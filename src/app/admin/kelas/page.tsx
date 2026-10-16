'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  School, Plus, Pencil, Trash2, RefreshCw, Upload, Download,
  ChevronLeft, ChevronRight, Calendar, Layers, ListChecks, TriangleAlert, FileSpreadsheet
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Admin {
  id: number
  username: string
}

interface Classroom {
  id: number
  name: string
  angkatan: string
  createdAt: string
}

export default function KelasManagementPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    angkatan: ''
  })

  useEffect(() => {
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }

    const session = JSON.parse(sessionData)
    setAdmin(session)
    fetchClassrooms()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/admin/classroom')
      if (response.ok) {
        const data = await response.json()
        setClassrooms(data)
      } else {
        toast.error('Gagal memuat data kelas')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/classroom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Kelas berhasil ditambahkan')
        setFormData({ name: '', angkatan: '' })
        setShowAddDialog(false)
        fetchClassrooms()
      } else {
        toast.error(data.message || 'Gagal menambah kelas')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClassroom) return

    try {
      const response = await fetch(`/api/admin/classroom/${selectedClassroom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Kelas berhasil diupdate')
        setFormData({ name: '', angkatan: '' })
        setShowEditDialog(false)
        setSelectedClassroom(null)
        fetchClassrooms()
      } else {
        toast.error(data.message || 'Gagal mengupdate kelas')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleDelete = async () => {
    if (!selectedClassroom) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/classroom/${selectedClassroom.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Kelas berhasil dihapus')
        setShowDeleteDialog(false)
        setSelectedClassroom(null)
        fetchClassrooms()
      } else {
        toast.error(data.message || 'Gagal menghapus kelas')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setFormData({
      name: classroom.name,
      angkatan: classroom.angkatan
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setShowDeleteDialog(true)
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/classroom/template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template-import-kelas.xlsx'
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Template berhasil diunduh')
      } else {
        toast.error('Gagal mengunduh template')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengunduh template')
    }
  }

  const handleImportExcel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const file = formData.get('xlsFile') as File

    if (!file) {
      toast.error('Pilih file Excel terlebih dahulu')
      return
    }

    setIsImporting(true)
    try {
      const response = await fetch('/api/admin/classroom/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Berhasil mengimpor ${data.count} kelas`)
        setShowImportDialog(false)
        fetchClassrooms()
      } else {
        toast.error(data.message || 'Gagal mengimpor data')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsImporting(false)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(classrooms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = classrooms.slice(startIndex, endIndex)

  // Statistik turunan (derived) - tidak mengubah data/logic
  const statistik = useMemo(() => {
    const angkatanList = Array.from(new Set(classrooms.map((c) => c.angkatan)))
    const sortedAngkatan = [...angkatanList].sort((a, b) => Number(b) - Number(a))
    return {
      totalKelas: classrooms.length,
      totalAngkatan: angkatanList.length,
      angkatanTerbaru: sortedAngkatan[0] ?? '-',
    }
  }, [classrooms])

  // Pagination functions
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1) // Reset to first page
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Statistik Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <School className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik.totalKelas}</div>
            <p className="text-xs text-muted-foreground">Kelas terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Angkatan</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik.totalAngkatan}</div>
            <p className="text-xs text-muted-foreground">Angkatan berbeda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Angkatan Terbaru</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik.angkatanTerbaru}</div>
            <p className="text-xs text-muted-foreground">Tahun terakhir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data / Halaman</CardTitle>
            <ListChecks className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemsPerPage}</div>
            <p className="text-xs text-muted-foreground">
              Halaman {currentPage} dari {totalPages || 1}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Kelas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <School className="size-5" />
                Data Kelas
              </CardTitle>
              <CardDescription>
                Total {classrooms.length} kelas terdaftar
                {classrooms.length > 0 && (
                  <span className="ml-2">
                    • Menampilkan {startIndex + 1}-{Math.min(endIndex, classrooms.length)} dari {classrooms.length}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Import Data Kelas</DialogTitle>
                    <DialogDescription>
                      Upload file Excel dengan kolom: name, angkatan
                    </DialogDescription>
                  </DialogHeader>

                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileSpreadsheet className="size-4" />
                      Belum punya template? Download terlebih dahulu.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="w-full"
                    >
                      <Download />
                      Download Template Excel
                    </Button>
                  </div>

                  <form onSubmit={handleImportExcel} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="xlsFile">File Excel</Label>
                      <Input
                        id="xlsFile"
                        name="xlsFile"
                        type="file"
                        accept=".xls,.xlsx"
                        required
                      />
                    </div>
                    <DialogFooter className="gap-2">
                      <Button type="submit" size="sm" disabled={isImporting}>
                        {isImporting ? (
                          <>
                            <RefreshCw className="animate-spin" />
                            Mengimpor...
                          </>
                        ) : (
                          'Import'
                        )}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowImportDialog(false)} disabled={isImporting}>
                        Batal
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah Kelas Baru</DialogTitle>
                    <DialogDescription>
                      Masukkan data kelas yang akan ditambahkan
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAdd} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Kelas</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Contoh: XII IPA 1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="angkatan">Angkatan</Label>
                      <Input
                        id="angkatan"
                        value={formData.angkatan}
                        onChange={(e) => setFormData({...formData, angkatan: e.target.value})}
                        placeholder="Contoh: 2024"
                        required
                      />
                    </div>
                    <DialogFooter className="gap-2">
                      <Button type="submit" size="sm">
                        Tambah
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>
                        Batal
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={fetchClassrooms}>
                <RefreshCw />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop View */}
          <div className="hidden rounded-md border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Angkatan</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <School />
                          </EmptyMedia>
                          <EmptyTitle>
                            {classrooms.length === 0 ? 'Belum ada data kelas' : 'Tidak ada data pada halaman ini'}
                          </EmptyTitle>
                          <EmptyDescription>
                            {classrooms.length === 0
                              ? 'Tambahkan kelas baru atau import dari Excel untuk memulai.'
                              : 'Coba pindah ke halaman lain.'}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((classroom) => (
                    <TableRow key={classroom.id}>
                      <TableCell className="font-medium">{classroom.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{classroom.angkatan}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(classroom.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(classroom)}
                            title="Edit kelas"
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(classroom)}
                            title="Hapus kelas"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="space-y-3 sm:hidden">
            {currentItems.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <School />
                  </EmptyMedia>
                  <EmptyTitle>
                    {classrooms.length === 0 ? 'Belum ada data kelas' : 'Tidak ada data pada halaman ini'}
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              currentItems.map((classroom) => (
                <div key={classroom.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{classroom.name}</p>
                      <p className="text-xs text-muted-foreground">Angkatan {classroom.angkatan}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(classroom.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <Badge variant="secondary">{classroom.angkatan}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(classroom)}
                    >
                      <Pencil />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => openDeleteDialog(classroom)}
                    >
                      <Trash2 />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {classrooms.length > 0 && (
            <div className="mt-4 flex flex-col gap-4">
              {/* Mobile View */}
              <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft />
                  </Button>

                  <span className="px-2 text-xs text-muted-foreground">
                    Hal {currentPage} dari {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight />
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-muted-foreground">Tampilkan:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => handleItemsPerPageChange(Number(value))}
                  >
                    <SelectTrigger className="h-7 w-14 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">data/halaman</span>
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden items-center justify-between gap-4 sm:flex">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Tampilkan:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => handleItemsPerPageChange(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">data per halaman</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages: (number | string)[] = []
                      const maxVisible = 5

                      if (totalPages <= maxVisible) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i)
                        }
                      } else {
                        pages.push(1)

                        if (currentPage > 3) {
                          pages.push('...')
                        }

                        const start = Math.max(2, currentPage - 1)
                        const end = Math.min(totalPages - 1, currentPage + 1)

                        for (let i = start; i <= end; i++) {
                          if (i !== 1 && i !== totalPages) {
                            pages.push(i)
                          }
                        }

                        if (currentPage < totalPages - 2) {
                          pages.push('...')
                        }

                        if (totalPages > 1) {
                          pages.push(totalPages)
                        }
                      }

                      return pages.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-muted-foreground">
                              ...
                            </span>
                          )
                        }

                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => handlePageChange(page as number)}
                          >
                            {page}
                          </Button>
                        )
                      })
                    })()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
            <DialogDescription>
              Update data kelas
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Kelas</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Contoh: XII IPA 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-angkatan">Angkatan</Label>
              <Input
                id="edit-angkatan"
                value={formData.angkatan}
                onChange={(e) => setFormData({...formData, angkatan: e.target.value})}
                placeholder="Contoh: 2024"
                required
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="submit" size="sm">
                Update
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEditDialog(false)
                  setSelectedClassroom(null)
                  setFormData({ name: '', angkatan: '' })
                }}
              >
                Batal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* Delete AlertDialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-destructive" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kelas <strong>{selectedClassroom?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setSelectedClassroom(null)}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 />
                  Ya, Hapus
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
