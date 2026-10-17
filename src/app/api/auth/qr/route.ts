import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, pengaturan } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST - Login via QR
// Body: { code: string }  atau { nis: string } (nama lama, tetap didukung)
// Isi QR: qr_id (UUID acak) untuk kartu baru, atau NIS untuk kartu lama.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const raw = body.code ?? body.nis
    const code = String(raw ?? '').trim()

    if (!code) {
      return NextResponse.json(
        { message: 'Kode QR tidak boleh kosong' },
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

    // 1) Coba sebagai qr_id (siswa lalu pegawai)
    if (UUID_RE.test(code)) {
      const [siswaByQr] = await db
        .select()
        .from(siswa)
        .where(eq(siswa.qrId, code))
        .limit(1)

      if (siswaByQr) {
        const { token: _t, plainToken: _p, qrId: _q, ...siswaResponse } = siswaByQr
        return NextResponse.json({
          message: siswaByQr.sudahMemilih
            ? 'Pemilih ini sudah melakukan voting'
            : 'Kode QR valid',
          alreadyVoted: siswaByQr.sudahMemilih,
          voter: {
            ...siswaResponse,
            type: 'siswa',
          },
        })
      }

      const [pegawaiByQr] = await db
        .select()
        .from(pegawai)
        .where(eq(pegawai.qrId, code))
        .limit(1)

      if (pegawaiByQr) {
        const { token: _t, tokenPlain: _tp, qrId: _q, ...pegawaiClean } = pegawaiByQr
        return NextResponse.json({
          message: pegawaiByQr.sudahMemilih
            ? 'Pemilih ini sudah melakukan voting'
            : 'Kode QR valid',
          alreadyVoted: pegawaiByQr.sudahMemilih,
          voter: {
            ...pegawaiClean,
            plainToken: pegawaiByQr.tokenPlain,
            // dipakai UI: nama & keterangan identitas
            namaLengkap: pegawaiByQr.nama,
            kelas: pegawaiByQr.role === 'guru' ? 'Guru' : 'Tenaga Kependidikan',
            type: pegawaiByQr.role, // 'guru' atau 'tu'
          },
        })
      }

      return NextResponse.json(
        { message: 'Kode QR tidak dikenali' },
        { status: 404 }
      )
    }

    // 2) Fallback: NIS (kartu lama yang sudah tercetak sebelum QR diganti)
    const [siswaData] = await db
      .select()
      .from(siswa)
      .where(eq(siswa.nis, code))
      .limit(1)

    if (!siswaData) {
      return NextResponse.json(
        { message: `NIS ${code} tidak ditemukan` },
        { status: 404 }
      )
    }

    const { token: _t, plainToken: _p, qrId: _q, ...siswaResponse } = siswaData

    return NextResponse.json({
      message: siswaData.sudahMemilih
        ? 'Siswa ini sudah melakukan voting'
        : 'NIS valid',
      alreadyVoted: siswaData.sudahMemilih,
      voter: {
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
