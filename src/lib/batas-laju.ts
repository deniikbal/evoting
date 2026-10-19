import crypto from 'crypto'

/**
 * Pembatas laju sederhana di memori proses.
 *
 * Panel admin dan kiosk tidak punya pembatas sama sekali, sehingga token 6
 * karakter (32^6 ≈ 1 miliar kombinasi, tetapi tanpa jeda maka percobaan
 * beruntun tetap mungkin) bisa ditebak secara daring, dan endpoint yang
 * menulis ke database bisa dibanjiri.
 *
 * Pembatas ini per-proses; cukup untuk satu instance PM2. Kalau nanti jalan di
 * beberapa instance, ganti penyimpanannya ke Redis atau tabel.
 */

type Catatan = { jumlah: number; disetelUlangPada: number }

const peta = new Map<string, Catatan>()

/** Bersihkan catatan kedaluwarsa supaya peta tidak tumbuh tanpa batas. */
function bersihkan(sekarang: number) {
  if (peta.size < 5000) return
  for (const [k, v] of peta) {
    if (v.disetelUlangPada <= sekarang) peta.delete(k)
  }
}

export type HasilBatas = {
  boleh: boolean
  sisaDetik: number
}

export function batasiLaju(
  kunci: string,
  batas: number,
  jendelaDetik: number
): HasilBatas {
  const sekarang = Date.now()
  bersihkan(sekarang)

  const catatan = peta.get(kunci)

  if (!catatan || catatan.disetelUlangPada <= sekarang) {
    peta.set(kunci, {
      jumlah: 1,
      disetelUlangPada: sekarang + jendelaDetik * 1000,
    })
    return { boleh: true, sisaDetik: 0 }
  }

  catatan.jumlah += 1

  if (catatan.jumlah > batas) {
    return {
      boleh: false,
      sisaDetik: Math.max(
        1,
        Math.ceil((catatan.disetelUlangPada - sekarang) / 1000)
      ),
    }
  }

  return { boleh: true, sisaDetik: 0 }
}

/** Alamat pemanggil dari header proxy, dipakai sebagai kunci pembatas. */
export function kunciDariPermintaan(header: Headers, tambahan: string) {
  const ip =
    header.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    header.get('x-real-ip') ||
    'tanpa-ip'

  return `${ip}:${tambahan}`
}

/** Pembatas untuk request JSON biasa; dipakai bersama oleh beberapa handler. */
export function bolehDariPermintaan(
  header: Headers,
  aksi: string,
  batas: number,
  jendelaDetik: number
) {
  return batasiLaju(
    kunciDariPermintaan(header, aksi),
    batas,
    jendelaDetik
  )
}

/** Hanya dipakai untuk memberi variasi pada nilai acak bila diperlukan. */
export function acakAman(): number {
  return crypto.randomInt(0, Number.MAX_SAFE_INTEGER)
}
