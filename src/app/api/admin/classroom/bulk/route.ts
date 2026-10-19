import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classroom, siswa } from '@/lib/schema'
import { eq, inArray } from 'drizzle-orm'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

// DELETE - Bulk delete classrooms
export async function DELETE(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const body = await request.json()
    const ids: number[] = Array.isArray(body?.ids) ? body.ids : []

    if (ids.length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada kelas yang dipilih' },
        { status: 400 }
      )
    }

    // Only keep valid numeric ids
    const validIds = ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id))

    if (validIds.length === 0) {
      return NextResponse.json(
        { message: 'ID kelas tidak valid' },
        { status: 400 }
      )
    }

    // Find which classrooms still have students assigned to them
    const classroomsWithStudents = await db
      .select({ classroomId: siswa.classroomId })
      .from(siswa)
      .where(inArray(siswa.classroomId, validIds))

    const blockedIds = new Set(
      classroomsWithStudents
        .map((s) => s.classroomId)
        .filter((id): id is number => id !== null)
    )

    const deletableIds = validIds.filter((id) => !blockedIds.has(id))
    const blockedList = validIds.filter((id) => blockedIds.has(id))

    let deletedCount = 0
    if (deletableIds.length > 0) {
      const deleted = await db
        .delete(classroom)
        .where(inArray(classroom.id, deletableIds))
        .returning()

      deletedCount = deleted.length
    }

    return NextResponse.json({
      message: `Berhasil menghapus ${deletedCount} kelas`,
      deletedCount,
      blockedCount: blockedList.length,
      blockedIds: blockedList,
    })
  } catch (error) {
    console.error('Error bulk deleting classrooms:', error)
    return NextResponse.json(
      { message: 'Gagal menghapus kelas' },
      { status: 500 }
    )
  }
}
