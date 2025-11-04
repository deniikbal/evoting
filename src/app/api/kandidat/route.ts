import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kandidat } from '@/lib/schema'
import { asc } from 'drizzle-orm'

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