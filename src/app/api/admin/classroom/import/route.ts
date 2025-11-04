import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classroom } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
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
    const classrooms = data.map((row: any) => ({
      name: row.name || row.Name || row.nama || row.Nama,
      angkatan: row.angkatan || row.Angkatan
    }))

    if (classrooms.length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada data kelas yang valid dalam file' },
        { status: 400 }
      )
    }

    let successCount = 0
    let errorCount = 0
    const errors = []

    // Process each classroom
    for (const classroomData of classrooms) {
      try {
        const { name, angkatan } = classroomData

        if (!name || !angkatan) {
          errors.push(`Baris ${classrooms.indexOf(classroomData) + 2}: Data tidak lengkap`)
          errorCount++
          continue
        }

        // Check if classroom with same name and angkatan already exists
        const [existingClassroom] = await db
          .select()
          .from(classroom)
          .where(
            and(
              eq(classroom.name, name.toString()),
              eq(classroom.angkatan, angkatan.toString())
            )
          )
          .limit(1)

        if (existingClassroom) {
          errors.push(`Kelas ${name} angkatan ${angkatan} sudah terdaftar`)
          errorCount++
          continue
        }

        await db.insert(classroom).values({
          name: name.toString(),
          angkatan: angkatan.toString()
        })

        successCount++
      } catch (error) {
        console.error('Error importing classroom:', error)
        errors.push(`Gagal mengimpor ${classroomData.name || 'kelas'}`)
        errorCount++
      }
    }

    return NextResponse.json({
      message: `Import selesai. ${successCount} kelas berhasil ditambahkan${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
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
