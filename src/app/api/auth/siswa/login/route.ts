import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pengaturan } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { nis, token } = await request.json()

    if (!nis || !token) {
      return NextResponse.json(
        { message: 'NIS dan token harus diisi' },
        { status: 400 }
      )
    }

    // Cari siswa berdasarkan NIS
    const [siswaData] = await db.select().from(siswa).where(eq(siswa.nis, nis)).limit(1)

    if (!siswaData) {
      return NextResponse.json(
        { message: 'NIS tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verifikasi token
    const hashedInputToken = hashToken(token)
    
    if (hashedInputToken !== siswaData.token) {
      return NextResponse.json(
        { message: 'Token salah' },
        { status: 401 }
      )
    }

    // Cek apakah voting sedang aktif
    const [votingAktif] = await db.select().from(pengaturan).where(eq(pengaturan.namaPengaturan, 'voting_aktif')).limit(1)

    if (!votingAktif || votingAktif.nilai !== 'true') {
      return NextResponse.json(
        { message: 'Voting belum dimulai atau sudah selesai' },
        { status: 403 }
      )
    }

    // Login berhasil, kembalikan data siswa (tanpa token)
    const { token: _, ...siswaResponse } = siswaData
    
    return NextResponse.json({
      message: siswaData.sudahMemilih ? 'Login berhasil - Anda sudah voting' : 'Login berhasil',
      siswa: siswaResponse
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}