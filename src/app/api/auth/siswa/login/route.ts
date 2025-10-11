import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

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
    const siswa = await db.siswa.findUnique({
      where: { nis }
    })

    if (!siswa) {
      return NextResponse.json(
        { message: 'NIS tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verifikasi token
    const isTokenValid = await bcrypt.compare(token, siswa.token)
    
    if (!isTokenValid) {
      return NextResponse.json(
        { message: 'Token salah' },
        { status: 401 }
      )
    }

    // Cek apakah voting sedang aktif
    const votingAktif = await db.pengaturan.findUnique({
      where: { namaPengaturan: 'voting_aktif' }
    })

    if (!votingAktif || votingAktif.nilai !== 'true') {
      return NextResponse.json(
        { message: 'Voting belum dimulai atau sudah selesai' },
        { status: 403 }
      )
    }

    // Login berhasil, kembalikan data siswa (tanpa token)
    const { token: _, ...siswaData } = siswa
    
    return NextResponse.json({
      message: siswa.sudahMemilih ? 'Login berhasil - Anda sudah voting' : 'Login berhasil',
      siswa: siswaData
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}