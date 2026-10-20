import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pegawai } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const pegawaiId = parseInt(params.id)

    const [pegawaiData] = await db
      .select()
      .from(pegawai)
      .where(eq(pegawai.id, pegawaiId))
      .limit(1)

    if (!pegawaiData) {
      return NextResponse.json(
        { message: 'Pegawai tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(pegawaiData)
  } catch (error) {
    console.error('Error fetching pegawai:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data pegawai' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
  try {
    const pegawaiId = parseInt(params.id)
    const { nama, email, role, nip, nomorInduk, status, classroomId } = await request.json()

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

    // Check if email is unique (if changed)
    if (email && email !== existingPegawai.email) {
      const [emailExists] = await db
        .select()
        .from(pegawai)
        .where(eq(pegawai.email, email))
        .limit(1)

      if (emailExists) {
        return NextResponse.json(
          { message: 'Email sudah terdaftar' },
          { status: 409 }
        )
      }
    }

    const [updatedPegawai] = await db
      .update(pegawai)
      .set({
        nama: nama || existingPegawai.nama,
        email: email || existingPegawai.email,
        role: role || existingPegawai.role,
        nip: nip !== undefined ? nip : existingPegawai.nip,
        nomorInduk: nomorInduk !== undefined ? nomorInduk : existingPegawai.nomorInduk,
        status: status || existingPegawai.status,
        // Pindah kelas: '' berarti tanpa kelas; string angka masuk kelas itu.
        // Tidak dikirim sama sekali = tidak berubah (aman untuk pemanggil lama).
        ...(classroomId !== undefined
          ? { classroomId: classroomId === '' ? null : parseInt(classroomId) }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(pegawai.id, pegawaiId))
      .returning()

    return NextResponse.json({
      message: 'Pegawai berhasil diperbarui',
      pegawai: updatedPegawai,
    })
  } catch (error) {
    console.error('Error updating pegawai:', error)
    return NextResponse.json(
      { message: 'Gagal memperbarui pegawai' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()
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

    const [deletedPegawai] = await db
      .delete(pegawai)
      .where(eq(pegawai.id, pegawaiId))
      .returning()

    return NextResponse.json({
      message: 'Pegawai berhasil dihapus',
      pegawai: deletedPegawai,
    })
  } catch (error) {
    console.error('Error deleting pegawai:', error)
    return NextResponse.json(
      { message: 'Gagal menghapus pegawai' },
      { status: 500 }
    )
  }
}
