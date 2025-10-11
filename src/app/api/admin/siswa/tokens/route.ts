import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const siswa = await db.siswa.findMany({
      select: {
        id: true,
        nis: true,
        namaLengkap: true,
        kelas: true,
        token: true
      },
      orderBy: [
        { kelas: 'asc' },
        { namaLengkap: 'asc' }
      ]
    })

    // If no students, return empty Excel file
    if (siswa.length === 0) {
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

    // Generate simple tokens for export (6 character alphanumeric)
    const siswaWithTokens = []
    
    for (const s of siswa) {
      // Generate a new simple token for export
      const exportToken = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      // Update the student's token to this new one
      await db.siswa.update({
        where: { id: s.id },
        data: { 
          token: await bcrypt.hash(exportToken, 10)
        }
      })
      
      siswaWithTokens.push({
        nis: s.nis,
        namaLengkap: s.namaLengkap,
        kelas: s.kelas,
        token: exportToken
      })
    }

    // Generate Excel file
    const worksheet = XLSX.utils.json_to_sheet(siswaWithTokens.map(s => ({
      'NIS': s.nis,
      'Nama Lengkap': s.namaLengkap,
      'Kelas': s.kelas,
      'Token': s.token
    })))

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