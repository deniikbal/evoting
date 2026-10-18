/**
 * Pengurutan nama kelas dengan cara manusia membacanya.
 *
 * Dua masalah yang diselesaikan:
 * 1. "X 10" harus berada setelah "X 2", bukan sebelumnya. Karena itu angka di
 *    dalam nama dibandingkan sebagai angka (Intl.Collator numeric).
 * 2. Urutan tingkatan harus X, XI, XII. Karena itu tingkatannya dibaca lebih
 *    dulu sebelum sisa nama dibandingkan.
 *
 * Nama yang bukan nama kelas (mis. "GURU", "TU") ditaruh di bawah kelas bila
 * dipakai bersama.
 */

const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' })

const TINGKATAN: Record<string, number> = { X: 10, XI: 11, XII: 12 }

function tingkatDari(nama: string): number | null {
  const cocok = nama.trim().match(/^(XII|XI|X)\b/i)
  if (!cocok) return null
  return TINGKATAN[cocok[1].toUpperCase()] ?? null
}

export function bandingNamaKelas(a: string, b: string): number {
  const tingkatA = tingkatDari(a)
  const tingkatB = tingkatDari(b)

  if (tingkatA !== null && tingkatB !== null) {
    if (tingkatA !== tingkatB) return tingkatA - tingkatB
  } else if (tingkatA === null && tingkatB !== null) {
    return 1
  } else if (tingkatA !== null && tingkatB === null) {
    return -1
  }

  return collator.compare(a, b)
}

/** Bandingkan angkatan: tingkat X, XI, XII naik, lalu yang lain menurut abjad. */
export function bandingAngkatan(a: string, b: string): number {
  const tingkatA = tingkatDari(a)
  const tingkatB = tingkatDari(b)

  if (tingkatA !== null && tingkatB !== null && tingkatA !== tingkatB) {
    return tingkatA - tingkatB
  }
  if (tingkatA === null && tingkatB !== null) return 1
  if (tingkatA !== null && tingkatB === null) return -1

  return collator.compare(a, b)
}

/** Pencarian nama kelas tanpa peduli huruf besar/kecil dan spasi berlebih. */
export function cocokCari(nama: string, kueri: string): boolean {
  const q = kueri.trim().toLowerCase()
  if (!q) return true
  return nama.toLowerCase().includes(q)
}
