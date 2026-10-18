// Tipe data dashboard admin.
// Satu sumber supaya angka yang tampil tidak pernah berbeda antar blok.

export interface Statistik {
  totalVoters: number
  totalSiswa: number
  siswaMemilih: number
  siswaBelumMemilih: number
  totalPegawai: number
  pegawaiMemilih: number
  pegawaiBelumMemilih: number
  sudahMemilih: number
  belumMemilih: number
  votingAktif: boolean
}

export interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  jumlahSuara: number
  role: string
}

export interface AdminSession {
  id: number
  username: string
  nama?: string
  role?: 'admin' | 'superadmin'
}

export interface ChartData {
  byAngkatan: Array<{
    angkatan: string
    totalSiswa: number
    totalVoted: number
  }>
  byKelas: Array<{
    name: string
    totalSiswa: number
    totalVoted: number
  }>
}

/** Hasil hitung partisipasi. Dihitung sekali, dipakai semua blok. */
export interface Partisipasi {
  sudah: number
  belum: number
  total: number
  /** null saat total 0, supaya 0/0 tidak tampil sebagai 0%. */
  persen: number | null
}

export function hitungPartisipasi(statistik: Statistik): Partisipasi {
  const total = statistik.totalVoters
  return {
    sudah: statistik.sudahMemilih,
    belum: statistik.belumMemilih,
    total,
    persen: total > 0 ? Math.round((statistik.sudahMemilih / total) * 100) : null,
  }
}

/** Label role kandidat dipakai di beberapa blok. */
export const ROLE_LABEL: Record<string, string> = {
  mitratama: 'Mitra Tama (Kelas XI)',
  mitramuda: 'Mitra Muda (Kelas X)',
}

export function labelRole(role: string): string {
  return ROLE_LABEL[role] ?? role
}
