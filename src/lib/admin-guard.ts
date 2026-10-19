import { NextRequest, NextResponse } from 'next/server'
import { bacaTokenSesi } from '@/lib/sesi-admin'

/**
 * Penjaga untuk seluruh route /api/admin/*.
 *
 * Sebelumnya semua route admin dapat dipanggil tanpa kredensial apa pun
 * (terukur: /api/admin/siswa membalas 200 beserta token login mentah dari
 * luar jaringan). Setiap handler memanggil penjaga ini sebelum menyentuh
 * database, dan membalas 401 lewat `responsBukanAdmin()` bila gagal.
 */

export function punyaSesiAdmin(request: NextRequest) {
  const token = request.cookies.get('sesiAdmin')?.value
  return bacaTokenSesi(token) !== null
}

/** Hanya superadmin. Untuk operasi menyeluruh yang sulit dibatalkan. */
export function punyaSesiSuperadmin(request: NextRequest) {
  const token = request.cookies.get('sesiAdmin')?.value
  const sesi = bacaTokenSesi(token)
  return sesi !== null && sesi.role === 'superadmin'
}

export function responsBukanAdmin() {
  return NextResponse.json(
    { message: 'Akses ditolak. Silakan login sebagai admin.' },
    { status: 401 }
  )
}

export function responsBukanSuperadmin() {
  return NextResponse.json(
    { message: 'Akses ditolak. Tindakan ini hanya untuk superadmin.' },
    { status: 403 }
  )
}
