import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, kandidat, vote, classroom } from '@/lib/schema'
import { eq, count, and, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filterType = searchParams.get('type') // 'angkatan' or 'kelas'
    const filterValue = searchParams.get('value')

    if (!filterType || !filterValue) {
      return NextResponse.json(
        { message: 'Filter type and value required' },
        { status: 400 }
      )
    }

    // Get all kandidat
    const allKandidat = await db.select().from(kandidat)

    let filteredSiswaIds: number[] = []

    if (filterType === 'angkatan') {
      // Get all classrooms with this angkatan
      const classrooms = await db
        .select({ id: classroom.id })
        .from(classroom)
        .where(eq(classroom.angkatan, filterValue))

      const classroomIds = classrooms.map(c => c.id)

      if (classroomIds.length === 0) {
        return NextResponse.json({
          kandidatVotes: allKandidat.map(k => ({
            id: k.id,
            nomorUrut: k.nomorUrut,
            namaCalon: k.namaCalon,
            jumlahSuara: 0
          }))
        })
      }

      // Get siswa IDs from these classrooms
      const siswaList = await db
        .select({ id: siswa.id })
        .from(siswa)
        .where(inArray(siswa.classroomId, classroomIds))

      filteredSiswaIds = siswaList.map(s => s.id)
    } else if (filterType === 'kelas') {
      // Get siswa IDs from this kelas
      const siswaList = await db
        .select({ id: siswa.id })
        .from(siswa)
        .where(eq(siswa.kelas, filterValue))

      filteredSiswaIds = siswaList.map(s => s.id)
    }

    if (filteredSiswaIds.length === 0) {
      return NextResponse.json({
        kandidatVotes: allKandidat.map(k => ({
          id: k.id,
          nomorUrut: k.nomorUrut,
          namaCalon: k.namaCalon,
          jumlahSuara: 0
        }))
      })
    }

    // Get votes from these siswa
    const votes = await db
      .select({
        kandidatId: vote.kandidatId,
        count: count()
      })
      .from(vote)
      .where(inArray(vote.siswaId, filteredSiswaIds))
      .groupBy(vote.kandidatId)

    // Map votes to kandidat
    const kandidatVotes = allKandidat.map(k => {
      const voteData = votes.find(v => v.kandidatId === k.id)
      return {
        id: k.id,
        nomorUrut: k.nomorUrut,
        namaCalon: k.namaCalon,
        jumlahSuara: voteData?.count || 0
      }
    })

    return NextResponse.json({ kandidatVotes })

  } catch (error) {
    console.error('Error fetching kandidat votes:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data suara kandidat' },
      { status: 500 }
    )
  }
}
