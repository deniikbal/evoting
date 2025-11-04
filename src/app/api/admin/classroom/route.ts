import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classroom } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET - List all classrooms
export async function GET() {
  try {
    const classrooms = await db
      .select()
      .from(classroom)
      .orderBy(desc(classroom.angkatan), classroom.name)

    return NextResponse.json(classrooms)
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
