import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, pegawai, kandidat, vote, classroom } from '@/lib/schema'
import { eq, count, inArray, or } from 'drizzle-orm'

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

      // Get siswa IDs from these classrooms (if any exist)
      if (classroomIds.length > 0) {
        const siswaList = await db
          .select({ id: siswa.id })
          .from(siswa)
          .where(inArray(siswa.classroomId, classroomIds))

        filteredSiswaIds = siswaList.map(s => s.id)
      }
      // Note: even if no siswa found, we'll still count pegawai votes
    } else if (filterType === 'kelas') {
      // Get siswa IDs from this kelas
      const siswaList = await db
        .select({ id: siswa.id })
        .from(siswa)
        .where(eq(siswa.kelas, filterValue))

      filteredSiswaIds = siswaList.map(s => s.id)
    }

    // Get pegawai IDs that match the filter (for angkatan/kelas filtering)
    let filteredPegawaiIds: number[] = []
    
    if (filterType === 'angkatan' || filterType === 'kelas') {
      // Get pegawai linked to filtered classrooms
      if (filterType === 'angkatan') {
        const classrooms = await db
          .select({ id: classroom.id })
          .from(classroom)
          .where(eq(classroom.angkatan, filterValue))
        
        const classroomIds = classrooms.map(c => c.id)
        
        if (classroomIds.length > 0) {
          const pegawaiList = await db
            .select({ id: pegawai.id })
            .from(pegawai)
            .where(inArray(pegawai.classroomId, classroomIds))
          
          filteredPegawaiIds = pegawaiList.map(p => p.id)
        }
      } else if (filterType === 'kelas') {
        // For kelas filter, find the classroom with this name, then get pegawai
        const classroomData = await db
          .select({ id: classroom.id })
          .from(classroom)
          .where(eq(classroom.name, filterValue))
        
        if (classroomData.length > 0) {
          const pegawaiList = await db
            .select({ id: pegawai.id })
            .from(pegawai)
            .where(eq(pegawai.classroomId, classroomData[0].id))
          
          filteredPegawaiIds = pegawaiList.map(p => p.id)
        }
      }
    }

    // Get votes from both siswa and pegawai
    // Build WHERE clause based on whether we have filtered siswa/pegawai
    let whereCondition
    
    if (filteredSiswaIds.length > 0 && filteredPegawaiIds.length > 0) {
      // Have both siswa and pegawai: include both
      whereCondition = or(
        inArray(vote.siswaId, filteredSiswaIds),
        inArray(vote.pegawaiId, filteredPegawaiIds)
      )
    } else if (filteredSiswaIds.length > 0) {
      // Only have siswa: include siswa + all pegawai from other sources
      whereCondition = or(
        inArray(vote.siswaId, filteredSiswaIds),
        or(eq(vote.voterType, 'guru'), eq(vote.voterType, 'tu'))
      )
    } else if (filteredPegawaiIds.length > 0) {
      // Only have pegawai: only include filtered pegawai
      whereCondition = inArray(vote.pegawaiId, filteredPegawaiIds)
    } else {
      // No filtering: include all pegawai votes
      whereCondition = or(eq(vote.voterType, 'guru'), eq(vote.voterType, 'tu'))
    }

    const votes = await db
      .select({
        kandidatId: vote.kandidatId,
        count: count()
      })
      .from(vote)
      .where(whereCondition)
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
