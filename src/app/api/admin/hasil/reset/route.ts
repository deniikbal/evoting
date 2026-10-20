import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admin } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { punyaSesiSuperadmin, responsBukanSuperadmin } from '@/lib/admin-guard'
import { bacaTokenSesi } from '@/lib/sesi-admin'
import { batasiLaju } from '@/lib/batas-laju'

export const dynamic = 'force-dynamic'

/**
 * Reset seluruh hasil voting.
 *
 * Perlindungan dua lapis, keduanya di server:
 * 1. Sesi superadmin: cookie httpOnly bertanda tangan.
 * 2. Password login milik superadmin yang sedang masuk, diverifikasi dengan
 *    bcrypt terhadap hash di tabel admin. Verifikasi TIDAK ada di klien,
 *    karena password yang ditulis di bundel JavaScript bukan rahasia.
 *
 * Apapun jalannya, suara yang sudah dihapus tidak bisa dikembalikan, jadi
 * percobaan dibatasi lajunya.
 */
export async function POST(request: NextRequest) {
  if (!punyaSesiSuperadmin(request)) return responsBukanSuperadmin()

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'tanpa-ip'

  // 5 percobaan per 5 menit per alamat: password tidak boleh bisa ditebak
  // beruntun di endpoint yang efeknya tidak dapat dibatalkan.
  const batas = batasiLaju(`reset-hasil:${ip}`, 5, 300)
  if (!batas.boleh) {
    return NextResponse.json(
      {
        message: `Terlalu banyak percobaan. Tunggu ${Math.ceil(batas.sisaDetik / 60)} menit.`,
      },
      { status: 429, headers: { 'Retry-After': String(batas.sisaDetik) } }
    )
  }

  const sesi = bacaTokenSesi(request.cookies.get('sesiAdmin')?.value)
  let password = ''
  try {
    const badan = await request.json()
    password = String(badan?.password ?? '')
  } catch {
    password = ''
  }

  if (!password) {
    return NextResponse.json(
      { message: 'Password harus diisi untuk konfirmasi reset' },
      { status: 400 }
    )
  }

  if (sesi) {
    const [adminData] = await db
      .select()
      .from(admin)
      .where(eq(admin.id, sesi.id))
      .limit(1)

    const cocok = adminData
      ? await bcrypt.compare(password, adminData.password)
      : false

    if (!cocok) {
      return NextResponse.json(
        { message: 'Password login salah. Hasil voting tidak dihapus.' },
        { status: 401 }
      )
    }
  }

  try {
    // 1. Reset jumlah suara semua kandidat menjadi 0
    await db.execute(sql`UPDATE "kandidat" SET "jumlah_suara" = 0`)

    // 2. Reset status sudahMemilih semua siswa
    await db.execute(sql`UPDATE "siswa" SET "sudah_memilih" = false`)

    // 3. Reset status sudahMemilih semua pegawai (guru/tu)
    await db.execute(sql`UPDATE "pegawai" SET "sudah_memilih" = false`)

    // 4. Delete all voting records
    await db.execute(sql`DELETE FROM "vote"`)

    return NextResponse.json({
      message: 'Semua hasil voting berhasil direset',
      success: true
    })

  } catch (error) {
    console.error('Error resetting voting:', error)
    return NextResponse.json(
      { message: 'Gagal mereset hasil voting' },
      { status: 500 }
    )
  }
}
