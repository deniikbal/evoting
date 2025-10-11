import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const siswa = await db.siswa.findMany({
      orderBy: [
        { kelas: 'asc' },
        { namaLengkap: 'asc' }
      ]
    })

    return NextResponse.json(siswa)
  } catch (error) {
    console.error('Error fetching siswa:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data siswa' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nis, namaLengkap, kelas } = await request.json()

    if (!nis || !namaLengkap || !kelas) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    // Check if NIS already exists
    const existingSiswa = await db.siswa.findUnique({
      where: { nis }
    })

    if (existingSiswa) {
      return NextResponse.json(
        { message: 'NIS sudah terdaftar' },
        { status: 409 }
      )
    }

    // Generate random token
    const token = Math.random().toString(36).substring(2, 8)
    
    const newSiswa = await db.siswa.create({
      data: {
        nis,
        namaLengkap,
        kelas,
        token
      }
    })

    // Return student data without token
    const { token: _, ...siswaData } = newSiswa

    return NextResponse.json({
      message: 'Siswa berhasil ditambahkan',
      siswa: siswaData
    })

  } catch (error) {
    console.error('Error creating siswa:', error)
    return NextResponse.json(
      { message: 'Gagal menambah siswa' },
      { status: 500 }
    )
  }
}