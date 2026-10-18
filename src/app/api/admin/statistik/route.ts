import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, pengaturan } from '@/lib/schema'
import { eq, count, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * Semua angka dihitung dengan tiga query yang berjalan bersamaan.
 *
 * Latensi ke database sekitar 0.5 sampai 1.4 detik per round-trip. Versi lama
 * memakai lima query berurutan (2.5 sampai 7 detik). Hitungan bersyarat dalam
 * satu query memangkas jumlah round-trip tanpa mengubah hasil.
 */
export async function GET() {
  try {
    const [siswaRingkas, pegawaiRingkas, votingSetting] = await Promise.all([
      db
        .select({
          total: count(),
          // Hitung baris yang sudah memilih dalam query yang sama.
          sudah: sql<number>`count(*) filter (where ${siswa.sudahMemilih} = true)`,
        })
        .from(siswa),
      db
        .select({
          total: count(),
          sudah: sql<number>`count(*) filter (where ${pegawai.sudahMemilih} = true)`,
        })
        .from(pegawai),
      db
        .select()
        .from(pengaturan)
        .where(eq(pengaturan.namaPengaturan, 'voting_aktif'))
        .limit(1),
    ])

    const totalSiswa = Number(siswaRingkas[0]?.total ?? 0)
    const siswaMemilih = Number(siswaRingkas[0]?.sudah ?? 0)
    const totalPegawai = Number(pegawaiRingkas[0]?.total ?? 0)
    const pegawaiMemilih = Number(pegawaiRingkas[0]?.sudah ?? 0)

    const siswaBelumMemilih = totalSiswa - siswaMemilih
    const pegawaiBelumMemilih = totalPegawai - pegawaiMemilih

    return NextResponse.json({
      totalVoters: totalSiswa + totalPegawai,
      totalSiswa,
      siswaMemilih,
      siswaBelumMemilih,
      totalPegawai,
      pegawaiMemilih,
      pegawaiBelumMemilih,
      sudahMemilih: siswaMemilih + pegawaiMemilih,
      belumMemilih: siswaBelumMemilih + pegawaiBelumMemilih,
      votingAktif: votingSetting[0]?.nilai === 'true',
    })
  } catch (error) {
    console.error('Error fetching statistik:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data statistik' },
      { status: 500 }
    )
  }
}
