'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, Download, ArrowLeft, RefreshCw, Trophy, Users, 
  CheckCircle, TrendingUp, FileText, Table
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hasil Voting</h1>
                <p className="text-sm text-gray-500">Pemilihan Ketua OSIS SMAN 1 Bantarujeg</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportCSV}>
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pemilih</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistik.totalSiswa}</div>
              <p className="text-xs text-muted-foreground">
                Terdaftar dalam sistem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sudah Memilih</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistik.sudahMemilih}</div>
              <p className="text-xs text-muted-foreground">
                {statistik.totalSiswa > 0 ? Math.round((statistik.sudahMemilih / statistik.totalSiswa) * 100) : 0}% partisipasi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suara</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalSuara}</div>
              <p className="text-xs text-muted-foreground">
                Suara masuk
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
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

        {/* Winner Announcement */}
        {winner && winner.jumlahSuara > 0 && (
          <Card className="mb-8 border-2 border-yellow-200 bg-yellow-50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-yellow-800">Pemenang Sementara</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="secondary" className="mb-2">
                Nomor {winner.nomorUrut}
              </Badge>
              <h3 className="text-xl font-bold text-yellow-800 mb-2">{winner.namaCalon}</h3>
              <p className="text-lg text-yellow-700">
                {winner.jumlahSuara} suara ({totalSuara > 0 ? Math.round((winner.jumlahSuara / totalSuara) * 100) : 0}%)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="w-5 h-5" />
              Perolehan Suara Detail
            </CardTitle>
            <CardDescription>
              Hasil lengkap pemilihan Ketua OSIS
            </CardDescription>
          </CardHeader>
          <CardContent>
            {kandidat.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada data voting</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedKandidat.map((k, index) => {
                  const persentase = totalSuara > 0 ? Math.round((k.jumlahSuara / totalSuara) * 100) : 0
                  
                  return (
                    <div key={k.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                            {index + 1}
                          </div>
                          <Badge variant="secondary">No. {k.nomorUrut}</Badge>
                          <span className="font-medium">{k.namaCalon}</span>
                          {index === 0 && k.jumlahSuara > 0 && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-lg">{k.jumlahSuara} suara</span>
                          <span className="text-sm text-gray-500">({persentase}%)</span>
                        </div>
                      </div>
                      <Progress value={persentase} className="h-3" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}