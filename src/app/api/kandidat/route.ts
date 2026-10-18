import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kandidat, vote } from '@/lib/schema'
import { asc, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * Daftar kandidat beserta jumlah suaranya.
 *
 * Versi lama menjalankan satu query hitung suara untuk setiap kandidat di dalam
 * map (7 kandidat berarti 8 round-trip). Dengan latensi database sekitar 0.5
 * sampai 1.4 detik, itu berubah menjadi 4 sampai 11 detik. Sekarang hanya dua
 * query yang berjalan bersamaan.
 */
export async function GET() {
  try {
    const [allKandidat, suaraPerKandidat] = await Promise.all([
      db.select().from(kandidat).orderBy(asc(kandidat.nomorUrut)),
      db
        .select({ kandidatId: vote.kandidatId, total: count() })
        .from(vote)
        .groupBy(vote.kandidatId),
    ])

    const petaSuara = new Map(
      suaraPerKandidat.map((row) => [row.kandidatId, Number(row.total)])
    )

    const hasil = allKandidat.map((k) => ({
      ...k,
      jumlahSuara: petaSuara.get(k.id) ?? 0,
    }))

    return NextResponse.json(hasil)
  } catch (error) {
    console.error('Error fetching kandidat:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data kandidat' },
      { status: 500 }
    )
  }
}
