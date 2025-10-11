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
  BarChart3, Download, ArrowLeft, RefreshCw, Trophy, Users, 
  CheckCircle, TrendingUp, FileText, Table, Trash2, AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  visi: string
  misi: string
  fotoUrl?: string
  jumlahSuara: number
}

interface Statistik {
  totalSiswa: number
  sudahMemilih: number
  belumMemilih: number
  votingAktif: boolean
}

export default function HasilVotingPage() {
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [statistik, setStatistik] = useState<Statistik>({
    totalSiswa: 0,
    sudahMemilih: 0,
    belumMemilih: 0,
    votingAktif: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check admin session
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }

    fetchData()
  }, [router])

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

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/hasil/export/csv')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `hasil-voting-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting CSV:', err)
    }
  }

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/admin/hasil/export/pdf')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `hasil-voting-${new Date().toISOString().split('T')[0]}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting PDF:', err)
    }
  }

  const handleResetVoting = async () => {
    setResetError('')
    
    if (resetPassword !== 'smansaba') {
      setResetError('Password salah!')
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
        alert('Semua hasil voting berhasil dihapus!')
      } else {
        setResetError('Gagal menghapus hasil voting')
      }
    } catch (err) {
      console.error('Error resetting voting:', err)
      setResetError('Terjadi kesalahan saat menghapus hasil voting')
    } finally {
      setIsResetting(false)
    }
  }

  const openResetDialog = () => {
    setResetPassword('')
    setResetError('')
    setShowResetDialog(true)
  }

  const totalSuara = statistik.sudahMemilih
  const sortedKandidat = [...kandidat].sort((a, b) => b.jumlahSuara - a.jumlahSuara)
  const winner = sortedKandidat[0]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Memuat data hasil voting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Hasil Voting</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Pemilihan Ketua OSIS SMAN 1 Bantarujeg</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Action Buttons - Only shown when voting is finished */}
        {!statistik.votingAktif && (
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full">
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="w-full">
                <Download className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button variant="outline" size="sm" onClick={fetchData} className="w-full">
                <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">⟳</span>
              </Button>
              <Button variant="destructive" size="sm" onClick={openResetDialog} className="w-full">
                <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Reset Voting</span>
                <span className="sm:hidden">Reset</span>
              </Button>
            </div>
          </div>
        )}

        {/* Statistik Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Pemilih</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{statistik.totalSiswa}</div>
              <p className="text-xs text-muted-foreground">
                Terdaftar dalam sistem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Sudah Memilih</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{statistik.sudahMemilih}</div>
              <p className="text-xs text-muted-foreground">
                {statistik.totalSiswa > 0 ? Math.round((statistik.sudahMemilih / statistik.totalSiswa) * 100) : 0}% partisipasi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Suara</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalSuara}</div>
              <p className="text-xs text-muted-foreground">
                Suara masuk
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                <Badge variant={statistik.votingAktif ? "default" : "secondary"}>
                  {statistik.votingAktif ? "Aktif" : "Selesai"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Status voting
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Voting Active Notice */}
        {statistik.votingAktif ? (
          <Card className="mb-6 sm:mb-8 border-2 border-blue-200 bg-blue-50">
            <CardHeader className="text-center pb-3 sm:pb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-blue-400 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-2xl text-blue-800">Voting Sedang Berlangsung</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm sm:text-base text-blue-700 mb-4">
                Hasil voting akan ditampilkan setelah voting selesai
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                  <Users className="w-4 h-4" />
                  <span>{statistik.sudahMemilih} dari {statistik.totalSiswa} siswa sudah memilih</span>
                </div>
                <p className="text-xs text-blue-600">
                  Nonaktifkan voting untuk melihat hasil lengkap
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Winner Announcement */}
            {winner && winner.jumlahSuara > 0 && (
              <Card className="mb-6 sm:mb-8 border-2 border-yellow-200 bg-yellow-50">
                <CardHeader className="text-center pb-3 sm:pb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-2xl text-yellow-800">Pemenang</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge variant="secondary" className="mb-2 text-xs sm:text-sm">
                    Nomor {winner.nomorUrut}
                  </Badge>
                  <h3 className="text-base sm:text-xl font-bold text-yellow-800 mb-2 truncate px-2">{winner.namaCalon}</h3>
                  <p className="text-sm sm:text-lg text-yellow-700">
                    {winner.jumlahSuara} suara ({totalSuara > 0 ? Math.round((winner.jumlahSuara / totalSuara) * 100) : 0}%)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Results Table */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Table className="w-4 h-4 sm:w-5 sm:h-5" />
              Perolehan Suara Detail
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Hasil lengkap pemilihan Ketua OSIS
            </CardDescription>
          </CardHeader>
          <CardContent>
            {kandidat.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">Belum ada data voting</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {sortedKandidat.map((k, index) => {
                  const persentase = totalSuara > 0 ? Math.round((k.jumlahSuara / totalSuara) * 100) : 0
                  
                  return (
                    <div key={k.id} className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 text-xs sm:text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <Badge variant="secondary" className="text-xs sm:text-sm">No. {k.nomorUrut}</Badge>
                          <span className="font-medium text-sm sm:text-base truncate flex-1">{k.namaCalon}</span>
                          {index === 0 && k.jumlahSuara > 0 && (
                            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="font-bold text-sm sm:text-lg">{k.jumlahSuara} suara</span>
                          <span className="text-xs sm:text-sm text-gray-500">({persentase}%)</span>
                        </div>
                      </div>
                      <Progress value={persentase} className="h-2 sm:h-3" />
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
              <AlertTriangle className="w-6 h-6" />
              <DialogTitle>Reset Semua Hasil Voting</DialogTitle>
            </div>
            <DialogDescription>
              Tindakan ini akan menghapus semua hasil voting dan mengatur ulang status voting semua siswa.
              <span className="block mt-2 font-semibold text-red-600">
                Tindakan ini tidak dapat dibatalkan!
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
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
              />
              {resetError && (
                <p className="text-sm text-red-600">{resetError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={isResetting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetVoting}
              disabled={isResetting || !resetPassword}
              className="w-full sm:w-auto"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset Voting
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}