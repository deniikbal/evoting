'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { 
  Trophy, Plus, Edit, Trash2, RefreshCw, User,
  AlertTriangle, X, Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
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
  createdAt: string
}

export default function KandidatManagementPage() {
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedKandidat, setSelectedKandidat] = useState<Kandidat | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    nomorUrut: '',
    namaCalon: '',
    visi: '',
    misi: '',
    fotoUrl: '',
    role: 'mitramuda'
  })

  useEffect(() => {
    // Check admin session
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }

    const session = JSON.parse(sessionData)
    setAdmin(session)
    fetchKandidat()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

  const fetchKandidat = async () => {
    try {
      const response = await fetch('/api/kandidat')
      if (response.ok) {
        const data = await response.json()
        setKandidat(data)
      } else {
        toast.error('Gagal memuat data kandidat')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Tipe file tidak valid. Gunakan JPG, PNG, atau WebP')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar. Maksimal 5MB')
        return
      }
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('/api/admin/kandidat/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        return data.url
      } else {
        toast.error(data.message || 'Gagal mengupload gambar')
        return null
      }
    } catch (error) {
      toast.error('Gagal mengupload gambar')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const formatMisiWithNumbers = (text: string): string => {
    if (!text) return text
    
    const lines = text.split('\n').filter(line => line.trim())
    return lines.map((line, index) => {
      // Remove existing numbers/bullets at the start
      const cleaned = line.replace(/^[\d\.\-\*\)\s]+/, '').trim()
      return `${index + 1}. ${cleaned}`
    }).join('\n')
  }

  const handleMisiChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({...formData, misi: e.target.value})
  }

  const handleAddKandidat = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Upload image first if exists
      let imageUrl = formData.fotoUrl
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      // Format misi with numbering
      const formattedMisi = formatMisiWithNumbers(formData.misi)

      const response = await fetch('/api/admin/kandidat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          nomorUrut: parseInt(formData.nomorUrut),
          misi: formattedMisi,
          fotoUrl: imageUrl
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Kandidat berhasil ditambahkan')
        setFormData({
          nomorUrut: '',
          namaCalon: '',
          visi: '',
          misi: '',
          fotoUrl: '',
          role: 'mitramuda'
        })
        setImageFile(null)
        setImagePreview('')
        setShowAddDialog(false)
        fetchKandidat()
      } else {
        toast.error(data.message || 'Gagal menambah kandidat')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditKandidat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedKandidat) return
    setIsSubmitting(true)

    try {
      // Upload image first if exists
      let imageUrl = formData.fotoUrl
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      // Format misi with numbering
      const formattedMisi = formatMisiWithNumbers(formData.misi)

      const response = await fetch(`/api/admin/kandidat/${selectedKandidat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          nomorUrut: parseInt(formData.nomorUrut),
          misi: formattedMisi,
          fotoUrl: imageUrl
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Kandidat berhasil diperbarui')
        setShowEditDialog(false)
        setSelectedKandidat(null)
        setImageFile(null)
        setImagePreview('')
        fetchKandidat()
      } else {
        toast.error(data.message || 'Gagal memperbarui kandidat')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = (id: number) => {
    setDeleteTarget(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    try {
      const response = await fetch(`/api/admin/kandidat/${deleteTarget}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Kandidat berhasil dihapus')
        fetchKandidat()
      } else {
        const data = await response.json()
        toast.error(data.message || 'Gagal menghapus kandidat')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  const openEditDialog = (k: Kandidat) => {
    setSelectedKandidat(k)
    setFormData({
      nomorUrut: k.nomorUrut.toString(),
      namaCalon: k.namaCalon,
      visi: k.visi || '',
      misi: k.misi || '',
      fotoUrl: k.fotoUrl || '',
      role: k.role
    })
    setImageFile(null)
    setImagePreview(k.fotoUrl || '')
    setShowEditDialog(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-blue-900">Memuat data kandidat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      <DashboardHeader admin={admin} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Actions */}
        <Card className="rounded-sm mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  Data Kandidat
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Total {kandidat.length} kandidat terdaftar
                </CardDescription>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2">
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Tambah</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-2">
                      <DialogTitle className="text-lg">Tambah Kandidat Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddKandidat} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="nomorUrut" className="text-xs font-semibold">No. Urut</Label>
                          <Input
                            id="nomorUrut"
                            type="number"
                            value={formData.nomorUrut}
                            onChange={(e) => setFormData({...formData, nomorUrut: e.target.value})}
                            className="text-xs h-8"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="namaCalon" className="text-xs font-semibold">Nama Calon</Label>
                          <Input
                            id="namaCalon"
                            value={formData.namaCalon}
                            onChange={(e) => setFormData({...formData, namaCalon: e.target.value})}
                            className="text-xs h-8"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="addRole" className="text-xs font-semibold">Kategori</Label>
                          <select
                            id="addRole"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full px-2 h-8 rounded-md border border-input bg-background text-xs"
                            required
                          >
                            <option value="mitramuda">Mitra Muda</option>
                            <option value="mitratama">Mitra Tama</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="foto" className="text-xs font-semibold">Foto</Label>
                          <Input
                            id="foto"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="text-xs h-8 px-2"
                          />
                        </div>
                      </div>
                      {imagePreview && (
                        <div className="flex justify-center mt-1">
                          <div className="relative w-16 h-16">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              width={64}
                              height={64}
                              className="w-full h-full object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null)
                                setImagePreview('')
                              }}
                              className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="visi" className="text-xs font-semibold">Visi</Label>
                        <Textarea
                          id="visi"
                          value={formData.visi}
                          onChange={(e) => setFormData({...formData, visi: e.target.value})}
                          rows={1}
                          placeholder="Visi..."
                          className="text-xs resize-none"
                        />
                      </div>
                      <div>
                        <Label htmlFor="misi" className="text-xs font-semibold">Misi (per baris)</Label>
                        <Textarea
                          id="misi"
                          value={formData.misi}
                          onChange={handleMisiChange}
                          rows={2}
                          placeholder="Misi 1&#10;Misi 2"
                          className="text-xs resize-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button type="submit" size="sm" className="flex-1 h-8 text-xs" disabled={isUploading || isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Menyimpan...
                            </>
                          ) : isUploading ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Upload...
                            </>
                          ) : (
                            'Tambah'
                          )}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setShowAddDialog(false)} disabled={isUploading || isSubmitting}>
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={fetchKandidat} className="w-full sm:w-auto">
                  <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">⟳</span>
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
              <div className="space-y-8">
                {['mitratama', 'mitramuda'].map((roleType) => {
                  const roleKandidat = kandidat.filter(k => k.role === roleType)
                  const roleLabel = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'
                  
                  if (roleKandidat.length === 0) return null
                  
                  return (
                    <div key={roleType}>
                      <div className="mb-6 flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-full font-bold text-white text-sm ${roleType === 'mitramuda' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
                          {roleLabel}
                        </div>
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                        <span className="text-gray-600 font-medium text-sm">{roleKandidat.length} kandidat</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {roleKandidat.map((k) => (
                          <Card key={k.id} className="rounded-sm hover:shadow-lg transition-shadow">
                            <CardHeader className="text-center pb-3 sm:pb-6">
                              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3 sm:mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                {k.fotoUrl ? (
                                  <img 
                                    src={k.fotoUrl} 
                                    alt={k.namaCalon}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                                )}
                              </div>
                              <div className="flex gap-2 justify-center mb-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs sm:text-sm">
                                  Nomor {k.nomorUrut}
                                </Badge>
                              </div>
                              <CardTitle className="text-base sm:text-lg truncate px-2">{k.namaCalon}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 sm:pt-6">
                              <div className="space-y-3 mb-4">
                                <div className="text-xs sm:text-sm">
                                  <p className="font-semibold mb-1">Visi:</p>
                                  <p className="text-gray-600 line-clamp-2 text-xs">
                                    {k.visi || 'Belum ada visi'}
                                  </p>
                                </div>
                                <div className="text-xs sm:text-sm">
                                  <p className="font-semibold mb-1">Misi:</p>
                                  {k.misi ? (
                                    <ol className="text-gray-600 space-y-1 text-xs">
                                      {k.misi.split('\n').filter(line => line.trim()).slice(0, 3).map((line, idx) => (
                                        <li key={idx} className="line-clamp-1">
                                          {line}
                                        </li>
                                      ))}
                                      {k.misi.split('\n').filter(line => line.trim()).length > 3 && (
                                        <li className="text-gray-400 italic">...</li>
                                      )}
                                    </ol>
                                  ) : (
                                    <p className="text-gray-600 text-xs">Belum ada misi</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditDialog(k)}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 text-xs font-medium"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => openDeleteDialog(k.id)}
                                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105"
                                  title="Hapus kandidat"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Edit Kandidat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditKandidat} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="editNomorUrut" className="text-xs font-semibold">No. Urut</Label>
                <Input
                  id="editNomorUrut"
                  type="number"
                  value={formData.nomorUrut}
                  onChange={(e) => setFormData({...formData, nomorUrut: e.target.value})}
                  className="text-xs h-8"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editNamaCalon" className="text-xs font-semibold">Nama Calon</Label>
                <Input
                  id="editNamaCalon"
                  value={formData.namaCalon}
                  onChange={(e) => setFormData({...formData, namaCalon: e.target.value})}
                  className="text-xs h-8"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="editRole" className="text-xs font-semibold">Kategori</Label>
                <select
                  id="editRole"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-2 h-8 rounded-md border border-input bg-background text-xs"
                  required
                >
                  <option value="mitramuda">Mitra Muda</option>
                  <option value="mitratama">Mitra Tama</option>
                </select>
              </div>
              <div>
                <Label htmlFor="editFoto" className="text-xs font-semibold">Foto</Label>
                <Input
                  id="editFoto"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="text-xs h-8 px-2"
                />
              </div>
            </div>
            {imagePreview && (
              <div className="flex justify-center mt-1">
                <div className="relative w-16 h-16">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                    }}
                    className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="editVisi" className="text-xs font-semibold">Visi</Label>
              <Textarea
                id="editVisi"
                value={formData.visi}
                onChange={(e) => setFormData({...formData, visi: e.target.value})}
                rows={1}
                placeholder="Visi..."
                className="text-xs resize-none"
              />
            </div>
            <div>
              <Label htmlFor="editMisi" className="text-xs font-semibold">Misi (per baris)</Label>
              <Textarea
                id="editMisi"
                value={formData.misi}
                onChange={handleMisiChange}
                rows={2}
                placeholder="Misi 1&#10;Misi 2"
                className="text-xs resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-8 text-xs" disabled={isUploading || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Menyimpan...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Upload...
                  </>
                ) : (
                  'Perbarui'
                )}
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setShowEditDialog(false)} disabled={isUploading || isSubmitting}>
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Konfirmasi Hapus
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kandidat ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 sm:flex-none"
            >
              Batal
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}