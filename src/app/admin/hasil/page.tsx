'use client'

/*
 * Design Read: panel admin "hasil voting" untuk panitia OSIS, gaya bersih
 * hangat identitas e-voting, dial ENERGY 2 / RHYTHM 2 / MOTION 1.
 *
 * Palet (semua berpangkat makna, konsisten dengan /vote dan /kehadiran):
 * - hijau #15803d : Mitra Tama (kategori kelas XI)
 * - merah #b91c1c : Mitra Muda (kategori kelas X)
 * - amber         : penanda "Terbanyak" (kandidat teratas tiap kategori)
 * - netral slate  : "belum memilih", teks pendukung
 * - biru #1e3a8a  : hanya untuk aksi (identitas aplikasi)
 *
 * Alasan keputusan utama (R-31):
 * - Strip statistik 3 ubin + bar proporsi, bukan 4 kartu gradien: dua kartu
 *   lama menampilkan angka yang sama persis ("Total Suara" = "Sudah
 *   Memilih") dan gradien warna tidak membawa makna. Bar proporsi yang sama
 *   dengan halaman /kehadiran menjadi motif identitas aplikasi.
 * - Kartu "Pemenang" dihapus: datanya duplikat persis baris pertama tiap
 *   kategori; pemimpin per kategori ditandai lencana "Terbanyak".
 * - Warna lencana kategori mengikuti kartu kandidat di /vote, bukan
 *   fuchsia/cyan yang tidak punya arti.
 * - MOTION 1: hanya hover/fokus, tidak ada animate-pulse (R-19).
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart3, RefreshCw, TriangleAlert, Eye, EyeOff,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Admin {
  id: number
  username: string
  role?: 'admin' | 'superadmin'
}

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  visi: string
  misi: string
  fotoUrl?: string
  jumlahSuara: number
  role: string
}

interface Statistik {
  totalVoters: number
  totalSiswa: number
  siswaMemilih: number
  siswaBelumMemilih: number
  totalPegawai: number
  pegawaiMemilih: number
  pegawaiBelumMemilih: number
  sudahMemilih: number
  belumMemilih: number
  votingAktif: boolean
}

const infoKategori = {
  mitratama: {
    label: 'Mitra Tama (Kelas XI)',
    chip: 'bg-green-100 text-green-800 border-green-200',
    bar: 'bg-green-600',
    angka: 'text-green-800',
  },
  mitramuda: {
    label: 'Mitra Muda (Kelas X)',
    chip: 'bg-red-100 text-red-800 border-red-200',
    bar: 'bg-red-600',
    angka: 'text-red-800',
  },
} as const

export default function HasilVotingPage() {
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [statistik, setStatistik] = useState<Statistik>({
    totalVoters: 0,
    totalSiswa: 0,
    siswaMemilih: 0,
    siswaBelumMemilih: 0,
    totalPegawai: 0,
    pegawaiMemilih: 0,
    pegawaiBelumMemilih: 0,
    sudahMemilih: 0,
    belumMemilih: 0,
    votingAktif: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [adminRole, setAdminRole] = useState<string>('')
  // Tampil/simpan password di dialog reset
  const [tampilPassword, setTampilPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Sesi admin dibaca dari cookie httpOnly lewat endpoint server; nilai di
    // localStorage tidak lagi menjadi dasar hak akses.
    const muatSesi = async () => {
      try {
        const res = await fetch('/api/auth/admin/sesi')
        if (!res.ok) {
          router.push('/login/admin')
          return
        }
        const data = await res.json()
        setAdmin(data.admin)
        setAdminRole(data.admin?.role || 'admin')
        fetchDataWithRole(data.admin?.role || 'admin')
      } catch {
        router.push('/login/admin')
      }
    }

    void muatSesi()
  }, [router])

  const fetchDataWithRole = async (userRole?: string) => {
    try {
      const [kandidatResponse, statistikResponse] = await Promise.all([
        fetch('/api/kandidat'),
        fetch('/api/admin/statistik')
      ])

      if (kandidatResponse.ok) {
        const kandidatData = await kandidatResponse.json()
        setKandidat(kandidatData)
      }

      if (statistikResponse.ok) {
        const statistikData = await statistikResponse.json()
        setStatistik(statistikData)
      }
    } catch (err) {
      toast.error('Gagal memuat data hasil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetVoting = async () => {
    if (!resetPassword) {
      toast.error('Password harus diisi')
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch('/api/admin/hasil/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      })

      const hasil = await response.json().catch(() => null)

      if (response.ok) {
        setShowResetDialog(false)
        setResetPassword('')
        fetchDataWithRole(adminRole)
        toast.success('Semua hasil voting berhasil dihapus!')
      } else {
        setShowResetDialog(true)
        toast.error(hasil?.message || 'Gagal menghapus hasil voting')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menghapus hasil voting')
    } finally {
      setIsResetting(false)
    }
  }

  const openResetDialog = () => {
    setResetPassword('')
    setShowResetDialog(true)
  }

  const totalSuara = statistik.sudahMemilih
  const sortedKandidat = useMemo(
    () => [...kandidat].sort((a, b) => b.jumlahSuara - a.jumlahSuara),
    [kandidat]
  )
  const persentasePartisipasi = statistik.totalVoters > 0
    ? Math.round((statistik.sudahMemilih / statistik.totalVoters) * 100)
    : 0
  const votingDitutupUntukAdmin = statistik.votingAktif && adminRole !== 'superadmin'

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Kepala halaman + aksi */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Hasil Voting
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Perolehan suara kandidat ketua OSIS, diperbarui langsung dari mesin pemilih.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            onClick={() => fetchDataWithRole(adminRole)}
          >
            <RefreshCw className="size-3.5" /> Segarkan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-red-200 bg-white text-red-700 hover:bg-red-50"
            onClick={openResetDialog}
          >
            <TriangleAlert className="size-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Pemberitahuan saat voting masih berjalan (bukan superadmin) */}
      {votingDitutupUntukAdmin && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <BarChart3 className="size-4 flex-shrink-0 mt-0.5" />
          <p>
            Voting sedang berlangsung. Statistik pemilih tetap terpantau, sedangkan
            perolehan suara lengkap baru tampil setelah voting dinonaktifkan.
          </p>
        </div>
      )}

      {/* Strip statistik: 3 ubin + bar proporsi (motif identitas halaman kehadiran) */}
      <section aria-label="Ringkasan pemilih">
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <span className="block text-2xl font-bold text-blue-900 md:text-3xl">
              {totalSuara}
            </span>
            <span className="mt-0.5 block text-xs font-medium text-blue-700">
              Suara masuk
            </span>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <span className="block text-2xl font-bold text-green-800 md:text-3xl">
              {statistik.sudahMemilih}
            </span>
            <span className="mt-0.5 block text-xs font-medium text-green-700">
              Sudah memilih
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <span className="block text-2xl font-bold text-slate-700 md:text-3xl">
              {statistik.belumMemilih}
            </span>
            <span className="mt-0.5 block text-xs font-medium text-slate-500">
              Belum memilih
            </span>
          </div>
        </div>

        <div
          className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
          role="img"
          aria-label={`Partisipasi ${persentasePartisipasi} persen`}
        >
          <div
            className="bg-green-600"
            style={{ width: `${(statistik.sudahMemilih / Math.max(1, statistik.totalVoters)) * 100}%` }}
          />
          <div
            className="bg-slate-400"
            style={{ width: `${(statistik.belumMemilih / Math.max(1, statistik.totalVoters)) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {statistik.totalVoters} pemilih (siswa + pegawai) · partisipasi {persentasePartisipasi}%
        </p>
      </section>

      {/* Perolehan suara per kategori */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4 md:p-6">
          {kandidat.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3 />
                </EmptyMedia>
                <EmptyTitle>Belum ada data voting</EmptyTitle>
                <EmptyDescription>
                  Hasil perolehan suara akan muncul di sini setelah ada suara masuk.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-8">
              {['mitratama', 'mitramuda'].map((roleType) => {
                const roleKandidat = sortedKandidat.filter(k => k.role === roleType)
                const info = infoKategori[roleType as keyof typeof infoKategori]
                // Terbanyak = jumlah suara tertinggi di kategori (> 0)
                const terbanyak = roleKandidat.reduce((m, k) => Math.max(m, k.jumlahSuara), 0)

                if (roleKandidat.length === 0) return null

                return (
                  <div key={roleType}>
                    {/* Kepala kategori: lencana warna kategori + garis sambung */}
                    <div className="mb-4 flex items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${info.chip}`}>
                        {info.label}
                      </span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="space-y-3">
                      {roleKandidat.map((k, index) => {
                        const persentase = totalSuara > 0
                          ? Math.round((k.jumlahSuara / totalSuara) * 100)
                          : 0
                        const isLeader = k.jumlahSuara > 0 && k.jumlahSuara === terbanyak

                        return (
                          <div
                            key={k.id}
                            className={`rounded-lg border p-3.5 ${
                              isLeader
                                ? 'border-amber-300 bg-amber-50/60'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex size-9 flex-shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                                  isLeader
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="truncate font-semibold text-slate-900">
                                    {k.namaCalon}
                                  </span>
                                  {isLeader && (
                                    <span className="rounded-full bg-amber-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                                      Terbanyak
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400">
                                  Nomor urut {k.nomorUrut}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`block text-xl font-bold ${isLeader ? info.angka : 'text-slate-900'}`}>
                                  {k.jumlahSuara}
                                </span>
                                <span className="block text-xs text-slate-400">
                                  {persentase}% suara
                                </span>
                              </div>
                            </div>
                            {/* Bar suara: warna solid kategori, bukan gradien */}
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${info.bar}`}
                                style={{ width: `${persentase}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog reset: konfirmasi destruktif, tanpa emoji */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Reset Semua Hasil Voting</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus semua hasil voting dan mengatur ulang status
              pemilih semua siswa dan pegawai.
              <span className="mt-2 block font-semibold text-destructive">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reset-password">
              Password login superadmin Anda:
            </Label>
            <div className="relative">
              <Input
                id="reset-password"
                type={tampilPassword ? 'text' : 'password'}
                placeholder="Password login akun ini"
                autoComplete="current-password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isResetting) {
                    handleResetVoting()
                  }
                }}
                className="h-10 pr-10"
              />
              {/* Tombol tampil/simpan password: target 44px termasuk area sentuh */}
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
              Password diverifikasi di server; password yang salah tidak akan
              menghapus apa pun.
            </p>
          </div>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={isResetting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetVoting}
              disabled={isResetting || !resetPassword}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Ya, Reset'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
