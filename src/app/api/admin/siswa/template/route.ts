import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classroom } from '@/lib/schema'
import * as XLSX from 'xlsx'
import { bandingNamaKelas } from '@/lib/urutan-kelas'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

/**
 * Template Excel untuk import siswa.
 *
 * Lembar "Data Siswa" berisi tiga kolom wajib dan contoh baris yang ditandai
 * jelas sebagai contoh, bukan data sungguhan.
 * Lembar "Daftar Kelas" memuat nama kelas yang benar-benar ada di menu Kelas,
 * supaya operator menyalin tulisan kelas yang persis dan barisnya tidak ditolak.
 */
export async function GET(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const daftarKelas = (await db.select({ name: classroom.name }).from(classroom))
      .map((k) => k.name)
      .sort(bandingNamaKelas)

    const contoh = daftarKelas.length > 0
      ? [
          { nis: 'CONTOH-1', nama_lengkap: 'Contoh Nama Siswa (hapus baris ini)', kelas: daftarKelas[0] },
          { nis: 'CONTOH-2', nama_lengkap: 'Contoh Nama Siswa (hapus baris ini)', kelas: daftarKelas[0] },
        ]
      : [{ nis: 'CONTOH-1', nama_lengkap: 'Contoh Nama Siswa (hapus baris ini)', kelas: 'X 1' }]

    const lembarData = XLSX.utils.json_to_sheet(contoh, {
      header: ['nis', 'nama_lengkap', 'kelas'],
    })
    lembarData['!cols'] = [{ wch: 16 }, { wch: 42 }, { wch: 16 }]

    const lembarKelas = XLSX.utils.json_to_sheet(
      daftarKelas.map((name) => ({ kelas: name })),
      { header: ['kelas'] }
    )
    lembarKelas['!cols'] = [{ wch: 20 }]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, lembarData, 'Data Siswa')
    XLSX.utils.book_append_sheet(workbook, lembarKelas, 'Daftar Kelas')

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-import-siswa.xlsx"',
      },
    })
  } catch (error) {
    console.error('Gagal membuat template:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat membuat template' },
      { status: 500 }
    )
  }
}
