import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kandidat, siswa } from '@/lib/schema'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Reset jumlah suara semua kandidat menjadi 0
    await db.update(kandidat).set({ jumlahSuara: 0 })

    // Reset status sudahMemilih semua siswa
    await db.update(siswa).set({ sudahMemilih: false })

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
