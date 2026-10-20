import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa } from '@/lib/schema'
import { asc, eq, sql } from 'drizzle-orm'
import { batasiLaju } from '@/lib/batas-laju'
import { bandingNamaKelas, denganNomorUrut } from '@/lib/urutan-kelas'

export const dynamic = 'force-dynamic'

/**
 * Kehadiran pemilih untuk pencocokan dengan daftar hadir cetak.
 *
 * Halaman ini dipakai siswa dan panitia, jadi TIDAK memerlukan login. Karena
 * terbuka, isinya dibatasi seketat mungkin:
 *
 * - Tidak ada `kandidatId`, nama calon, atau angka suara sama sekali. Yang
 *   dikirim hanya identitas pemilih dan status pencoblosannya. Ini berbeda
 *   dengan /api/kandidat yang menyembunyikan angka suara hanya untuk non-admin;
 *   di sini angka suara memang tidak pernah ikut di query.
 * - NIS ikut dikirim karena panitia perlu mencocokkan dengan kolom NIS di
 *   daftar hadir. Kalau suatu saat dirasa terlalu terbuka, hapus kolom nis di
 *   `petaKehadiran` dan pencocokan tetap bisa lewat nomor urut + nama.
 *
 * Nomor urut memakai `denganNomorUrut()` yang sama dengan generator PDF daftar
 * hadir dan kartu pemilih. Kalau penomoran di sini berbeda, pencocokan baris
 * dengan kertas menjadi mustahil, jadi jangan menggantinya dengan nomor sendiri.
 */

type Status = 'belum' | 'sebagian' | 'lengkap'

/**
 * Satu pemilih mengirim dua suara (mitratama + mitramuda). `sudahMemilih` di
 * tabel siswa baru bernilai true setelah KEDUA suara tersimpan, sehingga
 * pemilih yang hanya berhasil mencoblos satu kategori akan tampak "belum" —
 * padahal server akan menolak dia mencoblos ulang. Karena itu status di sini
 * dihitung dari jumlah baris di tabel vote, bukan dari `sudahMemilih`:
 *
 * - 0 suara  -> belum
 * - 1 suara  -> sebagian (harus dipanggil panitia)
 * - 2 suara  -> lengkap
 *
 * Catatan: jumlah suara per pemilih dibaca sebagai cacah baris, bukan isi
 * pilihannya. Tidak ada informasi kandidat yang ikut keluar.
 */
function statusDari(jumlahSuara: number): Status {
  if (jumlahSuara <= 0) return 'belum'
  if (jumlahSuara === 1) return 'sebagian'
  return 'lengkap'
}

const SEMUA_KELAS = '__semua__'

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'tanpa-ip'

    // Halaman terbuka: batasi supaya tidak dipakai untuk menyedot seluruh data
    // pemilih berulang kali. 60 permintaan per menit cukup untuk satu kelas
    // yang dibuka bergantian, termasuk memuat ulang saat sinyal buruk.
    const batas = batasiLaju(`kehadiran:${ip}`, 60, 60)
    if (!batas.boleh) {
      return NextResponse.json(
        { message: 'Terlalu banyak permintaan. Tunggu sebentar.' },
        { status: 429, headers: { 'Retry-After': String(batas.sisaDetik) } }
      )
    }

    const kelas = request.nextUrl.searchParams.get('kelas')?.trim() || ''

    // Daftar kelas untuk pemilih kelas di layar.
    if (request.nextUrl.searchParams.get('daftar') === 'kelas') {
      const namaKelas = await db
        .selectDistinct({ kelas: siswa.kelas })
        .from(siswa)

      return NextResponse.json({
        kelas: namaKelas
          .map((r) => r.kelas)
          .filter(Boolean)
          .sort(bandingNamaKelas),
      })
    }

    if (!kelas) {
      return NextResponse.json(
        { message: 'Parameter kelas harus diisi' },
        { status: 400 }
      )
    }

    // Satu query dengan subquery cacah suara: menghindari N+1 dan tidak pernah
    // menyentuh kolom kandidat.
    const baris = await db
      .select({
        nis: siswa.nis,
        namaLengkap: siswa.namaLengkap,
        kelas: siswa.kelas,
        jumlahSuara: sql<number>`(
          select count(*) from vote v
          where v.siswa_id = siswa.id
        )`,
      })
      .from(siswa)
      .where(kelas === SEMUA_KELAS ? undefined : eq(siswa.kelas, kelas))
      .orderBy(asc(siswa.namaLengkap))

    const denganNomor = denganNomorUrut(baris)

    const daftar = denganNomor.map((s) => ({
      nomorUrut: s.nomorUrut,
      nis: s.nis,
      namaLengkap: s.namaLengkap,
      kelas: s.kelas,
      status: statusDari(Number(s.jumlahSuara ?? 0)),
    }))

    const ringkasan = {
      total: daftar.length,
      lengkap: daftar.filter((s) => s.status === 'lengkap').length,
      sebagian: daftar.filter((s) => s.status === 'sebagian').length,
      belum: daftar.filter((s) => s.status === 'belum').length,
    }

    return NextResponse.json({
      kelas: kelas === SEMUA_KELAS ? 'Semua kelas' : kelas,
      ringkasan,
      siswa: daftar,
    })
  } catch (error) {
    console.error('Error kehadiran:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data kehadiran' },
      { status: 500 }
    )
  }
}
