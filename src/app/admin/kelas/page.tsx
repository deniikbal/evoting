'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { StatCard, StatCardGrid } from '@/components/admin/stat-card'
import { DataTableToolbar } from '@/components/admin/data-table-toolbar'
import { DataTablePagination } from '@/components/admin/data-table-pagination'
import { BulkActionBar } from '@/components/admin/bulk-action-bar'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import {
  School, Plus, Pencil, Trash2, RefreshCw, Upload, Download,
  Calendar, Layers, ListChecks, FileSpreadsheet, FileDown,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { StudentPdfCards } from '@/components/admin/student-pdf-cards'
import type { Siswa } from '@/app/admin/siswa/page'

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
  const [, setAdmin] = useState<Admin | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Generate kartu PDF per kelas: container snapshot render hanya saat request aktif
  const [kartuRequest, setKartuRequest] = useState<{ kelas: string; siswa: Siswa[] } | null>(null)

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'angkatan' | 'createdAt'; dir: 'asc' | 'desc' } | null>(null)

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

  // Siapkan siswa satu kelas, lalu mount StudentPdfCards (autoDownload)
  const handleKartuKelas = async (kelas: Classroom) => {
    try {
      toast.info(`Menyiapkan kartu kelas ${kelas.name}...`)
      const response = await fetch('/api/admin/siswa')
      const all: Siswa[] = response.ok ? await response.json() : []
      const siswaKelas = all.filter((s) => s.kelas === kelas.name).sort((a, b) =>
        a.namaLengkap.localeCompare(b.namaLengkap)
      )
      if (siswaKelas.length === 0) {
        toast.error(`Tidak ada siswa di kelas ${kelas.name}`)
        return
      }
      setKartuRequest({ kelas: kelas.name, siswa: siswaKelas })
    } catch {
      toast.error('Gagal memuat data siswa')
    }
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    setIsBulkDeleting(true)
    try {
      const response = await fetch('/api/admin/classroom/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.blockedCount > 0) {
          toast.warning(
            `${data.deletedCount} kelas dihapus. ${data.blockedCount} kelas dilewati karena masih memiliki siswa.`
          )
        } else {
          toast.success(`${data.deletedCount} kelas berhasil dihapus`)
        }
        setSelectedIds([])
        setShowBulkDeleteDialog(false)
        fetchClassrooms()
      } else {
        toast.error(data.message || 'Gagal menghapus kelas')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(selectableItems.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const toggleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
  }

  const toggleSort = (key: 'name' | 'angkatan' | 'createdAt') => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  // Sorted data (derived)
  const sortedClassrooms = useMemo(() => {
    if (!sortConfig) return classrooms
    const { key, dir } = sortConfig
    const factor = dir === 'asc' ? 1 : -1
    return [...classrooms].sort((a, b) => {
      if (key === 'angkatan') {
        return (Number(a.angkatan) - Number(b.angkatan)) * factor
      }
      if (key === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor
      }
      return a.name.localeCompare(b.name) * factor
    })
  }, [classrooms, sortConfig])

  // Pagination calculations
  const totalPages = Math.ceil(sortedClassrooms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = sortedClassrooms.slice(startIndex, endIndex)
  const selectableItems = currentItems
  const allCurrentSelected =
    selectableItems.length > 0 &&
    selectableItems.every((c) => selectedIds.includes(c.id))
  const someCurrentSelected =
    selectableItems.some((c) => selectedIds.includes(c.id)) && !allCurrentSelected

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

  // Drop selections that no longer exist (e.g. after delete/refetch)
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => classrooms.some((c) => c.id === id))
    )
  }, [classrooms])

  // Keep current page valid when total pages shrink
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

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
      <StatCardGrid>
        <StatCard
          title="Total Kelas"
          value={statistik.totalKelas}
          description="Kelas terdaftar"
          icon={School}
        />
        <StatCard
          title="Total Angkatan"
          value={statistik.totalAngkatan}
          description="Angkatan berbeda"
          icon={Layers}
        />
        <StatCard
          title="Angkatan Terbaru"
          value={statistik.angkatanTerbaru}
          description="Tahun terakhir"
          icon={Calendar}
        />
        <StatCard
          title="Data / Halaman"
          value={itemsPerPage}
          description={`Halaman ${currentPage} dari ${totalPages || 1}`}
          icon={ListChecks}
        />
      </StatCardGrid>

      {/* Data Kelas */}
      <Card>
        <DataTableToolbar
          title="Data Kelas"
          icon={School}
          description={
            <>
              Total {classrooms.length} kelas terdaftar
              {classrooms.length > 0 && (
                <span className="ml-2">
                  • Menampilkan {startIndex + 1}-{Math.min(endIndex, classrooms.length)} dari {classrooms.length}
                </span>
              )}
            </>
          }
          actions={
            <>
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
            </>
          }
        />
        <CardContent>
          {/* Bulk Action Toolbar */}
          <BulkActionBar
            selectedCount={selectedIds.length}
            itemLabel="kelas"
            onClear={() => setSelectedIds([])}
            onDelete={() => setShowBulkDeleteDialog(true)}
          />

          {/* Desktop View */}
          <div className="hidden rounded-md border sm:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        allCurrentSelected
                          ? true
                          : someCurrentSelected
                          ? 'indeterminate'
                          : false
                      }
                      onCheckedChange={(v) => toggleSelectAll(v === true)}
                      aria-label="Pilih semua"
                      disabled={selectableItems.length === 0}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort('name')}
                    >
                      Nama Kelas
                      {sortConfig?.key === 'name' ? (
                        sortConfig.dir === 'asc' ? <ArrowUp /> : <ArrowDown />
                      ) : (
                        <ArrowUpDown className="opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort('angkatan')}
                    >
                      Angkatan
                      {sortConfig?.key === 'angkatan' ? (
                        sortConfig.dir === 'asc' ? <ArrowUp /> : <ArrowDown />
                      ) : (
                        <ArrowUpDown className="opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort('createdAt')}
                    >
                      Tanggal Dibuat
                      {sortConfig?.key === 'createdAt' ? (
                        sortConfig.dir === 'asc' ? <ArrowUp /> : <ArrowDown />
                      ) : (
                        <ArrowUpDown className="opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-28 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-10">
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
                    <TableRow
                      key={classroom.id}
                      data-state={selectedIds.includes(classroom.id) ? 'selected' : undefined}
                      className="data-[state=selected]:bg-muted"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(classroom.id)}
                          onCheckedChange={(v) => toggleSelectOne(classroom.id, v === true)}
                          aria-label={`Pilih ${classroom.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{classroom.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{classroom.angkatan}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(classroom.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Kartu PDF kelas ini"
                            onClick={() => handleKartuKelas(classroom)}
                          >
                            <FileDown />
                            <span className="sr-only">Kartu PDF</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Edit kelas"
                            onClick={() => openEditDialog(classroom)}
                          >
                            <Pencil />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus kelas"
                            onClick={() => openDeleteDialog(classroom)}
                          >
                            <Trash2 />
                            <span className="sr-only">Hapus</span>
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
                <div
                  key={classroom.id}
                  className={`space-y-3 rounded-lg border p-4 transition-colors ${
                    selectedIds.includes(classroom.id) ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        className="mt-0.5"
                        checked={selectedIds.includes(classroom.id)}
                        onCheckedChange={(v) => toggleSelectOne(classroom.id, v === true)}
                        aria-label={`Pilih ${classroom.name}`}
                      />
                      <div>
                        <p className="text-sm font-semibold">{classroom.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(classroom.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{classroom.angkatan}</Badge>
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      title="Edit kelas"
                      onClick={() => openEditDialog(classroom)}
                    >
                      <Pencil />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Hapus kelas"
                      onClick={() => openDeleteDialog(classroom)}
                    >
                      <Trash2 />
                      <span className="sr-only">Hapus</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {classrooms.length > 0 && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
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


      {/* Delete ConfirmDialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Konfirmasi Hapus"
        description={
          <>
            Apakah Anda yakin ingin menghapus kelas{' '}
            <strong>{selectedClassroom?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </>
        }
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      {/* Bulk Delete ConfirmDialog */}
      <ConfirmDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title={`Hapus ${selectedIds.length} Kelas`}
        description={
          <>
            Apakah Anda yakin ingin menghapus <strong>{selectedIds.length}</strong> kelas yang dipilih?
            Kelas yang masih memiliki siswa terdaftar akan otomatis dilewati.
            Tindakan ini tidak dapat dibatalkan.
          </>
        }
        confirmLabel="Ya, Hapus Semua"
        isLoading={isBulkDeleting}
        onConfirm={handleBulkDelete}
      />

      {/* Kartu PDF per kelas: mount container hidden berisi siswa satu kelas,
          generate sekali (autoDownload), lalu unmount lewat onDone. */}
      {kartuRequest && (
        <StudentPdfCards
          siswa={kartuRequest.siswa}
          containerId="kartu-per-kelas-render"
          hideControls
          autoDownload
          fileName={`kartu-pemilih-${kartuRequest.kelas.replace(/[/\\]/g, '-')}.pdf`}
          onDone={() => setKartuRequest(null)}
        />
      )}
    </div>
  )
}
