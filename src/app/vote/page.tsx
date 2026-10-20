'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Camera, Keyboard, CheckCircle, XCircle, User, Vote, ArrowRight,
  ScanLine, RotateCcw, TriangleAlert, Users, Maximize, Minimize,
  ShieldCheck, Lock, Sparkles, ChevronLeft, Send,
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

  // Teks bantuan per tahap: bahasa siswa, bukan bahasa sistem. Kalimat
  // menjawab "sekarang aku harus apa" dalam satu baris.
  const BANTUAN: Record<Step, { judul: string; isi: string }> = {
    scan: {
      judul: 'Tunjukkan kartu kamu ke kamera',
      isi: 'Cukup arahkan kartu pemilih ke kotak kamera sampai bunyi "beep". Nanti namamu muncul di layar untuk dicek panitia.',
    },
    confirm: {
      judul: 'Ini kamu, kan?',
      isi: 'Cek nama dan kelas di layar. Kalau bener, lanjut. Kalau bukan kamu, tekan Batal dan panggil panitia.',
    },
    voting: {
      judul: 'Pilih dua: Mitra Tama dan Mitra Muda',
      isi: 'Ketuk foto kandidat pilihanmu di masing-masing kategori. Setelah dua-duanya ada tanda centang, tombol simpan akan aktif.',
    },
    done: {
      judul: 'Suara kamu udah masuk!',
      isi: 'Makasih ya. Layar balik ke kamera otomatis buat pemilih berikutnya.',
    },
  }

  // Scan input
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [scanError, setScanError] = useState('')

  // Pemilih hasil scan (siswa / guru / tu)
  const [siswa, setSiswa] = useState<VoterInfo | null>(null)

  // Tiket sesi pemilih: bukti bertanda tangan dari server bahwa kartu ini
  // benar-benar dipindai di kiosk. Identitas pemilih tidak lagi dikirim mentah.
  const [tiket, setTiket] = useState<string | null>(null)

  // Kandidat & pilihan
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [isLoadingKandidat, setIsLoadingKandidat] = useState(false)
  const [selectedMitraTama, setSelectedMitraTama] = useState<Kandidat | null>(null)
  const [selectedMitraMuda, setSelectedMitraMuda] = useState<Kandidat | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [voteError, setVoteError] = useState('')
  // Dialog konfirmasi terakhir: cek pilihan sekali lagi sebelum suara dikirim.
  const [bukaRangkuman, setBukaRangkuman] = useState(false)

  // Auto-close countdown
  const [countdown, setCountdown] = useState(AUTOCLOSE_SECONDS)

  // Scanner refs
  const scannerRef = useRef<any>(null)
  const lastScanRef = useRef<{ nis: string; at: number }>({ nis: '', at: 0 })
  const stepRef = useRef<Step>('scan')
  stepRef.current = step

  // Mode layar penuh. Kamera dipaku ke belakang — kiosk memakai kamera
  // belakang perangkat, tanpa pilihan ganti kamera.
  const [isFullscreen, setIsFullscreen] = useState(false)
  const camWrapRef = useRef<HTMLDivElement>(null)
  // Memulai ulang kamera (mis. pindah langkah) memakai elemen DOM yang sama.
  // html5-qrcode menolak start kalau elemen belum benar-benar dibersihkan,
  // jadi stop sebelumnya di-await dulu.
  const stopPromiseRef = useRef<Promise<unknown> | null>(null)

  /* ============ RESET ============ */
  const resetToScan = useCallback(() => {
    setStep('scan')
    setSiswa(null)
    setTiket(null)
    setKandidat([])
    setSelectedMitraTama(null)
    setSelectedMitraMuda(null)
    setVoteError('')
    setScanError('')
    setCountdown(AUTOCLOSE_SECONDS)
    setBukaRangkuman(false)
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

      // Tiket wajib ada: tanpa itu suara tidak akan diterima /api/voting.
      if (!data.tiket) {
        setScanError(
          'Sesi pemilih tidak diterbitkan. Panggil panitia untuk memeriksa server.'
        )
        return
      }

      setTiket(data.tiket)
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
    if (!tiket || !selectedMitraTama || !selectedMitraMuda) return

    setIsVoting(true)
    setVoteError('')

    const kirim = (kandidatId: number) =>
      fetch('/api/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kandidatId, tiket }),
      })

    try {
      const kirimSatu = async (kandidatId: number) => {
        try {
          return await kirim(kandidatId)
        } catch {
          return null
        }
      }

      // Dua suara dikirim berurutan, bukan bersamaan seperti sebelumnya yang
      // secara teori bisa membuat kondisi balapan pada penutupan hak pilih.
      let salahSatuSudahAda = false

      const responTama = await kirimSatu(selectedMitraTama.id)
      if (responTama && responTama.status === 409) salahSatuSudahAda = true

      const responMuda = await kirimSatu(selectedMitraMuda.id)
      if (responMuda && responMuda.status === 409) salahSatuSudahAda = true

      const berhasil = [responTama, responMuda].filter((r) => r && r.ok).length

      // Suara lengkap hanya bila kedua kategori benar-benar tersimpan.
      const lengkap = berhasil === 2 || (salahSatuSudahAda && berhasil >= 1)

      if (lengkap) {
        setStep('done')
        setCountdown(AUTOCLOSE_SECONDS)
        return
      }

      // Sebagian gagal: katakan apa adanya supaya panitia bisa menindak, dan
      // JANGAN menghapus tiket. Pemilih hanya perlu mengulang pilihan yang
      // belum masuk, sementara kategori yang sudah tersimpan ditolak server.
      if (berhasil === 1) {
        setVoteError(
          'Satu pilihan belum tersimpan. Tekan tombol simpan lagi, atau panggil panitia.'
        )
        return
      }

      const errRes = responTama || responMuda
      const errData = errRes ? await errRes.json().catch(() => ({})) : {}
      setVoteError(errData.message || 'Gagal menyimpan pilihan. Panggil panitia.')
    } catch (err) {
      setVoteError('Terjadi kesalahan. Panggil panitia.')
    } finally {
      setIsVoting(false)
    }
  }, [tiket, selectedMitraTama, selectedMitraMuda])

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
          // Kamera belakang selalu; tidak ada perpindahan ke kamera depan.
          { facingMode: 'environment' },
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
            'Kamera belakang tidak dapat diakses. Pastikan izin kamera diizinkan ' +
              'browser dan tidak ada aplikasi lain yang sedang memakai kamera, ' +
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
  }, [step, authenticateNis])

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
  // Warna penanda pilihan per kategori. Sebelumnya kartu terpilih memakai
  // `border-primary` + `ring-primary`, sedangkan `--primary` pada tema ini
  // bernilai oklch(0.205 0 0) — praktis hitam dan nyaris sama dengan
  // `--border` yang abu-abu muda. Akibatnya pemilih sulit melihat mana yang
  // sudah dipilih. Sekarang tiap kategori punya warna yang jelas berbeda:
  // Mitra Tama hijau, Mitra Muda merah.
  const WARNA = {
    mitratama: {
      garis: '#15803d',
      cahaya: 'rgba(21, 128, 61, 0.30)',
      latar: 'rgba(21, 128, 61, 0.07)',
      teks: '#166534',
    },
    mitramuda: {
      garis: '#b91c1c',
      cahaya: 'rgba(185, 28, 28, 0.30)',
      latar: 'rgba(185, 28, 28, 0.07)',
      teks: '#991b1b',
    },
  } as const

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Vote className="size-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-sm font-semibold text-foreground">Bilik Voting</h1>
              <p className="truncate text-[11px] text-muted-foreground">
                Pemilihan Ketua OSIS
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
              <span className="size-1.5 rounded-full bg-foreground/60" aria-hidden="true" />
              Siap
            </span>
            {isFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                title="Keluar layar penuh (Esc)"
                className="inline-flex size-11 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Minimize className="size-4" />
                <span className="sr-only">Keluar layar penuh</span>
              </button>
            )}
          </div>
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
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ScanLine className="size-4 shrink-0 text-foreground" aria-hidden="true" />
                    <h2 className="text-sm font-semibold text-foreground">{BANTUAN.scan.judul}</h2>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {BANTUAN.scan.isi}
                  </p>
                </div>
                <StepTag>1. Pindai</StepTag>
              </div>

              <div className="px-3 py-4 sm:px-4">
                <div ref={camWrapRef} className="space-y-3">
                  <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-md bg-foreground/95">
                    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
                      <span className="absolute left-3 top-3 size-6 rounded-tl border-l-2 border-t-2 border-background/80" />
                      <span className="absolute right-3 top-3 size-6 rounded-tr border-r-2 border-t-2 border-background/80" />
                      <span className="absolute bottom-3 left-3 size-6 rounded-bl border-b-2 border-l-2 border-background/80" />
                      <span className="absolute bottom-3 right-3 size-6 rounded-br border-b-2 border-r-2 border-background/80" />
                    </div>
                    <div
                      id="kiosk-qr-reader"
                      className="mx-auto w-full [&_video]:block [&_video]:w-full"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <ToolButton
                      onClick={toggleFullscreen}
                      icon={isFullscreen ? <Minimize /> : <Maximize />}
                      title="Layar penuh untuk semua langkah"
                    >
                      {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                    </ToolButton>
                  </div>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Camera className="size-3.5" aria-hidden="true" />
                    Kamera belakang aktif
                  </p>
                </div>

                {isAuthenticating && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    Memeriksa kartu
                  </div>
                )}

                {scanError && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5">
                    <TriangleAlert
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                      aria-hidden="true"
                    />
                    <p className="text-xs leading-relaxed text-foreground sm:text-sm">{scanError}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
                Satu pemilih satu suara. Panitia memeriksa identitas sebelum memulai.
              </div>
            </Panel>
          </div>
        )}

        {/* ================= STEP: CONFIRM ================= */}
        {step === 'confirm' && siswa && (
          <Panel className="mx-auto w-full max-w-lg border-2">
            {/* Motif identitas: bar dua warna = dua kategori pemilihan (hijau Mitra
                Tama, merah Mitra Muda), warna yang sama dengan kartu kandidat di
                langkah berikut. Dulu kartu ini hitam-putih polos sehingga tidak ada
                bahasa warna yang menghubungkannya dengan langkah memilih. */}
            <div aria-hidden="true" className="flex h-1.5 w-full">
              <div className="w-1/2" style={{ backgroundColor: WARNA.mitratama.garis }} />
              <div className="w-1/2" style={{ backgroundColor: WARNA.mitramuda.garis }} />
            </div>

            {/* Bagian identitas memakai latar hijau, warna langkah terverifikasi;
                lencana dan label memiliki makna warna yang sama dari awal sampai
                akhir alur (terverifikasi = hijau, waspada = amber). Kontras
                terukur: teks hijau 7:1, teks amber 7,7:1 di atas latarnya sendiri. */}
            <div
              className="px-4 pb-4 pt-5 text-center sm:px-6 sm:pt-6"
              style={{ backgroundColor: WARNA.mitratama.latar }}
            >
              <div
                className="mx-auto flex size-14 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: WARNA.mitratama.garis }}
              >
                <CheckCircle className="size-7" aria-hidden="true" />
              </div>
              <p
                className="mt-3 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: WARNA.mitratama.teks }}
              >
                Pemilih Terverifikasi
              </p>
              <h2 className="mt-1.5 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                {siswa.namaLengkap}
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {BANTUAN.confirm.judul}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                {siswa.type === 'siswa' ? (
                  <span className="rounded-md border border-border bg-background px-3 py-1 font-mono text-sm font-bold text-foreground">
                    NIS {siswa.nis}
                  </span>
                ) : (
                  <span className="rounded-md border border-border bg-background px-3 py-1 text-sm font-bold text-foreground">
                    {siswa.type === 'guru' ? 'Guru' : 'Tenaga Kependidikan'}
                  </span>
                )}
                <span className="rounded-md border border-border bg-background px-3 py-1 text-sm font-bold text-foreground">
                  {siswa.type === 'siswa' ? `Kelas ${siswa.kelas}` : siswa.kelas}
                </span>
              </div>
            </div>

            <div className="px-4 py-5 sm:px-6">
              {/* Kotak peringatan pakai warna amber, bukan abu-abu; isinya
                  memang peringatan, jadi harus terlihat layaknya tanda "berhati-hati". */}
              <div
                className="flex items-start gap-2 rounded-md border px-3 py-2.5 text-left"
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.10)',
                  borderColor: 'rgba(217, 119, 6, 0.45)',
                }}
              >
                <TriangleAlert
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: '#92400e' }}
                  aria-hidden="true"
                />
                <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
                  {BANTUAN.confirm.isi}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
                {/* Tombol "Mulai Memilih" ikut warna hijau terverifikasi, bukan
                    hitam, supaya warnanya seturut dengan lencana terverifikasi. */}
                <button
                  type="button"
                  onClick={startVoting}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#15803d] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#14532d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-1"
                >
                  <Vote className="size-4" aria-hidden="true" />
                  Mulai Memilih
                </button>
                <button
                  type="button"
                  onClick={resetToScan}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-1"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Batal
                </button>
              </div>
            </div>
          </Panel>
        )}

        {/* ================= STEP: VOTING ================= */}
        {step === 'voting' && siswa && (
          <div className="space-y-4">
            {/* Identitas pemilih */}
            <div className="flex items-center justify-between gap-3 rounded-md border-2 border-primary bg-primary/5 px-3 py-2.5 shadow-sm">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground">
                  <User className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{siswa.namaLengkap}</p>
                  <p className="truncate text-[11px] font-medium text-muted-foreground">
                    {siswa.type === 'siswa'
                      ? `NIS ${siswa.nis} • Kelas ${siswa.kelas}`
                      : `${siswa.type === 'guru' ? 'Guru' : 'Tenaga Kependidikan'} • ${siswa.kelas}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetToScan}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border-2 border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Batal
              </button>
            </div>

            {isLoadingKandidat ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-md border border-border bg-card">
                <Spinner className="size-7" />
                <p className="text-xs text-muted-foreground">Memuat daftar kandidat</p>
              </div>
            ) : kandidat.length === 0 ? (
              /* R-27: state kosong yang menyebut sebab dan tindakan berikutnya */
              <div className="flex flex-col items-center gap-2 rounded-md border border-border bg-card px-4 py-10 text-center">
                <Users className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">Belum ada kandidat</p>
                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Data kandidat kosong atau gagal dimuat. Panggil panitia, jangan lanjutkan
                  pemilihan.
                </p>
                <button
                  type="button"
                  onClick={fetchKandidat}
                  className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Muat ulang
                </button>
              </div>
            ) : (
              <>
                {/* Panduan bahasa siswa untuk layar memilih: satu baris yang
                    menjawab "aku harus pilih berapa", bukan label prosedur. */}
                <div className="flex flex-col gap-1 rounded-md border border-border bg-card px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground">{BANTUAN.voting.judul}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{BANTUAN.voting.isi}</p>
                </div>

                {['mitratama', 'mitramuda'].map((roleType) => {
                  const list = kandidat.filter((k) => k.role === roleType)
                  const isMuda = roleType === 'mitramuda'
                  const label = isMuda ? 'Mitra Muda' : 'Mitra Tama'
                  const sub = isMuda ? 'Kelas X' : 'Kelas XI'
                  const selected = isMuda ? selectedMitraMuda : selectedMitraTama
                  if (list.length === 0) return null

                  return (
                    <section key={roleType} className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                        <span className="text-[11px] text-muted-foreground">{sub}</span>
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {selected ? 'Terpilih' : 'Pilih satu'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                        {list.map((k) => {
                          const isSelected = selected?.id === k.id
                          const warna = WARNA[roleType as 'mitratama' | 'mitramuda']
                          return (
                            <button
                              key={k.id}
                              type="button"
                              onClick={() => selectKandidat(k)}
                              aria-pressed={isSelected}
                              className={`group relative overflow-hidden rounded-md border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                isSelected
                                  ? ''
                                  : 'border-border bg-card hover:border-foreground/40'
                              }`}
                              style={
                                isSelected
                                  ? {
                                      borderColor: warna.garis,
                                      backgroundColor: warna.latar,
                                      // Cincin digambar dengan box-shadow, bukan
                                      // kelas `ring-*`: warna ring bawaan Tailwind
                                      // tidak bisa diganti per-kategori lewat
                                      // kelas dinamis tanpa membuat kelas baru.
                                      boxShadow: `0 0 0 4px ${warna.cahaya}`,
                                    }
                                  : undefined
                              }
                            >
                              <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                                {k.fotoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={k.fotoUrl}
                                    alt={k.namaCalon}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <div className="flex size-full items-center justify-center">
                                    <User className="size-10 text-muted-foreground" aria-hidden="true" />
                                  </div>
                                )}

                                <span
                                  className="absolute left-2 top-2 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white shadow-sm"
                                  style={{ backgroundColor: '#f59e0b' }}
                                >
                                  {String(k.nomorUrut).padStart(2, '0')}
                                </span>

                                {isSelected && (
                                  <span
                                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-white shadow-sm"
                                    style={{ backgroundColor: warna.garis }}
                                  >
                                    <CheckCircle className="size-4" aria-hidden="true" />
                                  </span>
                                )}
                              </div>

                              <div className="border-t border-border bg-card px-2 py-2">
                                <p
                                  className="line-clamp-2 text-center text-sm font-bold leading-snug sm:text-base"
                                  style={isSelected ? { color: warna.teks } : undefined}
                                >
                                  {k.namaCalon}
                                </p>
                                {isSelected && (
                                  <p
                                    className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-wide"
                                    style={{ color: warna.teks }}
                                  >
                                    ✓ Terpilih
                                  </p>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}

                {voteError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                    <p className="text-xs text-foreground sm:text-sm">{voteError}</p>
                  </div>
                )}

                <div className="sticky bottom-0 z-10 -mx-3 border-t-2 border-border bg-background px-3 py-3 sm:mx-0 sm:rounded-md sm:border-2">
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <div
                      className={`rounded-md border-2 px-2.5 py-1.5 ${
                        selectedMitraTama ? '' : 'border-border bg-card'
                      }`}
                      style={
                        selectedMitraTama
                          ? {
                              borderColor: WARNA.mitratama.garis,
                              backgroundColor: WARNA.mitratama.latar,
                            }
                          : undefined
                      }
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mitra Tama</p>
                      <p
                        className="truncate text-xs font-semibold sm:text-sm"
                        style={
                          selectedMitraTama
                            ? { color: WARNA.mitratama.teks }
                            : { color: 'var(--muted-foreground)' }
                        }
                      >
                        {selectedMitraTama ? selectedMitraTama.namaCalon : 'Belum dipilih'}
                      </p>
                    </div>
                    <div
                      className={`rounded-md border-2 px-2.5 py-1.5 ${
                        selectedMitraMuda ? '' : 'border-border bg-card'
                      }`}
                      style={
                        selectedMitraMuda
                          ? {
                              borderColor: WARNA.mitramuda.garis,
                              backgroundColor: WARNA.mitramuda.latar,
                            }
                          : undefined
                      }
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mitra Muda</p>
                      <p
                        className="truncate text-xs font-semibold sm:text-sm"
                        style={
                          selectedMitraMuda
                            ? { color: WARNA.mitramuda.teks }
                            : { color: 'var(--muted-foreground)' }
                        }
                      >
                        {selectedMitraMuda ? selectedMitraMuda.namaCalon : 'Belum dipilih'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBukaRangkuman(true)}
                    disabled={!canSubmit || isVoting}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Lock className="size-4" aria-hidden="true" />
                    Konfirmasi dan Simpan Suara
                  </button>
                  <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                    Suara tidak dapat diubah setelah disimpan.
                  </p>
                </div>
              </>
            )}

            {/* Dialog konfirmasi terakhir: rangkuman pilihan sebelum dikirim.
                Suara baru masuk setelah tombol "Ya, Kirim Suara" ditekan, jadi
                salah ketuk di daftar kandidat masih bisa diperbaiki. */}
            <Dialog open={bukaRangkuman} onOpenChange={(o) => { if (!isVoting) setBukaRangkuman(o) }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Pastikan pilihanmu</DialogTitle>
                  <DialogDescription>
                    Ini dua nama yang akan merekam suaramu. Periksa sekali lagi:
                    setelah dikirim, suara tidak bisa diubah.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                  {[
                    { label: 'Mitra Tama', pilih: selectedMitraTama, warna: WARNA.mitratama },
                    { label: 'Mitra Muda', pilih: selectedMitraMuda, warna: WARNA.mitramuda },
                  ].map(({ label, pilih, warna }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-md border-2 px-3 py-2"
                      style={{
                        borderColor: pilih ? warna.garis : undefined,
                        backgroundColor: pilih ? warna.latar : undefined,
                      }}
                    >
                      {pilih?.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pilih.fotoUrl}
                          alt=""
                          aria-hidden="true"
                          className="size-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: warna.garis }}
                          aria-hidden="true"
                        >
                          <User className="size-4" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {label} · No. {String(pilih?.nomorUrut ?? 0).padStart(2, '0')}
                        </p>
                        <p
                          className="truncate text-sm font-bold"
                          style={pilih ? { color: warna.teks } : undefined}
                        >
                          {pilih?.namaCalon || 'Belum dipilih'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setBukaRangkuman(false)}
                    disabled={isVoting}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
                  >
                    Batal, mau ubah
                  </button>
                  <button
                    type="button"
                    onClick={submitVote}
                    disabled={isVoting}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:w-auto"
                  >
                    {isVoting ? (
                      <>
                        <Spinner className="size-4" /> Mengirim suara
                      </>
                    ) : (
                      <>
                        <Send className="size-4" /> Ya, Kirim Suara
                      </>
                    )}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ================= STEP: DONE ================= */}
        {step === 'done' && (
          <Panel className="mx-auto w-full max-w-md text-center">
            <div className="px-5 py-7">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground">
                <CheckCircle className="size-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">Suara Tersimpan</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {BANTUAN.done.isi}
              </p>

              <div className="mt-4 rounded-md border border-border px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Kembali ke kamera dalam{' '}
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {countdown}
                  </span>{' '}
                  detik
                </p>
                <div
                  className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={AUTOCLOSE_SECONDS}
                  aria-valuenow={Math.max(0, AUTOCLOSE_SECONDS - countdown)}
                >
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-1000 ease-linear"
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
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Pindai Pemilih Berikutnya
              </button>
            </div>
          </Panel>
        )}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-3 pb-6 pt-2 sm:px-4">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Satu pemilih satu suara
          </span>
          <span aria-hidden="true">/</span>
          <span>E-Voting OSIS SMAN 1 Bantarujeg</span>
        </p>
      </footer>
    </div>
  )
}
