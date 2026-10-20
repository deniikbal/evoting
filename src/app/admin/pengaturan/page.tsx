'use client'

/*
 * Design Read: konfigurasi pemilihan untuk panitia OSIS, gaya bersih hangat
 * identitas e-voting, dial ENERGY 1 / RHYTHM 1 / MOTION 1.
 *
 * Palet berpangkat makna (konsisten antar halaman):
 * - hijau : status "Aktif" (voting jalan, pantauan "sudah memilih" juga hijau)
 * - merah : tindakan menghentikan voting (efek tentsif)
 * - biru  : tombol memulai + aksi simpan/refresh (identitas aplikasi)
 * - netral slate: status non-aktif, teks pendukung
 *
 * Keputusan utama (R-31):
 * - Panel status terpisah dari form waktu: status adalah keputusan sensitif
 *   (butuh password), waktu hanya pelengkap; jadi tidak digabung satu kotak.
 * - MOTION 1: hanya hover/fokus, tanpa animasi loop.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Eye, EyeOff, Play, Square, RefreshCw, Save, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ambilSesiAdmin } from '@/lib/sesi-klien'

interface Admin {
  id: number
  username: string
}

interface Pengaturan {
  voting_aktif: string
  waktu_mulai_voting: string
  waktu_selesai_voting: string
}

export default function PengaturanPage() {
  const [pengaturan, setPengaturan] = useState<Pengaturan>({
    voting_aktif: 'false',
    waktu_mulai_voting: '',
    waktu_selesai_voting: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [votingAction, setVotingAction] = useState<'start' | 'stop'>('start')
  const [isToggling, setIsToggling] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tampilPassword, setTampilPassword] = useState(false)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Sesi admin diverifikasi server lewat cookie httpOnly. Nilai di
    // localStorage hanya untuk tampilan, bukan penentu hak akses.
    const muatSesi = async () => {
      const sesi = await ambilSesiAdmin()
      if (!sesi) {
        router.push('/login/admin')
        return
      }
      setAdmin(sesi)
      fetchPengaturan()
    }

    void muatSesi()
  }, [router])

  const fetchPengaturan = async () => {
    try {
      const response = await fetch('/api/admin/pengaturan')
      if (response.ok) {
        const data = await response.json()
        setPengaturan(data)
      } else {
        toast.error('Gagal memuat pengaturan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat memuat pengaturan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/pengaturan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pengaturan),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Pengaturan berhasil disimpan')
      } else {
        toast.error(data.message || 'Gagal menyimpan pengaturan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  const openConfirmDialog = (action: 'start' | 'stop') => {
    setVotingAction(action)
    setConfirmPassword('')
    setShowConfirmDialog(true)
  }

  const handleConfirmToggle = async () => {
    const newStatus = votingAction === 'start' ? 'true' : 'false'
    setIsToggling(true)

    try {
      // Kata sandi diverifikasi di server, bukan dicocokkan di peramban.
      // Sebelumnya nilainya ditulis apa adanya di kode klien.
      const konfirmasi = await fetch('/api/auth/admin/konfirmasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kataSandi: confirmPassword }),
      })

      if (!konfirmasi.ok) {
        const pesan = await konfirmasi.json().catch(() => ({}))
        toast.error(pesan.message || 'Password salah!')
        setIsToggling(false)
        return
      }

      const response = await fetch('/api/admin/pengaturan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pengaturan,
          voting_aktif: newStatus
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPengaturan(prev => ({ ...prev, voting_aktif: newStatus }))
        toast.success(`Voting berhasil ${votingAction === 'start' ? 'dimulai' : 'dihentikan'}`)
        setShowConfirmDialog(false)
        setConfirmPassword('')
      } else {
        toast.error(data.message || 'Gagal mengubah status voting')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsToggling(false)
    }
  }

  const votingAktif = pengaturan.voting_aktif === 'true'

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Kepala halaman */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          Pengaturan
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Status dan waktu pemilihan. Perubahan langsung memengaruhi mesin pemilih.
        </p>
      </div>

      {/* Status voting: dipisah dari form, aksinya perlu password */}
      <section
        aria-label="Status voting"
        className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <span
            className={`size-3 flex-shrink-0 rounded-full ${
              votingAktif ? 'bg-green-600' : 'bg-slate-400'
            }`}
            aria-hidden
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">Voting</p>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                  votingAktif
                    ? 'border-green-200 bg-green-100 text-green-800'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                {votingAktif ? 'Aktif' : 'Non-aktif'}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {votingAktif
                ? 'Siswa dan pegawai sedang dapat memilih'
                : 'Mesin pemilih masih terkunci'}
            </p>
          </div>
        </div>
        {votingAktif ? (
          <Button
            type="button"
            onClick={() => openConfirmDialog('stop')}
            variant="outline"
            size="sm"
            className="h-10 w-full border-red-200 bg-white text-red-700 hover:bg-red-50 sm:w-auto"
          >
            <Square className="size-3.5" /> Hentikan voting
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => openConfirmDialog('start')}
            size="sm"
            className="h-10 w-full bg-[#1e3a8a] text-white hover:bg-[#172554] sm:w-auto"
          >
            <Play className="size-3.5" /> Mulai voting
          </Button>
        )}
      </section>

      {/* Waktu voting */}
      <form
        onSubmit={handleSave}
        className="rounded-lg border border-slate-200 bg-white"
      >
        <div className="p-4 md:p-6">
          <p className="font-semibold text-slate-900">Waktu rencana pemilihan</p>
          <p className="mt-0.5 text-sm text-slate-500">
            Dicatat sebagai jadwal pada daftar hadir; bukan kunci mesin. Perpindahan
            status tetap lewat tombol di atas.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="waktu_mulai" className="text-slate-700">Waktu mulai</Label>
              <Input
                id="waktu_mulai"
                type="datetime-local"
                className="h-11"
                value={pengaturan.waktu_mulai_voting}
                onChange={(e) => setPengaturan(prev => ({
                  ...prev,
                  waktu_mulai_voting: e.target.value
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="waktu_selesai" className="text-slate-700">Waktu selesai</Label>
              <Input
                id="waktu_selesai"
                type="datetime-local"
                className="h-11"
                value={pengaturan.waktu_selesai_voting}
                onChange={(e) => setPengaturan(prev => ({
                  ...prev,
                  waktu_selesai_voting: e.target.value
                }))}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row md:px-6">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-10 bg-[#1e3a8a] text-white hover:bg-[#172554]"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save className="size-4" /> Simpan waktu
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            onClick={fetchPengaturan}
          >
            <RefreshCw className="size-4" /> Segarkan
          </Button>
        </div>
      </form>

      {/* Dialog konfirmasi: password login diverifikasi di server */}
      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          setShowConfirmDialog(open)
          if (!open) setConfirmPassword('')
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {votingAction === 'start' ? 'Mulai Voting' : 'Hentikan Voting'}
            </DialogTitle>
            <DialogDescription>
              {votingAction === 'start'
                ? 'Voting akan dibuka: siswa dan pegawai langsung dapat memilih di mesin masing-masing.'
                : 'Voting akan ditutup: mesin pemilih berhenti menerima suara.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="confirm-password">Password login Anda:</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={tampilPassword ? 'text' : 'password'}
                placeholder="Password login akun ini"
                autoComplete="current-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isToggling) {
                    handleConfirmToggle()
                  }
                }}
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setTampilPassword((t) => !t)}
                aria-label={tampilPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={tampilPassword}
                className="absolute right-0 top-0 flex size-10 items-center justify-center rounded-md text-slate-500 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                {tampilPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Password diverifikasi di server; yang salah tidak mengubah apa pun.
            </p>
          </div>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false)
                setConfirmPassword('')
              }}
              disabled={isToggling}
            >
              Batal
            </Button>
            <Button
              variant={votingAction === 'start' ? 'default' : 'destructive'}
              onClick={handleConfirmToggle}
              disabled={isToggling || !confirmPassword}
              className={votingAction === 'start' ? 'bg-[#1e3a8a] hover:bg-[#172554]' : ''}
            >
              {isToggling ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Memproses...
                </>
              ) : votingAction === 'start' ? (
                <>
                  <Play className="size-4" /> Ya, Mulai
                </>
              ) : (
                <>
                  <Square className="size-4" /> Ya, Hentikan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
