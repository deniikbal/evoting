import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'edge';
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get total siswa
    const totalSiswa = await db.siswa.count()

    // Get siswa yang sudah memilih
    const sudahMemilih = await db.siswa.count({
      where: {
        sudahMemilih: true
      }
    })

    // Get siswa yang belum memilih
    const belumMemilih = totalSiswa - sudahMemilih

    // Get voting status
    const votingAktifSetting = await db.pengaturan.findUnique({
      where: {
        namaPengaturan: 'voting_aktif'
      }
    })

    const votingAktif = votingAktifSetting?.nilai === 'true'

    return NextResponse.json({
      totalSiswa,
      sudahMemilih,
      belumMemilih,
      votingAktif
    })

  } catch (error) {
    console.error('Error fetching statistik:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data statistik' },
      { status: 500 }
    )
  }
}