'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  RefreshCw, Save, Play, Square, TriangleAlert, Loader2, Settings,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

  const votingAktif = pengaturan.voting_aktif === 'true'

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p>Memuat pengaturan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Voting Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="size-5" />
            Kontrol Voting
          </CardTitle>
          <CardDescription>
            Atur status dan waktu voting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Voting Status */}
            <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`size-3 rounded-full ${votingAktif ? 'bg-primary' : 'bg-destructive'}`}
                  aria-hidden
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Status Voting</p>
                    <Badge variant={votingAktif ? 'default' : 'secondary'}>
                      {votingAktif ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {votingAktif
                      ? 'Voting sedang aktif, siswa dapat memilih'
                      : 'Voting tidak aktif, siswa tidak dapat memilih'
                    }
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => openConfirmDialog(votingAktif ? 'stop' : 'start')}
                variant={votingAktif ? 'destructive' : 'default'}
                size="sm"
                className="w-full sm:w-auto"
              >
                {votingAktif ? (
                  <>
                    <Square />
                    Hentikan
                  </>
                ) : (
                  <>
                    <Play />
                    Mulai
                  </>
                )}
              </Button>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
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
              <div className="space-y-2">
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

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save />
                    Simpan
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={fetchPengaturan}>
                <RefreshCw />
                Refresh
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        setShowConfirmDialog(open)
        if (!open) setConfirmPassword('')
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div
              className={`mb-2 flex size-12 items-center justify-center rounded-full ${
                votingAction === 'start' ? 'bg-primary/10' : 'bg-destructive/10'
              }`}
            >
              <TriangleAlert
                className={`size-6 ${
                  votingAction === 'start' ? 'text-primary' : 'text-destructive'
                }`}
              />
            </div>
            <DialogTitle className="text-xl">
              {votingAction === 'start' ? 'Mulai Voting' : 'Hentikan Voting'}
            </DialogTitle>
            <DialogDescription>
              {votingAction === 'start'
                ? 'Apakah Anda yakin ingin memulai voting? Siswa akan dapat melakukan pemilihan setelah voting dimulai.'
                : 'Apakah Anda yakin ingin menghentikan voting? Siswa tidak akan dapat melakukan pemilihan setelah voting dihentikan.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="confirm-password">
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
            <p className="text-xs text-muted-foreground">Password diperlukan untuk keamanan sistem</p>
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
            >
              {isToggling ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Memproses...
                </>
              ) : votingAction === 'start' ? (
                <>
                  <Play />
                  Ya, Mulai
                </>
              ) : (
                <>
                  <Square />
                  Ya, Hentikan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
