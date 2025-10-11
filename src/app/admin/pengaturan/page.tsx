'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, ArrowLeft, RefreshCw, Save, Clock, Play, Square,
  Users, Key, Shield
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check admin session
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }

    fetchPengaturan()
  }, [router])

  const fetchPengaturan = async () => {
    try {
      const response = await fetch('/api/admin/pengaturan')
      if (response.ok) {
        const data = await response.json()
        setPengaturan(data)
      } else {
        setError('Gagal memuat pengaturan')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat pengaturan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

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
        setSuccess('Pengaturan berhasil disimpan')
      } else {
        setError(data.message || 'Gagal menyimpan pengaturan')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleVoting = async () => {
    const newStatus = pengaturan.voting_aktif === 'true' ? 'false' : 'true'
    
    try {
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
        setSuccess(`Voting berhasil ${newStatus === 'true' ? 'diaktifkan' : 'dinonaktifkan'}`)
      } else {
        setError(data.message || 'Gagal mengubah status voting')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Memuat pengaturan...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
                <p className="text-sm text-gray-500">Konfigurasi sistem voting</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voting Control */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Kontrol Voting
              </CardTitle>
              <CardDescription>
                Atur status dan waktu voting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {/* Voting Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${pengaturan.voting_aktif === 'true' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium">Status Voting</p>
                      <p className="text-sm text-gray-500">
                        {pengaturan.voting_aktif === 'true' 
                          ? 'Voting sedang aktif, siswa dapat memilih' 
                          : 'Voting tidak aktif, siswa tidak dapat memilih'
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={toggleVoting}
                    variant={pengaturan.voting_aktif === 'true' ? "destructive" : "default"}
                  >
                    {pengaturan.voting_aktif === 'true' ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Hentikan
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Mulai
                      </>
                    )}
                  </Button>
                </div>

                {/* Time Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="waktu_mulai">Waktu Mulai Voting</Label>
                    <Input
                      id="waktu_mulai"
                      type="datetime-local"
                      value={pengaturan.waktu_mulai_voting}
                      onChange={(e) => setPengaturan(prev => ({ 
                        ...prev, 
                        waktu_mulai_voting: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="waktu_selesai">Waktu Selesai Voting</Label>
                    <Input
                      id="waktu_selesai"
                      type="datetime-local"
                      value={pengaturan.waktu_selesai_voting}
                      onChange={(e) => setPengaturan(prev => ({ 
                        ...prev, 
                        waktu_selesai_voting: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Pengaturan
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={fetchPengaturan}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Aksi Cepat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/siswa')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Kelola Siswa
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/kandidat')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Kelola Kandidat
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/hasil')}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Lihat Hasil
                </Button>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Informasi Sistem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status Saat Ini:</span>
                    <span className={`font-medium ${pengaturan.voting_aktif === 'true' ? 'text-green-600' : 'text-red-600'}`}>
                      {pengaturan.voting_aktif === 'true' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waktu Server:</span>
                    <span className="font-medium">
                      {new Date().toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}