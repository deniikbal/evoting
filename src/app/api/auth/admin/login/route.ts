import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admin } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username dan password harus diisi' },
        { status: 400 }
      )
    }

    // Cari admin berdasarkan username
    const [adminData] = await db.select().from(admin).where(eq(admin.username, username)).limit(1)

    if (!adminData) {
      return NextResponse.json(
        { message: 'Username atau password salah' },
        { status: 401 }
      )
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, adminData.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Username atau password salah' },
        { status: 401 }
      )
    }

    // Login berhasil, kembalikan data admin (tanpa password)
    const { password: _, ...adminResponse } = adminData
    
    return NextResponse.json({
      message: 'Login berhasil',
      admin: adminResponse
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}