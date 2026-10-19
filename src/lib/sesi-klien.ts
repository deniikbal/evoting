'use client'

/**
 * Sesi admin di sisi klien.
 *
 * Sebelumnya hak akses admin ditentukan oleh nilai `adminSession` di
 * localStorage, yang bisa ditulis siapa saja dari DevTools. Sejak sesi
 * dipindahkan ke cookie httpOnly, klien tidak lagi memegang apa pun yang
 * menentukan izin; nilai di localStorage hanya dipakai untuk menampilkan nama
 * dan peran di antarmuka. Setiap permintaan ke API tetap diverifikasi server.
 */

export type AdminInfo = {
  id: number
  username: string
  nama?: string
  role: string
}

export async function ambilSesiAdmin(): Promise<AdminInfo | null> {
  try {
    const res = await fetch('/api/auth/admin/sesi', { cache: 'no-store' })
    if (!res.ok) return null

    const data = await res.json()
    if (!data?.admin) return null

    // Simpan salinan hanya untuk keperluan tampilan.
    localStorage.setItem('adminSession', JSON.stringify(data.admin))
    return data.admin as AdminInfo
  } catch {
    return null
  }
}

export async function keluarAdmin() {
  try {
    await fetch('/api/auth/admin/logout', { method: 'POST' })
  } catch {
    // Tetap lanjutkan pembersihan lokal walau jaringan bermasalah.
  }
  localStorage.removeItem('adminSession')
}
