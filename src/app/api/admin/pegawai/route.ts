import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pegawai } from '@/lib/schema'
import { eq, asc, or, ilike } from 'drizzle-orm'
import { generatePegawaiToken, generatePegawaiPassword, hashToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    let query = db.select().from(pegawai)

    if (role && role !== 'all') {
      query = query.where(eq(pegawai.role, role))
    }

    if (search) {
      query = query.where(
        or(
          ilike(pegawai.nama, `%${search}%`),
          ilike(pegawai.email, `%${search}%`)
        )
      )
    }

    const allPegawai = await query.orderBy(asc(pegawai.role), asc(pegawai.nama))

    return NextResponse.json(allPegawai)
  } catch (error) {
    console.error('Error fetching pegawai:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data pegawai' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nama, email, role, nip, nomorInduk, status } = await request.json()

    if (!nama || !email || !role) {
      return NextResponse.json(
        { message: 'Nama, email, dan role harus diisi' },
        { status: 400 }
      )
    }

    if (!['guru', 'tu'].includes(role)) {
      return NextResponse.json(
        { message: 'Role harus guru atau tu' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const [existingPegawai] = await db
      .select()
      .from(pegawai)
      .where(eq(pegawai.email, email))
      .limit(1)

    if (existingPegawai) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    // Generate token dan password
    const plainPassword = generatePegawaiPassword()
    const tokenPlain = generatePegawaiToken(role as 'guru' | 'tu')
    const token = hashToken(tokenPlain)

    const [newPegawai] = await db
      .insert(pegawai)
      .values({
        nama,
        email,
        passwordPlain: plainPassword,
        token: token,
        tokenPlain: tokenPlain,
        role,
        nip: nip || null,
        nomorInduk: nomorInduk || null,
        status: status || 'aktif',
      })
      .returning()

    // Return dengan credentials (untuk ditampilkan ke admin)
    return NextResponse.json({
      message: 'Pegawai berhasil ditambahkan',
      pegawai: {
        id: newPegawai.id,
        nama: newPegawai.nama,
        email: newPegawai.email,
        role: newPegawai.role,
        status: newPegawai.status,
      },
      credentials: {
        email: newPegawai.email,
        password_plain: plainPassword,
        token: tokenPlain, // return plain token
      },
    })
  } catch (error) {
    console.error('Error creating pegawai:', error)
    return NextResponse.json(
      { message: 'Gagal menambah pegawai' },
      { status: 500 }
    )
  }
}
