import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, classroom } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

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

    const errors: string[] = []
    const validStudents: Array<{
      nis: string
      namaLengkap: string
      kelas: string
      classroomId: number | null
      plainToken: string
    }> = []

    // Validate and prepare all students data
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i]
      const { nis, nama_lengkap, kelas } = studentData

      if (!nis || !nama_lengkap || !kelas) {
        errors.push(`Baris ${i + 2}: Data tidak lengkap`)
        continue
      }

      // Find matching classroom based on kelas name
      const matchedClassroom = allClassrooms.find(
        c => c.name.toLowerCase().trim() === kelas.toString().toLowerCase().trim()
      )

      // Generate plain token for students to use
      const plainToken = Math.random().toString(36).substring(2, 8).toUpperCase()

      validStudents.push({
        nis: nis.toString(),
        namaLengkap: nama_lengkap.toString(),
        kelas: kelas.toString(),
        classroomId: matchedClassroom ? matchedClassroom.id : null,
        plainToken
      })
    }

    if (validStudents.length === 0) {
      return NextResponse.json({
        message: 'Tidak ada data valid untuk diimpor',
        count: 0,
        linkedCount: 0,
        errors
      })
    }

    // Hash all tokens in parallel for speed
    const hashedTokens = await Promise.all(
      validStudents.map(student => Promise.resolve(hashToken(student.plainToken)))
    )

    // Prepare batch insert data
    const insertData = validStudents.map((student, index) => ({
      nis: student.nis,
      namaLengkap: student.namaLengkap,
      kelas: student.kelas,
      classroomId: student.classroomId,
      token: hashedTokens[index],
      plainToken: student.plainToken
    }))

    // Batch insert all students at once
    let insertedCount = 0
    let linkedCount = 0

    try {
      const result = await db.insert(siswa)
        .values(insertData)
        .onConflictDoNothing({ target: siswa.nis })
        .returning({ id: siswa.id, nis: siswa.nis, classroomId: siswa.classroomId })

      insertedCount = result.length
      linkedCount = result.filter(r => r.classroomId !== null).length

      // Track which NIS were skipped due to conflicts
      const insertedNIS = new Set(result.map(r => r.nis))
      insertData.forEach(data => {
        if (!insertedNIS.has(data.nis)) {
          errors.push(`NIS ${data.nis} sudah terdaftar`)
        }
      })
    } catch (error) {
      console.error('Batch insert error:', error)
      return NextResponse.json(
        { message: 'Terjadi kesalahan saat menyimpan data ke database' },
        { status: 500 }
      )
    }

    const errorCount = validStudents.length - insertedCount

    let message = `Import selesai. ${insertedCount} siswa berhasil ditambahkan`
    if (linkedCount > 0) {
      message += `, ${linkedCount} terhubung ke kelas`
    }
    if (errorCount > 0) {
      message += `, ${errorCount} gagal`
    }

    return NextResponse.json({
      message,
      count: insertedCount,
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