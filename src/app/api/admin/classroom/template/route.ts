import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Create sample data with headers
    const data = [
      {
        name: 'XII IPA 1',
        angkatan: '2024'
      },
      {
        name: 'XII IPA 2',
        angkatan: '2024'
      },
      {
        name: 'XII IPS 1',
        angkatan: '2024'
      }
    ]

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Kelas')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // name
      { wch: 15 }  // angkatan
    ]

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return as downloadable file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-import-kelas.xlsx"'
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
