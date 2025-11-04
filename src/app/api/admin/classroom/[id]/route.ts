import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classroom, siswa } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// PUT - Update classroom
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { name, angkatan } = body

    if (!name || !angkatan) {
      return NextResponse.json(
        { message: 'Nama kelas dan angkatan harus diisi' },
        { status: 400 }
      )
    }

    const updatedClassroom = await db
      .update(classroom)
      .set({
        name,
        angkatan,
      })
      .where(eq(classroom.id, id))
      .returning()

    if (updatedClassroom.length === 0) {
      return NextResponse.json(
        { message: 'Kelas tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedClassroom[0])
  } catch (error) {
    console.error('Error updating classroom:', error)
    return NextResponse.json(
      { message: 'Gagal mengupdate kelas' },
      { status: 500 }
    )
  }
}

// DELETE - Delete classroom
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    // Check if any students are assigned to this classroom
    const studentsInClassroom = await db
      .select()
      .from(siswa)
      .where(eq(siswa.classroomId, id))

    if (studentsInClassroom.length > 0) {
      return NextResponse.json(
        { message: `Tidak dapat menghapus kelas. Masih ada ${studentsInClassroom.length} siswa yang terdaftar di kelas ini.` },
        { status: 400 }
      )
    }

    const deletedClassroom = await db
      .delete(classroom)
      .where(eq(classroom.id, id))
      .returning()

    if (deletedClassroom.length === 0) {
      return NextResponse.json(
        { message: 'Kelas tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Kelas berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting classroom:', error)
    return NextResponse.json(
      { message: 'Gagal menghapus kelas' },
      { status: 500 }
    )
  }
}
