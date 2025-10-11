import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
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

    await db.siswa.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Siswa berhasil dihapus'
    })

  } catch (error) {
    console.error('Error deleting siswa:', error)
    return NextResponse.json(
      { message: 'Gagal menghapus siswa' },
      { status: 500 }
    )
  }
}