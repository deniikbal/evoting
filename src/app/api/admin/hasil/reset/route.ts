import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // 1. Reset jumlah suara semua kandidat menjadi 0
    await db.execute(sql`UPDATE "kandidat" SET "jumlah_suara" = 0`)

    // 2. Reset status sudahMemilih semua siswa
    await db.execute(sql`UPDATE "siswa" SET "sudah_memilih" = false`)

    // 3. Reset status sudahMemilih semua pegawai (guru/tu)
    await db.execute(sql`UPDATE "pegawai" SET "sudah_memilih" = false`)

    // 4. Delete all voting records
    await db.execute(sql`DELETE FROM "vote"`)

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
