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
  ScanLine, RotateCcw, TriangleAlert, Users,
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

interface SiswaInfo {
  id: number
  nis: string
  namaLengkap: string
  kelas: string
  sudahMemilih: boolean
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

  // Siswa hasil scan
  const [siswa, setSiswa] = useState<SiswaInfo | null>(null)

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

  /* ============ AUTH QR / NIS ============ */
  const authenticateNis = useCallback(async (rawNis: string) => {
    const nis = rawNis.trim()
    if (!nis) return

    // Debounce: abaikan scan duplikat dalam 2 detik
    const now = Date.now()
    if (lastScanRef.current.nis === nis && now - lastScanRef.current.at < 2000) {
      return
    }
    lastScanRef.current = { nis, at: now }

    setIsAuthenticating(true)
    setScanError('')

    try {
      const res = await fetch('/api/auth/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nis }),
      })
      const data = await res.json()

      if (!res.ok) {
        setScanError(data.message || 'NIS tidak valid')
        return
      }

      if (data.alreadyVoted) {
        setScanError(`Siswa ini (${data.siswa?.namaLengkap || nis}) sudah melakukan voting`)
        return
      }

      setSiswa(data.siswa)
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
      const responses = await Promise.all([
        fetch('/api/voting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kandidatId: selectedMitraTama.id,
            siswaId: siswa.id,
            voterType: 'siswa',
          }),
        }),
        fetch('/api/voting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kandidatId: selectedMitraMuda.id,
            siswaId: siswa.id,
            voterType: 'siswa',
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

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const el = document.getElementById('kiosk-qr-reader')
        if (!el) return

        const scanner = new Html5Qrcode('kiosk-qr-reader', { verbose: false })
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (vw: number, vh: number) => {
              const size = Math.floor(Math.min(vw, vh) * 0.7)
              return { width: size, height: size }
            },
          },
          (decodedText: string) => {
            // QR berisi NIS (murni angka/teks)
            const nis = decodedText.trim()
            if (stepRef.current === 'scan') {
              authenticateNis(nis)
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
            'Kamera tidak dapat diakses (butuh HTTPS/izin). Gunakan mode Manual atau Scanner USB.'
          )
        }
      }
    }

    // Delay kecil agar DOM siap
    const t = setTimeout(startScanner, 300)

    return () => {
      cancelled = true
      clearTimeout(t)
      const scanner = scannerRef.current
      scannerRef.current = null
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {})
      }
    }
  }, [step, scanMode, authenticateNis])

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
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow">
              <Vote className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight sm:text-base">Bilik Voting</h1>
              <p className="text-[11px] text-muted-foreground">E-Voting OSIS</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            Siap
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">

        {/* ================= STEP: SCAN ================= */}
        {step === 'scan' && (
          <div className="space-y-4">
            {/* Mode switch */}
            <div className="flex justify-center gap-2">
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('camera')}
              >
                <Camera />
                Kamera
              </Button>
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('manual')}
              >
                <Keyboard />
                Manual / Scanner USB
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <ScanLine className="size-6 text-sky-500" />
                  Scan Kartu QR
                </CardTitle>
                <CardDescription>
                  Arahkan QR Code siswa ke kamera. Setelah muncul nama siswa, pastikan sesuai lalu tekan &quot;Mulai Memilih&quot;.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scanMode === 'camera' ? (
                  <div className="overflow-hidden rounded-xl border-2 border-dashed border-sky-300 bg-black/5">
                    <div id="kiosk-qr-reader" className="mx-auto w-full max-w-md" />
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
                      placeholder="Ketik / tempel NIS lalu Enter"
                      className="h-12 text-center text-lg font-bold tracking-widest"
                      inputMode="numeric"
                      autoFocus
                    />
                    <Button type="submit" className="h-12" disabled={isAuthenticating}>
                      {isAuthenticating ? <Spinner className="size-5" /> : <ArrowRight />}
                      Proses
                    </Button>
                  </form>
                )}

                {isAuthenticating && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    Memeriksa NIS...
                  </div>
                )}

                {scanError && (
                  <Alert variant="destructive">
                    <TriangleAlert className="size-4" />
                    <AlertDescription>{scanError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= STEP: CONFIRM ================= */}
        {step === 'confirm' && siswa && (
          <Card className="mx-auto max-w-lg border-2 border-sky-200 shadow-lg dark:border-sky-900">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg">
                <User className="size-8" />
              </div>
              <CardDescription>Pastikan ini benar identitas Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold sm:text-3xl">{siswa.namaLengkap}</h2>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="secondary">NIS: {siswa.nis}</Badge>
                  <Badge variant="outline">Kelas {siswa.kelas}</Badge>
                </div>
              </div>

              <Alert>
                <TriangleAlert className="size-4" />
                <AlertDescription className="text-left text-xs">
                  <strong>Perhatian panitia:</strong> cek nama di layar sudah sesuai dengan siswa yang berdiri di depan.
                  Jika bukan, tekan Batal.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={resetToScan}>
                  <RotateCcw />
                  Batal
                </Button>
                <Button className="flex-1" onClick={startVoting}>
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
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{siswa.namaLengkap}</span>
                  <Badge variant="secondary" className="text-xs">{siswa.kelas}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={resetToScan}>
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
                      <div className="mb-3 flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={
                            isMuda
                              ? 'border-cyan-300 bg-cyan-100 px-3 py-1 font-bold text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-100'
                              : 'border-fuchsia-300 bg-fuchsia-100 px-3 py-1 font-bold text-fuchsia-800 dark:bg-fuchsia-900/60 dark:text-fuchsia-100'
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
                              className={`cursor-pointer overflow-hidden transition-all ${
                                isSelected
                                  ? isMuda
                                    ? 'border-2 border-cyan-500 ring-2 ring-cyan-300'
                                    : 'border-2 border-fuchsia-500 ring-2 ring-fuchsia-300'
                                  : 'hover:shadow-md'
                              }`}
                            >
                              <div className="relative h-40 bg-muted">
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
                              <CardContent className="p-3">
                                <p className="text-center text-sm font-bold leading-tight">{k.namaCalon}</p>
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

                <div className="sticky bottom-0 border-t bg-background/95 py-3 backdrop-blur">
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
                    className="h-12 w-full text-base font-semibold"
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
          <Card className="mx-auto max-w-md border-2 border-emerald-200 text-center shadow-lg dark:border-emerald-900">
            <CardContent className="space-y-4 py-10">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg">
                <CheckCircle className="size-10" />
              </div>
              <h2 className="text-2xl font-bold">Terima Kasih!</h2>
              <p className="text-muted-foreground">Suara Anda sudah tersimpan.</p>
              <Alert>
                <AlertDescription className="text-center text-sm">
                  Kembali ke layar scan dalam{' '}
                  <span className="text-lg font-bold text-foreground">{countdown}</span> detik
                  <br />
                  <span className="text-xs">Silakan siswa berikutnya bersiap.</span>
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={resetToScan}>
                <RotateCcw />
                Scan Siswa Berikutnya
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer hint */}
      <footer className="mx-auto max-w-5xl px-4 pb-6">
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Users className="size-3.5" />
          Satu siswa satu suara — jangan tinggalkan bilik saat proses.
        </p>
      </footer>
    </div>
  )
}
