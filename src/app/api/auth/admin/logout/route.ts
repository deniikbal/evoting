import { NextResponse } from 'next/server'
import { opsiHapusCookieSesi } from '@/lib/sesi-admin'

export const dynamic = 'force-dynamic'

/**
 * Logout admin.
 *
 * Penghapusan cookie harus dilakukan server karena cookie sesi bersifat
 * httpOnly dan tidak dapat dihapus dari JavaScript.
 */
export async function POST() {
  const respons = NextResponse.json({ message: 'Logout berhasil' })
  respons.cookies.set(opsiHapusCookieSesi())
  return respons
}
