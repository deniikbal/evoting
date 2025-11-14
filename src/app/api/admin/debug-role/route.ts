import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admin } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all admins
    const admins = await db.select().from(admin)
    
    return NextResponse.json({
      message: 'All admin records',
      data: admins
    })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { message: 'Error fetching admins', error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, role } = await request.json()

    if (!username || !role) {
      return NextResponse.json(
        { message: 'Username dan role harus diisi' },
        { status: 400 }
      )
    }

    if (!['admin', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { message: 'Role harus admin atau superadmin' },
        { status: 400 }
      )
    }

    // Update admin role
    const [updated] = await db
      .update(admin)
      .set({ role })
      .where(eq(admin.username, username))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { message: 'Admin tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: `Admin ${username} berhasil di-update menjadi ${role}`,
      data: updated
    })
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { message: 'Error updating admin', error: String(error) },
      { status: 500 }
    )
  }
}
