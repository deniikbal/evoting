import crypto from 'crypto'
import { cookies } from 'next/headers'

/**
 * Sesi admin berbasis cookie bertanda tangan (HMAC-SHA256).
 *
 * Sebelumnya panel admin hanya dilindungi oleh localStorage di sisi klien:
 * nilai `adminSession` bisa ditulis siapa saja lewat DevTools, dan semua route
 * /api/admin/* dapat dipanggil tanpa kredensial apa pun. Sesi sekarang
 * ditandatangani di server sehingga isinya tidak bisa dipalsukan, dan cookie
 * httpOnly membuatnya tidak bisa dibaca maupun ditulis dari JavaScript.
 *
 * Token bersifat stateless: isi + tanda tangan. Tidak ada tabel baru, jadi
 * tidak perlu migrasi database produksi.
 */

export const NAMA_COOKIE_SESI = 'sesiAdmin'

// 12 jam: cukup untuk satu hari pemilihan tanpa login ulang di tengah acara.
const MASA_BERLAKU_DETIK = 12 * 60 * 60

export type SesiAdmin = {
  id: number
  username: string
  nama: string
  role: string
}

/**
 * Kunci penandatangan.
 *
 * SESSION_SECRET dipakai bila ada. Kalau belum disetel (mis. deployment Vercel
 * yang belum diisi variabelnya), kunci diturunkan dari DATABASE_URL sehingga
 * setiap lingkungan tetap punya kunci yang tidak bisa ditebak dari luar tanpa
 * membocorkan rahasia baru. Setel SESSION_SECRET agar kunci sesi terpisah dari
 * kredensial database.
 */
function kunci(): string {
  const rahasia = process.env.SESSION_SECRET
  if (rahasia && rahasia.length >= 16) {
    return crypto.createHash('sha256').update(`sesi-admin:${rahasia}`).digest('hex')
  }

  const dasar = process.env.DATABASE_URL || 'evoting-tanpa-kunci'
  return crypto.createHash('sha256').update(`sesi-admin-turunan:${dasar}`).digest('hex')
}

function tandaTangan(isi: string): string {
  return crypto.createHmac('sha256', kunci()).update(isi).digest('base64url')
}

export function buatTokenSesi(sesi: SesiAdmin): string {
  const isi = Buffer.from(
    JSON.stringify({
      id: sesi.id,
      username: sesi.username,
      nama: sesi.nama,
      role: sesi.role,
      exp: Math.floor(Date.now() / 1000) + MASA_BERLAKU_DETIK,
    })
  ).toString('base64url')

  return `${isi}.${tandaTangan(isi)}`
}

export function bacaTokenSesi(token: string | undefined): SesiAdmin | null {
  if (!token) return null

  const bagian = token.split('.')
  if (bagian.length !== 2) return null

  const [isi, tanda] = bagian
  if (!isi || !tanda) return null

  const harapan = tandaTangan(isi)
  const a = Buffer.from(tanda)
  const b = Buffer.from(harapan)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const data = JSON.parse(Buffer.from(isi, 'base64url').toString('utf8'))
    if (typeof data?.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    if (!data.id || !data.username) return null

    return {
      id: Number(data.id),
      username: String(data.username),
      nama: String(data.nama ?? ''),
      role: String(data.role ?? 'admin'),
    }
  } catch {
    return null
  }
}

/** Sesi dari cookie permintaan yang sedang berjalan. */
export async function sesiSekarang(): Promise<SesiAdmin | null> {
  const jar = await cookies()
  return bacaTokenSesi(jar.get(NAMA_COOKIE_SESI)?.value)
}

export function opsiCookieSesi(token: string) {
  return {
    name: NAMA_COOKIE_SESI,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MASA_BERLAKU_DETIK,
  }
}

export function opsiHapusCookieSesi() {
  return {
    name: NAMA_COOKIE_SESI,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  }
}
