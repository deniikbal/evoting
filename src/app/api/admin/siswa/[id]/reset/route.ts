import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID tidak valid' },
        { status: 400 }
      )
    }

    // Check if student exists
    const existingSiswa = await db.siswa.findUnique({
      where: { id }
    })

    if (!existingSiswa) {
      return NextResponse.json(
        { message: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    // Reset voting status
    await db.siswa.update({
      where: { id },
      data: {
        sudahMemilih: false
      }
    })

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