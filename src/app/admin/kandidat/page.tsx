'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { StatCard, StatCardGrid } from '@/components/admin/stat-card'
import { DataTableToolbar } from '@/components/admin/data-table-toolbar'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import {
  Trophy, Plus, Pencil, Trash2, RefreshCw, User, Loader2, X,
  Users, Crown, Vote,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import { ambilSesiAdmin } from '@/lib/sesi-klien'

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
    // Sesi admin diverifikasi server lewat cookie httpOnly. Nilai di
    // localStorage hanya untuk tampilan, bukan penentu hak akses.
    const muatSesi = async () => {
      const sesi = await ambilSesiAdmin()
      if (!sesi) {
        router.push('/login/admin')
        return
      }
      setAdmin(sesi)
      fetchKandidat()
    }

    void muatSesi()
  }, [router])

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

      // Balasan galat belum tentu JSON (mis. 413 dari nginx berupa HTML), jadi
      // pembacaan body dilindungi supaya pesan aslinya tidak hilang.
      const data = await response.json().catch(() => null)

      if (response.ok && data?.url) {
        return data.url as string
      }

      toast.error(data?.message || `Gagal mengupload gambar (${response.status})`)
      return null
    } catch {
      toast.error('Gagal mengupload gambar. Periksa koneksi lalu coba lagi.')
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

  const handleAddKandidat = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Foto diunggah lebih dulu. Kalau gagal, simpan dihentikan: dulu alurnya
      // lanjut menyimpan kandidat dengan fotoUrl kosong, sehingga muncul
      // kandidat tanpa foto tanpa penjelasan.
      let imageUrl = formData.fotoUrl
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (!uploadedUrl) {
          setIsSubmitting(false)
          return
        }
        imageUrl = uploadedUrl
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
      // Foto diunggah lebih dulu. Kalau gagal, simpan dihentikan: dulu alurnya
      // lanjut menyimpan kandidat dengan fotoUrl kosong, sehingga muncul
      // kandidat tanpa foto tanpa penjelasan.
      let imageUrl = formData.fotoUrl
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (!uploadedUrl) {
          setIsSubmitting(false)
          return
        }
        imageUrl = uploadedUrl
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

  // Statistik turunan (derived)
  const statistik = useMemo(() => ({
    total: kandidat.length,
    mitraTama: kandidat.filter(k => k.role === 'mitratama').length,
    mitraMuda: kandidat.filter(k => k.role === 'mitramuda').length,
    totalSuara: kandidat.reduce((sum, k) => sum + (k.jumlahSuara || 0), 0),
  }), [kandidat])

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
      {/* Statistik Cards */}
      <StatCardGrid>
        <StatCard
          title="Total Kandidat"
          value={statistik.total}
          description="Kandidat terdaftar"
          icon={Trophy}
        />
        <StatCard
          title="Mitra Tama"
          value={statistik.mitraTama}
          description="Kelas XI"
          icon={Crown}
        />
        <StatCard
          title="Mitra Muda"
          value={statistik.mitraMuda}
          description="Kelas X"
          icon={Users}
        />
        <StatCard
          title="Total Suara"
          value={statistik.totalSuara}
          description="Suara masuk"
          icon={Vote}
        />
      </StatCardGrid>

      <Card>
        <DataTableToolbar
          title="Data Kandidat"
          icon={Trophy}
          description={`Total ${kandidat.length} kandidat terdaftar`}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={fetchKandidat}>
                <RefreshCw />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus />
                Tambah
              </Button>
            </>
          }
        />
        <CardContent className="space-y-8">
          {kandidat.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Trophy />
                </EmptyMedia>
                <EmptyTitle>Belum ada kandidat terdaftar</EmptyTitle>
                <EmptyDescription>
                  Tambahkan kandidat untuk memulai voting.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            ['mitratama', 'mitramuda'].map((roleType) => {
              const roleKandidat = kandidat.filter(k => k.role === roleType)
              const roleLabel = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'

              if (roleKandidat.length === 0) return null

              return (
                <div key={roleType}>
                  <div className="mb-6 flex items-center gap-4">
                    <Badge variant="outline" className="px-4 py-1.5 text-sm font-bold">
                      {roleLabel}
                    </Badge>
                    <Separator className="flex-1" />
                    <span className="text-sm font-medium text-muted-foreground">{roleKandidat.length} kandidat</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {roleKandidat.map((k) => (
                      <div
                        key={k.id}
                        className="overflow-hidden rounded-md border-2 border-border bg-card"
                      >
                        {/* Foto mengikuti kartu bilik voting: rasio 4:5, penuh,
                            nomor urut sebagai label di pojok kiri atas. */}
                        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                          {k.fotoUrl ? (
                            <img
                              src={k.fotoUrl}
                              alt={k.namaCalon}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <User className="size-10 text-muted-foreground" aria-hidden="true" />
                            </div>
                          )}

                          <span
                            className="absolute left-2 top-2 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: '#f59e0b' }}
                          >
                            {String(k.nomorUrut).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="border-t border-border bg-card px-2 py-2">
                          <p className="line-clamp-2 text-center text-sm font-bold leading-snug sm:text-base">
                            {k.namaCalon}
                          </p>
                          <div className="mt-2 flex gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openEditDialog(k)}
                            >
                              <Pencil />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => openDeleteDialog(k.id)}
                              title="Hapus kandidat"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Kandidat Baru</DialogTitle>
            <DialogDescription>
              Isi nomor urut, nama, kategori, dan foto kandidat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddKandidat} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nomorUrut">No. Urut</Label>
                <Input
                  id="nomorUrut"
                  type="number"
                  value={formData.nomorUrut}
                  onChange={(e) => setFormData({...formData, nomorUrut: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="namaCalon">Nama Calon</Label>
                <Input
                  id="namaCalon"
                  value={formData.namaCalon}
                  onChange={(e) => setFormData({...formData, namaCalon: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mitramuda">Mitra Muda</SelectItem>
                    <SelectItem value="mitratama">Mitra Tama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto">Foto</Label>
                <Input
                  id="foto"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="px-2"
                />
              </div>
            </div>
            {imagePreview && (
              <div className="flex justify-center">
                <div className="relative size-16">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={64}
                    height={64}
                    className="size-full rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 size-5 rounded-full"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={isUploading || isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isUploading || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Menyimpan...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Upload...
                  </>
                ) : (
                  'Tambah'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Kandidat</DialogTitle>
            <DialogDescription>
              Perbarui nomor urut, nama, kategori, dan foto kandidat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditKandidat} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="editNomorUrut">No. Urut</Label>
                <Input
                  id="editNomorUrut"
                  type="number"
                  value={formData.nomorUrut}
                  onChange={(e) => setFormData({...formData, nomorUrut: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNamaCalon">Nama Calon</Label>
                <Input
                  id="editNamaCalon"
                  value={formData.namaCalon}
                  onChange={(e) => setFormData({...formData, namaCalon: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mitramuda">Mitra Muda</SelectItem>
                    <SelectItem value="mitratama">Mitra Tama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editFoto">Foto</Label>
                <Input
                  id="editFoto"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="px-2"
                />
              </div>
            </div>
            {imagePreview && (
              <div className="flex justify-center">
                <div className="relative size-16">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={64}
                    height={64}
                    className="size-full rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 size-5 rounded-full"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUploading || isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isUploading || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Menyimpan...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Upload...
                  </>
                ) : (
                  'Perbarui'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Konfirmasi Hapus"
        description="Apakah Anda yakin ingin menghapus kandidat ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
