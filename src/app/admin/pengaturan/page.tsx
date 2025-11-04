'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  RefreshCw, Save, Play, Square, AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import DashboardHeader from '@/components/admin/DashboardHeader'

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
    fetchPengaturan()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

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
    if (confirmPassword !== 'SmansabaHiber2025') {
      toast.error('Password salah!')
      return
    }

    const newStatus = votingAction === 'start' ? 'true' : 'false'
    setIsToggling(true)
    
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-blue-900">Memuat pengaturan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      <DashboardHeader admin={admin} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

        <div className="space-y-6">
          {/* Voting Control */}
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Kontrol Voting
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Atur status dan waktu voting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
                {/* Voting Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-3 h-3 rounded-full ${pengaturan.voting_aktif === 'true' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">Status Voting</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {pengaturan.voting_aktif === 'true' 
                          ? 'Voting sedang aktif, siswa dapat memilih' 
                          : 'Voting tidak aktif, siswa tidak dapat memilih'
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => openConfirmDialog(pengaturan.voting_aktif === 'true' ? 'stop' : 'start')}
                    variant={pengaturan.voting_aktif === 'true' ? "destructive" : "default"}
                    size="sm"
                    className="w-full sm:w-auto px-4"
                  >
                    {pengaturan.voting_aktif === 'true' ? (
                      <>
                        <Square className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Hentikan</span>
                        <span className="sm:hidden">Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Mulai</span>
                        <span className="sm:hidden">Start</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Time Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="waktu_mulai" className="text-sm">Waktu Mulai Voting</Label>
                    <Input
                      id="waktu_mulai"
                      type="datetime-local"
                      value={pengaturan.waktu_mulai_voting}
                      onChange={(e) => setPengaturan(prev => ({ 
                        ...prev, 
                        waktu_mulai_voting: e.target.value 
                      }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="waktu_selesai" className="text-sm">Waktu Selesai Voting</Label>
                    <Input
                      id="waktu_selesai"
                      type="datetime-local"
                      value={pengaturan.waktu_selesai_voting}
                      onChange={(e) => setPengaturan(prev => ({ 
                        ...prev, 
                        waktu_selesai_voting: e.target.value 
                      }))}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex gap-2">
                  <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span className="text-sm">Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="text-sm">Simpan</span>
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={fetchPengaturan} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Refresh</span>
                    <span className="sm:hidden">⟳</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        setShowConfirmDialog(open)
        if (!open) setConfirmPassword('')
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                votingAction === 'start' ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  votingAction === 'start' ? 'text-blue-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <DialogTitle className="text-xl">
              {votingAction === 'start' ? 'Mulai Voting' : 'Hentikan Voting'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {votingAction === 'start' 
                ? 'Apakah Anda yakin ingin memulai voting? Siswa akan dapat melakukan pemilihan setelah voting dimulai.'
                : 'Apakah Anda yakin ingin menghentikan voting? Siswa tidak akan dapat melakukan pemilihan setelah voting dihentikan.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Masukkan password untuk konfirmasi:
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Masukkan password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isToggling) {
                    handleConfirmToggle()
                  }
                }}
                className="h-10"
              />
              <p className="text-xs text-gray-500">Password diperlukan untuk keamanan sistem</p>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false)
                setConfirmPassword('')
              }}
              disabled={isToggling}
              className="flex-1 sm:flex-none"
            >
              Batal
            </Button>
            <Button
              variant={votingAction === 'start' ? "default" : "destructive"}
              onClick={handleConfirmToggle}
              disabled={isToggling || !confirmPassword}
              className="flex-1 sm:flex-none"
            >
              {isToggling ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {votingAction === 'start' ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Ya, Mulai
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Ya, Hentikan
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}