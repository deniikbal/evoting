import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Create sample data with headers
    // Note: kelas should match existing classroom names in database for automatic linking
    const data = [
      {
        nis: '2024001',
        nama_lengkap: 'Ahmad Fauzi',
        kelas: 'XII IPA 1'
      },
      {
        nis: '2024002',
        nama_lengkap: 'Siti Aisyah',
        kelas: 'XII IPA 1'
      },
      {
        nis: '2024003',
        nama_lengkap: 'Budi Santoso',
        kelas: 'XII IPS 1'
      }
    ]

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // nis
      { wch: 30 }, // nama_lengkap
      { wch: 15 }  // kelas
    ]

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return as downloadable file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-import-siswa.xlsx"'
      }
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat membuat template' },
      { status: 500 }
    )
  }
}
