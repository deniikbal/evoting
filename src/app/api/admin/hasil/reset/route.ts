import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kandidat, siswa, pegawai, vote } from '@/lib/schema'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // 1. Reset jumlah suara semua kandidat menjadi 0
    await db.update(kandidat).set({ jumlahSuara: 0 })

    // 2. Reset status sudahMemilih semua siswa
    await db.update(siswa).set({ sudahMemilih: false })

    // 3. Reset status sudahMemilih semua pegawai (guru/tu)
    await db.update(pegawai).set({ sudahMemilih: false })

    // 4. Delete all voting records
    await db.delete(vote)

    return NextResponse.json({
      message: 'Semua hasil voting berhasil direset',
      success: true
    })

  } catch (error) {
    console.error('Error resetting voting:', error)
    return NextResponse.json(
      { message: 'Gagal mereset hasil voting' },
      { status: 500 }
    )
  }
}
