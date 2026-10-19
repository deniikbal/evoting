import crypto from 'crypto'

/**
 * Tiket sesi pemilih untuk alur kiosk.
 *
 * Dulu kiosk mengirim `siswaId` mentah ke /api/voting. Artinya siapa pun yang
 * tahu atau menebak sebuah id bisa mengirim suara atas nama orang itu, dan
 * tidak ada yang mengikat suara ke orang yang benar-benar memindai kartu.
 *
 * Sekarang /api/auth/qr mengeluarkan tiket bertanda tangan setelah kartu
 * dipindai. /api/voting hanya menerima tiket, dan identitas pemilih diambil
 * dari dalam tiket, bukan dari isi body permintaan.
 */

export type TiketPemilih = {
  jenis: 'siswa' | 'guru' | 'tu'
  id: number
}

const MASA_BERLAKU_DETIK = 10 * 60

function kunci(): string {
  const rahasia = process.env.SESSION_SECRET
  if (rahasia && rahasia.length >= 16) {
    return crypto
      .createHash('sha256')
      .update(`tiket-voting:${rahasia}`)
      .digest('hex')
  }

  const dasar = process.env.DATABASE_URL || 'evoting-tanpa-kunci'
  return crypto
    .createHash('sha256')
    .update(`tiket-voting-turunan:${dasar}`)
    .digest('hex')
}

function tandaTangan(isi: string): string {
  return crypto.createHmac('sha256', kunci()).update(isi).digest('base64url')
}

export function buatTiket(jenis: TiketPemilih['jenis'], id: number): string {
  const isi = Buffer.from(
    JSON.stringify({
      jenis,
      id,
      exp: Math.floor(Date.now() / 1000) + MASA_BERLAKU_DETIK,
    })
  ).toString('base64url')

  return `${isi}.${tandaTangan(isi)}`
}

export function bacaTiket(tiket: unknown): TiketPemilih | null {
  if (typeof tiket !== 'string') return null

  const bagian = tiket.split('.')
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
    if (!['siswa', 'guru', 'tu'].includes(data?.jenis)) return null
    if (!Number.isInteger(data?.id) || data.id <= 0) return null

    return { jenis: data.jenis, id: Number(data.id) }
  } catch {
    return null
  }
}
