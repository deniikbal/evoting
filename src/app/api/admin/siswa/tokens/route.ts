import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa } from '@/lib/schema'
import { asc } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import { bandingNamaKelas } from '@/lib/urutan-kelas'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    // Urutan kelas natural di JS: ORDER BY teks menaruh "X 10" sebelum "X 2".
    const allSiswa = (
      await db.select({
        nis: siswa.nis,
        namaLengkap: siswa.namaLengkap,
        kelas: siswa.kelas,
        plainToken: siswa.plainToken
      }).from(siswa).orderBy(asc(siswa.namaLengkap))
    ).sort(
      (a, b) =>
        bandingNamaKelas(a.kelas, b.kelas) ||
        a.namaLengkap.localeCompare(b.namaLengkap, 'id')
    )

    // If no students, return empty Excel file
    if (allSiswa.length === 0) {
      const worksheet = XLSX.utils.json_to_sheet([])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tokens Siswa')
      
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xls' 
      })

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': 'attachment; filename="tokens-siswa.xls"'
        }
      })
    }

    // Generate Excel file with plain tokens
    const worksheet = XLSX.utils.json_to_sheet(allSiswa.map(s => ({
      'NIS': s.nis,
      'Nama Lengkap': s.namaLengkap,
      'Kelas': s.kelas,
      'Token': s.plainToken
    })))

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // NIS
      { wch: 30 }, // Nama Lengkap
      { wch: 15 }, // Kelas
      { wch: 12 }  // Token
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tokens Siswa')
    
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xls' 
    })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': 'attachment; filename="tokens-siswa.xls"'
      }
    })

  } catch (error) {
    console.error('Error exporting tokens:', error)
    return NextResponse.json(
      { message: 'Gagal mengekspor token' },
      { status: 500 }
    )
  }
}