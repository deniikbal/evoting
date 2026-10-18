'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { ChartData } from './dashboard-types'

interface KecukupanDataKelasProps {
  chartData: ChartData | null
  /** true hanya saat pemuatan pertama; penyegaran berkala tidak mengosongkan tabel. */
  memuatAwal: boolean
  error: string | null
  onMuatUlang: () => void
}

type Filter = 'semua' | 'kosong' | 'sebagian' | 'lengkap'

interface BarisKelas {
  nama: string
  angkatan: string
  total: number
  voted: number
  persen: number | null
  status: 'kosong-pemilih' | 'belum' | 'sebagian' | 'lengkap'
}

const NAMA_STATUS: Record<BarisKelas['status'], string> = {
  'kosong-pemilih': 'Tanpa pemilih',
  belum: 'Belum ada',
  sebagian: 'Berjalan',
  lengkap: 'Lengkap',
}

/**
 * Pengurutan natural: angka di dalam nama dibandingkan sebagai angka, jadi
 * "X 2" berada sebelum "X 10" dan bukan sesudahnya. Urutan tingkatan X, XI,
 * XII ditetapkan lebih dulu karena urutan abjad akan menaruh XI sebelum X.
 */
const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' })
const TINGKATAN: Record<string, number> = { X: 10, XI: 11, XII: 12 }

function bandingNatural(a: string, b: string): number {
  const cocokA = a.trim().match(/^(XII|XI|X)\b\s*(.*)$/i)
  const cocokB = b.trim().match(/^(XII|XI|X)\b\s*(.*)$/i)
  const tingkatA = cocokA ? TINGKATAN[cocokA[1].toUpperCase()] : null
  const tingkatB = cocokB ? TINGKATAN[cocokB[1].toUpperCase()] : null

  if (tingkatA !== null && tingkatB !== null && tingkatA !== tingkatB) {
    return tingkatA - tingkatB
  }
  if (tingkatA === null && tingkatB !== null) return 1
  if (tingkatA !== null && tingkatB === null) return -1

  return collator.compare(a, b)
}

function statusDari(total: number, voted: number): BarisKelas['status'] {
  if (total === 0) return 'kosong-pemilih'
  if (voted === 0) return 'belum'
  if (voted >= total) return 'lengkap'
  return 'sebagian'
}

/**
 * Daftar kelas dengan jumlah pemilih yang sudah datang.
 * Pertanyaan yang dijawab: kelas mana yang belum mengirim satu pun pemilih.
 * Karena itu kelas nol berdiri di atas dan pemeriksaannya mendahului angka lain.
 */
