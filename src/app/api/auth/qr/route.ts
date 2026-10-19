import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, pengaturan } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { batasiLaju } from '@/lib/batas-laju'
import { buatTiket } from '@/lib/tiket-voting'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Login via QR di kiosk.
 *
 * Dua perbaikan dari versi sebelumnya:
 *
 * 1. Endpoint ini sekarang menerbitkan `tiket` bertanda tangan yang menjadi
 *    satu-satunya bukti identitas pemilih saat menyimpan suara di /api/voting.
 *    Sebelumnya identitas pemilih dikirim mentah dari klien.
 * 2. Jalur cadangan NIS dihapus. NIS bersifat berurutan dan mudah ditebak
 *    (252610001, 252610002, dan seterusnya), sehingga siapa pun bisa mencoblos
 *    atas nama orang lain hanya dengan menebak nomor. Seluruh 1306 siswa dan 67
 *    pegawai sudah memiliki qr_id unik (diperiksa di database), jadi tidak ada
 *    yang kehilangan hak pilih karena penutupan jalur ini.
 *
 * Pembatas laju ditambahkan karena kode 6 karakter tidak pernah dibatasi
 * percobaannya.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'tanpa-ip'

    const batas = batasiLaju(`qr:${ip}`, 60, 60)
    if (!batas.boleh) {
      return NextResponse.json(
        { message: 'Terlalu banyak percobaan. Tunggu sebentar.' },
        { status: 429, headers: { 'Retry-After': String(batas.sisaDetik) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const code = String(body.code ?? '').trim()

    if (!code) {
      return NextResponse.json(
        { message: 'Kode QR tidak boleh kosong' },
        { status: 400 }
      )
    }

    if (!UUID_RE.test(code)) {
      return NextResponse.json(
        { message: 'Kode QR tidak dikenali. Gunakan kartu ber-QR terbaru.' },
        { status: 404 }
      )
    }

    // Voting harus benar-benar sedang aktif.
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
        tiket: siswaByQr.sudahMemilih ? null : buatTiket('siswa', siswaByQr.id),
        voter: { ...siswaResponse, type: 'siswa' },
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
        tiket: pegawaiByQr.sudahMemilih
          ? null
          : buatTiket(pegawaiByQr.role as 'guru' | 'tu', pegawaiByQr.id),
        voter: {
          ...pegawaiClean,
          namaLengkap: pegawaiByQr.nama,
          kelas: pegawaiByQr.role === 'guru' ? 'Guru' : 'Tenaga Kependidikan',
          type: pegawaiByQr.role,
        },
      })
    }

    return NextResponse.json(
      { message: 'Kode QR tidak dikenali' },
      { status: 404 }
    )
  } catch (error) {
    console.error('QR auth error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
