import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa } from '@/lib/schema'
import { eq, inArray } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// POST - Regenerate token for single or multiple students
export async function POST(request: NextRequest) {
  try {
    const { studentIds } = await request.json()

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { message: 'Student IDs harus diisi dan berupa array' },
        { status: 400 }
      )
    }

    const updatedStudents = []

    for (const id of studentIds) {
      // Generate new plain token
      const plainToken = Math.random().toString(36).substring(2, 8).toUpperCase()
      // Hash token for security
      const hashedToken = await bcrypt.hash(plainToken, 10)

      const [updated] = await db
        .update(siswa)
        .set({
          token: hashedToken,
          plainToken
        })
        .where(eq(siswa.id, id))
        .returning({
          id: siswa.id,
          nis: siswa.nis,
          namaLengkap: siswa.namaLengkap,
          plainToken: siswa.plainToken
        })

      if (updated) {
        updatedStudents.push(updated)
      }
    }

    if (updatedStudents.length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada siswa yang berhasil diupdate' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: `Berhasil generate ulang token untuk ${updatedStudents.length} siswa`,
      count: updatedStudents.length,
      students: updatedStudents
    })

  } catch (error) {
    console.error('Error regenerating token:', error)
    return NextResponse.json(
      { message: 'Gagal generate ulang token' },
      { status: 500 }
    )
  }
}
