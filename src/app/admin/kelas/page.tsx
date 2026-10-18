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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { StatCard } from '@/components/admin/stat-card'
import { DataTableToolbar } from '@/components/admin/data-table-toolbar'
import { DataTablePagination } from '@/components/admin/data-table-pagination'
import { BulkActionBar } from '@/components/admin/bulk-action-bar'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import {
  School, Plus, Pencil, Trash2, RefreshCw, Upload, Download,
  Layers, Users, Search, FileSpreadsheet, FileDown,
  ArrowUpDown, ArrowUp, ArrowDown, Loader2, CheckCircle, XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { StudentPdfCards } from '@/components/admin/student-pdf-cards'
import type { Siswa } from '@/app/admin/siswa/page'
import { bandingAngkatan, bandingNamaKelas, cocokCari, denganNomorUrut } from '@/lib/urutan-kelas'

interface Admin {
  id: number
  username: string
}

interface Classroom {
  id: number
  name: string
  angkatan: string
  createdAt: string
  /** Jumlah siswa terdaftar di kelas ini. Kelas berisi siswa tidak dapat dihapus. */
  jumlahSiswa: number
}

type KunciSort = 'name' | 'angkatan' | 'createdAt' | 'jumlahSiswa'

export default function KelasManagementPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [galatMuat, setGalatMuat] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [, setAdmin] = useState<Admin | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Kelas yang kartu PDF-nya sedang disiapkan.
  const [kelasKartu, setKelasKartu] = useState<string | null>(null)

  // Generate kartu PDF per kelas: container snapshot render hanya saat request aktif
  const [kartuRequest, setKartuRequest] = useState<{ kelas: string; siswa: Siswa[] } | null>(null)

  // Detail siswa satu kelas: dibuka dengan mengklik angka jumlah siswa.
  const [detailKelas, setDetailKelas] = useState<Classroom | null>(null)
  const [detailSiswa, setDetailSiswa] = useState<Array<Siswa & { nomorUrut: number }>>([])
  const [detailMemuat, setDetailMemuat] = useState(false)
  const [detailGalat, setDetailGalat] = useState<string | null>(null)

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: KunciSort; dir: 'asc' | 'desc' } | null>(null)

  // Pencarian nama kelas
  const [cari, setCari] = useState('')

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
    if (kelas.jumlahSiswa === 0) {
      toast.error(`Kelas ${kelas.name} belum memiliki siswa`)
      return
    }
    setKelasKartu(kelas.name)
    try {
      toast.info(`Menyiapkan kartu kelas ${kelas.name}...`)
      // Ambil hanya siswa kelas ini, bukan seluruh sekolah.
      const response = await fetch(
        `/api/admin/siswa?kelas=${encodeURIComponent(kelas.name)}`
      )
      const siswaKelas: Siswa[] = response.ok ? await response.json() : []
      if (siswaKelas.length === 0) {
        toast.error(`Tidak ada siswa di kelas ${kelas.name}`)
        return
      }
      setKartuRequest({ kelas: kelas.name, siswa: siswaKelas })
    } catch {
      toast.error('Gagal memuat data siswa')
    } finally {
      setKelasKartu(null)
    }
  }

  // Detail siswa satu kelas. Hanya dipanggil untuk kelas yang berisi siswa.
  const bukaDetailSiswa = async (kelas: Classroom) => {
    if (kelas.jumlahSiswa === 0) return
    setDetailKelas(kelas)
    setDetailSiswa([])
    setDetailGalat(null)
    setDetailMemuat(true)
    try {
      const response = await fetch(
        `/api/admin/siswa?kelas=${encodeURIComponent(kelas.name)}`,
        { cache: 'no-store' }
      )
      if (!response.ok) {
        setDetailGalat(`Server menjawab ${response.status} saat memuat siswa.`)
        return
      }
      const data: Siswa[] = await response.json()
      if (data.length === 0) {
        setDetailGalat(`Tidak ada siswa terdaftar di kelas ${kelas.name}.`)
        return
      }
      setDetailSiswa(denganNomorUrut(data))
    } catch {
      setDetailGalat('Data siswa tidak dapat diambil. Periksa koneksi lalu coba lagi.')
    } finally {
      setDetailMemuat(false)
    }
  }

  // Angka ringkasan di dialog detail: berapa yang sudah memilih.
  const ringkasDetail = useMemo(() => {
    const sudah = detailSiswa.filter((s) => s.sudahMemilih).length
    return { sudah, belum: detailSiswa.length - sudah, total: detailSiswa.length }
  }, [detailSiswa])

  const fetchClassrooms = async () => {
    setGalatMuat(null)
    try {
      const response = await fetch('/api/admin/classroom', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setClassrooms(data)
      } else {
        setGalatMuat(`Server menjawab ${response.status} saat memuat data kelas.`)
        toast.error('Gagal memuat data kelas')
      }
    } catch (err) {
      setGalatMuat(
        'Data kelas tidak dapat diambil. Periksa koneksi lalu coba lagi.'
      )
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

  const toggleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
  }

  const toggleSort = (key: KunciSort) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  // Hasil pencarian, lalu pengurutan.
  const tersaring = useMemo(
    () => classrooms.filter((c) => cocokCari(c.name, cari)),
    [classrooms, cari]
  )

  const sortedClassrooms = useMemo(() => {
    if (!sortConfig) return tersaring
    const { key, dir } = sortConfig
    const factor = dir === 'asc' ? 1 : -1
    return [...tersaring].sort((a, b) => {
      if (key === 'angkatan') return bandingAngkatan(a.angkatan, b.angkatan) * factor
      if (key === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor
      }
      if (key === 'jumlahSiswa') return (a.jumlahSiswa - b.jumlahSiswa) * factor
      return bandingNamaKelas(a.name, b.name) * factor
    })
  }, [tersaring, sortConfig])

  // Pagination calculations
  const totalPages = Math.ceil(sortedClassrooms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = sortedClassrooms.slice(startIndex, endIndex)
  const selectableItems = currentItems
  // Hanya kelas kosong yang dapat dihapus, jadi hanya itu yang bisa dipilih.
  const bisaDihapus = selectableItems.filter((c) => c.jumlahSiswa === 0)
  const allCurrentSelected =
    bisaDihapus.length > 0 && bisaDihapus.every((c) => selectedIds.includes(c.id))
  const someCurrentSelected =
    bisaDihapus.some((c) => selectedIds.includes(c.id)) && !allCurrentSelected

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...bisaDihapus.map((c) => c.id)])))
    } else {
      setSelectedIds((prev) => prev.filter((id) => !bisaDihapus.some((c) => c.id === id)))
    }
  }

  // Statistik turunan (derived)
  const statistik = useMemo(() => {
    const angkatanList = Array.from(new Set(classrooms.map((c) => c.angkatan)))
    const urutAngkatan = [...angkatanList].sort(bandingAngkatan)
    const totalSiswa = classrooms.reduce((s, c) => s + c.jumlahSiswa, 0)
    const kelasKosong = classrooms.filter((c) => c.jumlahSiswa === 0).length
    return {
      totalKelas: classrooms.length,
      totalAngkatan: angkatanList.length,
      angkatanTerbaru: urutAngkatan[urutAngkatan.length - 1] ?? '-',
      totalSiswa,
      kelasKosong,
    }
  }, [classrooms])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  // Kembali ke halaman 1 saat pencarian berubah.
  useEffect(() => {
    setCurrentPage(1)
  }, [cari])

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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
      {/* Angka ringkas: apa yang ada, dan satu keadaan yang butuh tindakan. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Kelas terdaftar"
          value={statistik.totalKelas}
          description={`${statistik.totalAngkatan} angkatan, terbaru ${statistik.angkatanTerbaru}`}
          icon={School}
        />
        <StatCard
          title="Siswa terdaftar"
          value={statistik.totalSiswa}
          description="Terhubung ke kelas"
          icon={Users}
        />
        <StatCard
          title="Kelas kosong"
          value={statistik.kelasKosong}
          description="Tanpa siswa, dapat dihapus"
          icon={Layers}
        />
        <StatCard
          title="Rata-rata per kelas"
          value={
            statistik.totalKelas > 0
              ? Math.round(statistik.totalSiswa / statistik.totalKelas)
              : 0
          }
          description="Siswa per kelas"
          icon={Users}
        />
      </div>

      <Card>
        <DataTableToolbar
          title="Data Kelas"
          icon={School}
          description={
            cari
              ? `${tersaring.length} dari ${classrooms.length} kelas cocok dengan pencarian`
              : classrooms.length > 0
                ? `Menampilkan ${startIndex + 1}-${Math.min(endIndex, sortedClassrooms.length)} dari ${classrooms.length} kelas`
                : 'Belum ada kelas terdaftar'
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
                      Unggah file Excel dengan kolom: name, angkatan
                    </DialogDescription>
                  </DialogHeader>

                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileSpreadsheet className="size-4" />
                      Belum punya template? Unduh dulu.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="w-full"
                    >
                      <Download />
                      Unduh Template Excel
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
                        placeholder="Contoh: XII"
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
          {/* Pencarian: 37 kelas tidak bisa dipindai halaman demi halaman. */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup className="sm:max-w-xs">
              <InputGroupAddon>
                <Search className="size-4" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Cari nama kelas"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                aria-label="Cari nama kelas"
              />
            </InputGroup>
            {statistik.kelasKosong > 0 && !cari ? (
              <p className="text-sm text-muted-foreground">
                {statistik.kelasKosong} kelas belum memiliki siswa
              </p>
            ) : null}
          </div>

          {galatMuat ? (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 px-4 py-3"
            >
              <p className="text-sm font-medium">Data kelas gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">{galatMuat}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={fetchClassrooms}
              >
                Coba lagi
              </Button>
            </div>
          ) : null}

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
                      aria-label="Pilih semua kelas yang dapat dihapus"
                      disabled={bisaDihapus.length === 0}
                    />
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort('name')}>
                      Nama Kelas
                      {sortConfig?.key === 'name' ? (
                        sortConfig.dir === 'asc' ? <ArrowUp /> : <ArrowDown />
                      ) : (
                        <ArrowUpDown className="opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort('angkatan')}>
                      Angkatan
                      {sortConfig?.key === 'angkatan' ? (
                        sortConfig.dir === 'asc' ? <ArrowUp /> : <ArrowDown />
                      ) : (
                        <ArrowUpDown className="opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort('jumlahSiswa')}>
                      Siswa
                      {sortConfig?.key === 'jumlahSiswa' ? (
                        sortConfig.dir === 'asc' ? <ArrowUp /> : <ArrowDown />
                      ) : (
                        <ArrowUpDown className="opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort('createdAt')}>
                      Dibuat
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
                    <TableCell colSpan={6} className="py-10">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <School />
                          </EmptyMedia>
                          <EmptyTitle>
                            {classrooms.length === 0
                              ? 'Belum ada kelas terdaftar'
                              : cari
                                ? 'Tidak ada kelas yang cocok'
                                : 'Tidak ada data pada halaman ini'}
                          </EmptyTitle>
                          <EmptyDescription>
                            {classrooms.length === 0
                              ? 'Tambahkan kelas baru atau impor dari Excel untuk memulai.'
                              : cari
                                ? `Tidak ada nama kelas yang memuat "${cari}". Hapus kata kunci untuk melihat semua kelas.`
                                : 'Coba pindah ke halaman lain.'}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((classroom) => {
                    const kosong = classroom.jumlahSiswa === 0
                    return (
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
                            disabled={!kosong}
                            title={
                              kosong
                                ? undefined
                                : 'Kelas masih memiliki siswa, hapus siswanya dahulu'
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{classroom.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{classroom.angkatan}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {kosong ? (
                            <span className="text-muted-foreground">0</span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 tabular-nums"
                              title={`Lihat siswa kelas ${classroom.name}`}
                              onClick={() => bukaDetailSiswa(classroom)}
                            >
                              {classroom.jumlahSiswa}
                              <span className="sr-only">
                                siswa di kelas {classroom.name}, klik untuk
                                melihat daftar dan status memilih
                              </span>
                            </Button>
                          )}
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
                              title={
                                kosong
                                  ? 'Belum ada siswa di kelas ini'
                                  : 'Unduh kartu pemilih kelas ini'
                              }
                              onClick={() => handleKartuKelas(classroom)}
                              disabled={kosong || kelasKartu !== null}
                            >
                              {kelasKartu === classroom.name ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <FileDown />
                              )}
                              <span className="sr-only">
                                Kartu pemilih {classroom.name}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Edit kelas"
                              onClick={() => openEditDialog(classroom)}
                            >
                              <Pencil />
                              <span className="sr-only">Edit {classroom.name}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title={
                                kosong
                                  ? 'Hapus kelas'
                                  : 'Kelas masih memiliki siswa dan tidak dapat dihapus'
                              }
                              onClick={() => openDeleteDialog(classroom)}
                              disabled={!kosong}
                            >
                              <Trash2 />
                              <span className="sr-only">Hapus {classroom.name}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
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
                    {classrooms.length === 0
                      ? 'Belum ada kelas terdaftar'
                      : cari
                        ? 'Tidak ada kelas yang cocok'
                        : 'Tidak ada data pada halaman ini'}
                  </EmptyTitle>
                  <EmptyDescription>
                    {classrooms.length === 0
                      ? 'Tambahkan kelas atau impor dari Excel.'
                      : cari
                        ? `Tidak ada nama kelas yang memuat "${cari}".`
                        : 'Coba pindah ke halaman lain.'}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              currentItems.map((classroom) => {
                const kosong = classroom.jumlahSiswa === 0
                return (
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
                          disabled={!kosong}
                        />
                        <div>
                          <p className="text-sm font-semibold">{classroom.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {classroom.jumlahSiswa > 0 ? (
                              <button
                                type="button"
                                className="font-medium underline underline-offset-2 hover:text-foreground"
                                onClick={() => bukaDetailSiswa(classroom)}
                              >
                                {classroom.jumlahSiswa} siswa
                                <span className="sr-only">
                                  , klik untuk melihat daftar dan status
                                  memilih kelas {classroom.name}
                                </span>
                              </button>
                            ) : (
                              'Belum ada siswa'
                            )}
                            <span className="mx-1">·</span>
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
                        className="size-9"
                        title="Kartu pemilih"
                        onClick={() => handleKartuKelas(classroom)}
                        disabled={kosong || kelasKartu !== null}
                      >
                        {kelasKartu === classroom.name ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <FileDown />
                        )}
                        <span className="sr-only">Kartu pemilih {classroom.name}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-9"
                        title="Edit kelas"
                        onClick={() => openEditDialog(classroom)}
                      >
                        <Pencil />
                        <span className="sr-only">Edit {classroom.name}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        title={kosong ? 'Hapus kelas' : 'Kelas masih memiliki siswa'}
                        onClick={() => openDeleteDialog(classroom)}
                        disabled={!kosong}
                      >
                        <Trash2 />
                        <span className="sr-only">Hapus {classroom.name}</span>
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {sortedClassrooms.length > 0 && (
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
              Perbarui nama atau angkatan kelas
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
                placeholder="Contoh: XII"
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
        title="Hapus kelas ini"
        description={
          <>
            Kelas <strong>{selectedClassroom?.name}</strong> akan dihapus permanen.
            Kelas ini tidak memiliki siswa, jadi aman dihapus.
          </>
        }
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      {/* Bulk Delete ConfirmDialog */}
      <ConfirmDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title={`Hapus ${selectedIds.length} kelas`}
        description={
          <>
            <strong>{selectedIds.length}</strong> kelas kosong yang dipilih akan
            dihapus permanen. Tindakan ini tidak dapat dibatalkan.
          </>
        }
        confirmLabel="Hapus kelas terpilih"
        isLoading={isBulkDeleting}
        onConfirm={handleBulkDelete}
      />

      {/* Detail siswa per kelas */}
      <Dialog
        open={detailKelas !== null}
        onOpenChange={(buka) => {
          if (!buka) {
            setDetailKelas(null)
            setDetailSiswa([])
            setDetailGalat(null)
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Siswa kelas {detailKelas?.name}</DialogTitle>
            <DialogDescription>
              Angkatan {detailKelas?.angkatan}. Nomor urut mengikuti urutan di
              kartu pemilih kelas ini.
            </DialogDescription>
          </DialogHeader>

          {detailMemuat && (
            <div className="space-y-2 py-4" aria-busy="true">
              <p className="text-sm text-muted-foreground">Memuat data siswa...</p>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          )}

          {!detailMemuat && detailGalat && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <XCircle />
                </EmptyMedia>
                <EmptyTitle>Data siswa tidak tampil</EmptyTitle>
                <EmptyDescription>{detailGalat}</EmptyDescription>
              </EmptyHeader>
              <Button
                variant="outline"
                size="sm"
                onClick={() => detailKelas && bukaDetailSiswa(detailKelas)}
              >
                <RefreshCw />
                Coba lagi
              </Button>
            </Empty>
          )}

          {!detailMemuat && !detailGalat && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="default">
                  <CheckCircle className="size-3" />
                  {ringkasDetail.sudah} sudah memilih
                </Badge>
                <Badge variant="secondary">
                  <XCircle className="size-3" />
                  {ringkasDetail.belum} belum memilih
                </Badge>
                <span className="ml-auto text-muted-foreground tabular-nums">
                  {ringkasDetail.total} siswa
                </span>
              </div>

              <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                <ul className="divide-y rounded-lg border">
                  {detailSiswa.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <span className="w-8 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                        {s.nomorUrut}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {s.namaLengkap}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          NIS {s.nis}
                        </p>
                      </div>
                      <Badge variant={s.sudahMemilih ? 'default' : 'secondary'}>
                        {s.sudahMemilih ? (
                          <>
                            <CheckCircle className="size-3" />
                            Sudah
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3" />
                            Belum
                          </>
                        )}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Kartu PDF per kelas */}
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
