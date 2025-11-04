import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kandidat } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const allKandidat = await db.select().from(kandidat).orderBy(asc(kandidat.nomorUrut))

    return NextResponse.json(allKandidat)
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
    const [existingKandidat] = await db.select().from(kandidat).where(eq(kandidat.nomorUrut, nomorUrut)).limit(1)

    if (existingKandidat) {
      return NextResponse.json(
        { message: 'Nomor urut sudah digunakan' },
        { status: 409 }
      )
    }

    const [newKandidat] = await db.insert(kandidat).values({
      nomorUrut,
      namaCalon,
      visi: visi || null,
      misi: misi || null,
      fotoUrl: fotoUrl || null
    }).returning()

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