export default function KecukupanDataKelas({
  chartData,
  memuatAwal,
  error,
  onMuatUlang,
}: KecukupanDataKelasProps) {
  const [filter, setFilter] = useState<Filter>('kosong')
  const [tampilSemua, setTampilSemua] = useState(false)

  const angkatanDariKelas = useMemo(() => {
    const peta = new Map<string, string>()
    chartData?.byKelas.forEach((k) => {
      // Nama kelas diawali angkatan pada data sekolah ini ("XI MIPA 1", "X 3").
      const cocok = k.name.match(/^(XII|XI|X)\b/)
      peta.set(k.name, cocok ? cocok[1] : 'Lainnya')
    })
    return peta
  }, [chartData])

  const baris: BarisKelas[] = useMemo(() => {
    if (!chartData) return []
    return chartData.byKelas
      // Endpoint menyertakan entri "GURU" dan "TU" (pemilih non-kelas). Daftar
      // ini tentang kelas, jadi keduanya disaring. Pemilih pegawai tetap
      // terhitung di blok partisipasi.
      .filter((k) => !/^(GURU|TU)$/i.test(k.name.trim()))
      .map((k) => {
        const status = statusDari(k.totalSiswa, k.totalVoted)
        return {
          nama: k.name,
          angkatan: angkatanDariKelas.get(k.name) ?? 'Lainnya',
          total: k.totalSiswa,
          voted: k.totalVoted,
          persen:
            k.totalSiswa > 0
              ? Math.round((k.totalVoted / k.totalSiswa) * 100)
              : null,
          status,
        }
      })
      .sort((a, b) => {
        // Kelas tanpa pemilih paling atas, lalu yang belum mulai, lalu sisanya.
        const bobot: Record<BarisKelas['status'], number> = {
          'kosong-pemilih': 0,
          belum: 1,
          sebagian: 2,
          lengkap: 3,
        }
        if (bobot[a.status] !== bobot[b.status]) {
          return bobot[a.status] - bobot[b.status]
        }
        return bandingNatural(a.nama, b.nama)
      })
  }, [chartData, angkatanDariKelas])

  const jumlah = useMemo(() => {
    return {
      total: baris.length,
      belum: baris.filter((b) => b.status === 'belum').length,
      sebagian: baris.filter((b) => b.status === 'sebagian').length,
      lengkap: baris.filter((b) => b.status === 'lengkap').length,
      tanpaPemilih: baris.filter((b) => b.status === 'kosong-pemilih').length,
    }
  }, [baris])

  const tersaring = useMemo(() => {
    if (filter === 'semua') return baris
    if (filter === 'kosong') {
      return baris.filter((b) => b.status === 'belum' || b.status === 'kosong-pemilih')
    }
    return baris.filter((b) => b.status === filter)
  }, [baris, filter])

  const batas = tampilSemua ? tersaring.length : 8
  const terlihat = tersaring.slice(0, batas)

  function tombolFilter(nilai: Filter, label: string, hitung: number) {
    const aktif = filter === nilai
    return (
      <Button
        key={nilai}
        type="button"
        size="sm"
        variant={aktif ? 'secondary' : 'ghost'}
        aria-pressed={aktif}
        onClick={() => {
          setFilter(nilai)
          setTampilSemua(false)
        }}
        className="h-8"
      >
        {label}
        <span className="ml-1.5 text-xs tabular-nums text-secondary-foreground/90">
          {hitung}
        </span>
      </Button>
    )
  }

  return (
    <section
      aria-labelledby="kelas-judul"
      className="rounded-lg border bg-card shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b px-5 py-4">
        <div>
          <h2 id="kelas-judul" className="text-sm font-medium">
            Kedatangan pemilih per kelas
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelas tanpa satu pun pemilih ditaruh paling atas, supaya cepat
            terlihat kelas mana yang perlu dijemput.
          </p>
        </div>

        {!memuatAwal && !error && chartData ? (
          <div
            role="group"
            aria-label="Saring daftar kelas"
            className="-mx-1 flex flex-wrap items-center gap-1"
          >
            {tombolFilter('kosong', 'Belum ada pemilih', jumlah.belum + jumlah.tanpaPemilih)}
            {tombolFilter('sebagian', 'Berjalan', jumlah.sebagian)}
            {tombolFilter('lengkap', 'Lengkap', jumlah.lengkap)}
            {tombolFilter('semua', 'Semua', jumlah.total)}
          </div>
        ) : null}
      </div>

      <div className="px-5 py-2">
        {memuatAwal ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Memuat data kelas
          </div>
        ) : error ? (
          <div className="py-8">
            <p className="text-sm font-medium">Data kelas gagal dimuat</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={onMuatUlang}
            >
              Coba lagi
            </Button>
          </div>
        ) : baris.length === 0 ? (
          <div className="py-8">
            <p className="text-sm font-medium">Belum ada kelas terdaftar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Impor data kelas lewat menu Data Master. Setelah itu kelengkapan
              suara per kelas akan muncul di sini.
            </p>
          </div>
        ) : tersaring.length === 0 ? (
          <div className="py-8">
            <p className="text-sm font-medium">
              Tidak ada kelas pada saringan ini
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Semua kelas yang terdaftar sudah lengkap mengirim pemilih.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Jumlah pemilih yang sudah datang dibanding total pemilih tiap
                kelas
              </caption>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-2 font-medium">
                    Kelas
                  </th>
                  <th scope="col" className="hidden py-2 pr-2 font-medium sm:table-cell">
                    Angkatan
                  </th>
                  <th scope="col" className="py-2 pr-2 text-right font-medium">
                    Sudah
                  </th>
                  <th scope="col" className="hidden py-2 pr-2 text-right font-medium sm:table-cell">
                    Total
                  </th>
                  <th scope="col" className="w-28 py-2 pr-2 font-medium">
                    Capaian
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Keadaan
                  </th>
                </tr>
              </thead>
              <tbody>
                {terlihat.map((b) => (
                  <tr key={b.nama} className="border-b last:border-b-0">
                    <th scope="row" className="py-2 pr-2 text-left font-medium">
                      {b.nama}
                    </th>
                    <td className="hidden py-2 pr-2 text-muted-foreground sm:table-cell">
                      {b.angkatan}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {b.voted}
                    </td>
                    <td className="hidden py-2 pr-2 text-right tabular-nums text-muted-foreground sm:table-cell">
                      {b.total}
                    </td>
                    <td className="py-2 pr-2">
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-sm bg-secondary"
                        role="img"
                        aria-label={
                          b.persen === null
                            ? 'Tanpa data pemilih'
                            : `${b.persen}% pemilih sudah datang`
                        }
                      >
                        <div
                          className="h-full rounded-sm bg-foreground"
                          style={{ width: `${b.persen ?? 0}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <span className="text-xs text-muted-foreground">
                        {NAMA_STATUS[b.status]}
                      </span>
                      {b.persen !== null ? (
                        <span className="ml-1.5 text-xs tabular-nums">
                          {b.persen}%
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {tersaring.length > 8 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setTampilSemua((v) => !v)}
              >
                {tampilSemua
                  ? 'Tampilkan lebih sedikit'
                  : `Tampilkan ${tersaring.length - 8} kelas lain`}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
