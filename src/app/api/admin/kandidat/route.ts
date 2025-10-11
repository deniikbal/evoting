import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const kandidat = await db.kandidat.findMany({
      orderBy: [
        { nomorUrut: 'asc' }
      ]
    })

    return NextResponse.json(kandidat)
  } catch (error) {
    console.error('Error fetching kandidat:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data kandidat' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nomorUrut, namaCalon, visi, misi, fotoUrl } = await request.json()

    if (!nomorUrut || !namaCalon) {
      return NextResponse.json(
        { message: 'Nomor urut dan nama calon harus diisi' },
        { status: 400 }
      )
    }

    // Check if nomor urut already exists
    const existingKandidat = await db.kandidat.findUnique({
      where: { nomorUrut }
    })

    if (existingKandidat) {
      return NextResponse.json(
        { message: 'Nomor urut sudah digunakan' },
        { status: 409 }
      )
    }

    const newKandidat = await db.kandidat.create({
      data: {
        nomorUrut,
        namaCalon,
        visi: visi || null,
        misi: misi || null,
        fotoUrl: fotoUrl || null
      }
    })

    return NextResponse.json({
      message: 'Kandidat berhasil ditambahkan',
      kandidat: newKandidat
    })

  } catch (error) {
    console.error('Error creating kandidat:', error)
    return NextResponse.json(
      { message: 'Gagal menambah kandidat' },
      { status: 500 }
    )
  }
}