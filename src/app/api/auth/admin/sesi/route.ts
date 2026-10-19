import { NextResponse } from 'next/server'
import { sesiSekarang } from '@/lib/sesi-admin'

export const dynamic = 'force-dynamic'

/**
 * Identitas admin yang sedang login.
 *
 * Dipakai panel admin untuk memutuskan tampilan (mis. menyembunyikan hasil saat
 * voting berjalan bagi admin biasa). Ini bukan pengaman: pengaman sesungguhnya
 * ada di setiap route /api/admin/* dan tidak bisa dilewati dari sisi klien.
 */
export async function GET() {
  const sesi = await sesiSekarang()

  if (!sesi) {
    return NextResponse.json(
      { message: 'Belum login sebagai admin' },
      { status: 401 }
    )
  }

  return NextResponse.json({ admin: sesi })
}
