import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pegawai, classroom as classroomTable } from '@/lib/schema'
import { eq, leftJoin } from 'drizzle-orm'
import { generatePegawaiToken, generatePegawaiPassword, hashToken } from '@/lib/utils'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const kelas = searchParams.get('kelas')

    const baris = await db
      .select({ pegawai, kelasNama: classroomTable.name })
      .from(pegawai)
      .leftJoin(classroomTable, eq(pegawai.classroomId, classroomTable.id))

    const allPegawai = baris
      // Bentuk respons tetap rata (satu objek per pegawai) ditambah nama kelas;
      // pemakai lain (PDF kartu, import) tak perlu tahu bedanya.
      .map(({ pegawai: p, kelasNama }) => ({ ...p, kelasNama }))
      .filter((p) => {
        if (role && role !== 'all' && p.role !== role) return false
        if (
          search &&
          !p.nama.toLowerCase().includes(search.toLowerCase()) &&
          !p.email.toLowerCase().includes(search.toLowerCase())
        ) {
          return false
        }
        // Filter per kelas (mis. ?kelas=GURU) dipakai halaman Kelas saat
        // membuat kartu / daftar hadir untuk kelompok pegawai.
        if (kelas && p.kelasNama !== kelas) return false
        return true
      })
      .sort((a, b) => (a.role === b.role ? a.nama.localeCompare(b.nama) : a.role < b.role ? -1 : 1))

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
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const { nama, email, role, nip, nomorInduk, classroomId, status } = await request.json()

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

    // Generate token (same format as siswa: 6 characters)
    const tokenPlain = generatePegawaiToken(role as 'guru' | 'tu')
    const token = hashToken(tokenPlain)

    const [newPegawai] = await db
      .insert(pegawai)
      .values({
        nama,
        email,
        token: token,
        tokenPlain: tokenPlain,
        role,
        nip: nip || null,
        nomorInduk: nomorInduk || null,
        classroomId: classroomId ? parseInt(classroomId) : null,
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
        token: tokenPlain,
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
