import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, pengaturan } from '@/lib/schema'
import { eq, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get total siswa
    const [{ total: totalSiswa }] = await db.select({ total: count() }).from(siswa)

    // Get siswa yang sudah memilih
    const [{ total: siswaMemilih }] = await db.select({ total: count() }).from(siswa).where(eq(siswa.sudahMemilih, true))

    // Get siswa yang belum memilih
    const siswaBelumMemilih = totalSiswa - siswaMemilih

    // Get total pegawai (guru & TU)
    const [{ total: totalPegawai }] = await db.select({ total: count() }).from(pegawai)

    // Get pegawai yang sudah memilih
    const [{ total: pegawaiMemilih }] = await db.select({ total: count() }).from(pegawai).where(eq(pegawai.sudahMemilih, true))

    // Get pegawai yang belum memilih
    const pegawaiBelumMemilih = totalPegawai - pegawaiMemilih

    // Calculate totals
    const totalVoters = totalSiswa + totalPegawai
    const totalSudahMemilih = siswaMemilih + pegawaiMemilih
    const totalBelumMemilih = siswaBelumMemilih + pegawaiBelumMemilih

    // Get voting status
    const [votingAktifSetting] = await db.select().from(pengaturan).where(eq(pengaturan.namaPengaturan, 'voting_aktif')).limit(1)

    const votingAktif = votingAktifSetting?.nilai === 'true'

    return NextResponse.json({
      totalVoters,
      totalSiswa,
      siswaMemilih,
      siswaBelumMemilih,
      totalPegawai,
      pegawaiMemilih,
      pegawaiBelumMemilih,
      sudahMemilih: totalSudahMemilih,
      belumMemilih: totalBelumMemilih,
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