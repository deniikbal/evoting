import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kandidat, vote } from '@/lib/schema'
import { asc, count } from 'drizzle-orm'
import { punyaSesiAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

/**
 * Daftar kandidat.
 *
 * Perbaikan: perolehan suara tidak lagi ikut pada respons publik. Sebelumnya
 * endpoint ini mengembalikan `jumlahSuara` setiap kandidat tanpa kredensial apa
 * pun, sehingga siapa saja yang membuka DevTools di halaman kiosk dapat
 * memantau hasil real-time selagi pemilihan berjalan. Halaman /admin/hasil
 * sudah menyembunyikan angka itu saat voting aktif, tetapi penyembunyian di
 * sisi klien tidak ada artinya bila API-nya membocorkannya.
 *
 * Aturan sekarang:
 * - Tanpa sesi admin (kiosk, beranda): angka suara selalu nol.
 * - Dengan sesi admin: angka suara sebenarnya. Petugas yang sudah login tetap
 *   dapat memantau, dan itu memang kebutuhan panitia.
 *
 * Sekaligus mempertahankan perbaikan lama: dulu satu query hitung suara
 * dijalankan untuk setiap kandidat di dalam map (7 kandidat berarti 8
 * round-trip, sekitar 4 sampai 11 detik). Sekarang hanya dua query.
 */
export async function GET(request: NextRequest) {
  try {
    const daftarKandidat = await db
      .select()
      .from(kandidat)
      .orderBy(asc(kandidat.nomorUrut))

    if (!punyaSesiAdmin(request)) {
      return NextResponse.json(
        daftarKandidat.map((k) => ({ ...k, jumlahSuara: 0 }))
      )
    }

    const suaraPerKandidat = await db
      .select({ kandidatId: vote.kandidatId, total: count() })
      .from(vote)
      .groupBy(vote.kandidatId)

    const petaSuara = new Map(
      suaraPerKandidat.map((row) => [row.kandidatId, Number(row.total)])
    )

    return NextResponse.json(
      daftarKandidat.map((k) => ({
        ...k,
        jumlahSuara: petaSuara.get(k.id) ?? 0,
      }))
    )
  } catch (error) {
    console.error('Error fetching kandidat:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data kandidat' },
      { status: 500 }
    )
  }
}
