'use client'

/*
 * Design Read: halaman status publik untuk siswa SMA (Gen Z), gaya bersih
 * hangat dengan identitas e-voting, dial ENERGY 2 / RHYTHM 2 / MOTION 1.
 *
 * Palet (semua berpangkat makna, konsisten dengan alur /vote):
 * - hijau #15803d : lengkap, kedua suara tersimpan (sama dengan "terverifikasi")
 * - amber #d97706 : sebagian, harus dipanggil panitia
 * - netral slate  : belum memilih (bukan error, hanya belum waktunya)
 * - biru #1e3a8a  : hanya untuk aksi dan fokus (identitas aplikasi)
 *
 * Alasan keputusan utama (R-31):
 * - Bar proporsi bertumpuk, bukan 4 kartu statistik identik: satu visual
 *   menjawab "berapa banyak yang sudah selesai" tanpa mengulang angka.
 * - Tabel di desktop, kartu baris di ponsel: tabel 4 kolom tidak mungkin
 *   muat 375px, jadi ponsel mendapat susunan ulang yang disengaja (R-03).
 * - Filter berupa chips besar (min 44px) bukan tombol kecil: dihalaman ini
 *   panitia memegang HP, jempol bukan kursor.
 * - MOTION 1: hanya hover/fokus; tidak ada animasi loop (R-19).
 */

import { useState, useEffect, useMemo } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, AlertTriangle, CheckCircle, Clock, Loader2, RotateCcw } from 'lucide-react'

interface SiswaKehadiran {
  nomorUrut: number
  nis: string
  namaLengkap: string
  kelas: string
  status: 'belum' | 'sebagian' | 'lengkap'
}

interface Ringkasan {
  total: number
  lengkap: number
  sebagian: number
  belum: number
}

interface DataKehadiran {
  kelas: string
  ringkasan: Ringkasan
  siswa: SiswaKehadiran[]
}

const labelStatus = (st: SiswaKehadiran['status']) =>
  st === 'lengkap' ? 'Sudah memilih' : st === 'sebagian' ? 'Sebagian' : 'Belum memilih'

/* Warna status: latar tipis, teks gelap, kontras terukur AA (lihat log WCAG). */
const gayaStatus: Record<SiswaKehadiran['status'], { chip: string; titik: string }> = {
  lengkap: { chip: 'bg-green-100 text-green-800 border-green-200', titik: 'bg-green-600' },
  sebagian: { chip: 'bg-amber-100 text-amber-800 border-amber-200', titik: 'bg-amber-500' },
  belum: { chip: 'bg-slate-100 text-slate-600 border-slate-200', titik: 'bg-slate-400' },
}

