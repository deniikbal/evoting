import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, kandidat, vote, classroom } from '@/lib/schema'
import { eq, count, and, inArray, or } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filterType = searchParams.get('type') // 'angkatan', 'kelas', or 'role'
    const filterValue = searchParams.get('value')
    const roleFilter = searchParams.get('role') // optional: 'mitratama' or 'mitramuda'

    if (!filterType || !filterValue) {
      return NextResponse.json(
        { message: 'Filter type and value required' },
        { status: 400 }
      )
    }

    // Get all kandidat
    const allKandidat = await db.select().from(kandidat)

    let filteredSiswaIds: number[] = []
    let filteredKandidat = allKandidat
    
    // Apply role filter if provided
    if (roleFilter && roleFilter !== 'semua') {
      filteredKandidat = filteredKandidat.filter(k => k.role === roleFilter)
    }

    // Handle filter based on type
    if (filterType === 'role') {
      // For role filter, get all siswa and pegawai
      filteredKandidat = allKandidat.filter(k => k.role === filterValue)
      
      const allSiswa = await db.select({ id: siswa.id }).from(siswa)
      filteredSiswaIds = allSiswa.map(s => s.id)
    } else if (filterType === 'angkatan') {
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
            jumlahSuara: 0,
            role: k.role
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
        kandidatVotes: filteredKandidat.map(k => ({
          id: k.id,
          nomorUrut: k.nomorUrut,
          namaCalon: k.namaCalon,
          jumlahSuara: 0,
          role: k.role
        }))
      })
    }

    // Get votes from both siswa and pegawai
    // For siswa: filter by siswaId
    // For pegawai: all pegawai votes are included (no class-based filtering)
    const votes = await db
      .select({
        kandidatId: vote.kandidatId,
        count: count()
      })
      .from(vote)
      .where(
        or(
          inArray(vote.siswaId, filteredSiswaIds),
          // Include all pegawai votes (voterType = 'guru' or 'tu')
          and(
            or(eq(vote.voterType, 'guru'), eq(vote.voterType, 'tu')),
            // voterType is not null (it's a pegawai vote)
          )
        )
      )
      .groupBy(vote.kandidatId)

    // Map votes to kandidat (using filtered kandidat based on role)
    const kandidatVotes = filteredKandidat.map(k => {
      const voteData = votes.find(v => v.kandidatId === k.id)
      return {
        id: k.id,
        nomorUrut: k.nomorUrut,
        namaCalon: k.namaCalon,
        jumlahSuara: voteData?.count || 0,
        role: k.role
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
