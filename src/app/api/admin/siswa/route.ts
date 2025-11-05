import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function GET() {
  try {
    const allSiswa = await db.select().from(siswa).orderBy(asc(siswa.kelas), asc(siswa.namaLengkap))

    return NextResponse.json(allSiswa)
  } catch (error) {
    console.error('Error fetching siswa:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data siswa' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nis, namaLengkap, kelas, classroomId } = await request.json()

    if (!nis || !namaLengkap || !kelas) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    // Check if NIS already exists
    const [existingSiswa] = await db.select().from(siswa).where(eq(siswa.nis, nis)).limit(1)

    if (existingSiswa) {
      return NextResponse.json(
        { message: 'NIS sudah terdaftar' },
        { status: 409 }
      )
    }

    // Generate random token (plain for students to see)
    const plainToken = Math.random().toString(36).substring(2, 8).toUpperCase()
    // Hash token for security
    const hashedToken = hashToken(plainToken)
    
    const [newSiswa] = await db.insert(siswa).values({
      nis,
      namaLengkap,
      kelas,
      classroomId: classroomId ? parseInt(classroomId) : null,
      token: hashedToken,
      plainToken
    }).returning()

    // Return student data without token
    const { token: _, ...siswaData } = newSiswa

    return NextResponse.json({
      message: 'Siswa berhasil ditambahkan',
      siswa: siswaData
    })

  } catch (error) {
    console.error('Error creating siswa:', error)
    return NextResponse.json(
      { message: 'Gagal menambah siswa' },
      { status: 500 }
    )
  }
}