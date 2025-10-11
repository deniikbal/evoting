import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Reset jumlah suara semua kandidat menjadi 0
    await db.kandidat.updateMany({
      data: {
        jumlahSuara: 0
      }
    })

    // Reset status sudahMemilih semua siswa
    await db.siswa.updateMany({
      data: {
        sudahMemilih: false
      }
    })

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
