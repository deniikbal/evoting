'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { StatCard, StatCardGrid } from '@/components/admin/stat-card'
import { DataTableToolbar } from '@/components/admin/data-table-toolbar'
import {
  BarChart3, RefreshCw, Trophy, Users, UserCheck, UserX, Percent,
  Trash2, Sparkles, TriangleAlert,
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

        // Access Control: Admin can only view results when voting is NOT active
        // SuperAdmin can always view results
        // But we don't redirect - just show notice instead
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetVoting = async () => {
    if (resetPassword !== 'smansaba') {
      toast.error('Password salah!')
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch('/api/admin/hasil/reset', {
        method: 'POST',
      })

      if (response.ok) {
        setShowResetDialog(false)
        setResetPassword('')
        fetchDataWithRole(adminRole)
        toast.success('Semua hasil voting berhasil dihapus!')
      } else {
        toast.error('Gagal menghapus hasil voting')
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

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <StatCardGrid>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </StatCardGrid>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Voting Active Notice - Show only if voting active AND user is NOT superadmin */}
      {statistik.votingAktif && adminRole !== 'superadmin' ? (
        <>
          {/* Statistik tetap tampil */}
          <StatCardGrid>
            <StatCard title="Total Suara" value={statistik.sudahMemilih} description="Suara masuk" icon={BarChart3} className="border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 dark:border-sky-900" />
            <StatCard title="Sudah Memilih" value={statistik.sudahMemilih} description={`dari ${statistik.totalVoters} pemilih`} icon={UserCheck} className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-emerald-900" />
            <StatCard title="Belum Memilih" value={statistik.belumMemilih} description="Pemilih tersisa" icon={UserX} className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-900" />
            <StatCard title="Partisipasi" value={`${persentasePartisipasi}%`} description="Tingkat partisipasi" icon={Percent} className="border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 dark:border-violet-900" />
          </StatCardGrid>

          <Card className="border-sky-200 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 dark:from-sky-950/40 dark:via-cyan-950/40 dark:to-blue-950/40 dark:border-sky-900">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex size-20 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 shadow-lg">
                <Sparkles className="size-10 text-white" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-sky-900 dark:text-sky-100">Voting Sedang Berlangsung</h2>
              <p className="mx-auto mb-6 max-w-md text-sky-700 dark:text-sky-300">
                Hasil voting akan ditampilkan setelah voting selesai
              </p>
              <div className="inline-flex items-center gap-3 rounded-full border border-sky-200 bg-white/70 px-6 py-3 backdrop-blur dark:border-sky-800 dark:bg-sky-950/40">
                <Users className="size-5 text-sky-600 dark:text-sky-400" />
                <span className="font-semibold text-sky-900 dark:text-sky-100">
                  {statistik.sudahMemilih} dari {statistik.totalVoters} pemilih sudah memilih
                </span>
              </div>
              <p className="mt-4 text-sm text-sky-600 dark:text-sky-400">
                Nonaktifkan voting untuk melihat hasil lengkap
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Statistik Cards */}
          <StatCardGrid>
            <StatCard title="Total Suara" value={totalSuara} description="Suara masuk" icon={BarChart3} className="border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 dark:border-sky-900" />
            <StatCard title="Sudah Memilih" value={statistik.sudahMemilih} description={`dari ${statistik.totalVoters} pemilih`} icon={UserCheck} className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-emerald-900" />
            <StatCard title="Belum Memilih" value={statistik.belumMemilih} description="Pemilih tersisa" icon={UserX} className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-900" />
            <StatCard title="Partisipasi" value={`${persentasePartisipasi}%`} description="Tingkat partisipasi" icon={Percent} className="border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 dark:border-violet-900" />
          </StatCardGrid>

          {/* Winner Announcement - 2 Columns */}
          {sortedKandidat.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {['mitratama', 'mitramuda'].map((roleType) => {
                const roleWinner = sortedKandidat.find(k => k.role === roleType)
                const roleLabel = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'
                const isMuda = roleType === 'mitramuda'

                return (
                  <Card
                    key={roleType}
                    className={
                      isMuda
                        ? 'border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-100 shadow-lg dark:from-cyan-950/40 dark:via-sky-950/40 dark:to-blue-950/40 dark:border-cyan-900'
                        : 'border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-pink-50 to-purple-100 shadow-lg dark:from-fuchsia-950/40 dark:via-pink-950/40 dark:to-purple-950/40 dark:border-fuchsia-900'
                    }
                  >
                    <CardContent className="py-8 text-center">
                      <Badge
                        variant="outline"
                        className={
                          isMuda
                            ? 'mb-4 border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-100 dark:border-cyan-700'
                            : 'mb-4 border-fuchsia-300 bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-800 dark:bg-fuchsia-900/60 dark:text-fuchsia-100 dark:border-fuchsia-700'
                        }
                      >
                        {roleLabel}
                      </Badge>
                      <div
                        className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br shadow-lg ${
                          isMuda ? 'from-cyan-400 to-blue-500' : 'from-fuchsia-400 to-pink-500'
                        }`}
                      >
                        <Trophy className="size-8 text-white" />
                      </div>
                      {roleWinner && roleWinner.jumlahSuara > 0 ? (
                        <>
                          <h2 className={`mb-3 text-lg font-bold ${isMuda ? 'text-cyan-900 dark:text-cyan-100' : 'text-fuchsia-900 dark:text-fuchsia-100'}`}>
                            🏆 Pemenang 🏆
                          </h2>
                          <Badge
                            className={
                              isMuda
                                ? 'mb-3 bg-cyan-200 text-cyan-900 dark:bg-cyan-800 dark:text-cyan-50'
                                : 'mb-3 bg-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-800 dark:text-fuchsia-50'
                            }
                          >
                            No. {roleWinner.nomorUrut}
                          </Badge>
                          <h3 className={`mb-3 text-xl font-bold ${isMuda ? 'text-cyan-900 dark:text-cyan-100' : 'text-fuchsia-900 dark:text-fuchsia-100'}`}>
                            {roleWinner.namaCalon}
                          </h3>
                          <div
                            className={`inline-flex items-baseline gap-2 rounded-full bg-gradient-to-r px-4 py-2 shadow-md ${
                              isMuda ? 'from-cyan-500 to-blue-600' : 'from-fuchsia-500 to-pink-600'
                            }`}
                          >
                            <span className="text-2xl font-bold text-white">{roleWinner.jumlahSuara}</span>
                            <span className="text-sm text-white/90">suara</span>
                            <span className="text-xs text-white/80">
                              ({totalSuara > 0 ? Math.round((roleWinner.jumlahSuara / totalSuara) * 100) : 0}%)
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className={`py-6 ${isMuda ? 'text-cyan-600 dark:text-cyan-400' : 'text-fuchsia-600 dark:text-fuchsia-400'}`}>
                          <p className="font-semibold">Belum ada data</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Results Table */}
          <Card>
            <DataTableToolbar
              title="Perolehan Suara Detail"
              icon={BarChart3}
              description="Hasil lengkap pemilihan Ketua OSIS"
              actions={
                <>
                  <Button variant="outline" size="sm" onClick={() => fetchDataWithRole(adminRole)}>
                    <RefreshCw />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={openResetDialog}
                  >
                    <Trash2 />
                    Reset
                  </Button>
                </>
              }
            />
            <CardContent>
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
                    const roleLabel = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'
                    const isMuda = roleType === 'mitramuda'

                    if (roleKandidat.length === 0) return null

                    return (
                      <div key={roleType}>
                        <div className="mb-6 flex items-center gap-4">
                          <Badge
                            className={
                              isMuda
                                ? 'border-cyan-300 bg-cyan-100 px-4 py-1.5 text-sm font-bold text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-100 dark:border-cyan-700'
                                : 'border-fuchsia-300 bg-fuchsia-100 px-4 py-1.5 text-sm font-bold text-fuchsia-800 dark:bg-fuchsia-900/60 dark:text-fuchsia-100 dark:border-fuchsia-700'
                            }
                            variant="outline"
                          >
                            {roleLabel}
                          </Badge>
                          <span
                            className={`h-0.5 flex-1 bg-gradient-to-r ${
                              isMuda ? 'from-cyan-300 to-transparent' : 'from-fuchsia-300 to-transparent'
                            }`}
                          />
                        </div>
                        <div className="space-y-4">
                          {roleKandidat.map((k, index) => {
                            const persentase = totalSuara > 0 ? Math.round((k.jumlahSuara / totalSuara) * 100) : 0
                            const isWinner = index === 0 && k.jumlahSuara > 0

                            return (
                              <div
                                key={k.id}
                                className={`rounded-xl border-2 p-4 transition-all ${
                                  isWinner
                                    ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-md dark:from-amber-950/40 dark:to-yellow-950/40 dark:border-amber-800'
                                    : 'border-border bg-card hover:shadow-sm'
                                }`}
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div
                                      className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ${
                                        isWinner
                                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md'
                                          : isMuda
                                            ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200'
                                            : 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/60 dark:text-fuchsia-200'
                                      }`}
                                    >
                                      {isWinner ? <Trophy className="size-5" /> : index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">No. {k.nomorUrut}</Badge>
                                        {isWinner && (
                                          <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-xs text-white">
                                            Pemenang
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="block truncate font-semibold">{k.namaCalon}</span>
                                    </div>
                                  </div>
                                  <div className="ml-4 text-right">
                                    <div className={`text-2xl font-bold ${isWinner ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                      {k.jumlahSuara}
                                    </div>
                                    <div className="text-xs text-muted-foreground">suara</div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Persentase</span>
                                    <span className={`font-semibold ${isWinner ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                      {persentase}%
                                    </span>
                                  </div>
                                  <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                                        isWinner
                                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                          : isMuda
                                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                                            : 'bg-gradient-to-r from-fuchsia-400 to-pink-500'
                                      }`}
                                      style={{ width: `${persentase}%` }}
                                    />
                                  </div>
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
        </>
      )}

      {/* Reset Voting Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="size-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl">Reset Semua Hasil Voting</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus semua hasil voting dan mengatur ulang status voting semua siswa.
              <span className="mt-2 block font-semibold text-destructive">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reset-password">
              Masukkan password untuk konfirmasi:
            </Label>
            <Input
              id="reset-password"
              type="password"
              placeholder="Masukkan password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isResetting) {
                  handleResetVoting()
                }
              }}
              className="h-10"
            />
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
                <>
                  <Trash2 />
                  Ya, Reset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