export default function KehadiranPage() {
  const [kelas, setKelas] = useState('')
  const [daftarKelas, setDaftarKelas] = useState<string[]>([])
  const [data, setData] = useState<DataKehadiran | null>(null)
  const [muat, setMuat] = useState(false)
  const [cari, setCari] = useState('')
  const [filter, setFilter] = useState<'semua' | 'belum' | 'sebagian' | 'lengkap'>('semua')
  const [galat, setGalat] = useState('')
  // Naikkan untuk memicu ulang pemuatan (tombol "Coba lagi").
  const [kunci, setKunci] = useState(0)

  // Muat daftar kelas sekali saat mount.
  useEffect(() => {
    fetch('/api/kehadiran?daftar=kelas')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((j) => setDaftarKelas(j.kelas))
      .catch(() => setGalat('Gagal memuat daftar kelas'))
  }, [])

  // Muat data saat kelas berubah; jadi fungsi agar tombol "Coba lagi" bisa memanggilnya.
  useEffect(() => {
    if (!kelas) return
    let batal = false
    const muatData = () => {
      setMuat(true)
      setGalat('')
      fetch(`/api/kehadiran?kelas=${encodeURIComponent(kelas)}`)
        .then((r) => {
          if (!r.ok) return r.json().then((e) => Promise.reject(e.message || 'Gagal memuat'))
          return r.json()
        })
        .then((j) => { if (!batal) setData(j) })
        .catch((e) => { if (!batal) setGalat(typeof e === 'string' ? e : 'Gagal memuat data kehadiran') })
        .finally(() => { if (!batal) setMuat(false) })
    }
    muatData()
    return () => { batal = true }
  }, [kelas, kunci])

  const barisTampil = useMemo(() => {
    if (!data) return []
    return data.siswa.filter((s) => {
      const cocokCari =
        !cari ||
        s.namaLengkap.toLowerCase().includes(cari.toLowerCase()) ||
        s.nis.includes(cari)
      const cocokFilter =
        filter === 'semua' || s.status === filter
      return cocokCari && cocokFilter
    })
  }, [data, cari, filter])

  const persenLengkap = data
    ? (data.ringkasan.lengkap / Math.max(1, data.ringkasan.total)) * 100
    : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">

        {/* Kepala halaman: satu fokus, bahasa singkat untuk siswa */}
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Cek Kehadiran
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Cocokkan nomor urut dan nama dengan daftar hadir. Halaman ini tidak
            menampilkan hasil suara siapa pun.
          </p>
        </header>

        {/* Pemilih kelas + pencarian */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Select value={kelas} onValueChange={setKelas} disabled={muat}>
            <SelectTrigger className="h-11 w-full sm:w-64" aria-label="Pilih kelas">
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {daftarKelas.map((k) => (
                <SelectItem key={k} value={k} className="h-11">
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative sm:flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama atau NIS"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="h-11 pl-9"
              aria-label="Cari nama atau NIS"
            />
          </div>
        </div>

        {galat && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertTriangle className="size-4 flex-shrink-0" />
            <span className="flex-1">{galat}</span>
            {kelas && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-red-200 bg-white text-red-800 hover:bg-red-50"
                onClick={() => setKunci((k) => k + 1)}
              >
                <RotateCcw className="size-3.5" /> Coba lagi
              </Button>
            )}
          </div>
        )}

        {!kelas && !galat && (
          <div className="mt-10 rounded-lg border border-dashed border-slate-300 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">Pilih kelas dulu</p>
            <p className="mt-1 text-sm text-slate-500">
              Daftar pemilih per kelas akan tampil di sini.
            </p>
          </div>
        )}

        {kelas && data && (
          <>
            {/* Ringkasan: angka besar + bar proporsi 3 status */}
            <section aria-label="Ringkasan" className="mt-6">
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <span className="block text-2xl font-bold text-green-800 md:text-3xl">
                    {data.ringkasan.lengkap}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-green-700">
                    Sudah memilih
                  </span>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <span className="block text-2xl font-bold text-amber-800 md:text-3xl">
                    {data.ringkasan.sebagian}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-amber-700">
                    Sebagian
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="block text-2xl font-bold text-slate-700 md:text-3xl">
                    {data.ringkasan.belum}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500">
                    Belum memilih
                  </span>
                </div>
              </div>

              {/* Bar proporsi: tiap segmen warna sesuai maknanya */}
              <div
                className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
                role="img"
                aria-label={`${persenLengkap.toFixed(0)} persen sudah memilih`}
              >
                <div
                  className="bg-green-600"
                  style={{ width: `${(data.ringkasan.lengkap / Math.max(1, data.ringkasan.total)) * 100}%` }}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${(data.ringkasan.sebagian / Math.max(1, data.ringkasan.total)) * 100}%` }}
                />
                <div
                  className="bg-slate-400"
                  style={{ width: `${(data.ringkasan.belum / Math.max(1, data.ringkasan.total)) * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {data.ringkasan.total} pemilih kelas {data.kelas} · {persenLengkap.toFixed(0)}% sudah memilih
              </p>
            </section>

            {/* Filter status: chips besar, aktif berwarna sesuai status */}
            <div
              className="mt-4 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter status kehadiran"
            >
              {(['semua', 'lengkap', 'sebagian', 'belum'] as const).map((f) => {
                const count =
                  f === 'semua'
                    ? data.ringkasan.total
                    : (data.ringkasan[f] ?? data.siswa.filter((s) => s.status === f).length)
                const aktif = filter === f
                const warnaAktif: Record<string, string> = {
                  semua: 'bg-[#1e3a8a] text-white',
                  lengkap: 'bg-green-700 text-white',
                  // amber-700, bukan amber-500: putih di amber-500 hanya 2,15:1 (gagal AA)
                  sebagian: 'bg-amber-700 text-white',
                  belum: 'bg-slate-700 text-white',
                }
                return (
                  <Button
                    key={f}
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter(f)}
                    aria-pressed={aktif}
                    className={`h-11 rounded-full px-4 text-sm ${
                      aktif ? warnaAktif[f] : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f === 'semua' ? 'Semua' : labelStatus(f)}
                    <span className={aktif ? 'opacity-80' : 'text-slate-400'}>{count}</span>
                  </Button>
                )
              })}
            </div>

            {/* Daftar pemilih: tabel di desktop, kartu baris di ponsel */}
            {muat ? (
              <div className="mt-4 space-y-2" aria-busy="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="size-9 flex-shrink-0 animate-pulse rounded-md bg-slate-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-40 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                    </div>
                    <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
                  </div>
                ))}
                <p className="text-center text-xs text-slate-400">Memuat data kehadiran</p>
              </div>
            ) : barisTampil.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">Tidak ada yang cocok</p>
                <p className="mt-1 text-sm text-slate-500">
                  Coba ubah kata pencarian atau filter status.
                </p>
                {(cari || filter !== 'semua') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-10"
                    onClick={() => { setCari(''); setFilter('semua') }}
                  >
                    <RotateCcw className="size-3.5" /> Reset pencarian
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop: tabel rapi */}
                <div className="mt-4 hidden overflow-hidden rounded-lg border border-slate-200 bg-white sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-14 text-right text-slate-500">No</TableHead>
                        <TableHead className="w-32 text-slate-500">NIS</TableHead>
                        <TableHead className="text-slate-500">Nama lengkap</TableHead>
                        <TableHead className="w-44 text-right text-slate-500">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {barisTampil.map((s) => (
                        <TableRow key={`${s.nis}-${s.nomorUrut}`} className="hover:bg-slate-50">
                          <TableCell className="text-right text-slate-400">{s.nomorUrut}</TableCell>
                          <TableCell className="font-mono text-sm text-slate-500">{s.nis}</TableCell>
                          <TableCell className="font-medium text-slate-900">{s.namaLengkap}</TableCell>
                          <TableCell className="text-right">
                            <StatusChip status={s.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Ponsel: kartu baris, susunan ulang (bukan tabel yang disempitkan) */}
                <ul className="mt-4 space-y-2 sm:hidden">
                  {barisTampil.map((s) => (
                    <li
                      key={`${s.nis}-${s.nomorUrut}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-600">
                        {s.nomorUrut}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {s.namaLengkap}
                        </span>
                        <span className="block font-mono text-xs text-slate-400">{s.nis}</span>
                      </span>
                      <StatusChip status={s.status} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Keterangan ringkas: satu baris titik warna */}
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-green-600" /> Sudah memilih: kedua suara tersimpan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" /> Sebagian: 1 suara, panggil panitia
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-400" /> Belum ada catatan pencoblosan
              </span>
            </div>
          </>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          SMAN 1 Bantarujeg · Data diambil dari aplikasi pemilihan ketua OSIS
        </p>
      </div>
    </div>
  )
}

/* Lencana status: ikon relevan (selesai/peringatan/kosong), warna bermakna. */
function StatusChip({ status }: { status: SiswaKehadiran['status'] }) {
  const g = gayaStatus[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${g.chip}`}
    >
      {status === 'lengkap' && <CheckCircle className="size-3.5" />}
      {status === 'sebagian' && <Clock className="size-3.5" />}
      <span className={`size-1.5 rounded-full ${g.titik}`} aria-hidden="true" />
      {labelStatus(status)}
    </span>
  )
}
