import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admin } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { batasiLaju } from '@/lib/batas-laju'
import { buatTokenSesi, opsiCookieSesi } from '@/lib/sesi-admin'

export const dynamic = 'force-dynamic'

/**
 * Login admin.
 *
 * Sebelumnya endpoint ini mengembalikan data admin dan klien menyimpannya di
 * localStorage. Nilai itu bisa ditulis siapa saja lewat DevTools sehingga
 * seluruh panel admin terbuka. Sekarang sesi ditandatangani di server dan
 * dikirim sebagai cookie httpOnly, dan klien hanya menerima identitas untuk
 * ditampilkan (tanpa hak apa pun).
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'tanpa-ip'

    // 10 percobaan per 5 menit per alamat: kata sandi admin tidak boleh bisa
    // ditebak beruntun.
    const batas = batasiLaju(`login-admin:${ip}`, 10, 300)
    if (!batas.boleh) {
      return NextResponse.json(
        {
          message: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(
            batas.sisaDetik / 60
          )} menit.`,
        },
        { status: 429, headers: { 'Retry-After': String(batas.sisaDetik) } }
      )
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username dan password harus diisi' },
        { status: 400 }
      )
    }

    const [adminData] = await db
      .select()
      .from(admin)
      .where(eq(admin.username, String(username).trim()))
      .limit(1)

    // Pesan galat disamakan supaya tidak membedakan username ada atau tidak.
    const gagal = () =>
      NextResponse.json(
        { message: 'Username atau password salah' },
        { status: 401 }
      )

    if (!adminData) return gagal()

    const isPasswordValid = await bcrypt.compare(password, adminData.password)
    if (!isPasswordValid) return gagal()

    const token = buatTokenSesi({
      id: adminData.id,
      username: adminData.username,
      nama: adminData.nama,
      role: adminData.role,
    })

    const respons = NextResponse.json({
      message: 'Login berhasil',
      admin: {
        id: adminData.id,
        username: adminData.username,
        nama: adminData.nama,
        role: adminData.role,
      },
    })

    respons.cookies.set(opsiCookieSesi(token))
    return respons
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
