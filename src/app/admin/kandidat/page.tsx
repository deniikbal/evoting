'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, Plus, Edit, Trash2, RefreshCw, ArrowLeft, Upload, User,
  Eye, EyeOff
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
  createdAt: string
}

export default function KandidatManagementPage() {
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedKandidat, setSelectedKandidat] = useState<Kandidat | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    nomorUrut: '',
    namaCalon: '',
    visi: '',
    misi: '',
    fotoUrl: ''
  })

  useEffect(() => {
    // Check admin session
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }

    fetchKandidat()
  }, [router])

  const fetchKandidat = async () => {
    try {
      const response = await fetch('/api/kandidat')
      if (response.ok) {
        const data = await response.json()
        setKandidat(data)
      } else {
        setError('Gagal memuat data kandidat')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddKandidat = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/kandidat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          nomorUrut: parseInt(formData.nomorUrut)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Kandidat berhasil ditambahkan')
        setFormData({
          nomorUrut: '',
          namaCalon: '',
          visi: '',
          misi: '',
          fotoUrl: ''
        })
        setShowAddDialog(false)
        fetchKandidat()
      } else {
        setError(data.message || 'Gagal menambah kandidat')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleEditKandidat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedKandidat) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/kandidat/${selectedKandidat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          nomorUrut: parseInt(formData.nomorUrut)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Kandidat berhasil diperbarui')
        setShowEditDialog(false)
        setSelectedKandidat(null)
        fetchKandidat()
      } else {
        setError(data.message || 'Gagal memperbarui kandidat')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleDeleteKandidat = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kandidat ini?')) return

    try {
      const response = await fetch(`/api/admin/kandidat/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Kandidat berhasil dihapus')
        fetchKandidat()
      } else {
        const data = await response.json()
        setError(data.message || 'Gagal menghapus kandidat')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const openEditDialog = (k: Kandidat) => {
    setSelectedKandidat(k)
    setFormData({
      nomorUrut: k.nomorUrut.toString(),
      namaCalon: k.namaCalon,
      visi: k.visi || '',
      misi: k.misi || '',
      fotoUrl: k.fotoUrl || ''
    })
    setShowEditDialog(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Memuat data kandidat...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Kandidat</h1>
                <p className="text-sm text-gray-500">Kelola data kandidat OSIS</p>
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

        {/* Actions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Data Kandidat
                </CardTitle>
                <CardDescription>
                  Total {kandidat.length} kandidat terdaftar
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Kandidat
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Tambah Kandidat Baru</DialogTitle>
                      <DialogDescription>
                        Masukkan data kandidat yang akan ditambahkan
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddKandidat} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nomorUrut">Nomor Urut</Label>
                          <Input
                            id="nomorUrut"
                            type="number"
                            value={formData.nomorUrut}
                            onChange={(e) => setFormData({...formData, nomorUrut: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="namaCalon">Nama Calon</Label>
                          <Input
                            id="namaCalon"
                            value={formData.namaCalon}
                            onChange={(e) => setFormData({...formData, namaCalon: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="fotoUrl">URL Foto (opsional)</Label>
                        <Input
                          id="fotoUrl"
                          type="url"
                          value={formData.fotoUrl}
                          onChange={(e) => setFormData({...formData, fotoUrl: e.target.value})}
                          placeholder="https://example.com/foto.jpg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="visi">Visi</Label>
                        <Textarea
                          id="visi"
                          value={formData.visi}
                          onChange={(e) => setFormData({...formData, visi: e.target.value})}
                          rows={3}
                          placeholder="Visi kandidat..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="misi">Misi</Label>
                        <Textarea
                          id="misi"
                          value={formData.misi}
                          onChange={(e) => setFormData({...formData, misi: e.target.value})}
                          rows={3}
                          placeholder="Misi kandidat..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Tambah</Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={fetchKandidat}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Kandidat Cards */}
            {kandidat.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada kandidat terdaftar</p>
                <p className="text-sm text-gray-400 mt-2">Tambahkan kandidat untuk memulai voting</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kandidat.map((k) => (
                  <Card key={k.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        {k.fotoUrl ? (
                          <img 
                            src={k.fotoUrl} 
                            alt={k.namaCalon}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      <Badge variant="secondary" className="w-fit mx-auto mb-2">
                        Nomor {k.nomorUrut}
                      </Badge>
                      <CardTitle className="text-lg">{k.namaCalon}</CardTitle>
                      <CardDescription>
                        {k.jumlahSuara} suara
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="text-sm">
                          <p className="font-semibold">Visi:</p>
                          <p className="text-gray-600 line-clamp-2">
                            {k.visi || 'Belum ada visi'}
                          </p>
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold">Misi:</p>
                          <p className="text-gray-600 line-clamp-2">
                            {k.misi || 'Belum ada misi'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(k)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteKandidat(k.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Kandidat</DialogTitle>
            <DialogDescription>
              Perbarui data kandidat
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditKandidat} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editNomorUrut">Nomor Urut</Label>
                <Input
                  id="editNomorUrut"
                  type="number"
                  value={formData.nomorUrut}
                  onChange={(e) => setFormData({...formData, nomorUrut: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editNamaCalon">Nama Calon</Label>
                <Input
                  id="editNamaCalon"
                  value={formData.namaCalon}
                  onChange={(e) => setFormData({...formData, namaCalon: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editFotoUrl">URL Foto (opsional)</Label>
              <Input
                id="editFotoUrl"
                type="url"
                value={formData.fotoUrl}
                onChange={(e) => setFormData({...formData, fotoUrl: e.target.value})}
                placeholder="https://example.com/foto.jpg"
              />
            </div>
            <div>
              <Label htmlFor="editVisi">Visi</Label>
              <Textarea
                id="editVisi"
                value={formData.visi}
                onChange={(e) => setFormData({...formData, visi: e.target.value})}
                rows={3}
                placeholder="Visi kandidat..."
              />
            </div>
            <div>
              <Label htmlFor="editMisi">Misi</Label>
              <Textarea
                id="editMisi"
                value={formData.misi}
                onChange={(e) => setFormData({...formData, misi: e.target.value})}
                rows={3}
                placeholder="Misi kandidat..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Perbarui</Button>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}