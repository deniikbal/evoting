import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import crypto from 'crypto'
import { bandingNamaKelas } from '@/lib/urutan-kelas'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * GET /api/admin/siswa
 *
 * Tanpa parameter: semua siswa, diurutkan per kelas secara natural (X 1, X 2,
 * X 10 lalu XI, XII) dengan nama sebagai urutan kedua. Pengurutan kelas
 * dilakukan di JS karena ORDER BY teks menaruh "X 10" sebelum "X 2".
 * Dengan ?kelas=NAMA: hanya siswa di kelas itu. Dipakai tombol kartu PDF per
 * kelas, yang sebelumnya mengunduh seluruh 1306 siswa (390 KB, sekitar 22 detik
 * pada koneksi lambat) hanya untuk memakai 30 sampai 40 baris.
 */
export async function GET(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const kelas = request.nextUrl.searchParams.get('kelas')

    const daftarSiswa = kelas
      ? await db
          .select()
          .from(siswa)
          .where(eq(siswa.kelas, kelas))
          .orderBy(asc(siswa.namaLengkap))
      : (await db.select().from(siswa).orderBy(asc(siswa.namaLengkap))).sort(
          (a, b) =>
            bandingNamaKelas(a.kelas, b.kelas) ||
            a.namaLengkap.localeCompare(b.namaLengkap, 'id')
        )

    return NextResponse.json(daftarSiswa)
  } catch (error) {
    console.error('Error fetching siswa:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data siswa' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
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