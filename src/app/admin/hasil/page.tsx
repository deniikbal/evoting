'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
    // Check admin session
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }

    const session = JSON.parse(sessionData)
    setAdmin(session)
    setAdminRole(session.role || 'admin')

    // Check if admin is regular admin (not superadmin)
    // If voting is active, redirect regular admin to dashboard
    fetchDataWithRole(session.role)
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
            <StatCard title="Total Suara" value={statistik.sudahMemilih} description="Suara masuk" icon={BarChart3} />
            <StatCard title="Sudah Memilih" value={statistik.sudahMemilih} description={`dari ${statistik.totalVoters} pemilih`} icon={UserCheck} />
            <StatCard title="Belum Memilih" value={statistik.belumMemilih} description="Pemilih tersisa" icon={UserX} />
            <StatCard title="Partisipasi" value={`${persentasePartisipasi}%`} description="Tingkat partisipasi" icon={Percent} />
          </StatCardGrid>

          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
                <Sparkles className="size-10 text-muted-foreground" />
              </div>
              <h2 className="mb-3 text-2xl font-bold">Voting Sedang Berlangsung</h2>
              <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                Hasil voting akan ditampilkan setelah voting selesai
              </p>
              <div className="inline-flex items-center gap-3 rounded-full border bg-muted/50 px-6 py-3">
                <Users className="size-5 text-muted-foreground" />
                <span className="font-semibold">
                  {statistik.sudahMemilih} dari {statistik.totalVoters} pemilih sudah memilih
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Nonaktifkan voting untuk melihat hasil lengkap
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Statistik Cards */}
          <StatCardGrid>
            <StatCard title="Total Suara" value={totalSuara} description="Suara masuk" icon={BarChart3} />
            <StatCard title="Sudah Memilih" value={statistik.sudahMemilih} description={`dari ${statistik.totalVoters} pemilih`} icon={UserCheck} />
            <StatCard title="Belum Memilih" value={statistik.belumMemilih} description="Pemilih tersisa" icon={UserX} />
            <StatCard title="Partisipasi" value={`${persentasePartisipasi}%`} description="Tingkat partisipasi" icon={Percent} />
          </StatCardGrid>

          {/* Winner Announcement - 2 Columns */}
          {sortedKandidat.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {['mitratama', 'mitramuda'].map((roleType) => {
                const roleWinner = sortedKandidat.find(k => k.role === roleType)
                const roleLabel = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'

                return (
                  <Card key={roleType}>
                    <CardContent className="py-8 text-center">
                      <Badge variant="outline" className="mb-4 px-3 py-1 text-xs font-bold">
                        {roleLabel}
                      </Badge>
                      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                        <Trophy className="size-8 text-primary" />
                      </div>
                      {roleWinner && roleWinner.jumlahSuara > 0 ? (
                        <>
                          <h2 className="mb-3 text-lg font-bold">🏆 Pemenang 🏆</h2>
                          <Badge variant="secondary" className="mb-3">
                            No. {roleWinner.nomorUrut}
                          </Badge>
                          <h3 className="mb-3 text-xl font-bold">{roleWinner.namaCalon}</h3>
                          <div className="inline-flex items-baseline gap-2 rounded-full border bg-muted/50 px-4 py-2">
                            <span className="text-2xl font-bold">{roleWinner.jumlahSuara}</span>
                            <span className="text-sm text-muted-foreground">suara</span>
                            <span className="text-xs text-muted-foreground">
                              ({totalSuara > 0 ? Math.round((roleWinner.jumlahSuara / totalSuara) * 100) : 0}%)
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="py-6 text-muted-foreground">
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

                    if (roleKandidat.length === 0) return null

                    return (
                      <div key={roleType}>
                        <div className="mb-6 flex items-center gap-4">
                          <Badge variant="outline" className="px-4 py-1.5 text-sm font-bold">
                            {roleLabel}
                          </Badge>
                          <Separator className="flex-1" />
                        </div>
                        <div className="space-y-4">
                          {roleKandidat.map((k, index) => {
                            const persentase = totalSuara > 0 ? Math.round((k.jumlahSuara / totalSuara) * 100) : 0
                            const isWinner = index === 0 && k.jumlahSuara > 0

                            return (
                              <div
                                key={k.id}
                                className={`rounded-xl border p-4 transition-all ${
                                  isWinner ? 'border-primary/40 bg-primary/5 shadow-sm' : 'hover:shadow-sm'
                                }`}
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ${
                                      isWinner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}>
                                      {isWinner ? <Trophy className="size-5" /> : index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">No. {k.nomorUrut}</Badge>
                                        {isWinner && (
                                          <Badge className="text-xs">Pemenang</Badge>
                                        )}
                                      </div>
                                      <span className="block truncate font-semibold">{k.namaCalon}</span>
                                    </div>
                                  </div>
                                  <div className="ml-4 text-right">
                                    <div className="text-2xl font-bold">{k.jumlahSuara}</div>
                                    <div className="text-xs text-muted-foreground">suara</div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Persentase</span>
                                    <span className={`font-semibold ${isWinner ? 'text-primary' : ''}`}>{persentase}%</span>
                                  </div>
                                  <Progress value={persentase} className="h-3" />
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
