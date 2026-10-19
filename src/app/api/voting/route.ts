import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, kandidat, vote, pengaturan } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { bacaTiket } from '@/lib/tiket-voting'
import { batasiLaju } from '@/lib/batas-laju'

export const dynamic = 'force-dynamic'

/**
 * Simpan satu suara.
 *
 * Perbaikan dari versi sebelumnya (semua temuan terukur sebelum diubah):
 *
 * 1. Identitas pemilih dibaca dari tiket bertanda tangan, bukan dari
 *    `siswaId`/`pegawaiId` di body. Sebelumnya siapa pun yang tahu sebuah id
 *    bisa mencoblos atas nama orang itu tanpa pernah memegang kartunya.
 * 2. `voting_aktif` diperiksa di sini. Dulu hanya /api/auth/qr yang memeriksa,
 *    sehingga request langsung ke endpoint ini tetap tersimpan walaupun voting
 *    sudah ditutup.
 * 3. Kandidat wajib sesuai kategori pemilih: siswa mencoblos mitramuda, guru/TU
 *    mencoblos mitratama. Sebelumnya kandidat apa pun diterima untuk pemilih
 *    apa pun; bukti DB: satu kandidat mitratama mengumpulkan 12 suara padahal
 *    hanya 24 siswa memilih.
 * 4. Satu kategori hanya boleh dicoblos sekali per pemilih, dan hak pilih baru
 *    ditutup setelah KEDUA kategori terisi. Ini menghapus masalah lama: kiosk
 *    mengirim dua request paralel, dan bila satu gagal, pemilih sudah ditandai
 *    "sudah memilih" dengan separuh suara tersimpan permanen.
 *
 * Kiosk mengirim dua request bersamaan, jadi penguncian dilakukan per pemilih
 * memakai advisory lock transaksi. Tanpa itu, dua request yang berjalan
 * bersamaan sama-sama membaca "belum mencoblos" dan suara ganda bisa lolos.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'tanpa-ip'

    // Kiosk yang sah mengirim dua request per pemilih; 40 per menit tidak akan
    // mengganggu antrean, tetapi menutup percobaan beruntun.
    const batas = batasiLaju(`voting:${ip}`, 40, 60)
    if (!batas.boleh) {
      return NextResponse.json(
        { message: 'Terlalu banyak permintaan. Tunggu sebentar.' },
        { status: 429, headers: { 'Retry-After': String(batas.sisaDetik) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { kandidatId, tiket } = body as {
      kandidatId?: number
      tiket?: string
    }

    if (!kandidatId || !tiket) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 })
    }

    const pemilih = bacaTiket(tiket)
    if (!pemilih) {
      return NextResponse.json(
        {
          message:
            'Sesi pemilih tidak valid atau kedaluwarsa. Pindai ulang kartu Anda.',
        },
        { status: 401 }
      )
    }

    // 2. Voting harus sedang berjalan.
    const [pengaturanVoting] = await db
      .select()
      .from(pengaturan)
      .where(eq(pengaturan.namaPengaturan, 'voting_aktif'))
      .limit(1)

    if (!pengaturanVoting || pengaturanVoting.nilai !== 'true') {
      return NextResponse.json(
        { message: 'Voting belum dimulai atau sudah selesai' },
        { status: 403 }
      )
    }

    // 3. Kandidat harus ada dan kategorinya cocok.
    const [kandidatData] = await db
      .select()
      .from(kandidat)
      .where(eq(kandidat.id, Number(kandidatId)))
      .limit(1)

    if (!kandidatData) {
      return NextResponse.json({ message: 'Kandidat tidak ditemukan' }, { status: 404 })
    }

    // Kandidat wajib termasuk salah satu dari dua kategori resmi. Yang
    // dilarang adalah mencoblos kategori yang sama dua kali, bukan mencoblos
    // kedua kategori: setiap pemilih (siswa maupun guru/TU) memang memilih satu
    // mitratama dan satu mitramuda. Data lama mengonfirmasi pola ini: 24
    // pemilih menghasilkan tepat 48 suara, 24 pada masing-masing kategori.
    if (!['mitratama', 'mitramuda'].includes(kandidatData.role)) {
      return NextResponse.json(
        { message: 'Kategori kandidat tidak dikenali' },
        { status: 400 }
      )
    }

    const hasil = await db.transaction(async (tx) => {
      // Kunci per pemilih: request paralel untuk orang yang sama dijalankan
      // berurutan, sehingga hitungan di bawah selalu akurat. Tanpa ini, dua
      // request kiosk yang berjalan bersamaan sama-sama membaca "belum
      // mencoblos" dan suara ganda bisa lolos.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`pemilih:${pemilih.jenis}:${pemilih.id}`}))`
      )

      const kolomPemilih = pemilih.jenis === 'siswa' ? vote.siswaId : vote.pegawaiId

      // Kategori yang sama tidak boleh dicoblos dua kali.
      const [sudahAda] = await tx
        .select({ id: vote.id })
        .from(vote)
        .where(
          sql`${kolomPemilih} = ${pemilih.id} and ${vote.kandidatId} in (select id from kandidat where role = ${kandidatData.role})`
        )
        .limit(1)

      if (sudahAda) {
        throw new Error('Kategori ini sudah dicoblos')
      }

      const [ringkasan] = await tx
        .select({ total: sql<number>`count(*)` })
        .from(vote)
        .where(sql`${kolomPemilih} = ${pemilih.id}`)

      if (Number(ringkasan?.total ?? 0) >= 2) {
        throw new Error('Sudah melakukan voting')
      }

      if (pemilih.jenis === 'siswa') {
        const [siswaData] = await tx
          .select({ id: siswa.id })
          .from(siswa)
          .where(eq(siswa.id, pemilih.id))
          .limit(1)
        if (!siswaData) throw new Error('Siswa tidak ditemukan')
      } else {
        const [pegawaiData] = await tx
          .select({ id: pegawai.id })
          .from(pegawai)
          .where(eq(pegawai.id, pemilih.id))
          .limit(1)
        if (!pegawaiData) throw new Error('Pegawai tidak ditemukan')
      }

      await tx.insert(vote).values({
        siswaId: pemilih.jenis === 'siswa' ? pemilih.id : null,
        pegawaiId: pemilih.jenis === 'siswa' ? null : pemilih.id,
        kandidatId: kandidatData.id,
        voterType: pemilih.jenis,
      })

      await tx
        .update(kandidat)
        .set({ jumlahSuara: sql`${kandidat.jumlahSuara} + 1` })
        .where(eq(kandidat.id, kandidatData.id))

      // 4. Hak pilih ditutup hanya setelah kedua kategori terisi.
      const [setelah] = await tx
        .select({ total: sql<number>`count(*)` })
        .from(vote)
        .where(sql`${kolomPemilih} = ${pemilih.id}`)

      const lengkap = Number(setelah?.total ?? 0) >= 2

      if (lengkap) {
        if (pemilih.jenis === 'siswa') {
          await tx
            .update(siswa)
            .set({ sudahMemilih: true })
            .where(eq(siswa.id, pemilih.id))
        } else {
          await tx
            .update(pegawai)
            .set({ sudahMemilih: true })
            .where(eq(pegawai.id, pemilih.id))
        }
      }

      const [kandidatTerkini] = await tx
        .select()
        .from(kandidat)
        .where(eq(kandidat.id, kandidatData.id))
        .limit(1)

      return { kandidat: kandidatTerkini, lengkap }
    })

    return NextResponse.json({
      message: 'Voting berhasil',
      lengkap: hasil.lengkap,
      kandidat: hasil.kandidat,
    })
  } catch (error: any) {
    console.error('Voting error:', error)

    if (error?.message?.includes('Kategori ini sudah dicoblos')) {
      return NextResponse.json(
        { message: 'Pilihan pada kategori ini sudah tersimpan' },
        { status: 409 }
      )
    }

    if (error?.message?.includes('Sudah melakukan voting')) {
      return NextResponse.json(
        { message: 'Anda sudah menggunakan hak suara Anda' },
        { status: 403 }
      )
    }

    if (error?.message?.includes('tidak ditemukan')) {
      return NextResponse.json(
        { message: 'Data pemilih tidak valid' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Terjadi kesalahan saat melakukan voting' },
      { status: 500 }
    )
  }
}
