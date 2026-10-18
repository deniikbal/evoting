'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { ChartData } from './dashboard-types'
import { bandingNamaKelas } from '@/lib/urutan-kelas'

interface GrafikKehadiranProps {
  chartData: ChartData | null
  /** true hanya saat pemuatan pertama; penyegaran berkala tidak mengosongkan tabel. */
  memuatAwal: boolean
  error: string | null
  onMuatUlang: () => void
}

interface KelompokKehadiran {
  nama: string
  total: number
  voted: number
  persen: number | null
}

type Sumbu = 'angkatan' | 'kelas'

/**
 * Dua pertanyaan, dua grafik:
 * 1. Angkatan mana yang tertinggal?
 * 2. Kelas mana yang tertinggal, kalau angkatannya sudah dibuka?
 * Batang mendatar dengan satu warna; panjang batang yang membawa data.
 */
export default function GrafikKehadiran({
  chartData,
  memuatAwal,
  error,
  onMuatUlang,
}: GrafikKehadiranProps) {
  const [sumbu, setSumbu] = useState<Sumbu>('angkatan')

  const data: KelompokKehadiran[] = useMemo(() => {
    if (!chartData) return []
    const sumber =
      sumbu === 'angkatan'
        ? chartData.byAngkatan
            // "Angkatan" GURU dan TU bukan angkatan siswa.
            .filter((a) => !/^(GURU|TU)$/i.test(a.angkatan.trim()))
            .map((a) => ({
              nama: `Angkatan ${a.angkatan}`,
              total: a.totalSiswa,
              voted: a.totalVoted,
            }))
        : chartData.byKelas
            .filter((k) => !/^(GURU|TU)$/i.test(k.name.trim()))
            .map((k) => ({
              nama: k.name,
              total: k.totalSiswa,
              voted: k.totalVoted,
            }))
    return sumber
      .map((s) => ({
        ...s,
        persen: s.total > 0 ? Math.round((s.voted / s.total) * 100) : null,
      }))
      .sort((a, b) => (a.persen ?? -1) - (b.persen ?? -1) || bandingNamaKelas(a.nama, b.nama))
  }, [chartData, sumbu])

  const maksimal = Math.max(...data.map((d) => d.total), 1)

  return (
    <section
      aria-labelledby="kehadiran-judul"
      className="rounded-lg border bg-card shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="kehadiran-judul" className="text-sm font-medium">
            {sumbu === 'angkatan'
              ? 'Angkatan mana yang tertinggal'
              : 'Kelas mana yang tertinggal'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Batang abu-abu adalah jumlah pemilih terdaftar, bagian gelap adalah
            yang sudah datang. Urut dari capaian terendah.
          </p>
        </div>
        <div
          role="group"
          aria-label="Pilih pembagian grafik"
          className="-mx-1 flex shrink-0 gap-1"
        >
          <Button
            type="button"
            size="sm"
            variant={sumbu === 'angkatan' ? 'secondary' : 'ghost'}
            aria-pressed={sumbu === 'angkatan'}
            className="h-8"
            onClick={() => setSumbu('angkatan')}
          >
            Per angkatan
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sumbu === 'kelas' ? 'secondary' : 'ghost'}
            aria-pressed={sumbu === 'kelas'}
            className="h-8"
            onClick={() => setSumbu('kelas')}
          >
            Per kelas
          </Button>
        </div>
      </div>

      <div className="px-5 py-4">
        {memuatAwal ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Memuat data kehadiran
          </div>
        ) : error ? (
          <div className="py-8">
            <p className="text-sm font-medium">Grafik gagal dimuat</p>
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
        ) : data.length === 0 ? (
          <div className="py-8">
            <p className="text-sm font-medium">Belum ada data pemilih</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Impor data siswa beserta kelasnya lewat menu Data Master supaya
              grafik ini terisi.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((d) => {
              const lebarTotal = Math.max((d.total / maksimal) * 100, 1)
              const lebarDatang =
                d.total > 0 ? (d.voted / d.total) * lebarTotal : 0
              return (
                <li key={d.nama}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm">{d.nama}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {d.total === 0
                        ? 'tanpa pemilih'
                        : `${d.voted} / ${d.total}, ${d.persen}%`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 w-full">
                    <div
                      className="relative h-3 overflow-hidden rounded-sm bg-secondary"
                      style={{ width: `${lebarTotal}%` }}
                      role="img"
                      aria-label={
                        d.total === 0
                          ? `${d.nama} tidak memiliki pemilih terdaftar`
                          : `${d.nama}: ${d.voted} dari ${d.total} pemilih sudah datang, ${d.persen}%`
                      }
                    >
                      <div
                        className="h-full rounded-sm bg-foreground"
                        style={{ width: `${lebarTotal > 0 ? (lebarDatang / lebarTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
