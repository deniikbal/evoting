import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, classroom } from '@/lib/schema'
import { eq, count, and } from 'drizzle-orm'
import { bandingNamaKelas } from '@/lib/urutan-kelas'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    // Get all classrooms with their students
    const allClassrooms = await db
      .select({
        id: classroom.id,
        name: classroom.name,
        angkatan: classroom.angkatan,
      })
      .from(classroom)

    // Get voting counts by classroom
    const votingByClassroom = await db
      .select({
        classroomId: siswa.classroomId,
        totalSiswa: count(),
      })
      .from(siswa)
      .groupBy(siswa.classroomId)

    const votingByClassroomVoted = await db
      .select({
        classroomId: siswa.classroomId,
        totalVoted: count(),
      })
      .from(siswa)
      .where(eq(siswa.sudahMemilih, true))
      .groupBy(siswa.classroomId)

    // Map the data
    const classroomData = allClassrooms.map(c => {
      const totalData = votingByClassroom.find(v => v.classroomId === c.id)
      const votedData = votingByClassroomVoted.find(v => v.classroomId === c.id)
      
      return {
        classroomId: c.id,
        name: c.name,
        angkatan: c.angkatan,
        totalSiswa: totalData?.totalSiswa || 0,
        totalVoted: votedData?.totalVoted || 0,
      }
    })

    // Group by angkatan
    const byAngkatan = classroomData.reduce((acc: any[], item) => {
      const existing = acc.find(a => a.angkatan === item.angkatan)
      if (existing) {
        existing.totalSiswa += item.totalSiswa
        existing.totalVoted += item.totalVoted
      } else {
        acc.push({
          angkatan: item.angkatan,
          totalSiswa: item.totalSiswa,
          totalVoted: item.totalVoted,
        })
      }
      return acc
    }, [])

    // Group by kelas (classroom) — urutan natural supaya tampilan dasbor tidak
    // bergantung pada urutan balik dari database.
    const byKelas = classroomData
      .map(item => ({
        name: item.name,
        totalSiswa: item.totalSiswa,
        totalVoted: item.totalVoted,
      }))
      .sort((a, b) => bandingNamaKelas(a.name, b.name))

    return NextResponse.json({
      byAngkatan,
      byKelas,
    })

  } catch (error) {
    console.error('Error fetching chart statistik:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data statistik chart' },
      { status: 500 }
    )
  }
}
