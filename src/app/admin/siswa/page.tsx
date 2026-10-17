'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { StatCard, StatCardGrid } from '@/components/admin/stat-card'
import { DataTableToolbar } from '@/components/admin/data-table-toolbar'
import { DataTablePagination } from '@/components/admin/data-table-pagination'
import { BulkActionBar } from '@/components/admin/bulk-action-bar'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { StudentPdfCards } from '@/components/admin/student-pdf-cards'
import {
  Users, Plus, Download, Upload, Pencil, Trash2, RefreshCw,
  Search, CheckCircle, XCircle, Key, Printer,
  UserCheck, UserX, Percent, FileSpreadsheet, Info,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import VoterCard from '@/components/admin/VoterCard'
import { toast } from 'sonner'

interface Admin {
  id: number
  username: string
}

export interface Siswa {
  id: number
  nis: string
  namaLengkap: string
  kelas: string
  classroomId: number | null
  plainToken: string
  qrId: string
  sudahMemilih: boolean
  createdAt: string
}

interface Classroom {
  id: number
  name: string
  angkatan: string
}

export default function SiswaManagementPage() {
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sudah' | 'belum'>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null)
  const [selectedClassForPrint, setSelectedClassForPrint] = useState<string>('all')
  const [printMode, setPrintMode] = useState<'class' | 'individual'>('class')
  const [selectedSiswaForPrint, setSelectedSiswaForPrint] = useState<number[]>([])
  const [printSearchTerm, setPrintSearchTerm] = useState<string>('')
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' })
  const [regeneratingIds, setRegeneratingIds] = useState<number[]>([])

  // Selection and delete states
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('single')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const router = useRouter()

  // Form state for adding/editing student
  const [formData, setFormData] = useState({
    nis: '',
    namaLengkap: '',
    kelas: '',
    classroomId: ''
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
    fetchSiswa()
    fetchClassrooms()
  }, [router])

  useEffect(() => {
    // Filter students based on search term and status
    let filtered = siswa.filter(s =>
      s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Apply status filter
    if (statusFilter === 'sudah') {
      filtered = filtered.filter(s => s.sudahMemilih)
    } else if (statusFilter === 'belum') {
      filtered = filtered.filter(s => !s.sudahMemilih)
    }

    setFilteredSiswa(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [siswa, searchTerm, statusFilter])

  const fetchSiswa = async () => {
    try {
      const response = await fetch('/api/admin/siswa')
      if (response.ok) {
        const data = await response.json()
        setSiswa(data)
      } else {
        toast.error('Gagal memuat data siswa')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/admin/classroom')
      if (response.ok) {
        const data = await response.json()
        setClassrooms(data)
      }
    } catch (err) {
      console.error('Error fetching classrooms:', err)
    }
  }

  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsAdding(true)
    try {
      const response = await fetch('/api/admin/siswa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Siswa berhasil ditambahkan')
        setFormData({ nis: '', namaLengkap: '', kelas: '', classroomId: '' })
        setShowAddDialog(false)
        fetchSiswa()
      } else {
        toast.error(data.message || 'Gagal menambah siswa')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsAdding(false)
    }
  }

  const openEditDialog = (siswa: Siswa) => {
    setSelectedSiswa(siswa)
    setFormData({
      nis: siswa.nis,
      namaLengkap: siswa.namaLengkap,
      kelas: siswa.kelas,
      classroomId: siswa.classroomId ? siswa.classroomId.toString() : ''
    })
    setShowEditDialog(true)
  }

  const handleEditSiswa = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSiswa) return

    setIsEditing(true)
    try {
      const response = await fetch(`/api/admin/siswa/${selectedSiswa.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Siswa berhasil diupdate')
        setFormData({ nis: '', namaLengkap: '', kelas: '', classroomId: '' })
        setShowEditDialog(false)
        setSelectedSiswa(null)
        fetchSiswa()
      } else {
        toast.error(data.message || 'Gagal mengupdate siswa')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsEditing(false)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredSiswa.slice(startIndex, endIndex)

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentItems.map(s => s.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const isAllSelected = currentItems.length > 0 && selectedIds.length === currentItems.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < currentItems.length

  // Delete handlers
  const openDeleteDialog = (id: number) => {
    setDeleteType('single')
    setDeleteTarget(id)
    setShowDeleteDialog(true)
  }

  const openBulkDeleteDialog = () => {
    setDeleteType('bulk')
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      if (deleteType === 'single' && deleteTarget) {
        const response = await fetch(`/api/admin/siswa/${deleteTarget}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          toast.success('Siswa berhasil dihapus')
          fetchSiswa()
        } else {
          const data = await response.json()
          toast.error(data.message || 'Gagal menghapus siswa')
        }
      } else if (deleteType === 'bulk') {
        let successCount = 0
        let errorCount = 0

        for (const id of selectedIds) {
          try {
            const response = await fetch(`/api/admin/siswa/${id}`, {
              method: 'DELETE',
            })
            if (response.ok) {
              successCount++
            } else {
              errorCount++
            }
          } catch {
            errorCount++
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} siswa berhasil dihapus${errorCount > 0 ? `, ${errorCount} gagal` : ''}`)
        } else {
          toast.error('Gagal menghapus siswa')
        }

        setSelectedIds([])
        fetchSiswa()
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  const handleResetStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/siswa/${id}/reset`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Status pemilihan berhasil direset')
        fetchSiswa()
      } else {
        const data = await response.json()
        toast.error(data.message || 'Gagal mereset status')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleRegenerateToken = async (studentIds: number[]) => {
    setRegeneratingIds(prev => [...prev, ...studentIds])

    try {
      const response = await fetch('/api/admin/siswa/regenerate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentIds }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchSiswa()
      } else {
        toast.error(data.message || 'Gagal generate ulang token')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setRegeneratingIds(prev => prev.filter(id => !studentIds.includes(id)))
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/siswa/template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template-import-siswa.xlsx'
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

  const handleImportCSV = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const file = formData.get('xlsFile') as File

    if (!file) {
      toast.error('Pilih file Excel terlebih dahulu')
      return
    }

    setIsImporting(true)
    setImportProgress({ current: 0, total: 0, message: 'Membaca file...' })

    try {
      setImportProgress({ current: 0, total: 0, message: 'Mengunggah dan memproses data...' })

      const response = await fetch('/api/admin/siswa/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setImportProgress({
          current: data.count,
          total: data.count,
          message: `Selesai! ${data.count} siswa berhasil diimpor`
        })

        toast.success(`Berhasil mengimpor ${data.count} siswa`)

        setTimeout(() => {
          setShowImportDialog(false)
          setIsImporting(false)
          setImportProgress({ current: 0, total: 0, message: '' })
          fetchSiswa()
        }, 1500)
      } else {
        toast.error(data.message || 'Gagal mengimpor data')
        setIsImporting(false)
        setImportProgress({ current: 0, total: 0, message: '' })
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
      setIsImporting(false)
      setImportProgress({ current: 0, total: 0, message: '' })
    }
  }

  const handleExportTokens = async () => {
    try {
      const response = await fetch('/api/admin/siswa/tokens')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'tokens-siswa.xls'
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Token berhasil diekspor dalam format Excel')
      } else {
        toast.error('Gagal mengekspor token')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengekspor token')
    }
  }

  // Pagination functions
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1) // Reset to first page
  }

  const handlePrintCards = () => {
    window.print()
  }

  const getFilteredSiswaForPrint = () => {
    if (printMode === 'individual') {
      return siswa.filter(s => selectedSiswaForPrint.includes(s.id))
    }

    if (selectedClassForPrint === 'all') {
      return siswa
    }
    return siswa.filter(s => s.kelas === selectedClassForPrint)
  }

  const getSearchedSiswaForSelection = () => {
    return siswa.filter(s =>
      s.nis.toLowerCase().includes(printSearchTerm.toLowerCase()) ||
      s.namaLengkap.toLowerCase().includes(printSearchTerm.toLowerCase()) ||
      s.kelas.toLowerCase().includes(printSearchTerm.toLowerCase())
    )
  }

  const uniqueClasses = Array.from(new Set(siswa.map(s => s.kelas))).sort()

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

  const persentasePartisipasi = siswa.length > 0
    ? Math.round((siswa.filter(s => s.sudahMemilih).length / siswa.length) * 100)
    : 0

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Statistik Cards */}
      <StatCardGrid>
        <StatCard
          title="Total Siswa"
          value={siswa.length}
          description="Terdaftar"
          icon={Users}
        />
        <StatCard
          title="Sudah Memilih"
          value={siswa.filter(s => s.sudahMemilih).length}
          description={`${persentasePartisipasi}% partisipasi`}
          icon={UserCheck}
        />
        <StatCard
          title="Belum Memilih"
          value={siswa.filter(s => !s.sudahMemilih).length}
          description={`${100 - persentasePartisipasi}% belum`}
          icon={UserX}
        />
        <StatCard
          title="Tingkat Partisipasi"
          value={`${persentasePartisipasi}%`}
          description="Dari total siswa"
          icon={Percent}
        />
      </StatCardGrid>

      {/* Data Siswa */}
      <Card>
        <DataTableToolbar
          title="Data Siswa"
          icon={Users}
          description={
            <>
              Total {siswa.length} siswa terdaftar
              {filteredSiswa.length !== siswa.length && (
                <span className="ml-2">({filteredSiswa.length} hasil filter)</span>
              )}
              {filteredSiswa.length > 0 && (
                <span className="ml-2">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredSiswa.length)} dari {filteredSiswa.length}
                </span>
              )}
            </>
          }
          actions={
            <>
              <StudentPdfCards
                siswa={filteredSiswa}
                label={`Download PDF (${filteredSiswa.length})`}
                fileName={`kartu-pemilih-${new Date().toISOString().slice(0, 10)}.pdf`}
              />

              <Dialog open={showImportDialog} onOpenChange={(open) => {
                if (!isImporting) {
                  setShowImportDialog(open)
                  if (!open) {
                    setImportProgress({ current: 0, total: 0, message: '' })
                  }
                }
              }}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Import Data Siswa</DialogTitle>
                    <DialogDescription>
                      Upload file Excel dengan kolom: nis, nama_lengkap, kelas
                    </DialogDescription>
                  </DialogHeader>

                  {!isImporting ? (
                    <>
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

                      <Alert>
                        <Info className="size-4" />
                        <AlertDescription className="text-xs">
                          <strong>Tips:</strong> Nama kelas di Excel harus sama persis dengan nama kelas yang sudah terdaftar di menu Kelas untuk relasi otomatis.
                        </AlertDescription>
                      </Alert>

                      <form onSubmit={handleImportCSV} className="space-y-4">
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
                            <Upload />
                            Import
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setShowImportDialog(false)} disabled={isImporting}>
                            Batal
                          </Button>
                        </DialogFooter>
                      </form>
                    </>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="size-8 animate-spin text-primary" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          {importProgress.total > 0 && (
                            <span className="font-medium">
                              {importProgress.current} / {importProgress.total}
                            </span>
                          )}
                        </div>
                        <Progress
                          value={importProgress.total > 0
                            ? (importProgress.current / importProgress.total) * 100
                            : 100}
                        />
                        <p className="mt-2 text-center text-sm text-muted-foreground">
                          {importProgress.message || 'Memproses data...'}
                        </p>
                      </div>
                      <Alert>
                        <AlertDescription className="text-center text-xs">
                          Mohon tunggu, jangan tutup dialog ini...
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={handleExportTokens}>
                <Download />
                Export
              </Button>

              <Dialog open={showPrintDialog} onOpenChange={(open) => {
                setShowPrintDialog(open)
                if (!open) {
                  setPrintMode('class')
                  setSelectedSiswaForPrint([])
                  setSelectedClassForPrint('all')
                  setPrintSearchTerm('')
                }
              }}>
                <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cetak Kartu Pemilih</DialogTitle>
                    <DialogDescription>
                      Pilih cara mencetak kartu peserta
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-3 border-b pb-4">
                      <Label className="text-base font-semibold">Mode Cetak</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="mode-class"
                            name="printMode"
                            value="class"
                            checked={printMode === 'class'}
                            onChange={() => {
                              setPrintMode('class')
                              setSelectedSiswaForPrint([])
                            }}
                            className="size-4 cursor-pointer"
                          />
                          <Label htmlFor="mode-class" className="cursor-pointer font-medium">
                            Cetak Berdasarkan Kelas
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="mode-individual"
                            name="printMode"
                            value="individual"
                            checked={printMode === 'individual'}
                            onChange={() => setPrintMode('individual')}
                            className="size-4 cursor-pointer"
                          />
                          <Label htmlFor="mode-individual" className="cursor-pointer font-medium">
                            Pilih Peserta
                          </Label>
                        </div>
                      </div>
                    </div>

                    {printMode === 'class' && (
                      <div className="space-y-2">
                        <Label htmlFor="print-class">Pilih Kelas</Label>
                        <Select
                          value={selectedClassForPrint}
                          onValueChange={setSelectedClassForPrint}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih kelas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Kelas ({siswa.length} siswa)</SelectItem>
                            {uniqueClasses.map((kelas) => {
                              const count = siswa.filter(s => s.kelas === kelas).length
                              return (
                                <SelectItem key={kelas} value={kelas}>
                                  {kelas} ({count} siswa)
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {printMode === 'individual' && (
                      <div className="space-y-3">
                        <InputGroup>
                          <InputGroupAddon>
                            <Search className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput
                            placeholder="Cari NIS, nama, atau kelas..."
                            value={printSearchTerm}
                            onChange={(e) => setPrintSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const searchedSiswa = getSearchedSiswaForSelection()
                              const allSearchedIds = searchedSiswa.map(s => s.id)
                              const allSelected = allSearchedIds.every(id => selectedSiswaForPrint.includes(id))

                              if (allSelected) {
                                setSelectedSiswaForPrint(selectedSiswaForPrint.filter(id => !allSearchedIds.includes(id)))
                              } else {
                                const newSelected = new Set(selectedSiswaForPrint)
                                allSearchedIds.forEach(id => newSelected.add(id))
                                setSelectedSiswaForPrint(Array.from(newSelected))
                              }
                            }}
                            className="text-xs font-medium text-primary underline hover:opacity-80"
                          >
                            {printSearchTerm ? 'Pilih/Batal Hasil Pencarian' : 'Pilih/Batal Semua'}
                          </button>
                          <span className="text-xs text-muted-foreground">
                            ({selectedSiswaForPrint.length}/{siswa.length})
                          </span>
                        </div>
                        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                          {getSearchedSiswaForSelection().length > 0 ? (
                            getSearchedSiswaForSelection().map((s) => (
                              <div key={s.id} className="flex items-center gap-2 rounded p-2 hover:bg-muted/50">
                                <Checkbox
                                  id={`print-siswa-${s.id}`}
                                  checked={selectedSiswaForPrint.includes(s.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSiswaForPrint([...selectedSiswaForPrint, s.id])
                                    } else {
                                      setSelectedSiswaForPrint(selectedSiswaForPrint.filter(id => id !== s.id))
                                    }
                                  }}
                                />
                                <Label htmlFor={`print-siswa-${s.id}`} className="flex-1 cursor-pointer text-sm">
                                  <span className="font-medium">{s.namaLengkap}</span>
                                  <span className="ml-2 text-muted-foreground">({s.nis}) - {s.kelas}</span>
                                </Label>
                              </div>
                            ))
                          ) : printSearchTerm ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                              Tidak ada siswa yang cocok dengan pencarian
                            </p>
                          ) : (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                              Tidak ada siswa yang terdaftar
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <Alert>
                      <AlertDescription className="text-sm">
                        <strong>Preview:</strong> {getFilteredSiswaForPrint().length} kartu akan dicetak
                      </AlertDescription>
                    </Alert>
                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        onClick={handlePrintCards}
                        disabled={getFilteredSiswaForPrint().length === 0}
                      >
                        <Printer />
                        Cetak ({getFilteredSiswaForPrint().length})
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPrintDialog(false)}
                      >
                        Batal
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah Siswa Baru</DialogTitle>
                    <DialogDescription>
                      Masukkan data siswa yang akan ditambahkan
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddSiswa} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nis">NIS</Label>
                      <Input
                        id="nis"
                        value={formData.nis}
                        onChange={(e) => setFormData({...formData, nis: e.target.value})}
                        placeholder="Masukkan NIS"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                      <Input
                        id="namaLengkap"
                        value={formData.namaLengkap}
                        onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kelas</Label>
                      <Select
                        value={formData.classroomId}
                        onValueChange={(value) => {
                          const selectedClass = classrooms.find(c => c.id.toString() === value)
                          setFormData({
                            ...formData,
                            classroomId: value,
                            kelas: selectedClass ? selectedClass.name : ''
                          })
                        }}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                        <SelectContent>
                          {classrooms.map((classroom) => (
                            <SelectItem key={classroom.id} value={classroom.id.toString()}>
                              {classroom.name} - {classroom.angkatan}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button type="submit" size="sm" disabled={!formData.classroomId || isAdding}>
                        {isAdding ? (
                          <>
                            <RefreshCw className="animate-spin" />
                            Menambahkan...
                          </>
                        ) : (
                          'Tambah'
                        )}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAddDialog(false)} disabled={isAdding}>
                        Batal
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={fetchSiswa}>
                <RefreshCw />
                Refresh
              </Button>
            </>
          }
        />
        <CardContent>
          <BulkActionBar
            selectedCount={selectedIds.length}
            itemLabel="siswa"
            onClear={() => setSelectedIds([])}
            onDelete={openBulkDeleteDialog}
            deleteLabel={`Hapus ${selectedIds.length} Siswa`}
          />
          {selectedIds.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="mb-4"
              onClick={() => handleRegenerateToken(selectedIds)}
              disabled={regeneratingIds.length > 0}
            >
              <Key />
              Generate Token ({selectedIds.length})
            </Button>
          )}

          {/* Search & Filter */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <InputGroup className="flex-1">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Cari NIS, nama, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'sudah' | 'belum') => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="sudah">Sudah Memilih</SelectItem>
                  <SelectItem value="belum">Belum Memilih</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="hidden rounded-md border sm:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                      onCheckedChange={(v) => handleSelectAll(v === true)}
                      aria-label="Pilih semua"
                    />
                  </TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-36 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-10">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Users />
                          </EmptyMedia>
                          <EmptyTitle>
                            {searchTerm ? 'Tidak ada siswa yang cocok' : 'Belum ada data siswa'}
                          </EmptyTitle>
                          <EmptyDescription>
                            {searchTerm ? 'Coba ubah kata kunci pencarian.' : 'Tambahkan siswa atau import dari Excel.'}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((s) => (
                    <TableRow
                      key={s.id}
                      data-state={selectedIds.includes(s.id) ? 'selected' : undefined}
                      className="data-[state=selected]:bg-muted"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(s.id)}
                          onCheckedChange={(checked) => handleSelectOne(s.id, checked as boolean)}
                          aria-label={`Pilih ${s.namaLengkap}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{s.nis}</TableCell>
                      <TableCell>{s.namaLengkap}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.kelas}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.sudahMemilih ? 'default' : 'secondary'}>
                          {s.sudahMemilih ? (
                            <>
                              <CheckCircle className="size-3" />
                              Sudah Memilih
                            </>
                          ) : (
                            <>
                              <XCircle className="size-3" />
                              Belum Memilih
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Edit siswa"
                            onClick={() => openEditDialog(s)}
                          >
                            <Pencil />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Generate token baru"
                            onClick={() => handleRegenerateToken([s.id])}
                            disabled={regeneratingIds.includes(s.id)}
                          >
                            {regeneratingIds.includes(s.id) ? (
                              <RefreshCw className="animate-spin" />
                            ) : (
                              <Key />
                            )}
                            <span className="sr-only">Generate Token</span>
                          </Button>
                          {s.sudahMemilih && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Reset status memilih"
                              onClick={() => handleResetStatus(s.id)}
                            >
                              <RefreshCw />
                              <span className="sr-only">Reset Status</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus siswa"
                            onClick={() => openDeleteDialog(s.id)}
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

          {/* Table - Mobile */}
          <div className="space-y-3 sm:hidden">
            {currentItems.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>
                    {searchTerm ? 'Tidak ada siswa yang cocok' : 'Belum ada data siswa'}
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              currentItems.map((s) => (
                <div
                  key={s.id}
                  className={`space-y-3 rounded-lg border p-4 transition-colors ${
                    selectedIds.includes(s.id) ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.includes(s.id)}
                      onCheckedChange={(checked) => handleSelectOne(s.id, checked as boolean)}
                      aria-label={`Pilih ${s.namaLengkap}`}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{s.namaLengkap}</p>
                          <p className="text-xs text-muted-foreground">NIS: {s.nis}</p>
                          <p className="text-xs text-muted-foreground">Kelas: {s.kelas}</p>
                        </div>
                        <Badge variant={s.sudahMemilih ? 'default' : 'secondary'} className="shrink-0 text-xs">
                          {s.sudahMemilih ? 'Sudah' : 'Belum'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="ml-8 flex flex-wrap justify-end gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      title="Edit siswa"
                      onClick={() => openEditDialog(s)}
                    >
                      <Pencil />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      title="Generate token baru"
                      onClick={() => handleRegenerateToken([s.id])}
                      disabled={regeneratingIds.includes(s.id)}
                    >
                      {regeneratingIds.includes(s.id) ? (
                        <RefreshCw className="animate-spin" />
                      ) : (
                        <Key />
                      )}
                      <span className="sr-only">Token</span>
                    </Button>
                    {s.sudahMemilih && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        title="Reset status memilih"
                        onClick={() => handleResetStatus(s.id)}
                      >
                        <RefreshCw />
                        <span className="sr-only">Reset</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Hapus siswa"
                      onClick={() => openDeleteDialog(s.id)}
                    >
                      <Trash2 />
                      <span className="sr-only">Hapus</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredSiswa.length > 0 && (
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
            <DialogTitle>Edit Siswa</DialogTitle>
            <DialogDescription>
              Update data siswa
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSiswa} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nis">NIS</Label>
              <Input
                id="edit-nis"
                value={formData.nis}
                onChange={(e) => setFormData({...formData, nis: e.target.value})}
                placeholder="Masukkan NIS"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-namaLengkap">Nama Lengkap</Label>
              <Input
                id="edit-namaLengkap"
                value={formData.namaLengkap}
                onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select
                value={formData.classroomId}
                onValueChange={(value) => {
                  const selectedClass = classrooms.find(c => c.id.toString() === value)
                  setFormData({
                    ...formData,
                    classroomId: value,
                    kelas: selectedClass ? selectedClass.name : ''
                  })
                }}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id.toString()}>
                      {classroom.name} - {classroom.angkatan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button type="submit" size="sm" disabled={!formData.classroomId || isEditing}>
                {isEditing ? (
                  <>
                    <RefreshCw className="animate-spin" />
                    Mengupdate...
                  </>
                ) : (
                  'Update'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEditDialog(false)
                  setSelectedSiswa(null)
                  setFormData({ nis: '', namaLengkap: '', kelas: '', classroomId: '' })
                }}
                disabled={isEditing}
              >
                Batal
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
        description={
          deleteType === 'single'
            ? 'Apakah Anda yakin ingin menghapus siswa ini? Tindakan ini tidak dapat dibatalkan.'
            : `Apakah Anda yakin ingin menghapus ${selectedIds.length} siswa yang dipilih? Tindakan ini tidak dapat dibatalkan.`
        }
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      {/* Print Area - Hidden on screen, visible on print */}
      <div className="print-only">
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }

            body * {
              visibility: hidden;
            }

            .print-only, .print-only * {
              visibility: visible;
            }

            .print-only {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }

            .print-page {
              page-break-after: always;
              width: 100%;
            }

            .print-page:last-child {
              page-break-after: auto;
            }

            .print-header {
              text-align: center;
              margin-bottom: 10px;
              padding: 10px;
              border-bottom: 2px solid #333;
            }

            .print-header h2 {
              margin: 0;
              font-size: 18px;
              font-weight: bold;
            }

            .print-cards-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 6px;
              width: 100%;
            }

            .voter-card {
              page-break-inside: avoid;
              width: 100%;
            }
          }

          @media screen {
            .print-only {
              display: none;
            }
          }
        `}</style>

        <div>
          {(() => {
            const siswaList = getFilteredSiswaForPrint()
            const pages: React.ReactNode[] = []

            // Group students by kelas
            const groupedByKelas: { [key: string]: typeof siswaList } = {}
            siswaList.forEach(s => {
              if (!groupedByKelas[s.kelas]) {
                groupedByKelas[s.kelas] = []
              }
              groupedByKelas[s.kelas].push(s)
            })

            // Create one page per kelas
            Object.keys(groupedByKelas).sort().forEach(kelas => {
              const kelasStudents = groupedByKelas[kelas]
              pages.push(
                <div key={kelas} className="print-page">
                  <div className="print-header">
                    <h2>KARTU PEMILIHAN KELAS {kelas}</h2>
                  </div>
                  <div className="print-cards-grid">
                    {kelasStudents.map((s) => (
                      <VoterCard key={s.id} siswa={s} />
                    ))}
                  </div>
                </div>
              )
            })

            return pages
          })()}
        </div>
      </div>
    </div>
  )
}
