import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, kandidat, vote } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

/**
 * Reset status pemilihan satu siswa.
 *
 * Perbaikan penting: suara yang sudah tersimpan IKUT dihapus.
 *
 * Versi lama hanya mengubah `sudah_memilih` menjadi false tanpa menyentuh tabel
 * vote. Akibatnya pemilih yang "direset" agar bisa memilih ulang justru
 * menyumbang suara tambahan: baris vote lamanya masih dihitung, dan
 * `jumlah_suara` kandidat naik lagi. Satu orang bisa menambah perolehan
 * kandidat berkali-kali hanya dengan meminta panitia mereset dirinya.
 *
 * Penghapusan suara dan pengurangan `jumlah_suara` dilakukan dalam satu
 * transaksi supaya tidak ada keadaan setengah jalan.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()

  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 })
    }

    const [existingSiswa] = await db
      .select()
      .from(siswa)
      .where(eq(siswa.id, id))
      .limit(1)

    if (!existingSiswa) {
      return NextResponse.json(
        { message: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    const jumlahDihapus = await db.transaction(async (tx) => {
      // Ambil dulu suara yang ada supaya perolehan kandidat dikurangi tepat
      // sebanyak yang benar-benar dihapus.
      const suaraSiswa = await tx
        .select({ id: vote.id, kandidatId: vote.kandidatId })
        .from(vote)
        .where(eq(vote.siswaId, id))

      for (const suara of suaraSiswa) {
        await tx
          .update(kandidat)
          .set({ jumlahSuara: sql`greatest(${kandidat.jumlahSuara} - 1, 0)` })
          .where(eq(kandidat.id, suara.kandidatId))
      }

      await tx.delete(vote).where(eq(vote.siswaId, id))

      await tx
        .update(siswa)
        .set({ sudahMemilih: false })
        .where(eq(siswa.id, id))

      return suaraSiswa.length
    })

    return NextResponse.json({
      message:
        jumlahDihapus > 0
          ? `Status pemilihan direset dan ${jumlahDihapus} suara dihapus`
          : 'Status pemilihan berhasil direset',
      suaraDihapus: jumlahDihapus,
    })
  } catch (error) {
    console.error('Error resetting siswa status:', error)
    return NextResponse.json(
      { message: 'Gagal mereset status' },
      { status: 500 }
    )
  }
}
