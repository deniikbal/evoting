'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  BarChart3, RefreshCw, Trophy, Users, 
  CheckCircle, TrendingUp, Trash2, AlertTriangle, Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import DashboardHeader from '@/components/admin/DashboardHeader'

interface Admin {
  id: number
  username: string
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
    fetchData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

  const fetchData = async () => {
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
        fetchData()
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
  const sortedKandidat = [...kandidat].sort((a, b) => b.jumlahSuara - a.jumlahSuara)
  const winner = sortedKandidat[0]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-blue-900">Memuat data hasil voting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      <DashboardHeader admin={admin} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">


        {/* Statistik Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-100">Total Pemilih</p>
                <Users className="h-5 w-5 text-blue-100" />
              </div>
              <div className="text-3xl font-bold mb-1">{statistik.totalVoters}</div>
              <p className="text-xs text-blue-100">Siswa ({statistik.totalSiswa}) + Pegawai ({statistik.totalPegawai})</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-emerald-100">Sudah Memilih</p>
                <CheckCircle className="h-5 w-5 text-emerald-100" />
              </div>
              <div className="text-3xl font-bold mb-1">{statistik.sudahMemilih}</div>
              <p className="text-xs text-emerald-100">
                {statistik.totalVoters > 0 ? Math.round((statistik.sudahMemilih / statistik.totalVoters) * 100) : 0}% partisipasi
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-sm bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-cyan-100">Total Suara</p>
                <TrendingUp className="h-5 w-5 text-cyan-100" />
              </div>
              <div className="text-3xl font-bold mb-1">{totalSuara}</div>
              <p className="text-xs text-cyan-100">Suara masuk</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm bg-gradient-to-br from-sky-500 to-sky-600 text-white border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-sky-100">Status</p>
                <BarChart3 className="h-5 w-5 text-sky-100" />
              </div>
              <div className="mb-1">
                <Badge variant={statistik.votingAktif ? "default" : "secondary"} className="text-sm">
                  {statistik.votingAktif ? "Aktif" : "Selesai"}
                </Badge>
              </div>
              <p className="text-xs text-sky-100">Status voting</p>
            </CardContent>
          </Card>
        </div>

        {/* Voting Active Notice */}
        {statistik.votingAktif ? (
          <Card className="rounded-sm mb-6 bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-blue-900 mb-3">Voting Sedang Berlangsung</h2>
              <p className="text-blue-700 mb-6 max-w-md mx-auto">
                Hasil voting akan ditampilkan setelah voting selesai
              </p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/60 backdrop-blur rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {statistik.sudahMemilih} dari {statistik.totalVoters} pemilih sudah memilih
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-4">
                Nonaktifkan voting untuk melihat hasil lengkap
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Winner Announcement */}
            {winner && winner.jumlahSuara > 0 && (
              <Card className="rounded-sm mb-6 bg-gradient-to-br from-amber-100 via-yellow-100 to-amber-100 border-2 border-yellow-300 shadow-xl">
                <CardContent className="pt-8 pb-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 to-amber-200/20"></div>
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-900 mb-4">🎉 Pemenang Pemilihan 🎉</h2>
                    <div className="inline-block px-4 py-1 bg-white/60 backdrop-blur rounded-full mb-3">
                      <span className="text-sm font-semibold text-amber-800">Nomor Urut {winner.nomorUrut}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-amber-900 mb-3">{winner.namaCalon}</h3>
                    <div className="inline-flex items-baseline gap-2 px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full shadow-lg">
                      <span className="text-3xl font-bold text-white">{winner.jumlahSuara}</span>
                      <span className="text-lg text-white/90">suara</span>
                      <span className="text-sm text-white/80">({totalSuara > 0 ? Math.round((winner.jumlahSuara / totalSuara) * 100) : 0}%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Table */}
            <Card className="rounded-sm bg-white/80 backdrop-blur shadow-xl">
              <CardHeader className="bg-white border-b">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                      <BarChart3 className="w-5 h-5" />
                      Perolehan Suara Detail
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1">
                      Hasil lengkap pemilihan Ketua OSIS
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchData}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                      onClick={openResetDialog}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {kandidat.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-gray-500">Belum ada data voting</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {['mitramuda', 'mitratama'].map((roleType) => {
                      const roleKandidat = sortedKandidat.filter(k => k.role === roleType)
                      const roleLabel = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'
                      const roleColor = roleType === 'mitramuda' ? 'text-blue-600' : 'text-purple-600'
                      
                      if (roleKandidat.length === 0) return null
                      
                      return (
                        <div key={roleType}>
                          <div className="mb-6 flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-full font-bold text-white text-sm ${roleType === 'mitramuda' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
                              {roleLabel}
                            </div>
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                          </div>
                          <div className="space-y-4">
                            {roleKandidat.map((k, index) => {
                      const persentase = totalSuara > 0 ? Math.round((k.jumlahSuara / totalSuara) * 100) : 0
                      const isWinner = index === 0 && k.jumlahSuara > 0
                      
                      return (
                        <div 
                          key={k.id} 
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isWinner 
                              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-yellow-300 shadow-md' 
                              : 'bg-white border-gray-200 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                                isWinner 
                                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {isWinner ? <Trophy className="w-5 h-5" /> : index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-xs">No. {k.nomorUrut}</Badge>
                                  {isWinner && (
                                    <Badge className="bg-gradient-to-r from-yellow-400 to-amber-400 text-white text-xs">
                                      Pemenang
                                    </Badge>
                                  )}
                                </div>
                                <span className="font-semibold text-gray-900 block truncate">{k.namaCalon}</span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-gray-900">{k.jumlahSuara}</div>
                              <div className="text-xs text-gray-600">suara</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Persentase</span>
                              <span className={`font-semibold ${isWinner ? 'text-amber-600' : 'text-gray-700'}`}>{persentase}%</span>
                            </div>
                            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                                  isWinner 
                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500' 
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
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
      </main>

      {/* Reset Voting Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <DialogTitle className="text-xl">Reset Semua Hasil Voting</DialogTitle>
            <DialogDescription className="text-base">
              Tindakan ini akan menghapus semua hasil voting dan mengatur ulang status voting semua siswa.
              <span className="block mt-2 font-semibold text-red-600">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password" className="text-sm font-medium">
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
              <p className="text-xs text-gray-500">Hint: Password default adalah "smansaba"</p>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={isResetting}
              className="flex-1 sm:flex-none"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetVoting}
              disabled={isResetting || !resetPassword}
              className="flex-1 sm:flex-none"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
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