import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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