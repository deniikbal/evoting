import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admin } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { role } = await request.json()

    if (!['admin', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { message: 'Role harus admin atau superadmin' },
        { status: 400 }
      )
    }

    const [updated] = await db
      .update(admin)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(admin.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { message: 'Admin tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Admin berhasil diperbarui',
      data: {
        id: updated.id,
        username: updated.username,
        role: updated.role,
      },
    })
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { message: 'Gagal memperbarui admin' },
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

    // Prevent deleting the last admin
    const adminCount = await db.select().from(admin)
    if (adminCount.length <= 1) {
      return NextResponse.json(
        { message: 'Tidak bisa menghapus admin terakhir' },
        { status: 400 }
      )
    }

    const [deleted] = await db
      .delete(admin)
      .where(eq(admin.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { message: 'Admin tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Admin berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { message: 'Gagal menghapus admin' },
      { status: 500 }
    )
  }
}
