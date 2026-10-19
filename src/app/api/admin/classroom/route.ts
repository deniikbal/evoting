import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classroom, siswa } from '@/lib/schema'
import { count } from 'drizzle-orm'
import { bandingNamaKelas } from '@/lib/urutan-kelas'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

// GET - List all classrooms beserta jumlah siswanya.
// jumlahSiswa dipakai halaman /admin/kelas: kelas yang masih berisi siswa tidak
// dapat dihapus, jadi angkanya perlu terlihat sebelum tombol hapus ditekan.
//
// Urutan memakai bandingNamaKelas (bukan ORDER BY nama) karena SQL mengurutkan
// teks: "X 10" akan mendahului "X 2". Pengurutan dilakukan di sini supaya
// halaman Kelas, dropdown Siswa, dan dropdown Pegawai menerima urutan yang sama.
export async function GET(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const classrooms = await db.select().from(classroom)

    // Satu query agregat, bukan satu query per kelas.
    const perKelas = await db
      .select({ classroomId: siswa.classroomId, total: count() })
      .from(siswa)
      .groupBy(siswa.classroomId)

    const petaJumlah = new Map(
      perKelas
        .filter((row) => row.classroomId !== null)
        .map((row) => [row.classroomId as number, Number(row.total)])
    )

    const data = classrooms
      .map((k) => ({
        ...k,
        jumlahSiswa: petaJumlah.get(k.id) ?? 0,
      }))
      .sort((a, b) => bandingNamaKelas(a.name, b.name))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching classrooms:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data kelas' },
      { status: 500 }
    )
  }
}

// POST - Create new classroom
export async function POST(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const body = await request.json()
    const { name, angkatan } = body

    if (!name || !angkatan) {
      return NextResponse.json(
        { message: 'Nama kelas dan angkatan harus diisi' },
        { status: 400 }
      )
    }

    const newClassroom = await db
      .insert(classroom)
      .values({
        name,
        angkatan,
      })
      .returning()

    return NextResponse.json(newClassroom[0], { status: 201 })
  } catch (error) {
    console.error('Error creating classroom:', error)
    return NextResponse.json(
      { message: 'Gagal menambah kelas' },
      { status: 500 }
    )
  }
}
