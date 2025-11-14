import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, pengaturan } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { hashToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
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
