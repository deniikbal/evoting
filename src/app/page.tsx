'use client'

/*
 * Halaman informasi resmi Pemilihan Ketua OSIS SMAN 1 Bantarujeg.
 *
 * Design Read: halaman publik pemilihan untuk siswa, panitia, dan penonton,
 * mayoritas membuka dari ponsel. Bahasa visualnya "paparan resmi sekolah",
 * bersih dan tegas, warna identitasnya diambil dari bahasa warna alur voting:
 * hijau Mitra Tama (#15803d), merah Mitra Muda (#b91c1c), amber untuk nomor
 * urut. Biru #1e3a8a sebagai warna resmi (sekolah memakai biru ini di
 *   aplikasi lain) dan hover-nya biru gelap #172554.
 * Dial: ENERGY 2 / RHYTHM 2 / MOTION 1 (hanya hover/fokus bergerak).
 *
 * Keputusan utama dan alasannya:
 * - Netral dingin (slate) sebagai basis, biru resmi sebagai warna primer,
 *   2 warna kategori + 1 aksen amber; tanpa gradasi biru-ungu generik
 *   karena setiap warna harus punya makna.
 * - Foto kandidat tampil penuh lebar kartu (rasio 3:4) di ponsel agar
 *   wajah kandidat terlihat jelas, bukan sekadar foto kecil di kartu sempit.
 * - Bagian "Fitur" 6 kartu dihilangkan: tidak ada bukti di baliknya. Yang
 *   dibuka pengunjung: siapa kandidatnya, bagaimana cara memilih, dan status.
 * - Statistik hanya menampilkan angka nyata dari /api/statistik, tidak ada
 *   angka hiasan. Status galat diberi tombol coba lagi yang benar-benar berfungsi.
 */

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  ChevronRight,
  Menu,
  ScanLine,
  User,
  UserCheck,
  Vote,
  X,
} from 'lucide-react'

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  visi: string | null
  misi: string | null
  fotoUrl: string | null
  jumlahSuara: number
  role: string
}

/* Warna kategori pemilihan; sengaja ditulis sebagai konstanta agar HTML dan
   kartu kandidat memakai warna yang persis sama dengan halaman /vote. */
const WARNA_KATEGORI = {
  mitratama: '#15803d',
  mitramuda: '#b91c1c',
} as const

const JADWAL = {
  tahun: '2026',
  periode: '2026/2027',
}

