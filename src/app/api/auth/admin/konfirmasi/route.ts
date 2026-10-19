import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

import { db } from '@/lib/db'
import { admin } from '@/lib/schema'
import { sesiSekarang } from '@/lib/sesi-admin'
import { batasiLaju } from '@/lib/batas-laju'

export const dynamic = 'force-dynamic'

/**
 * Konfirmasi kata sandi admin yang sedang login.
 *
 * Dipakai sebagai langkah kedua sebelum tindakan merusak (mis. reset hasil
 * pemilihan). Sebelumnya kata sandi konfirmasi ditulis apa adanya di kode
 * peramban sehingga bisa dibaca siapa pun lewat View Source; sekarang
 * diverifikasi di server terhadap kata sandi akun yang benar-benar login.
 */
export async function POST(request: NextRequest) {
  try {
    const sesi = await sesiSekarang()
    if (!sesi) {
      return NextResponse.json(
        { message: 'Belum login sebagai admin' },
        { status: 401 }
      )
    }

    const batas = batasiLaju(`konfirmasi-admin:${sesi.id}`, 10, 300)
    if (!batas.boleh) {
      return NextResponse.json(
        { message: 'Terlalu banyak percobaan. Tunggu sebentar.' },
        { status: 429, headers: { 'Retry-After': String(batas.sisaDetik) } }
      )
    }

    const body = await request.json().catch(() => null)
    const kataSandi = typeof body?.kataSandi === 'string' ? body.kataSandi : ''

    if (!kataSandi) {
      return NextResponse.json(
        { message: 'Kata sandi wajib diisi' },
        { status: 400 }
      )
    }

    const [akun] = await db
      .select({ password: admin.password })
      .from(admin)
      .where(eq(admin.id, sesi.id))
      .limit(1)

    if (!akun?.password) {
      return NextResponse.json(
        { message: 'Akun admin tidak ditemukan' },
        { status: 401 }
      )
    }

    const cocok = await bcrypt.compare(kataSandi, akun.password)
    if (!cocok) {
      return NextResponse.json(
        { message: 'Kata sandi salah' },
        { status: 403 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Konfirmasi admin gagal:', error)
    return NextResponse.json(
      { message: 'Gagal memverifikasi kata sandi' },
      { status: 500 }
    )
  }
}
