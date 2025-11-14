import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pegawai } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { generatePegawaiToken, generatePegawaiPassword, hashToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pegawaiId = parseInt(params.id)

    // Check if pegawai exists
    const [existingPegawai] = await db
      .select()
      .from(pegawai)
      .where(eq(pegawai.id, pegawaiId))
      .limit(1)

    if (!existingPegawai) {
      return NextResponse.json(
        { message: 'Pegawai tidak ditemukan' },
        { status: 404 }
      )
    }

    // Generate new token dan password
    const plainPassword = generatePegawaiPassword()
    const tokenPlain = generatePegawaiToken(existingPegawai.role as 'guru' | 'tu')
    const token = hashToken(tokenPlain)

    const [updatedPegawai] = await db
      .update(pegawai)
      .set({
        passwordPlain: plainPassword,
        token: token,
        tokenPlain: tokenPlain,
        updatedAt: new Date(),
      })
      .where(eq(pegawai.id, pegawaiId))
      .returning()

    return NextResponse.json({
      message: 'Password berhasil di-regenerate',
      pegawai: {
        id: updatedPegawai.id,
        nama: updatedPegawai.nama,
        email: updatedPegawai.email,
      },
      credentials: {
        email: updatedPegawai.email,
        password: plainPassword,
      },
    })
  } catch (error) {
    console.error('Error regenerating token:', error)
    return NextResponse.json(
      { message: 'Gagal me-regenerate token' },
      { status: 500 }
    )
  }
}
