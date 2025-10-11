'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, BarChart3, Play, Square, LogOut, Settings, FileText, Users2, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Statistik {
  totalSiswa: number
  sudahMemilih: number
  belumMemilih: number
  votingAktif: boolean
}

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  jumlahSuara: number
}

interface Admin {
  id: number
  username: string
}

export default function DashboardPage() {
  const [statistik, setStatistik] = useState<Statistik>({
    totalSiswa: 0,
    sudahMemilih: 0,
    belumMemilih: 0,
    votingAktif: false
  })
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTogglingVoting, setIsTogglingVoting] = useState(false)
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

    // Fetch data
    fetchStatistik()
    fetchKandidat()
  }, [router])

  const fetchStatistik = async () => {
    try {
      const response = await fetch('/api/admin/statistik')
      if (response.ok) {
        const data = await response.json()
        setStatistik(data)
      }
    } catch (err) {
      console.error('Error fetching statistik:', err)
    }
  }

  const fetchKandidat = async () => {
    try {
      const response = await fetch('/api/kandidat')
      if (response.ok) {
        const data = await response.json()
        setKandidat(data)
      }
    } catch (err) {
      console.error('Error fetching kandidat:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVoting = async () => {
    setIsTogglingVoting(true)
    try {
      const response = await fetch('/api/admin/voting-toggle', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setStatistik(prev => ({ ...prev, votingAktif: data.votingAktif }))
      }
    } catch (err) {
      console.error('Error toggling voting:', err)
    } finally {
      setIsTogglingVoting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

  const persentaseMemilih = statistik.totalSiswa > 0 
    ? Math.round((statistik.sudahMemilih / statistik.totalSiswa) * 100)
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
              <p className="text-sm text-gray-500">E-Voting OSIS SMAN 1 Bantarujeg</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Admin: {admin?.username}</span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Voting Control */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Pengaturan Voting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status Voting</p>
                  <p className="text-sm text-gray-500">
                    {statistik.votingAktif 
                      ? 'Voting sedang aktif, siswa dapat melakukan login dan memilih'
                      : 'Voting tidak aktif, siswa tidak dapat melakukan voting'
                    }
                  </p>
                </div>
                <Button
                  onClick={toggleVoting}
                  disabled={isTogglingVoting}
                  variant={statistik.votingAktif ? "destructive" : "default"}
                >
                  {isTogglingVoting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : statistik.votingAktif ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Hentikan Voting
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Mulai Voting
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
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
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistik.sudahMemilih}</div>
              <p className="text-xs text-muted-foreground">
                {persentaseMemilih}% dari total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Belum Memilih</CardTitle>
              <UserX className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistik.belumMemilih}</div>
              <p className="text-xs text-muted-foreground">
                {100 - persentaseMemilih}% dari total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Voting</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={statistik.votingAktif ? "default" : "secondary"}>
                  {statistik.votingAktif ? "Aktif" : "Non-Aktif"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Klik tombol untuk mengubah
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/siswa')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="w-5 h-5" />
                Manajemen Siswa
              </CardTitle>
              <CardDescription>
                Tambah, edit, dan impor data siswa
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/kandidat')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Manajemen Kandidat
              </CardTitle>
              <CardDescription>
                Kelola data kandidat OSIS
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/hasil')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Hasil Voting
              </CardTitle>
              <CardDescription>
                Lihat dan ekspor hasil voting
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/pengaturan')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Pengaturan
              </CardTitle>
              <CardDescription>
                Konfigurasi sistem voting
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Results */}
        <Card>
          <CardHeader>
            <CardTitle>Hasil Sementara</CardTitle>
            <CardDescription>Perolehan suara sementara untuk setiap kandidat</CardDescription>
          </CardHeader>
          <CardContent>
            {kandidat.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Belum ada kandidat</p>
            ) : (
              <div className="space-y-4">
                {kandidat.map((k) => {
                  const persentase = statistik.sudahMemilih > 0 
                    ? Math.round((k.jumlahSuara / statistik.sudahMemilih) * 100)
                    : 0
                  
                  return (
                    <div key={k.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">No. {k.nomorUrut}</Badge>
                        <span className="font-medium">{k.namaCalon}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-bold">{k.jumlahSuara} suara</span>
                          <span className="text-sm text-gray-500 ml-2">({persentase}%)</span>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${persentase}%` }}
                          ></div>
                        </div>
                      </div>
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