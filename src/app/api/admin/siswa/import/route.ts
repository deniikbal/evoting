import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, classroom } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('xlsFile') as File

    if (!file) {
      return NextResponse.json(
        { message: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false })
    
    if (data.length === 0) {
      return NextResponse.json(
        { message: 'File Excel tidak valid atau kosong' },
        { status: 400 }
      )
    }

    // Normalize data to match expected format
    const students = data.map((row: any) => ({
      nis: row.nis || row.NIS || row.Nis,
      nama_lengkap: row.nama_lengkap || row['Nama Lengkap'] || row.nama || row.Nama,
      kelas: row.kelas || row.Kelas
    }))

    if (students.length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada data siswa yang valid dalam file' },
        { status: 400 }
      )
    }

    // Fetch all classrooms once for efficiency
    const allClassrooms = await db.select().from(classroom)

    let successCount = 0
    let errorCount = 0
    let linkedCount = 0
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
        const [existingSiswa] = await db.select().from(siswa).where(eq(siswa.nis, nis.toString())).limit(1)

        if (existingSiswa) {
          errors.push(`NIS ${nis} sudah terdaftar`)
          errorCount++
          continue
        }

        // Find matching classroom based on kelas name
        const matchedClassroom = allClassrooms.find(
          c => c.name.toLowerCase().trim() === kelas.toString().toLowerCase().trim()
        )

        // Generate plain token for students to use
        const plainToken = Math.random().toString(36).substring(2, 8).toUpperCase()
        // Hash token for security
        const hashedToken = await bcrypt.hash(plainToken, 10)

        await db.insert(siswa).values({
          nis: nis.toString(),
          namaLengkap: nama_lengkap.toString(),
          kelas: kelas.toString(),
          classroomId: matchedClassroom ? matchedClassroom.id : null,
          token: hashedToken,
          plainToken
        })

        if (matchedClassroom) {
          linkedCount++
        }

        successCount++
      } catch (error) {
        console.error('Error importing student:', error)
        errors.push(`Gagal mengimpor ${studentData.nama_lengkap || studentData.nis}`)
        errorCount++
      }
    }

    let message = `Import selesai. ${successCount} siswa berhasil ditambahkan`
    if (linkedCount > 0) {
      message += `, ${linkedCount} terhubung ke kelas`
    }
    if (errorCount > 0) {
      message += `, ${errorCount} gagal`
    }

    return NextResponse.json({
      message,
      count: successCount,
      linkedCount,
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