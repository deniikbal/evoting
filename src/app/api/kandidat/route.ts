import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kandidat, vote } from '@/lib/schema'
import { asc, count, eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all kandidat
    const allKandidat = await db.select().from(kandidat).orderBy(asc(kandidat.nomorUrut))

    // For each kandidat, count votes from vote table (real-time calculation)
    const kandidatWithVotes = await Promise.all(
      allKandidat.map(async (k) => {
        const voteCount = await db
          .select({ count: count() })
          .from(vote)
          .where(eq(vote.kandidatId, k.id))

        return {
          ...k,
          jumlahSuara: voteCount[0]?.count || 0,
        }
      })
    )

    return NextResponse.json(kandidatWithVotes)
  } catch (error) {
    console.error('Error fetching kandidat:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data kandidat' },
      { status: 500 }
    )
  }
}