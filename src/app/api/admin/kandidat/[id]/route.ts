import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kandidat } from '@/lib/schema'
import { eq, ne, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
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
    const [existingKandidat] = await db.select().from(kandidat).where(eq(kandidat.id, id)).limit(1)

    if (!existingKandidat) {
      return NextResponse.json(
        { message: 'Kandidat tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if nomor urut is used by another candidate
    const [duplicateNomorUrut] = await db.select().from(kandidat)
      .where(and(eq(kandidat.nomorUrut, nomorUrut), ne(kandidat.id, id)))
      .limit(1)

    if (duplicateNomorUrut) {
      return NextResponse.json(
        { message: 'Nomor urut sudah digunakan oleh kandidat lain' },
        { status: 409 }
      )
    }

    const [updatedKandidat] = await db.update(kandidat)
      .set({
        nomorUrut,
        namaCalon,
        visi: visi || null,
        misi: misi || null,
        fotoUrl: fotoUrl || null
      })
      .where(eq(kandidat.id, id))
      .returning()

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

    // Check if candidate exists
    const [existingKandidat] = await db.select().from(kandidat).where(eq(kandidat.id, id)).limit(1)

    if (!existingKandidat) {
      return NextResponse.json(
        { message: 'Kandidat tidak ditemukan' },
        { status: 404 }
      )
    }

    await db.delete(kandidat).where(eq(kandidat.id, id))

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