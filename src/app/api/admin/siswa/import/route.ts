import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const runtime = 'edge';
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('csvFile') as File

    if (!file) {
      return NextResponse.json(
        { message: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    // Read CSV file
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { message: 'File CSV tidak valid atau kosong' },
        { status: 400 }
      )
    }

    // Parse CSV (skip header)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const students = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length >= 3) {
        const student: any = {}
        headers.forEach((header, index) => {
          student[header] = values[index] || ''
        })
        students.push(student)
      }
    }

    if (students.length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada data siswa yang valid dalam file' },
        { status: 400 }
      )
    }

    let successCount = 0
    let errorCount = 0
    const errors = []

    // Process each student
    for (const studentData of students) {
      try {
        const { nis, nama_lengkap, kelas } = studentData

        if (!nis || !nama_lengkap || !kelas) {
          errors.push(`Baris ${students.indexOf(studentData) + 2}: Data tidak lengkap`)
          errorCount++
          continue
        }

        // Check if NIS already exists
        const existingSiswa = await db.siswa.findUnique({
          where: { nis: nis.toString() }
        })

        if (existingSiswa) {
          errors.push(`NIS ${nis} sudah terdaftar`)
          errorCount++
          continue
        }

        // Generate token and hash it
        const token = Math.random().toString(36).substring(2, 8)
        const hashedToken = await bcrypt.hash(token, 10)

        await db.siswa.create({
          data: {
            nis: nis.toString(),
            namaLengkap: nama_lengkap.toString(),
            kelas: kelas.toString(),
            token: hashedToken
          }
        })

        successCount++
      } catch (error) {
        console.error('Error importing student:', error)
        errors.push(`Gagal mengimpor ${studentData.nama_lengkap || studentData.nis}`)
        errorCount++
      }
    }

    return NextResponse.json({
      message: `Import selesai. ${successCount} siswa berhasil ditambahkan${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengimpor data' },
      { status: 500 }
    )
  }
}