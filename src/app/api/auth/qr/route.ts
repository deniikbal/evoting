import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pengaturan } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// POST - Login via QR (QR berisi NIS saja)
// Body: { nis: string }
export async function POST(request: NextRequest) {
  try {
    const { nis } = await request.json()

    if (!nis) {
      return NextResponse.json(
        { message: 'NIS tidak boleh kosong' },
        { status: 400 }
      )
    }

    const trimmedNis = String(nis).trim()

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

    // Cari siswa berdasarkan NIS
    const [siswaData] = await db
      .select()
      .from(siswa)
      .where(eq(siswa.nis, trimmedNis))
      .limit(1)

    if (!siswaData) {
      return NextResponse.json(
        { message: `NIS ${trimmedNis} tidak ditemukan` },
        { status: 404 }
      )
    }

    // Kembalikan data siswa untuk layar konfirmasi identitas (tanpa token)
    const { token: _t, plainToken: _p, ...siswaResponse } = siswaData

    return NextResponse.json({
      message: siswaData.sudahMemilih
        ? 'Siswa ini sudah melakukan voting'
        : 'NIS valid',
      alreadyVoted: siswaData.sudahMemilih,
      siswa: {
        ...siswaResponse,
        type: 'siswa',
      },
    })
  } catch (error) {
    console.error('QR auth error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
