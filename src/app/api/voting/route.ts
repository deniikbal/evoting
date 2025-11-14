import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, kandidat, vote } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { kandidatId, siswaId, pegawaiId, voterType } = await request.json()

    if (!kandidatId || (!siswaId && !pegawaiId) || !voterType) {
      return NextResponse.json(
        { message: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    if (!['siswa', 'guru', 'tu'].includes(voterType)) {
      return NextResponse.json(
        { message: 'Voter type tidak valid' },
        { status: 400 }
      )
    }

    // Gunakan transaksi untuk memastikan integritas data
    const result = await db.transaction(async (tx) => {
      if (voterType === 'siswa') {
        // 1. Cek apakah siswa sudah memilih
        const [siswaData] = await tx
          .select()
          .from(siswa)
          .where(eq(siswa.id, siswaId!))
          .limit(1)

        if (!siswaData) {
          throw new Error('Siswa tidak ditemukan')
        }

        if (siswaData.sudahMemilih) {
          throw new Error('Siswa sudah melakukan voting')
        }

        // 2. Simpan vote ke tabel vote
        await tx.insert(vote).values({
          siswaId,
          kandidatId,
          voterType: 'siswa',
        })

        // 3. Tambah jumlah suara kandidat
        await tx
          .update(kandidat)
          .set({ jumlahSuara: sql`${kandidat.jumlahSuara} + 1` })
          .where(eq(kandidat.id, kandidatId))

        // 4. Update status siswa sudah memilih
        await tx
          .update(siswa)
          .set({ sudahMemilih: true })
          .where(eq(siswa.id, siswaId))
      } else {
        // Pegawai (guru atau tu)
        const [pegawaiData] = await tx
          .select()
          .from(pegawai)
          .where(eq(pegawai.id, pegawaiId!))
          .limit(1)

        if (!pegawaiData) {
          throw new Error('Pegawai tidak ditemukan')
        }

        if (pegawaiData.sudahMemilih) {
          throw new Error('Pegawai sudah melakukan voting')
        }

        // 2. Simpan vote ke tabel vote
        await tx.insert(vote).values({
          pegawaiId,
          kandidatId,
          voterType: voterType, // 'guru' atau 'tu'
        })

        // 3. Tambah jumlah suara kandidat
        await tx
          .update(kandidat)
          .set({ jumlahSuara: sql`${kandidat.jumlahSuara} + 1` })
          .where(eq(kandidat.id, kandidatId))

        // 4. Update status pegawai sudah memilih
        await tx
          .update(pegawai)
          .set({ sudahMemilih: true })
          .where(eq(pegawai.id, pegawaiId))
      }

      // Return updated kandidat
      const [updatedKandidat] = await tx
        .select()
        .from(kandidat)
        .where(eq(kandidat.id, kandidatId))
        .limit(1)

      return updatedKandidat
    })

    return NextResponse.json({
      message: 'Voting berhasil',
      kandidat: result,
    })
  } catch (error: any) {
    console.error('Voting error:', error)

    if (error.message.includes('sudah melakukan voting')) {
      return NextResponse.json(
        { message: 'Anda sudah menggunakan hak suara Anda' },
        { status: 403 }
      )
    }

    if (error.message.includes('tidak ditemukan')) {
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