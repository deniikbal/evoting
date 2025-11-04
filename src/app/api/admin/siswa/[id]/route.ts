import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PUT(
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

    const { nis, namaLengkap, kelas, classroomId } = await request.json()

    if (!nis || !namaLengkap || !kelas) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
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

    // Check if NIS is being changed and if new NIS already exists
    if (nis !== existingSiswa.nis) {
      const [nisDuplicate] = await db
        .select()
        .from(siswa)
        .where(eq(siswa.nis, nis))
        .limit(1)

      if (nisDuplicate) {
        return NextResponse.json(
          { message: 'NIS sudah digunakan oleh siswa lain' },
          { status: 409 }
        )
      }
    }

    const [updatedSiswa] = await db
      .update(siswa)
      .set({
        nis,
        namaLengkap,
        kelas,
        classroomId: classroomId ? parseInt(classroomId) : null,
      })
      .where(eq(siswa.id, id))
      .returning()

    // Return student data without token
    const { token: _, ...siswaData } = updatedSiswa

    return NextResponse.json({
      message: 'Siswa berhasil diupdate',
      siswa: siswaData
    })

  } catch (error) {
    console.error('Error updating siswa:', error)
    return NextResponse.json(
      { message: 'Gagal mengupdate siswa' },
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

    // Check if student exists
    const [existingSiswa] = await db.select().from(siswa).where(eq(siswa.id, id)).limit(1)

    if (!existingSiswa) {
      return NextResponse.json(
        { message: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    await db.delete(siswa).where(eq(siswa.id, id))

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