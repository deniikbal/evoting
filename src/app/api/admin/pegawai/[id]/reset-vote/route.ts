import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pegawai, kandidat, vote } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

/**
 * Reset status pemilihan satu pegawai.
 *
 * Perbaikan: suara yang sudah tersimpan ikut dihapus, sama seperti pada reset
 * siswa. Versi lama hanya membalik `sudah_memilih` tanpa menyentuh tabel vote,
 * sehingga pemilih yang direset menyumbang suara tambahan dan perolehan
 * kandidat naik lagi di luar jumlah pemilih sebenarnya.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()

  try {
    const { id: idParam } = await params
    const pegawaiId = parseInt(idParam)

    if (isNaN(pegawaiId)) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 })
    }

    const [existingPegawai] = await db
      .select()
      .from(pegawai)
      .where(eq(pegawai.id, pegawaiId))
      .limit(1)

    if (!existingPegawai) {
      return NextResponse.json(
        { message: 'Pegawai tidak ditemukan' },
        { status: 404 }
      )
    }

    const jumlahDihapus = await db.transaction(async (tx) => {
      const suaraPegawai = await tx
        .select({ id: vote.id, kandidatId: vote.kandidatId })
        .from(vote)
        .where(eq(vote.pegawaiId, pegawaiId))

      for (const suara of suaraPegawai) {
        await tx
          .update(kandidat)
          .set({ jumlahSuara: sql`greatest(${kandidat.jumlahSuara} - 1, 0)` })
          .where(eq(kandidat.id, suara.kandidatId))
      }

      await tx.delete(vote).where(eq(vote.pegawaiId, pegawaiId))

      const [updatedPegawai] = await tx
        .update(pegawai)
        .set({ sudahMemilih: false, updatedAt: new Date() })
        .where(eq(pegawai.id, pegawaiId))
        .returning()

      return { jumlahSuara: suaraPegawai.length, pegawai: updatedPegawai }
    })

    return NextResponse.json({
      message:
        jumlahDihapus.jumlahSuara > 0
          ? `Status vote direset dan ${jumlahDihapus.jumlahSuara} suara dihapus`
          : 'Status vote berhasil direset',
      suaraDihapus: jumlahDihapus.jumlahSuara,
      pegawai: jumlahDihapus.pegawai,
    })
  } catch (error) {
    console.error('Error resetting vote:', error)
    return NextResponse.json(
      { message: 'Gagal mereset vote' },
      { status: 500 }
    )
  }
}
