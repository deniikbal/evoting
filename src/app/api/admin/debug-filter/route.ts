import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, vote, classroom } from '@/lib/schema'
import { eq, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filterValue = searchParams.get('value')

    // Get all classrooms
    const allClassrooms = await db.select().from(classroom)
    
    // Check if classroom with filterValue exists
    let matchingClassrooms: any = []
    if (filterValue) {
      matchingClassrooms = await db
        .select()
        .from(classroom)
        .where(eq(classroom.angkatan, filterValue))
    }

    // Get siswa with their classroom info
    const allSiswa = await db
      .select({
        id: siswa.id,
        nis: siswa.nis,
        namaLengkap: siswa.namaLengkap,
        kelas: siswa.kelas,
        classroomId: siswa.classroomId
      })
      .from(siswa)

    // Get all votes
    const allVotes = await db.select().from(vote)

    // Count votes by voterType
    const votesByType = await db
      .select({
        voterType: vote.voterType,
        count: count()
      })
      .from(vote)
      .groupBy(vote.voterType)

    return NextResponse.json({
      filterValue,
      classroomsTotal: allClassrooms.length,
      classrooms: allClassrooms.map(c => ({
        id: c.id,
        name: c.name,
        angkatan: c.angkatan
      })),
      matchingClassroomsCount: matchingClassrooms.length,
      matchingClassrooms: matchingClassrooms.map((c: any) => ({
        id: c.id,
        name: c.name,
        angkatan: c.angkatan
      })),
      siswaTotal: allSiswa.length,
      siswaByClassroom: allSiswa.reduce((acc: any, s) => {
        const classId = s.classroomId || 'null'
        if (!acc[classId]) acc[classId] = 0
        acc[classId]++
        return acc
      }, {}),
      votesTotal: allVotes.length,
      votesByType: votesByType,
      sampleVotes: allVotes.slice(0, 5)
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { message: 'Debug failed', error: String(error) },
      { status: 500 }
    )
  }
}
