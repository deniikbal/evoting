'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import StatusVoting from '@/components/admin/StatusVoting'
import RingkasanPartisipasi from '@/components/admin/RingkasanPartisipasi'
import KecukupanDataKelas from '@/components/admin/KecukupanDataKelas'
import HasilSuara from '@/components/admin/HasilSuara'
import GrafikKehadiran from '@/components/admin/GrafikKehadiran'
import {
  hitungPartisipasi,
  type AdminSession,
  type ChartData,
  type Kandidat,
  type Statistik,
} from '@/components/admin/dashboard-types'

const STATISTIK_KOSONG: Statistik = {
  totalVoters: 0,
  totalSiswa: 0,
  siswaMemilih: 0,
  siswaBelumMemilih: 0,
  totalPegawai: 0,
  pegawaiMemilih: 0,
  pegawaiBelumMemilih: 0,
  sudahMemilih: 0,
  belumMemilih: 0,
  votingAktif: false,
}

const JEDA_SEGAR_MS = 5000

interface PropsMuat {
  /**
   * true hanya pada pemuatan pertama. Saat penyegaran berkala, data lama tetap
   * tampil supaya halaman tidak berkedip.
   */
  tampilkanSpinner: boolean
}

/**
 * Susunan halaman mengikuti keputusan yang diambil panitia, bukan bentuk
 * dashboard bawaan: status pemilihan, partisipasi, kelas yang tertinggal,
 * lalu perolehan suara dan grafik kehadiran.
 *
 * Penyegaran berkala berjalan diam-diam: angka diganti di tempat, tanpa
 * mengosongkan layar. Spinner hanya muncul saat pemuatan pertama atau saat
 * pengguna menekan Coba lagi.
 */
