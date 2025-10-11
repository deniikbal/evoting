import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { nomorUrut, namaCalon, visi, misi, fotoUrl } = await request.json()

    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID tidak valid' },
        { status: 400 }
      )
    }

    if (!nomorUrut || !namaCalon) {
      return NextResponse.json(
        { message: 'Nomor urut dan nama calon harus diisi' },
        { status: 400 }
      )
    }

    // Check if candidate exists
    const existingKandidat = await db.kandidat.findUnique({
      where: { id }
    })

    if (!existingKandidat) {
      return NextResponse.json(
        { message: 'Kandidat tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if nomor urut is used by another candidate
    const duplicateNomorUrut = await db.kandidat.findFirst({
      where: {
        nomorUrut,
        id: { not: id }
      }
    })

    if (duplicateNomorUrut) {
      return NextResponse.json(
        { message: 'Nomor urut sudah digunakan oleh kandidat lain' },
        { status: 409 }
      )
    }

    const updatedKandidat = await db.kandidat.update({
      where: { id },
      data: {
        nomorUrut,
        namaCalon,
        visi: visi || null,
        misi: misi || null,
        fotoUrl: fotoUrl || null
      }
    })

    return NextResponse.json({
      message: 'Kandidat berhasil diperbarui',
      kandidat: updatedKandidat
    })

  } catch (error) {
    console.error('Error updating kandidat:', error)
    return NextResponse.json(
      { message: 'Gagal memperbarui kandidat' },
      { status: 500 }
    )
  }
}

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

    // Check if candidate exists
    const existingKandidat = await db.kandidat.findUnique({
      where: { id }
    })

    if (!existingKandidat) {
      return NextResponse.json(
        { message: 'Kandidat tidak ditemukan' },
        { status: 404 }
      )
    }

    await db.kandidat.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Kandidat berhasil dihapus'
    })

  } catch (error) {
    console.error('Error deleting kandidat:', error)
    return NextResponse.json(
      { message: 'Gagal menghapus kandidat' },
      { status: 500 }
    )
  }
}