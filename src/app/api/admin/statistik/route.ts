import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pengaturan } from '@/lib/schema'
import { eq, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get total siswa
    const [{ total: totalSiswa }] = await db.select({ total: count() }).from(siswa)

    // Get siswa yang sudah memilih
    const [{ total: sudahMemilih }] = await db.select({ total: count() }).from(siswa).where(eq(siswa.sudahMemilih, true))

    // Get siswa yang belum memilih
    const belumMemilih = totalSiswa - sudahMemilih

    // Get voting status
    const [votingAktifSetting] = await db.select().from(pengaturan).where(eq(pengaturan.namaPengaturan, 'voting_aktif')).limit(1)

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