export default function DashboardPage() {
  const [statistik, setStatistik] = useState<Statistik>(STATISTIK_KOSONG)
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [adminRole, setAdminRole] = useState<string>('admin')
  const [diperbaruiPada, setDiperbaruiPada] = useState<Date | null>(null)

  // true hanya selama pemuatan pertama belum selesai.
  const [memuatAwal, setMemuatAwal] = useState(true)
  // true saat ada permintaan yang sedang berjalan (untuk penanda halus).
  const [sedangMenyegarkan, setSedangMenyegarkan] = useState(false)

  const [galatStatistik, setGalatStatistik] = useState<string | null>(null)
  const [galatKandidat, setGalatKandidat] = useState<string | null>(null)
  const [galatChart, setGalatChart] = useState<string | null>(null)

  const router = useRouter()
  // Simpan role di ref supaya penyegaran tidak membaca nilai basi.
  const roleRef = useRef<string>('admin')
  // Cegah setState setelah komponen lepas.
  const hidup = useRef(true)
  // Cegah permintaan bertumpuk bila server lambat.
  const sedangJalan = useRef(false)

  const muatKandidat = useCallback(async () => {
    setGalatKandidat(null)
    try {
      const res = await fetch('/api/kandidat', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Server menjawab ${res.status}`)
      const data = (await res.json()) as Kandidat[]
      if (hidup.current) setKandidat(data)
    } catch (err) {
      if (hidup.current) {
        setGalatKandidat(
          err instanceof Error
            ? `Perolehan suara tidak dapat diambil (${err.message}).`
            : 'Perolehan suara tidak dapat diambil.'
        )
      }
    }
  }, [])

  /**
   * Mengambil statistik dan, bila berhak, perolehan suara. Tidak pernah
   * mengosongkan data lama: nilai diganti setelah respons masuk.
   */
  const segarkan = useCallback(async () => {
    if (sedangJalan.current) return
    sedangJalan.current = true
    setSedangMenyegarkan(true)
    setGalatStatistik(null)
    setGalatChart(null)

    try {
      const [resStatistik, resChart] = await Promise.all([
        fetch('/api/admin/statistik', { cache: 'no-store' }),
        fetch('/api/admin/statistik-chart', { cache: 'no-store' }),
      ])

      if (!hidup.current) return

      if (resStatistik.ok) {
        const data = (await resStatistik.json()) as Statistik
        if (!hidup.current) return
        setStatistik(data)
        setDiperbaruiPada(new Date())

        // SuperAdmin selalu melihat hasil; admin hanya saat voting dihentikan.
        const bolehLihat =
          !data.votingAktif || roleRef.current === 'superadmin'
        if (bolehLihat) {
          await muatKandidat()
        } else if (hidup.current) {
          setKandidat([])
          setGalatKandidat(null)
        }
      } else {
        throw new Error(`Server menjawab ${resStatistik.status}`)
      }

      if (!hidup.current) return

      if (resChart.ok) {
        const data = (await resChart.json()) as ChartData
        if (hidup.current) setChartData(data)
      } else {
        setGalatChart(`Data per kelas tidak dapat diambil (server menjawab ${resChart.status}).`)
      }
    } catch (err) {
      if (hidup.current) {
        setGalatStatistik(
          err instanceof Error && err.message.startsWith('Server')
            ? `Statistik pemilihan tidak dapat diambil (${err.message.toLowerCase()}).`
            : 'Statistik pemilihan tidak dapat diambil. Periksa koneksi lalu coba lagi.'
        )
      }
    } finally {
      sedangJalan.current = false
      if (hidup.current) {
        setSedangMenyegarkan(false)
        setMemuatAwal(false)
      }
    }
  }, [muatKandidat])

  // Jalankan sekali saat halaman dibuka, lalu berulang tiap 5 detik.
  // Dependensi sengaja kosong: interval tidak boleh dipasang ulang oleh
  // perubahan identitas callback, karena itu mematikan penyegaran diam-diam.
  useEffect(() => {
    hidup.current = true

    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.replace('/login/admin')
      return
    }

    let sesi: AdminSession
    try {
      sesi = JSON.parse(sessionData) as AdminSession
    } catch {
      localStorage.removeItem('adminSession')
      router.replace('/login/admin')
      return
    }

    setAdmin(sesi)
    const role = sesi.role ?? 'admin'
    setAdminRole(role)
    roleRef.current = role

    segarkan()
    const interval = setInterval(segarkan, JEDA_SEGAR_MS)

    // Saat tab kembali aktif, segarkan sekali supaya angka tidak basi.
    const saatTerlihat = () => {
      if (document.visibilityState === 'visible') segarkan()
    }
    document.addEventListener('visibilitychange', saatTerlihat)

    return () => {
      hidup.current = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', saatTerlihat)
    }
  }, [router])

  const partisipasi = hitungPartisipasi(statistik)
  const hasilTerlihat = !statistik.votingAktif || adminRole === 'superadmin'

  const cobaSemua = () => {
    setMemuatAwal(true)
    segarkan()
  }

  if (memuatAwal && !diperbaruiPada) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <p className="text-sm">Memuat statistik pemilihan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Pemantauan pemilihan</h1>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {sedangMenyegarkan
            ? 'Menyegarkan data'
            : 'Data disegarkan otomatis tiap 5 detik.'}
        </p>
      </header>

      {galatStatistik ? (
        <section
          role="alert"
          className="rounded-lg border border-destructive/40 bg-card px-4 py-3"
        >
          <p className="text-sm font-medium">Statistik pemilihan gagal dimuat</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {galatStatistik}
            {diperbaruiPada ? ' Angka di bawah ini dari pengambilan terakhir.' : ''}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={cobaSemua}
          >
            Coba lagi
          </Button>
        </section>
      ) : null}

      <StatusVoting
        votingAktif={statistik.votingAktif}
        admin={admin}
        hasilTerlihat={hasilTerlihat}
        diperbaruiPada={diperbaruiPada}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RingkasanPartisipasi statistik={statistik} partisipasi={partisipasi} />
        </div>
        <div className="lg:col-span-2">
          <KecukupanDataKelas
            chartData={chartData}
            memuatAwal={memuatAwal}
            error={galatChart}
            onMuatUlang={cobaSemua}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HasilSuara
          kandidat={kandidat}
          votingAktif={statistik.votingAktif}
          hasilTerlihat={hasilTerlihat}
          sedangMemuat={memuatAwal && hasilTerlihat}
        />
        <GrafikKehadiran
          chartData={chartData}
          memuatAwal={memuatAwal}
          error={galatChart}
          onMuatUlang={cobaSemua}
        />
      </div>

      {galatKandidat && hasilTerlihat ? (
        <div role="alert">
          <p className="text-sm font-medium">Perolehan suara gagal dimuat</p>
          <p className="mt-1 text-sm text-muted-foreground">{galatKandidat}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={cobaSemua}
          >
            Coba lagi
          </Button>
        </div>
      ) : null}
    </div>
  )
}
