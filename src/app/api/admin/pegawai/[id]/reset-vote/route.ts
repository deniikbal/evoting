import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pegawai } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pegawaiId = parseInt(params.id)

    // Check if pegawai exists
    const [existingPegawai] = await db
      .select()
      .from(pegawai)
      .where(eq(pegawai.id, pegawaiId))
      .limit(1)

    if (!existingPegawai) {
      return NextResponse.json(
        { message: 'Pegawai tidak ditemukan' },
        { status: 404 }
      )
    }

    const [updatedPegawai] = await db
      .update(pegawai)
      .set({
        sudahMemilih: false,
        updatedAt: new Date(),
      })
      .where(eq(pegawai.id, pegawaiId))
      .returning()

    return NextResponse.json({
      message: 'Status vote berhasil direset',
      pegawai: updatedPegawai,
    })
  } catch (error) {
    console.error('Error resetting vote:', error)
    return NextResponse.json(
      { message: 'Gagal mereset vote' },
      { status: 500 }
    )
  }
}