export default function LandingPage() {
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalKandidat: 0,
    votingAktif: false,
  })
  const [kandidatList, setKandidatList] = useState<Kandidat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchError, setIsFetchError] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    setIsFetchError(false)
    try {
      const [statistikResponse, kandidatResponse] = await Promise.all([
        fetch('/api/statistik'),
        fetch('/api/kandidat'),
      ])

      if (statistikResponse.ok) {
        const statistikData = await statistikResponse.json()
        setStats(prev => ({
          ...prev,
          totalSiswa: statistikData.totalSiswa,
          votingAktif: statistikData.votingAktif,
        }))
      }

      if (kandidatResponse.ok) {
        const kandidatData = await kandidatResponse.json()
        setKandidatList(kandidatData)
        setStats(prev => ({ ...prev, totalKandidat: kandidatData.length }))
      } else {
        setIsFetchError(true)
      }
    } catch (err) {
      console.error('Gagal memuat data beranda:', err)
      setIsFetchError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const navItems = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Kandidat', href: '#kandidat' },
    { label: 'Cara Memilih', href: '#cara-memilih' },
    { label: 'Kontak', href: '#kontak' },
  ]

  return (
    <div className="min-h-screen bg-background [--border:#e2e8f0]">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between sm:h-16">
            <a href="#beranda" className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#1e3a8a] text-white">
                <Vote className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                  E-Voting OSIS
                </p>
                <p className="hidden text-[11px] text-slate-600 sm:block">
                  SMAN 1 Bantarujeg
                </p>
              </div>
            </a>

            {/* Navigasi ponsel: daftar menu, bukan baris tautan yang sempit */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden min-h-11 border-slate-300 text-[#1e3a8a] hover:bg-[rgba(30,58,138,0.06)] hover:text-[#172554] md:inline-flex"
                onClick={() => (window.location.href = '/login')}
              >
                <UserCheck aria-hidden="true" />
                Masuk Memilih
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              >
                {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
              </Button>
            </div>
          </div>

          {/* Navigasi tampilan lebar */}
          <nav className="hidden border-t py-1 md:flex md:justify-center">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-accent hover:text-slate-900"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {isMobileMenuOpen && (
            <nav className="flex flex-col gap-1 border-t py-2 md:hidden">
              {navItems.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex min-h-11 items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-accent"
                >
                  {item.label}
                  <ChevronRight className="size-4 text-slate-600" aria-hidden="true" />
                </a>
              ))}
              <Button
                className="mt-1 min-h-12 bg-[#1e3a8a] text-white hover:bg-[#172554]"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  window.location.href = '/login'
                }}
              >
                <UserCheck aria-hidden="true" />
                Masuk Memilih
              </Button>
            </nav>
          )}
        </div>
      </header>

      <main>
        {/* ================= HERO ================= */}
        <section id="beranda" className="border-b py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              <span className="mb-4 inline-block rounded-md px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "rgba(30,58,138,0.08)", color: "#1e40af" }}>
                Pemilihan {JADWAL.tahun}
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Pilih Ketua OSIS
                <span className="mt-2 block text-2xl leading-snug text-slate-600 sm:text-3xl lg:text-4xl">
                  SMAN 1 Bantarujeg, periode {JADWAL.periode}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Kartu pemilih diperiksa panitia, suara direkam penuh, dan hasilnya
                bisa dipantau setelah voting berakhir. Ikut memilih singkat saja:
                pindai kartu, periksa nama, pilih dua pasangan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="min-h-12 bg-[#1e3a8a] px-6 text-white hover:bg-[#172554] sm:w-auto"
                  onClick={() => (window.location.href = '/login')}
                >
                  <UserCheck aria-hidden="true" />
                  Masuk Memilih
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 px-6 sm:w-auto"
                  onClick={() => {
                    document.getElementById('kandidat')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Lihat Kandidat
                </Button>
              </div>
            </div>

            {/* Ringkasan status: semua angka nyata dari /api/statistik */}
            <aside className="rounded-lg border p-5 sm:p-6 lg:mt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Status Pemilihan
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">Voting</span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-bold"
                    style={
                      stats.votingAktif
                        ? { backgroundColor: 'rgba(21,128,61,0.10)', color: '#166534' }
                        : { backgroundColor: 'rgba(15,23,42,0.06)', color: '#334155' }
                    }
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: stats.votingAktif ? WARNA_KATEGORI.mitratama : '#a3a3a3' }}
                      aria-hidden="true"
                    />
                    {stats.votingAktif ? 'Sedang Berjalan' : 'Belum Dimulai'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t pt-4">
                  <span className="text-sm text-slate-600">Kategori</span>
                  <span className="flex gap-1.5">
                    <span
                      className="rounded-md px-2 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: WARNA_KATEGORI.mitratama }}
                    >
                      Mitra Tama
                    </span>
                    <span
                      className="rounded-md px-2 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: WARNA_KATEGORI.mitramuda }}
                    >
                      Mitra Muda
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t pt-4">
                  <span className="text-sm text-slate-600">Pemilih Terdaftar</span>
                  <span className="text-sm font-bold text-slate-900">
                    {isLoading ? '...' : stats.totalSiswa}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t pt-4">
                  <span className="text-sm text-slate-600">Kandidat</span>
                  <span className="text-sm font-bold text-slate-900">
                    {isLoading ? '...' : stats.totalKandidat}
                  </span>
                </div>
              </div>
              <p className="mt-4 border-t pt-4 text-[11px] leading-relaxed text-slate-600">
                Kartu pemilih dibagikan melalui wali kelas. Datang ke bilik voting
                dengan kartu tersendiri.
              </p>
            </aside>
          </div>
        </section>

        {/* ================= KANDIDAT ================= */}
        <section id="kandidat" className="border-b bg-slate-50 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 md:flex md:items-end md:justify-between md:gap-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Kenali Kandidat
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
                  Foto, visi, dan misi setiap pasangan calon. Nomor urut pasangan
                  tercantum di pojok atas fotonya.
                </p>
              </div>
              <Badge variant="outline" className="mt-4 px-3 py-1.5 text-sm md:mt-0">
                Periode {JADWAL.periode}
              </Badge>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-600">
                Memuat data kandidat...
              </div>
            ) : kandidatList.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center">
                <p className="font-semibold text-slate-900">
                  {isFetchError ? 'Gagal memuat data kandidat' : 'Belum ada kandidat yang terdaftar'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {isFetchError
                    ? 'Periksa koneksi dan coba muat ulang halaman.'
                    : 'Data kandidat akan tampil di sini setelah panitia mengunggahnya.'}
                </p>
                {isFetchError && (
                  <Button variant="outline" className="mt-4 min-h-11" onClick={fetchStats}>
                    Muat Ulang
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-10 md:space-y-12">
                {(['mitratama', 'mitramuda'] as const).map(roleType => {
                  const roleKandidat = kandidatList.filter(k => k.role === roleType)
                  const roleLabel =
                    roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'
                  const warna = WARNA_KATEGORI[roleType]

                  /* Satu bar kategori berwarna menandai kelompok; kandidatnya
                     tetap satu gaya agar foto menjadi fokus utama. */
                  return (
                    <div key={roleType}>
                      <div className="mb-6 flex items-center gap-3">
                        <h3
                          className="rounded-md px-3 py-1.5 text-sm font-bold text-white sm:px-4"
                          style={{ backgroundColor: warna }}
                        >
                          {roleLabel}
                        </h3>
                        <span className="text-sm font-medium text-slate-600">
                          {roleKandidat.length} kandidat
                        </span>
                      </div>

                      {roleKandidat.length === 0 ? (
                        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-slate-600">
                          Belum ada kandidat untuk kategori ini
                        </div>
                      ) : (
                        /* Foto tampil penuh: di ponsel satu kartu satu kolom, wajah
                           kandidat terlihat besar; di layar lebar empat kolom. */
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                          {roleKandidat.map(kandidat => (
                            <article
                              key={kandidat.id}
                              className="overflow-hidden rounded-lg border bg-card"
                            >
                              <div className="relative aspect-[3/4] w-full bg-muted">
                                {kandidat.fotoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={kandidat.fotoUrl}
                                    alt={`Foto kandidat ${kandidat.namaCalon}`}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <User className="size-20 text-slate-300" aria-hidden="true" />
                                  </div>
                                )}
                                {/* Nomor urut amber: warna yang sama dengan lencana
                                    nomor di halaman /vote, jadi consisten satu alur. */}
                                <span
                                  className="absolute left-3 top-3 rounded-md px-2.5 py-1 text-sm font-bold text-slate-900"
                                  style={{ backgroundColor: '#f5b301' }}
                                >
                                  No. {kandidat.nomorUrut}
                                </span>
                              </div>
                              <div className="p-4 sm:p-5">
                                <h4 className="text-center text-lg font-bold leading-snug text-slate-900">
                                  {kandidat.namaCalon}
                                </h4>
                                {kandidat.visi && (
                                  <div className="mt-3 border-t pt-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                      Visi
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                      {kandidat.visi}
                                    </p>
                                  </div>
                                )}
                                {kandidat.misi && (
                                  <div className="mt-3 border-t pt-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                      Misi
                                    </p>
                                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                                      {kandidat.misi}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* ================= CARA MEMILIH ================= */}
        <section id="cara-memilih" className="border-b py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Tentang Pemilihan
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
                Alurnya singkat, sama seperti proses sesungguhnya di bilik voting.
                Cocok untuk pemilih baru kelas X.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">Cara Memilih</h3>
                {/* Tiga langkah berikut adalah proses sesungguhnya di bilik
                    voting (/vote), bukan rangka wacana standar. */}
                <ol className="space-y-3">
                  {[
                    {
                      nomor: '1',
                      judul: 'Pindai kartu pemilih',
                      isi: 'Panitia mengarahkan kamera ke QR di kartu pemilih yang Saudara terima.',
                      ikon: <ScanLine className="size-4" aria-hidden="true" />,
                    },
                    {
                      nomor: '2',
                      judul: 'Periksa nama di layar',
                      isi: 'Nama dan kelas muncul; panitia memastikan kartu itu milik Anda.',
                      ikon: <UserCheck className="size-4" aria-hidden="true" />,
                    },
                    {
                      nomor: '3',
                      judul: 'Pilih 2 pasangan',
                      isi: 'Satu pasangan Mitra Tama (hijau) dan satu Mitra Muda (merah), lalu simpan.',
                      ikon: <Vote className="size-4" aria-hidden="true" />,
                    },
                  ].map(langkah => (
                    <li
                      key={langkah.nomor}
                      className="flex gap-3 rounded-lg border p-4 sm:p-5"
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: WARNA_KATEGORI.mitratama }}
                      >
                        {langkah.ikon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {langkah.nomor}. {langkah.judul}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {langkah.isi}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">Prinsip Pemungutan</h3>
                <ul className="space-y-3">
                  {[
                    {
                      judul: 'Satu pemilih satu suara',
                      isi: 'Kartu yang sudah dipakai memilih tidak bisa dipakai lagi.',
                    },
                    {
                      judul: 'Memilih dua pasangan',
                      isi: 'Setiap pemilih menentukan satu pasangan Mitra Tama dan satu pasangan Mitra Muda secara berurutan.',
                    },
                    {
                      judul: 'Hasil cepat dipantau',
                      isi: 'Setelah voting berakhir, angka per kandidat akan dibuka bersama.',
                    },
                  ].map(prinsip => (
                    <li key={prinsip.judul} className="rounded-lg border p-4 sm:p-5">
                      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <CheckCircle
                          className="size-4 shrink-0"
                          style={{ color: WARNA_KATEGORI.mitratama }}
                          aria-hidden="true"
                        />
                        {prinsip.judul}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                        {prinsip.isi}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        {/* Warna hitam resmi memakai warna utama tema; bar dua kategori di
            pinggir atasnya menjadi penanda identitas sekali saja di halaman. */}
        <section className="relative">
          <div aria-hidden="true" className="flex h-1.5">
            <div className="w-1/2" style={{ backgroundColor: WARNA_KATEGORI.mitratama }} />
            <div className="w-1/2" style={{ backgroundColor: WARNA_KATEGORI.mitramuda }} />
          </div>
          <div className="bg-[#172554] py-12 sm:py-16">
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
              <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl">
                Satu suara memilih masa depan OSIS
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-background/80">
                Data pemilih dan kartu pemilih sudah dibagikan lewat wali kelas.
                Tenang, cukup datang dengan kartu.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="mt-8 min-h-12 px-6"
                onClick={() => (window.location.href = '/login')}
              >
                <UserCheck aria-hidden="true" />
                Masuk Memilih
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer id="kontak" className="border-t bg-slate-50 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-md bg-[#1e3a8a] text-white">
                  <Vote className="size-4" aria-hidden="true" />
                </div>
                <p className="font-bold text-slate-900">E-Voting OSIS</p>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Pemilihan elektronik OSIS SMAN 1 Bantarujeg, periode {JADWAL.periode}.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-900">Tautan</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>
                  <a href="/login" className="transition-colors hover:text-slate-900">
                    Halaman Masuk
                  </a>
                </li>
                <li>
                  <a href="#cara-memilih" className="transition-colors hover:text-slate-900">
                    Cara Memilih
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-900">Kontak</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Panitia Pemilihan OSIS<br />
                SMAN 1 Bantarujeg<br />
                Tahun {JADWAL.tahun}/2027
              </p>
            </div>
          </div>

          <p className="mt-10 border-t pt-6 text-center text-xs text-slate-600">
            &copy; {JADWAL.tahun} E-Voting OSIS SMAN 1 Bantarujeg.
          </p>
        </div>
      </footer>
    </div>
  )
}
