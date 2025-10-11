import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { kandidatId, siswaId } = await request.json()

    if (!kandidatId || !siswaId) {
      return NextResponse.json(
        { message: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Gunakan transaksi untuk memastikan integritas data
    const result = await db.$transaction(async (tx) => {
      // 1. Cek apakah siswa sudah memilih
      const siswa = await tx.siswa.findUnique({
        where: { id: siswaId }
      })

      if (!siswa) {
        throw new Error('Siswa tidak ditemukan')
      }

      if (siswa.sudahMemilih) {
        throw new Error('Siswa sudah melakukan voting')
      }

      // 2. Tambah jumlah suara kandidat
      const updatedKandidat = await tx.kandidat.update({
        where: { id: kandidatId },
        data: {
          jumlahSuara: {
            increment: 1
          }
        }
      })

      // 3. Update status siswa sudah memilih
      await tx.siswa.update({
        where: { id: siswaId },
        data: {
          sudahMemilih: true
        }
      })

      return updatedKandidat
    })

    return NextResponse.json({
      message: 'Voting berhasil',
      kandidat: result
    })

  } catch (error: any) {
    console.error('Voting error:', error)
    
    if (error.message.includes('sudah melakukan voting')) {
      return NextResponse.json(
        { message: 'Anda sudah menggunakan hak suara Anda' },
        { status: 403 }
      )
    }

    if (error.message.includes('Siswa tidak ditemukan')) {
      return NextResponse.json(
        { message: 'Data siswa tidak valid' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Terjadi kesalahan saat melakukan voting' },
      { status: 500 }
    )
  }
}