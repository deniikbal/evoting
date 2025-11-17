import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Create template data
    const templateData = [
      {
        nama: 'Contoh Nama Guru',
        email: 'guru@sekolah.com',
        role: 'guru',
        kelas: 'XII MIPA 1',
        nip: '123456789',
        nomorInduk: 'G001',
      },
      {
        nama: 'Contoh Nama TU',
        email: 'tu@sekolah.com',
        role: 'tu',
        kelas: '',
        nip: '',
        nomorInduk: 'TU001',
      },
    ]

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 },  // nama
      { wch: 25 },  // email
      { wch: 10 },  // role
      { wch: 20 },  // kelas
      { wch: 15 },  // nip
      { wch: 15 },  // nomorInduk
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pegawai')

    // Generate Excel file
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    // Return file as response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_pegawai.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error exporting template:', error)
    return NextResponse.json(
      { message: 'Gagal mengexport template' },
      { status: 500 }
    )
  }
}
