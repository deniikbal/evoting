'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Spinner } from '@/components/ui/spinner'
import {
  Camera, Keyboard, CheckCircle, XCircle, User, Vote, ArrowRight,
  ScanLine, RotateCcw, TriangleAlert, Users, SwitchCamera, Maximize, Minimize,
  ShieldCheck, Lock, Sparkles, ChevronLeft,
} from 'lucide-react'
import { Panel, ToolButton, StepTag } from './ui'

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  visi: string
  misi: string
  fotoUrl?: string
  role: string
}

interface VoterInfo {
  id: number
  nis?: string
  namaLengkap: string
  kelas: string
  sudahMemilih: boolean
  type: 'siswa' | 'guru' | 'tu'
}

type Step = 'scan' | 'confirm' | 'voting' | 'done'

// Setelah suara tersimpan, layar "Terima Kasih" hanya tampil sebentar lalu
// langsung balik ke kamera supaya antrean cepat.
const AUTOCLOSE_SECONDS = 1

export default function KioskPage() {
  const [step, setStep] = useState<Step>('scan')

  // Scan input
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [scanError, setScanError] = useState('')

  // Pemilih hasil scan (siswa / guru / tu)
  const [siswa, setSiswa] = useState<VoterInfo | null>(null)

  // Kandidat & pilihan
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [isLoadingKandidat, setIsLoadingKandidat] = useState(false)
  const [selectedMitraTama, setSelectedMitraTama] = useState<Kandidat | null>(null)
  const [selectedMitraMuda, setSelectedMitraMuda] = useState<Kandidat | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [voteError, setVoteError] = useState('')

  // Auto-close countdown
  const [countdown, setCountdown] = useState(AUTOCLOSE_SECONDS)

  // Scanner refs
  const scannerRef = useRef<any>(null)
  const lastScanRef = useRef<{ nis: string; at: number }>({ nis: '', at: 0 })
  const stepRef = useRef<Step>('scan')
  stepRef.current = step

  // Kamera: pilihan depan/belakang + mode layar penuh
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const camWrapRef = useRef<HTMLDivElement>(null)
  // Mengganti kamera = stop() lalu start() pada elemen DOM yang sama.
  // html5-qrcode menolak start kalau elemen belum benar-benar dibersihkan,
  // jadi stop sebelumnya di-await dulu.
  const stopPromiseRef = useRef<Promise<unknown> | null>(null)

  /* ============ RESET ============ */
  const resetToScan = useCallback(() => {
    setStep('scan')
    setSiswa(null)
    setKandidat([])
    setSelectedMitraTama(null)
    setSelectedMitraMuda(null)
    setVoteError('')
    setScanError('')
    setCountdown(AUTOCLOSE_SECONDS)
  }, [])

  /* ============ AUTH QR (qr_id / NIS lama) ============ */
  const authenticateNis = useCallback(async (rawNis: string) => {
    const code = rawNis.trim()
    if (!code) return

    // Debounce: abaikan scan duplikat dalam 2 detik
    const now = Date.now()
    if (lastScanRef.current.nis === code && now - lastScanRef.current.at < 2000) {
      return
    }
    lastScanRef.current = { nis: code, at: now }

    setIsAuthenticating(true)
    setScanError('')

    try {
      const res = await fetch('/api/auth/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setScanError(data.message || 'Kode QR tidak valid')
        return
      }

      if (data.alreadyVoted) {
        setScanError(`Pemilih ini (${data.voter?.namaLengkap || code}) sudah melakukan voting`)
        return
      }

      setSiswa(data.voter)
      setStep('confirm')
    } catch (err) {
      setScanError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setIsAuthenticating(false)
    }
  }, [])

  /* ============ FETCH KANDIDAT ============ */
  const fetchKandidat = useCallback(async () => {
    setIsLoadingKandidat(true)
    try {
      const res = await fetch('/api/kandidat')
      if (res.ok) {
        const data = await res.json()
        setKandidat(data)
      }
    } catch (err) {
      console.error('Gagal memuat kandidat:', err)
    } finally {
      setIsLoadingKandidat(false)
    }
  }, [])

  const startVoting = useCallback(() => {
    if (!siswa) return
    fetchKandidat()
    setStep('voting')
  }, [siswa, fetchKandidat])

  /* ============ SUBMIT VOTE ============ */
  const submitVote = useCallback(async () => {
    if (!siswa || !selectedMitraTama || !selectedMitraMuda) return

    setIsVoting(true)
    setVoteError('')

    try {
      // Isi payload menyesuaikan jenis pemilih: siswa pakai siswaId,
      // guru/TU pakai pegawaiId (voterType = 'guru' | 'tu').
      const voterPayload =
        siswa.type === 'siswa'
          ? { siswaId: siswa.id, voterType: 'siswa' as const }
          : { pegawaiId: siswa.id, voterType: siswa.type }

      const responses = await Promise.all([
        fetch('/api/voting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kandidatId: selectedMitraTama.id,
            ...voterPayload,
          }),
        }),
        fetch('/api/voting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kandidatId: selectedMitraMuda.id,
            ...voterPayload,
          }),
        }),
      ])

      const allSuccess = responses.every((r) => r.ok)

      if (allSuccess) {
        setStep('done')
        setCountdown(AUTOCLOSE_SECONDS)
      } else {
        const errRes = responses.find((r) => !r.ok)
        const errData = errRes ? await errRes.json().catch(() => ({})) : {}
        setVoteError(errData.message || 'Gagal menyimpan pilihan. Panggil panitia.')
      }
    } catch (err) {
      setVoteError('Terjadi kesalahan. Panggil panitia.')
    } finally {
      setIsVoting(false)
    }
  }, [siswa, selectedMitraTama, selectedMitraMuda])

  /* ============ CAMERA SCANNER (html5-qrcode) ============ */
  useEffect(() => {
    // Hanya aktifkan kamera saat step=scan & mode=camera
    if (step !== 'scan') {
      return
    }

    let cancelled = false

    // Elemen #kiosk-qr-reader dipakai ulang saat mengganti kamera. Kalau
    // scanner lama masih hidup, start() baru langsung gagal — jadi tunggu
    // proses stop selesai dulu.
    const stopPrevious = async () => {
      const scanner = scannerRef.current
      scannerRef.current = null
      if (!scanner) return
      try {
        await scanner.stop()
        await scanner.clear()
      } catch {
        // scanner memang belum/tidak jalan — aman diabaikan
      }
    }

    const startScanner = async () => {
      await stopPromiseRef.current
      if (cancelled) return
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const el = document.getElementById('kiosk-qr-reader')
        if (!el) return

        const scanner = new Html5Qrcode('kiosk-qr-reader', { verbose: false })
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: facing },
          {
            fps: 10,
            qrbox: (vw: number, vh: number) => {
              const size = Math.floor(Math.min(vw, vh) * 0.7)
              return { width: size, height: size }
            },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            // QR berisi qr_id (UUID) untuk kartu baru, atau NIS untuk kartu lama
            const code = decodedText.trim()
            if (stepRef.current === 'scan') {
              authenticateNis(code)
            }
          },
          () => {
            // ignore per-frame errors
          }
        )
      } catch (err: any) {
        console.error('Kamera gagal:', err)
        if (!cancelled) {
          setScanError(
            `Kamera ${facing === 'user' ? 'depan' : 'belakang'} tidak dapat diakses. ` +
              'Coba tekan tombol Kamera Depan/Belakang, pastikan izin kamera diizinkan browser, ' +
              'lalu muat ulang halaman.'
          )
        }
      }
    }

    // Delay kecil agar DOM siap. stopPromiseRef SENGAJA tidak diisi promise
    // start ini: startScanner menunggu stopPromiseRef (milik cleanup
    // sebelumnya). Mengisinya dengan promise sendiri = deadlock, kamera tidak
    // pernah menyala.
    ;(async () => {
      await new Promise((r) => setTimeout(r, 300))
      if (!cancelled) await startScanner()
    })().catch((err) => console.error('Scanner start gagal:', err))

    return () => {
      cancelled = true
      // scanner.stop() bisa MELEMPAR sinkron ("Cannot stop, scanner is not
      // running or paused") ketika kamera gagal start — .catch() tidak
      // menangkapnya, halaman jadi client-side exception saat pindah mode.
      stopPromiseRef.current = stopPrevious()
    }
  }, [step, facing, authenticateNis])

  /* ============ LAYAR PENUH (SELURUH HALAMAN) ============ */
  // Dulu yang di-fullscreen hanya kotak kamera. Akibatnya: begitu panitia
  // pindah ke mode Manual, <input> berada di luar area fullscreen -> fokus ke
  // input membuat Chrome membatalkan fullscreen otomatis (bukan karena kode
  // kita). Sekarang seluruh halaman yang di-fullscreen agar semua langkah
  // (scan, konfirmasi, voting, selesai) tetap layar penuh.
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Layar penuh gagal:', err)
    }
  }, [])

  // Sinkronkan state kalau user keluar fullscreen lewat Esc / tombol sistem
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Layar penuh SENGAJA dibiarkan tetap aktif saat kartu terbaca. Dulu keluar
  // otomatis saat pindah dari 'scan', tapi itu merepotkan panitia: layar
  // konfirmasi lalu voting harus dibuka ulang ke layar penuh. Keluar hanya
  // kalau panitia menekan tombol (Esc / "Keluar Layar Penuh").

  /* ============ AUTO-CLOSE SETELAH SELESAI ============ */
  useEffect(() => {
    if (step !== 'done') return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          resetToScan()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [step, resetToScan])

  /* ============ PILIH KANDIDAT ============ */
  const selectKandidat = (k: Kandidat) => {
    if (k.role === 'mitratama') {
      setSelectedMitraTama(k)
    } else {
      setSelectedMitraMuda(k)
    }
  }

  const canSubmit = !!selectedMitraTama && !!selectedMitraMuda

  /* ============ RENDER ============ */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Vote className="size-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-[15px] font-bold text-slate-900 sm:text-base">
                Bilik Voting
              </h1>
              <p className="truncate text-xs font-medium text-slate-500">
                Pemilihan Ketua OSIS · SMAN 1 Bantarujeg
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Siap
            </span>
            {isFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                title="Keluar layar penuh (Esc)"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Minimize className="size-4" />
                <span className="sr-only">Keluar layar penuh</span>
              </button>
            )}
          </div>
        </div>

        {/* Penanda tahap: satu garis, selalu tahu posisi */}
        <div className="mx-auto flex max-w-5xl items-center gap-2 border-t border-slate-100 px-3 py-2 sm:px-4">
          {([
            ['scan', 'Pindai Kartu'],
            ['confirm', 'Konfirmasi'],
            ['voting', 'Pilih Kandidat'],
          ] as const).map(([key, label], i) => {
            const order = ['scan', 'confirm', 'voting', 'done']
            const aktifIdx = order.indexOf(step)
            const iniIdx = order.indexOf(key)
            const lewat = aktifIdx > iniIdx
            const aktif = aktifIdx === iniIdx
            return (
              <div key={key} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    lewat || aktif
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {lewat ? '✓' : i + 1}
                </span>
                <span
                  className={`truncate text-xs font-semibold ${
                    aktif ? 'text-indigo-700' : lewat ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
                {i < 2 && <span className="h-px flex-1 bg-slate-200" />}
              </div>
            )
          })}
        </div>
      </header>

      <main
        className={`mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6 ${
          isFullscreen ? 'flex min-h-[calc(100vh-3.5rem)] flex-col justify-center' : ''
        }`}
      >

        {/* ================= STEP: SCAN ================= */}
        {step === 'scan' && (
          <div className="mx-auto w-full max-w-2xl space-y-4">
            <Panel className="overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ScanLine className="size-4 shrink-0 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-900 sm:text-[15px]">
                      Pindai Kartu Pemilih
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Arahkan QR ke kamera. Nama pemilih akan muncul untuk diperiksa panitia.
                  </p>
                </div>
                <StepTag>Langkah 1</StepTag>
              </div>

              <div className="px-3 py-4 sm:px-5">
                <div ref={camWrapRef} className="space-y-3">
                  <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-900/10">
                    {/* Sudut bingkai bidik — petunjuk visual tanpa menutupi kamera */}
                    <div className="pointer-events-none absolute inset-0 z-10">
                      <span className="absolute left-3 top-3 size-6 rounded-tl-lg border-l-2 border-t-2 border-white/80" />
                      <span className="absolute right-3 top-3 size-6 rounded-tr-lg border-r-2 border-t-2 border-white/80" />
                      <span className="absolute bottom-3 left-3 size-6 rounded-bl-lg border-b-2 border-l-2 border-white/80" />
                      <span className="absolute bottom-3 right-3 size-6 rounded-br-lg border-b-2 border-r-2 border-white/80" />
                    </div>
                    <div
                      id="kiosk-qr-reader"
                      className="mx-auto w-full [&_video]:block [&_video]:w-full"
                      style={
                        // Kamera depan di-mirror supaya gerak terasa natural.
                        // Tidak memengaruhi pembacaan QR.
                        facing === 'user' ? { transform: 'scaleX(-1)' } : undefined
                      }
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <ToolButton
                      onClick={() =>
                        setFacing((f) => (f === 'environment' ? 'user' : 'environment'))
                      }
                      icon={<SwitchCamera />}
                      title="Ganti kamera depan/belakang"
                    >
                      {facing === 'environment' ? 'Kamera Depan' : 'Kamera Belakang'}
                    </ToolButton>
                    <ToolButton
                      onClick={toggleFullscreen}
                      icon={isFullscreen ? <Minimize /> : <Maximize />}
                      title="Layar penuh untuk semua langkah"
                    >
                      {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                    </ToolButton>
                  </div>

                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                    <Camera className="size-3.5" />
                    Kamera {facing === 'user' ? 'depan' : 'belakang'} aktif
                  </p>
                </div>

                {isAuthenticating && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <Spinner className="size-4" />
                    Memeriksa kartu…
                  </div>
                )}

                {scanError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-rose-600" />
                    <p className="text-xs leading-relaxed text-rose-800 sm:text-sm">{scanError}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 sm:px-5">
                <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                Satu pemilih satu suara. Panitia wajib memeriksa identitas sebelum memulai.
              </div>
            </Panel>
          </div>
        )}

        {/* ================= STEP: CONFIRM ================= */}
        {step === 'confirm' && siswa && (
          <Panel className="mx-auto w-full max-w-lg overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-400" />

            <div className="px-4 pb-5 pt-6 text-center sm:px-6">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <User className="size-7" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Langkah 2 · Konfirmasi identitas
              </p>
              <h2 className="mt-1.5 text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                {siswa.namaLengkap}
              </h2>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                {siswa.type === 'siswa' ? (
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                    NIS {siswa.nis}
                  </span>
                ) : (
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {siswa.type === 'guru' ? 'Guru' : 'Tenaga Kependidikan'}
                  </span>
                )}
                <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  {siswa.type === 'siswa' ? `Kelas ${siswa.kelas}` : siswa.kelas}
                </span>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-left">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-relaxed text-amber-900">
                  <strong className="font-semibold">Periksa dulu:</strong> pastikan wajah pemilih di
                  depan cocok dengan nama di atas. Kalau bukan, tekan Batal.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={startVoting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 sm:flex-1"
                >
                  <Vote className="size-4" />
                  Mulai Memilih
                </button>
                <button
                  type="button"
                  onClick={resetToScan}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:flex-1"
                >
                  <ChevronLeft className="size-4" />
                  Batal
                </button>
              </div>
            </div>
          </Panel>
        )}

        {/* ================= STEP: VOTING ================= */}
        {step === 'voting' && siswa && (
          <div className="space-y-4">
            {/* Bilah identitas pemilih */}
            <div className="sticky top-[7.25rem] z-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <User className="size-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold text-slate-900">{siswa.namaLengkap}</p>
                  <p className="truncate text-xs text-slate-500">
                    {siswa.type === 'siswa' ? `Kelas ${siswa.kelas}` : siswa.kelas}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetToScan}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <RotateCcw className="size-3.5" />
                Batal
              </button>
            </div>

            {isLoadingKandidat ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner className="size-8" />
              </div>
            ) : (
              <>
                {['mitratama', 'mitramuda'].map((roleType) => {
                  const list = kandidat.filter((k) => k.role === roleType)
                  const isMuda = roleType === 'mitramuda'
                  const label = isMuda ? 'Mitra Muda' : 'Mitra Tama'
                  const sub = isMuda ? 'Kelas X' : 'Kelas XI'
                  const selected = isMuda ? selectedMitraMuda : selectedMitraTama

                  if (list.length === 0) return null

                  return (
                    <section key={roleType} className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                            isMuda
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isMuda ? 'Mitra Muda' : 'Mitra Tama'}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{sub}</span>
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="text-[11px] font-semibold text-slate-400">
                          {selected ? 'Terpilih' : 'Pilih satu'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                        {list.map((k) => {
                          const isSelected = selected?.id === k.id
                          const ring = isMuda ? 'ring-teal-500' : 'ring-amber-500'
                          const check = isMuda ? 'bg-teal-600' : 'bg-amber-600'
                          return (
                            <button
                              key={k.id}
                              type="button"
                              onClick={() => selectKandidat(k)}
                              aria-pressed={isSelected}
                              className={`group relative overflow-hidden rounded-xl border bg-white text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.99] ${
                                isSelected
                                  ? `border-transparent ring-2 ${ring}`
                                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                              }`}
                            >
                              <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
                                {k.fotoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={k.fotoUrl}
                                    alt={k.namaCalon}
                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                  />
                                ) : (
                                  <div className="flex size-full items-center justify-center">
                                    <User className="size-12 text-slate-300" />
                                  </div>
                                )}

                                <span className="absolute left-2 top-2 rounded-md bg-slate-900/80 px-1.5 py-0.5 font-mono text-xs font-bold text-white">
                                  {String(k.nomorUrut).padStart(2, '0')}
                                </span>

                                {isSelected && (
                                  <span
                                    className={`absolute right-2 top-2 flex size-6 items-center justify-center rounded-full ${check} text-white shadow`}
                                  >
                                    <CheckCircle className="size-3.5" />
                                  </span>
                                )}
                              </div>

                              <div className="px-2 py-2">
                                <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 sm:text-[13px]">
                                  {k.namaCalon}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}

                {voteError && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                    <p className="text-xs text-rose-800 sm:text-sm">{voteError}</p>
                  </div>
                )}

                {/* Ringkasan pilihan + tombol kirim: menempel di bawah */}
                <div className="sticky bottom-0 z-10 -mx-3 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-4">
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        Mitra Tama
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {selectedMitraTama?.namaCalon || 'Belum dipilih'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-teal-200 bg-teal-50/70 px-2.5 py-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                        Mitra Muda
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {selectedMitraMuda?.namaCalon || 'Belum dipilih'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitVote}
                    disabled={!canSubmit || isVoting}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isVoting ? (
                      <>
                        <Spinner className="size-4" />
                        Menyimpan suara…
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        Konfirmasi &amp; Simpan Suara
                      </>
                    )}
                  </button>
                  <p className="mt-1.5 text-center text-xs text-slate-500">
                    Suara tidak dapat diubah setelah disimpan.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= STEP: DONE ================= */}
        {step === 'done' && (
          <Panel className="mx-auto w-full max-w-md overflow-hidden text-center">
            <div className="h-1.5 w-full bg-emerald-500" />
            <div className="px-5 py-7">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                <CheckCircle className="size-9 text-emerald-600" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">Suara Tersimpan</h2>
              <p className="mt-1 text-sm text-slate-600">
                Terima kasih, {siswa?.namaLengkap?.split(' ')[0] || 'pemilih'}.
              </p>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-xs text-slate-600">
                  Kembali ke kamera dalam{' '}
                  <span className="font-mono text-base font-bold text-slate-900">{countdown}</span>{' '}
                  detik
                </p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-linear"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, ((AUTOCLOSE_SECONDS - countdown) / AUTOCLOSE_SECONDS) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={resetToScan}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <RotateCcw className="size-4" />
                Pindai Pemilih Berikutnya
              </button>
            </div>
          </Panel>
        )}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-3 pb-6 pt-2 sm:px-4">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3.5" />
            Satu pemilih satu suara
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3.5" />
            E-Voting OSIS SMAN 1 Bantarujeg
          </span>
        </p>
      </footer>
    </div>
  )
}
