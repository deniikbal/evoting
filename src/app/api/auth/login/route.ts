import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, pengaturan } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { hashToken } from '@/lib/utils'
import { batasiLaju } from '@/lib/batas-laju'
import { buatTiket } from '@/lib/tiket-voting'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'tanpa-ip'

    // Token hanya 6 karakter, jadi percobaan beruntun harus dibatasi.
    const batas = batasiLaju(`login-token:${ip}`, 20, 300)
    if (!batas.boleh) {
      return NextResponse.json(
        { message: 'Terlalu banyak percobaan login. Tunggu sebentar.' },
        { status: 429, headers: { 'Retry-After': String(batas.sisaDetik) } }
      )
    }

    const { username, token } = await request.json()

    // Support 2 auth methods - BOTH use token:
    // 1. Siswa: username (NIS) + token (plain, 6 chars)
    // 2. Pegawai: username (email) + token (plain, 6 chars)

    if (!username || !token) {
      return NextResponse.json(
        { message: 'Username dan token harus diisi' },
        { status: 400 }
      )
    }

    // Cek apakah voting sedang aktif
    const [votingAktif] = await db
      .select()
      .from(pengaturan)
      .where(eq(pengaturan.namaPengaturan, 'voting_aktif'))
      .limit(1)

    if (!votingAktif || votingAktif.nilai !== 'true') {
      return NextResponse.json(
        { message: 'Voting belum dimulai atau sudah selesai' },
        { status: 403 }
      )
    }

    // Try login as siswa (NIS + token)
    const [siswaData] = await db
      .select()
      .from(siswa)
      .where(eq(siswa.nis, username))
      .limit(1)

    if (siswaData) {
      const hashedInputToken = hashToken(token)

      if (hashedInputToken === siswaData.token) {
        const { token: _, plainToken: __, ...siswaResponse } = siswaData

        return NextResponse.json({
          message: siswaData.sudahMemilih
            ? 'Login berhasil - Anda sudah voting'
            : 'Login berhasil',
          tiket: siswaData.sudahMemilih ? null : buatTiket('siswa', siswaData.id),
          user: {
            ...siswaResponse,
            type: 'siswa',
            plainToken: siswaData.plainToken,
          },
        })
      }
    }

    // Try login as pegawai (email + token)
    const [pegawaiData] = await db
      .select()
      .from(pegawai)
      .where(eq(pegawai.email, username.toLowerCase()))
      .limit(1)

    if (pegawaiData) {
      // Check status first
      if (pegawaiData.status !== 'aktif') {
        return NextResponse.json(
          { message: 'Akun tidak aktif' },
          { status: 403 }
        )
      }

      const hashedInputToken = hashToken(token)

      if (hashedInputToken === pegawaiData.token) {
        const { token: _, ...pegawaiResponse } = pegawaiData

        return NextResponse.json({
          message: pegawaiData.sudahMemilih
            ? 'Login berhasil - Anda sudah voting'
            : 'Login berhasil',
          tiket: pegawaiData.sudahMemilih
            ? null
            : buatTiket(pegawaiData.role as 'guru' | 'tu', pegawaiData.id),
          user: {
            ...pegawaiResponse,
            type: pegawaiData.role, // 'guru' atau 'tu'
            plainToken: pegawaiData.tokenPlain,
          },
        })
      }
    }

    return NextResponse.json(
      { message: 'Username atau token salah atau tidak ditemukan' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
