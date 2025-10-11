import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get candidates with vote counts
    const kandidat = await db.kandidat.findMany({
      orderBy: [
        { jumlahSuara: 'desc' },
        { nomorUrut: 'asc' }
      ]
    })

    // Get voting statistics
    const totalSiswa = await db.siswa.count()
    const sudahMemilih = await db.siswa.count({
      where: { sudahMemilih: true }
    })

    const totalSuara = sudahMemilih

    // Generate CSV content
    const headers = [
      'Peringkat',
      'Nomor Urut',
      'Nama Calon',
      'Jumlah Suara',
      'Persentase'
    ]

    const rows = kandidat.map((k, index) => {
      const persentase = totalSuara > 0 ? ((k.jumlahSuara / totalSuara) * 100).toFixed(2) : '0.00'
      return [
        index + 1,
        k.nomorUrut,
        `"${k.namaCalon}"`,
        k.jumlahSuara,
        `${persentase}%`
      ].join(',')
    })

    // Add summary at the end
    const summary = [
      '',
      '',
      '',
      '',
      ''
    ]
    summary.push('RINGKASAN')
    summary.push(`Total Pemilih,${totalSiswa}`)
    summary.push(`Sudah Memilih,${sudahMemilih}`)
    summary.push(`Belum Memilih,${totalSiswa - sudahMemilih}`)
    summary.push(`Partisipasi,${totalSiswa > 0 ? ((sudahMemilih / totalSiswa) * 100).toFixed(2) : '0.00'}%`)

    const csvContent = [
      `Hasil Voting OSIS SMAN 1 Bantarujeg`,
      `Tanggal: ${new Date().toLocaleDateString('id-ID')}`,
      '',
      headers.join(','),
      ...rows,
      ...summary
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hasil-voting-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { message: 'Gagal mengekspor hasil voting' },
      { status: 500 }
    )
  }
}