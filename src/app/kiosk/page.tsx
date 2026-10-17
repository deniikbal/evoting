'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import {
  Camera, Keyboard, CheckCircle, XCircle, User, Vote, ArrowRight,
  ScanLine, RotateCcw, TriangleAlert, Users, SwitchCamera, Maximize, Minimize,
} from 'lucide-react'

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
type ScanMode = 'camera' | 'manual'

const AUTOCLOSE_SECONDS = 5

export default function KioskPage() {
  const [step, setStep] = useState<Step>('scan')
  const [scanMode, setScanMode] = useState<ScanMode>('camera')

  // Scan input
  const [manualNis, setManualNis] = useState('')
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
  const manualInputRef = useRef<HTMLInputElement>(null)
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
    setManualNis('')
    setCountdown(AUTOCLOSE_SECONDS)
    setTimeout(() => manualInputRef.current?.focus(), 100)
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
      setManualNis('')
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
    if (step !== 'scan' || scanMode !== 'camera') {
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
              'Coba ganti kamera, atau pakai mode Manual / Scanner USB.'
          )
        }
      }
    }

    // Delay kecil agar DOM siap
    const p = (async () => {
      await new Promise((r) => setTimeout(r, 300))
      if (!cancelled) await startScanner()
    })()
    stopPromiseRef.current = p

    return () => {
      cancelled = true
      // scanner.stop() bisa MELEMPAR sinkron ("Cannot stop, scanner is not
      // running or paused") ketika kamera gagal start — .catch() tidak
      // menangkapnya, halaman jadi client-side exception saat pindah mode.
      stopPromiseRef.current = stopPrevious()
    }
  }, [step, scanMode, facing, authenticateNis])

  /* ============ LAYAR PENUH UNTUK AREA KAMERA ============ */
  const toggleFullscreen = useCallback(async () => {
    const el = camWrapRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
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

  // Keluar fullscreen otomatis kalau langkah berpindah dari 'scan' (mis. kartu
  // terbaca) supaya layar konfirmasi tidak terkurung di area kamera.
  useEffect(() => {
    if (step !== 'scan' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [step])

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

  /* ============ FOCUS INPUT MANUAL ============ */
  useEffect(() => {
    if (step === 'scan' && scanMode === 'manual') {
      manualInputRef.current?.focus()
    }
  }, [step, scanMode])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50 dark:from-slate-950 dark:via-sky-950/30 dark:to-indigo-950/30">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow">
              <Vote className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-tight sm:text-base">Bilik Voting</h1>
              <p className="truncate text-[11px] text-muted-foreground">E-Voting OSIS</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            Siap
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">

        {/* ================= STEP: SCAN ================= */}
        {step === 'scan' && (
          <div className="space-y-4">
            {/* Mode switch */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-center">
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setScanMode('camera')}
              >
                <Camera />
                Kamera
              </Button>
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setScanMode('manual')}
              >
                <Keyboard />
                <span className="truncate">Manual / Scanner USB</span>
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="px-4 text-center sm:px-6">
                <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
                  <ScanLine className="size-5 shrink-0 text-sky-500 sm:size-6" />
                  Scan Kartu QR
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Arahkan QR Code ke kamera. Setelah muncul nama, pastikan sesuai lalu tekan
                  &quot;Mulai Memilih&quot;.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-3 sm:px-6">
                {scanMode === 'camera' ? (
                  <div
                    ref={camWrapRef}
                    className={
                      isFullscreen
                        ? 'flex h-screen w-screen flex-col justify-center bg-black p-3'
                        : 'space-y-3'
                    }
                  >
                    <div
                      className={
                        isFullscreen
                          ? 'relative overflow-hidden rounded-xl border-2 border-sky-400/40 bg-black'
                          : 'relative overflow-hidden rounded-xl border-2 border-dashed border-sky-300 bg-black/5'
                      }
                    >
                      <div
                        id="kiosk-qr-reader"
                        className={
                          isFullscreen
                            ? 'mx-auto w-full [&_video]:!w-full [&_video]:!object-cover'
                            : 'mx-auto w-full max-w-md'
                        }
                        style={
                          // Kamera depan di-mirror supaya gerak panitia terasa
                          // natural. Tidak memengaruhi pembacaan QR.
                          facing === 'user' ? { transform: 'scaleX(-1)' } : undefined
                        }
                      />
                    </div>

                    <div
                      className={
                        isFullscreen
                          ? 'mt-3 flex justify-center gap-2'
                          : 'flex flex-wrap justify-center gap-2'
                      }
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFacing((f) => (f === 'environment' ? 'user' : 'environment'))
                        }
                      >
                        <SwitchCamera />
                        {facing === 'environment' ? 'Kamera Depan' : 'Kamera Belakang'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize /> : <Maximize />}
                        {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                      </Button>
                    </div>

                    {!isFullscreen && (
                      <p className="text-center text-xs text-muted-foreground">
                        Kamera aktif: <strong>{facing === 'user' ? 'Depan' : 'Belakang'}</strong>. Pakai
                        Layar Penuh agar QR lebih mudah dibidik.
                      </p>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      authenticateNis(manualNis)
                    }}
                    className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
                  >
                    <Input
                      ref={manualInputRef}
                      value={manualNis}
                      onChange={(e) => setManualNis(e.target.value)}
                      placeholder="Scan QR, atau ketik kode / NIS lalu Enter"
                      className="h-12 text-center text-base font-bold tracking-wider sm:text-lg"
                      autoFocus
                    />
                    <Button type="submit" className="h-12 shrink-0" disabled={isAuthenticating}>
                      {isAuthenticating ? <Spinner className="size-5" /> : <ArrowRight />}
                      Proses
                    </Button>
                  </form>
                )}

                {isAuthenticating && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    Memeriksa kode QR...
                  </div>
                )}

                {scanError && (
                  <Alert variant="destructive">
                    <TriangleAlert className="size-4" />
                    <AlertDescription className="text-xs sm:text-sm">{scanError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= STEP: CONFIRM ================= */}
        {step === 'confirm' && siswa && (
          <Card className="mx-auto w-full max-w-lg border-2 border-sky-200 shadow-lg dark:border-sky-900">
            <CardHeader className="px-4 text-center sm:px-6">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg">
                <User className="size-8" />
              </div>
              <CardDescription>Pastikan ini benar identitas Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 text-center sm:px-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold leading-tight sm:text-3xl">{siswa.namaLengkap}</h2>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {siswa.type === 'siswa' ? (
                    <Badge variant="secondary">NIS: {siswa.nis}</Badge>
                  ) : (
                    <Badge variant="secondary">
                      {siswa.type === 'guru' ? 'GURU' : 'TENAGA KEPENDIDIKAN'}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {siswa.type === 'siswa' ? `Kelas ${siswa.kelas}` : siswa.kelas}
                  </Badge>
                </div>
              </div>

              <Alert>
                <TriangleAlert className="size-4" />
                <AlertDescription className="text-left text-xs">
                  <strong>Perhatian panitia:</strong> cek nama di layar sudah sesuai dengan pemilih yang berdiri di depan.
                  Jika bukan, tekan Batal.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="lg" className="w-full sm:flex-1" onClick={resetToScan}>
                  <RotateCcw />
                  Batal
                </Button>
                <Button size="lg" className="w-full sm:flex-1" onClick={startVoting}>
                  <Vote />
                  Mulai Memilih
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================= STEP: VOTING ================= */}
        {step === 'voting' && siswa && (
          <div className="space-y-4">
            <Card>
              <CardContent className="flex items-center justify-between gap-2 px-3 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-2">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">{siswa.namaLengkap}</span>
                  <Badge variant="secondary" className="hidden shrink-0 text-xs sm:inline-flex">
                    {siswa.kelas}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0" onClick={resetToScan}>
                  <RotateCcw />
                  Batal
                </Button>
              </CardContent>
            </Card>

            {isLoadingKandidat ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner className="size-8" />
              </div>
            ) : (
              <>
                {['mitratama', 'mitramuda'].map((roleType) => {
                  const list = kandidat.filter((k) => k.role === roleType)
                  const label = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'
                  const selected = roleType === 'mitratama' ? selectedMitraTama : selectedMitraMuda
                  const isMuda = roleType === 'mitramuda'

                  if (list.length === 0) return null

                  return (
                    <div key={roleType}>
                      <div className="mb-3 flex items-center gap-2 sm:gap-3">
                        <Badge
                          variant="outline"
                          className={
                            isMuda
                              ? 'border-cyan-300 bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-800 sm:px-3 sm:text-sm dark:bg-cyan-900/60 dark:text-cyan-100'
                              : 'border-fuchsia-300 bg-fuchsia-100 px-2 py-1 text-xs font-bold text-fuchsia-800 sm:px-3 sm:text-sm dark:bg-fuchsia-900/60 dark:text-fuchsia-100'
                          }
                        >
                          {label}
                        </Badge>
                        <Separator className="flex-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {list.map((k) => {
                          const isSelected = selected?.id === k.id
                          return (
                            <Card
                              key={k.id}
                              onClick={() => selectKandidat(k)}
                              className={`cursor-pointer overflow-hidden transition-all active:scale-[0.98] ${
                                isSelected
                                  ? isMuda
                                    ? 'border-2 border-cyan-500 ring-2 ring-cyan-300'
                                    : 'border-2 border-fuchsia-500 ring-2 ring-fuchsia-300'
                                  : 'hover:shadow-md'
                              }`}
                            >
                              <div className="relative h-32 bg-muted sm:h-40">
                                {k.fotoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={k.fotoUrl} alt={k.namaCalon} className="size-full object-cover" />
                                ) : (
                                  <div className="flex size-full items-center justify-center">
                                    <User className="size-14 text-muted-foreground/40" />
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute right-2 top-2 rounded-full bg-emerald-500 p-1 text-white">
                                    <CheckCircle className="size-5" />
                                  </div>
                                )}
                                <div className="absolute left-2 top-2">
                                  <Badge className="text-xs">No. {k.nomorUrut}</Badge>
                                </div>
                              </div>
                              <CardContent className="p-2 sm:p-3">
                                <p className="text-center text-xs font-bold leading-tight sm:text-sm">
                                  {k.namaCalon}
                                </p>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {voteError && (
                  <Alert variant="destructive">
                    <XCircle className="size-4" />
                    <AlertDescription>{voteError}</AlertDescription>
                  </Alert>
                )}

                <div className="sticky bottom-0 border-t bg-background/95 px-3 py-3 backdrop-blur sm:px-0">
                  <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border bg-muted/40 p-2">
                      <p className="text-muted-foreground">Mitra Tama</p>
                      <p className="truncate font-semibold">{selectedMitraTama?.namaCalon || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 p-2">
                      <p className="text-muted-foreground">Mitra Muda</p>
                      <p className="truncate font-semibold">{selectedMitraMuda?.namaCalon || '-'}</p>
                    </div>
                  </div>
                  <Button
                    className="h-14 w-full text-base font-semibold"
                    size="lg"
                    onClick={submitVote}
                    disabled={!canSubmit || isVoting}
                  >
                    {isVoting ? (
                      <>
                        <Spinner className="size-5" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle />
                        Konfirmasi Pilihan
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= STEP: DONE ================= */}
        {step === 'done' && (
          <Card className="mx-auto w-full max-w-md border-2 border-emerald-200 text-center shadow-lg dark:border-emerald-900">
            <CardContent className="space-y-4 px-4 py-8 sm:px-6 sm:py-10">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg">
                <CheckCircle className="size-10" />
              </div>
              <h2 className="text-xl font-bold sm:text-2xl">Terima Kasih!</h2>
              <p className="text-muted-foreground">Suara Anda sudah tersimpan.</p>
              <Alert>
                <AlertDescription className="text-center text-sm">
                  Kembali ke layar scan dalam{' '}
                  <span className="text-lg font-bold text-foreground">{countdown}</span> detik
                  <br />
                  <span className="text-xs">Silakan pemilih berikutnya bersiap.</span>
                </AlertDescription>
              </Alert>
              <Button size="lg" className="w-full" onClick={resetToScan}>
                <RotateCcw />
                Scan Pemilih Berikutnya
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer hint */}
      <footer className="mx-auto max-w-5xl px-3 pb-6 sm:px-4">
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Users className="size-3.5" />
          Satu siswa satu suara — jangan tinggalkan bilik saat proses.
        </p>
      </footer>
    </div>
  )
}
