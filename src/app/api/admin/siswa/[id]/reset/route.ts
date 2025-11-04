import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID tidak valid' },
        { status: 400 }
      )
    }

    // Check if student exists
    const [existingSiswa] = await db.select().from(siswa).where(eq(siswa.id, id)).limit(1)

    if (!existingSiswa) {
      return NextResponse.json(
        { message: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    // Reset voting status
    await db.update(siswa)
      .set({ sudahMemilih: false })
      .where(eq(siswa.id, id))

    return NextResponse.json({
      message: 'Status pemilihan berhasil direset'
    })

  } catch (error) {
    console.error('Error resetting siswa status:', error)
    return NextResponse.json(
      { message: 'Gagal mereset status' },
      { status: 500 }
    )
  }
}