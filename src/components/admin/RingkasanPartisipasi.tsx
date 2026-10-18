'use client'

import { Progress } from '@/components/ui/progress'
import type { Partisipasi, Statistik } from './dashboard-types'

interface RingkasanPartisipasiProps {
  statistik: Statistik
  partisipasi: Partisipasi
}

interface RincianBaris {
  label: string
  sudah: number
  belum: number
  total: number
}

function Rincian({
  baris,
  menonjol,
}: {
  baris: RincianBaris
  menonjol?: boolean
}) {
  const persen =
    baris.total > 0 ? Math.round((baris.sudah / baris.total) * 100) : null
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className={menonjol ? 'text-sm font-medium' : 'text-sm'}>
        {baris.label}
      </dt>
      <dd className="text-right text-sm tabular-nums">
        <span className={menonjol ? 'font-semibold' : 'font-medium'}>
          {baris.sudah}
        </span>
        <span className="text-muted-foreground">
          {' / '}
          {baris.total}
        </span>
        <span className="ml-2 text-xs text-muted-foreground">
          {persen === null ? 'tanpa data' : `${persen}%`}
        </span>
      </dd>
    </div>
  )
}

/**
 * Angka utama halaman: seberapa banyak pemilih yang sudah datang.
 * Satu angka besar, lalu rincian siswa dan pegawai sebagai pendukung.
 * Tidak ada delta persentase karena tidak ada deret pembanding (R-17, R-38).
 */
export default function RingkasanPartisipasi({
  statistik,
  partisipasi,
}: RingkasanPartisipasiProps) {
  if (partisipasi.total === 0) {
    return (
      <section
        aria-labelledby="partisipasi-judul"
        className="rounded-lg border bg-card p-5"
      >
        <h2 id="partisipasi-judul" className="text-sm font-medium">
          Partisipasi pemilih
        </h2>
        <div className="mt-3 rounded-md border border-dashed px-4 py-6">
          <p className="text-sm font-medium">Belum ada pemilih terdaftar</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan data siswa dan guru atau TU lewat menu Data Master supaya
            partisipasi bisa dihitung.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="partisipasi-judul"
      className="rounded-lg border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="partisipasi-judul" className="text-sm font-medium">
          Partisipasi pemilih
        </h2>
        <p className="text-xs text-muted-foreground">
          {partisipasi.belum} pemilih belum datang
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
        <p className="text-4xl font-semibold tabular-nums tracking-tight">
          {partisipasi.persen}
          <span className="text-2xl font-medium">%</span>
        </p>
        <p className="pb-1 text-sm text-muted-foreground tabular-nums">
          {partisipasi.sudah} dari {partisipasi.total} pemilih
        </p>
      </div>

      <Progress
        value={partisipasi.persen ?? 0}
        className="mt-3 h-2 rounded-md"
        aria-label={`Partisipasi pemilih ${partisipasi.persen ?? 0}%`}
      />

      <dl className="mt-4 divide-y">
        <Rincian
          menonjol
          baris={{
            label: 'Siswa',
            sudah: statistik.siswaMemilih,
            belum: statistik.siswaBelumMemilih,
            total: statistik.totalSiswa,
          }}
        />
        <Rincian
          baris={{
            label: 'Guru dan TU',
            sudah: statistik.pegawaiMemilih,
            belum: statistik.pegawaiBelumMemilih,
            total: statistik.totalPegawai,
          }}
        />
      </dl>
    </section>
  )
}
