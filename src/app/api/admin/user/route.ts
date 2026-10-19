import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admin } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const admins = await db
      .select({
        id: admin.id,
        username: admin.username,
        nama: admin.nama,
        role: admin.role,
        createdAt: admin.createdAt,
      })
      .from(admin)

    return NextResponse.json(admins)
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data admin' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const { username, nama, password, role } = await request.json()

    if (!username || !nama || !password || !role) {
      return NextResponse.json(
        { message: 'Username, nama, password, dan role harus diisi' },
        { status: 400 }
      )
    }

    if (!['admin', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { message: 'Role harus admin atau superadmin' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingAdmin = await db
      .select()
      .from(admin)
      .where(eq(admin.username, username))

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { message: 'Username sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const [newAdmin] = await db
      .insert(admin)
      .values({
        username,
        nama,
        password: hashedPassword,
        role,
      })
      .returning()

    return NextResponse.json({
      message: 'Admin berhasil dibuat',
      data: {
        id: newAdmin.id,
        username: newAdmin.username,
        nama: newAdmin.nama,
        role: newAdmin.role,
      },
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { message: 'Gagal membuat admin' },
      { status: 500 }
    )
  }
}
