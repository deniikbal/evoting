'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DataTableToolbar } from '@/components/admin/data-table-toolbar'
import { DataTablePagination } from '@/components/admin/data-table-pagination'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { PegawaiPdfCards } from '@/components/admin/pegawai-pdf-cards'
import {
  Plus, Upload, Download, RefreshCw, Trash2, RotateCcw, Copy, Check, Loader2,
  Search, Printer, Users, CheckCircle, FileSpreadsheet, FileDown, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { ambilSesiAdmin } from '@/lib/sesi-klien'

interface Admin {
  id: number
  username: string
}

interface Pegawai {
  id: number
  nama: string
  email: string
  role: 'guru' | 'tu'
  status: 'aktif' | 'non-aktif'
  sudahMemilih: boolean
  tokenPlain: string
  qrId: string
  classroomId?: number | null
  /** Nama kelas/group pegawai (GURU / TU / kelas mengajar), dari leftJoin classroom. */
  kelasNama?: string | null
  /** Dikirim /api/admin/pegawai (select *). Kosong pada data saat ini. */
  nip?: string | null
  nomorInduk?: string | null
}

interface Credentials {
  email: string
  token: string
}

interface Classroom {
  id: number
  name: string
  angkatan: string
}

interface FormData {
  nama: string
  email: string
  role: 'guru' | 'tu'
  nip: string
  nomorInduk: string
  classroomId: string
  status: 'aktif' | 'non-aktif'
}

export default function PegawaiPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [filteredPegawai, setFilteredPegawai] = useState<Pegawai[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'guru' | 'tu'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sudah' | 'belum'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    email: '',
    role: 'guru',
    nip: '',
    nomorInduk: '',
    classroomId: '',
    status: 'aktif',
  })
  const [formError, setFormError] = useState('')
  const [galatMuat, setGalatMuat] = useState('')
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(false)
  // Edit pegawai: tombol edit kini ada di tabel desktop dan kartu ponsel.
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null)
  const [editFormData, setEditFormData] = useState<{
    nama: string
    email: string
    role: 'guru' | 'tu'
    classroomId: string
    nip: string
    nomorInduk: string
    status: 'aktif' | 'non-aktif'
  }>({ nama: '', email: '', role: 'guru', classroomId: '', nip: '', nomorInduk: '', status: 'aktif' })
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [kartuRequest, setKartuRequest] = useState<Pegawai[] | null>(null)
  const [classroomSearch, setClassroomSearch] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    success: number
    failed: number
    errors: Array<{ row: number; error: string }>
    credentials: Array<{
      email: string
      password_plain: string
      token: string
      role: string
      nama: string
    }>
  } | null>(null)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    checkAdminSession()
    fetchPegawai()
    fetchClassrooms()
  }, [])

  useEffect(() => {
    // Filter pegawai
    let filtered = pegawaiList.filter(p =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(p => p.role === roleFilter)
    }

    // Apply status filter
    if (statusFilter === 'sudah') {
      filtered = filtered.filter(p => p.sudahMemilih)
    } else if (statusFilter === 'belum') {
      filtered = filtered.filter(p => !p.sudahMemilih)
    }

    setFilteredPegawai(filtered)
    setCurrentPage(1)
  }, [pegawaiList, searchQuery, roleFilter, statusFilter])

  const checkAdminSession = async () => {
    // Sesi diverifikasi server lewat cookie httpOnly; localStorage hanya
    // salinan untuk tampilan.
    const sesi = await ambilSesiAdmin()
    if (!sesi) {
      router.push('/login/admin')
      return
    }
    setAdmin(sesi)
  }

  const fetchPegawai = async () => {
    try {
      setIsLoading(true)
      setGalatMuat('')
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/pegawai?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPegawaiList(data)
      } else {
        setGalatMuat(
          response.status === 401 || response.status === 403
            ? 'Sesi admin tidak berlaku lagi. Masuk ulang untuk melihat data pegawai.'
            : `Server membalas error ${response.status} saat memuat data pegawai.`
        )
      }
    } catch (err) {
      console.error('Error fetching pegawai:', err)
      setGalatMuat('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClassrooms = async () => {
    try {
      setLoadingClassrooms(true)
      const response = await fetch('/api/admin/classroom')
      if (response.ok) {
        const data = await response.json()
        console.log('Classrooms loaded:', data)
        setClassrooms(data)
      } else {
        console.error('Failed to fetch classrooms:', response.status)
      }
    } catch (err) {
      console.error('Error fetching classrooms:', err)
    } finally {
      setLoadingClassrooms(false)
    }
  }

  const handleAddNew = () => {
    setFormError('')
    setFormData({
      nama: '',
      email: '',
      role: 'guru',
      nip: '',
      nomorInduk: '',
      classroomId: '',
      status: 'aktif',
    })
    setShowAddModal(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.nama || !formData.email || !formData.role) {
      setFormError('Nama, email, dan role harus diisi')
      return
    }

    if (!formData.email.includes('@')) {
      setFormError('Email tidak valid')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/pegawai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setCredentials(data.credentials)
        setFormData({
          nama: '',
          email: '',
          role: 'guru',
          nip: '',
          nomorInduk: '',
          classroomId: '',
          status: 'aktif',
        })
        setShowAddModal(false)
        await fetchPegawai()
      } else {
        setFormError(data.message || 'Gagal menambah pegawai')
      }
    } catch (err) {
      setFormError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (p: Pegawai) => {
    setFormError('')
    setSelectedPegawai(p)
    setEditFormData({
      nama: p.nama,
      email: p.email,
      role: p.role,
      classroomId: p.classroomId ? String(p.classroomId) : '',
      nip: p.nip || '',
      nomorInduk: p.nomorInduk || '',
      status: p.status,
    })
    setShowEditModal(true)
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPegawai) return

    if (!editFormData.nama || !editFormData.email) {
      setFormError('Nama dan email harus diisi')
      return
    }
    if (!editFormData.email.includes('@')) {
      setFormError('Email tidak valid')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/pegawai/${selectedPegawai.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Pegawai berhasil diperbarui')
        setShowEditModal(false)
        await fetchPegawai()
      } else {
        setFormError(data.message || 'Gagal memperbarui pegawai')
      }
    } catch (err) {
      setFormError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImport = () => {
    setImportFile(null)
    setImportResult(null)
    setImportError('')
    setImportProgress(0)
    setShowImportModal(true)
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!importFile) {
      setImportError('Pilih file terlebih dahulu')
      return
    }

    setIsImporting(true)
    setImportError('')
    setImportProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      setImportProgress(50)

      const response = await fetch('/api/admin/pegawai/import', {
        method: 'POST',
        body: formData,
      })

      setImportProgress(80)

      if (response.ok) {
        const data = await response.json()
        setImportResult(data.result)
        setImportProgress(100)
        await fetchPegawai()
        toast.success(`Import selesai: ${data.result.success} berhasil, ${data.result.failed} gagal`)
      } else {
        const data = await response.json()
        setImportError(data.message || 'Gagal mengimport data')
      }
    } catch (err) {
      setImportError('Terjadi kesalahan saat mengimport')
      console.error('Error importing:', err)
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        setImportError('File harus berformat Excel (.xlsx, .xls) atau CSV')
        return
      }
      setImportError('')
      setImportFile(file)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/pegawai/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template_pegawai.xlsx'
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting template:', err)
    }
  }

  // Kartu dicetak lewat PegawaiPdfCards (canvas QR -> html2canvas -> PDF A4).
  // Set state ini untuk memicu generate + download otomatis sekali.
  const handlePrintCards = () => {
    setShowPrintDialog(false)
    setKartuRequest(pegawaiList.filter((p) => p.status === 'aktif'))
  }

  const handleDelete = async (id: number) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/pegawai/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setPegawaiList(pegawaiList.filter(p => p.id !== id))
        toast.success('Pegawai berhasil dihapus')
      }
    } catch (err) {
      console.error('Error deleting pegawai:', err)
      toast.error('Gagal menghapus pegawai')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const handleCopyCredential = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} disalin`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleResetStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/pegawai/${id}/reset-vote`, {
        method: 'POST',
      })
      if (response.ok) {
        await fetchPegawai()
        toast.success('Status pemilihan berhasil direset')
      }
    } catch (err) {
      toast.error('Gagal reset status')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1)
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredPegawai.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = filteredPegawai.slice(startIndex, startIndex + itemsPerPage)

  // Statistik ringkas: satu baris teks, bukan deretan kartu angka (R-17: angka nyata saja).
  const totalPegawai = pegawaiList.length
  const totalGuru = pegawaiList.filter(p => p.role === 'guru').length
  const totalTu = pegawaiList.filter(p => p.role === 'tu').length
  const sudahVote = pegawaiList.filter(p => p.sudahMemilih).length
  const persenPemilih = totalPegawai > 0 ? Math.round((sudahVote / totalPegawai) * 100) : 0

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPegawai()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, roleFilter])

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Ringkasan: satu baris teks, satu angka yang menentukan tindakan (belum memilih). */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Pegawai</h1>
          <p className="text-sm text-muted-foreground">
            {totalPegawai} akun: {totalGuru} guru, {totalTu} TU. {sudahVote} sudah memilih,{' '}
            {totalPegawai - sudahVote} belum ({persenPemilih}%).
          </p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <DataTableToolbar
          title="Daftar pegawai"
          description="Guru dan tenaga kependidikan yang bisa memilih di bilik QR."
          actions={
            <>
              <Button onClick={handleExport} variant="outline" size="default" className="min-h-11 sm:min-h-0">
                <Download />
                Template
              </Button>
              <Button onClick={handleImport} variant="outline" size="default" className="min-h-11 sm:min-h-0">
                <Upload />
                Import
              </Button>
              <Button
                onClick={() => setShowPrintDialog(true)}
                variant="outline"
                size="default"
                className="min-h-11 sm:min-h-0"
              >
                <Printer />
                Cetak kartu
              </Button>
              <Button onClick={fetchPegawai} variant="outline" size="default" className="min-h-11 sm:min-h-0">
                <RefreshCw />
                Muat ulang
              </Button>
              <Button onClick={handleAddNew} size="default" className="min-h-11 sm:min-h-0">
                <Plus />
                Tambah pegawai
              </Button>
            </>
          }
        />
        <CardContent>
          {/* Search & Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <InputGroup className="flex-1 max-sm:min-h-11!">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Cari nama atau email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            <div className="w-full sm:w-40">
              <Select
                value={roleFilter}
                onValueChange={(value: 'all' | 'guru' | 'tu') => setRoleFilter(value)}
              >
                <SelectTrigger className="w-full min-h-11 sm:min-h-0">
                  <SelectValue placeholder="Filter role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua role</SelectItem>
                  <SelectItem value="guru">Guru</SelectItem>
                  <SelectItem value="tu">TU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'sudah' | 'belum') => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full min-h-11 sm:min-h-0">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="sudah">Sudah memilih</SelectItem>
                  <SelectItem value="belum">Belum memilih</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {galatMuat ? (
            <div role="alert" className="mb-4 rounded-lg border border-destructive/40 px-4 py-3">
              <p className="text-sm font-medium">Data pegawai gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">{galatMuat}</p>
              <Button type="button" variant="outline" size="default" className="mt-3 min-h-11 sm:min-h-0" onClick={fetchPegawai}>
                Coba lagi
              </Button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Memuat data pegawai">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden rounded-md border sm:block">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-slate-500">Nama</TableHead>
                      <TableHead className="text-slate-500">Role</TableHead>
                      <TableHead className="text-slate-500">Kelas</TableHead>
                      <TableHead className="text-slate-500">Status akun</TableHead>
                      <TableHead className="text-slate-500">Memilih</TableHead>
                      <TableHead className="w-32 text-right text-slate-500">Aksi</TableHead>
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
                                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                                  ? 'Tidak ada pegawai yang cocok'
                                  : 'Belum ada data pegawai'}
                              </EmptyTitle>
                              <EmptyDescription>
                                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                                  ? 'Longgarkan filter role atau status, atau ubah kata kunci pencarian.'
                                  : 'Tambah pegawai satu per satu, atau import dari Excel.'}
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <p className="font-medium">{p.nama}</p>
                            <p className="break-all text-xs text-muted-foreground">{p.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className="border-blue-200 bg-blue-50 text-blue-800" variant="outline">
                              {p.role === 'guru' ? 'Guru' : 'TU'}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {p.kelasNama || 'Tanpa kelas'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                p.status === 'aktif'
                                  ? 'border-green-200 bg-green-100 text-green-800'
                                  : 'border-slate-200 bg-slate-100 text-slate-600'
                              }
                              variant="outline"
                            >
                              {p.status === 'aktif' ? 'Aktif' : 'Non-aktif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                p.sudahMemilih
                                  ? 'border-green-200 bg-green-100 text-green-800'
                                  : 'border-slate-200 bg-slate-100 text-slate-600'
                              }
                              variant="outline"
                            >
                              {p.sudahMemilih ? 'Sudah' : 'Belum'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0"
                                title={`Edit ${p.nama}`}
                                onClick={() => handleEdit(p)}
                              >
                                <Pencil />
                                <span className="sr-only">Edit pegawai</span>
                              </Button>
                              {p.sudahMemilih ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0"
                                  title={`Reset status memilih ${p.nama}`}
                                  onClick={() => handleResetStatus(p.id)}
                                >
                                  <RotateCcw />
                                  <span className="sr-only">Reset status memilih</span>
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title={`Hapus ${p.nama}`}
                                onClick={() => setDeleteConfirm(p.id)}
                              >
                                <Trash2 />
                                <span className="sr-only">Hapus pegawai</span>
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
                        <Users />
                      </EmptyMedia>
                      <EmptyTitle>
                        {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                          ? 'Tidak ada pegawai yang cocok'
                          : 'Belum ada data pegawai'}
                      </EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  currentItems.map((p) => (
                    <div key={p.id} className="space-y-3 rounded-lg border p-4">
                      <div>
                        <p className="font-semibold">{p.nama}</p>
                        <p className="break-all text-xs text-muted-foreground">{p.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge className="border-blue-200 bg-blue-50 text-blue-800" variant="outline">
                          {p.role === 'guru' ? 'Guru' : 'TU'}
                        </Badge>
                        <Badge className="border-slate-200 bg-slate-100 text-slate-600" variant="outline">
                          {p.kelasNama || 'Tanpa kelas'}
                        </Badge>
                        <Badge
                          className={
                            p.status === 'aktif'
                              ? 'border-green-200 bg-green-100 text-green-800'
                              : 'border-slate-200 bg-slate-100 text-slate-600'
                          }
                          variant="outline"
                        >
                          {p.status === 'aktif' ? 'Aktif' : 'Non-aktif'}
                        </Badge>
                        <Badge
                          className={
                            p.sudahMemilih
                              ? 'border-green-200 bg-green-100 text-green-800'
                              : 'border-slate-200 bg-slate-100 text-slate-600'
                          }
                          variant="outline"
                        >
                          {p.sudahMemilih ? 'Sudah memilih' : 'Belum memilih'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="default"
                          className="min-h-11 sm:min-h-0"
                          onClick={() => handleEdit(p)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        {p.sudahMemilih ? (
                          <Button variant="outline" size="default" className="min-h-11 sm:min-h-0" onClick={() => handleResetStatus(p.id)}>
                            <RotateCcw />
                            Reset status
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="default"
                          className="min-h-11 sm:min-h-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteConfirm(p.id)}
                        >
                          <Trash2 />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {filteredPegawai.length > 0 && (
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Pegawai Modal */}
      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          if (!open) {
            setFormData({
              nama: '',
              email: '',
              role: 'guru',
              nip: '',
              nomorInduk: '',
              classroomId: '',
              status: 'aktif',
            })
            setFormError('')
          }
          setShowAddModal(open)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pegawai Baru</DialogTitle>
            <DialogDescription>
              Isi nama, email, dan role pegawai.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitForm} className="space-y-3">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="nama" className="text-xs">Nama *</Label>
                <Input
                  id="nama"
                  placeholder="Nama lengkap"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@sekolah"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as 'guru' | 'tu' })
                  }
                >
                  <SelectTrigger className="w-full min-h-11 sm:min-h-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guru">Guru</SelectItem>
                    <SelectItem value="tu">TU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Kelas</Label>
                <Select
                  value={formData.classroomId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, classroomId: value })
                    setClassroomSearch('')
                  }}
                >
                  <SelectTrigger className="w-full min-h-11 sm:min-h-0">
                    <SelectValue placeholder="Pilih kelas..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 z-50 border-b bg-popover p-2">
                      <Input
                        placeholder="Cari kelas..."
                        value={classroomSearch}
                        onChange={(e) => setClassroomSearch(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    {loadingClassrooms ? (
                      <div className="p-2 text-center text-xs text-muted-foreground">Memuat...</div>
                    ) : classrooms
                        .filter((c) =>
                          `${c.name} ${c.angkatan}`
                            .toLowerCase()
                            .includes(classroomSearch.toLowerCase())
                        )
                        .length > 0 ? (
                      classrooms
                        .filter((c) =>
                          `${c.name} ${c.angkatan}`
                            .toLowerCase()
                            .includes(classroomSearch.toLowerCase())
                        )
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name} ({c.angkatan})
                          </SelectItem>
                        ))
                    ) : (
                      <div className="p-2 text-center text-xs text-muted-foreground">
                        Tidak ada kelas
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="nip" className="text-xs">NIP</Label>
                <Input
                  id="nip"
                  placeholder="123456789"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nomorInduk" className="text-xs">No. Induk</Label>
                <Input
                  id="nomorInduk"
                  placeholder="G001"
                  value={formData.nomorInduk}
                  onChange={(e) => setFormData({ ...formData, nomorInduk: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as 'aktif' | 'non-aktif' })
                }
              >
                <SelectTrigger className="w-full min-h-11 sm:min-h-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                className="min-h-11 sm:min-h-0"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" size="default" className="min-h-11 sm:min-h-0" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Simpan
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* Edit Pegawai Modal */}
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditModal(false)
            setFormError('')
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit pegawai</DialogTitle>
            <DialogDescription>
              {selectedPegawai?.nama
                ? `Perbaiki data ${selectedPegawai.nama}. Kelas di sini adalah kelompok pemilihnya, bukan kelas mengajar.`
                : 'Perbaiki data pegawai.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-3">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor="edit-nama" className="text-xs">Nama *</Label>
              <Input
                id="edit-nama"
                placeholder="Nama lengkap"
                value={editFormData.nama}
                onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email" className="text-xs">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="email@sekolah"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Role *</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, role: value as 'guru' | 'tu' })
                  }
                >
                  <SelectTrigger className="w-full min-h-11 sm:min-h-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guru">Guru</SelectItem>
                    <SelectItem value="tu">TU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                {/* Kelas = kelompok pemilih (mis. GURU, TU); ikut ke daftar hadir per kelas. */}
                <Label className="text-xs">Kelas</Label>
                <Select
                  value={editFormData.classroomId}
                  onValueChange={(value) => {
                    setEditFormData({ ...editFormData, classroomId: value })
                    setClassroomSearch('')
                  }}
                >
                  <SelectTrigger className="w-full min-h-11 sm:min-h-0">
                    <SelectValue placeholder="Pilih kelas..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 z-50 border-b bg-popover p-2">
                      <Input
                        placeholder="Cari kelas..."
                        value={classroomSearch}
                        onChange={(e) => setClassroomSearch(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    {loadingClassrooms ? (
                      <div className="p-2 text-center text-xs text-muted-foreground">Memuat...</div>
                    ) : classrooms
                        .filter((c) =>
                          `${c.name} ${c.angkatan}`
                            .toLowerCase()
                            .includes(classroomSearch.toLowerCase())
                        )
                        .length > 0 ? (
                      classrooms
                        .filter((c) =>
                          `${c.name} ${c.angkatan}`
                            .toLowerCase()
                            .includes(classroomSearch.toLowerCase())
                        )
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name} ({c.angkatan})
                          </SelectItem>
                        ))
                    ) : (
                      <div className="p-2 text-center text-xs text-muted-foreground">
                        Tidak ada kelas
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="edit-nip" className="text-xs">NIP</Label>
                <Input
                  id="edit-nip"
                  placeholder="123456789"
                  value={editFormData.nip}
                  onChange={(e) => setEditFormData({ ...editFormData, nip: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-nomorInduk" className="text-xs">No. Induk</Label>
                <Input
                  id="edit-nomorInduk"
                  placeholder="G001"
                  value={editFormData.nomorInduk}
                  onChange={(e) => setEditFormData({ ...editFormData, nomorInduk: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, status: value as 'aktif' | 'non-aktif' })
                }
              >
                <SelectTrigger className="w-full min-h-11 sm:min-h-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                className="min-h-11 sm:min-h-0"
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" size="default" className="min-h-11 sm:min-h-0" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Menyimpan
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog akun baru: hanya email yang ditampilkan. Token login sengaja
          tidak ditampilkan di UI (DESIGN.md batasan 4); login pegawai kini lewat QR. */}
      <Dialog open={credentials !== null} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Akun pegawai dibuat</DialogTitle>
            <DialogDescription>
              Pegawai masuk ke bilik dengan memindai kartu QR. Email akun ini untuk
              keperluan administrasi.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="akun-email">Email akun</Label>
                <div className="flex gap-2">
                  <Input
                    id="akun-email"
                    value={credentials.email}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="shrink-0 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0"
                    title="Salin email akun"
                    onClick={() => handleCopyCredential(credentials.email, 'Email')}
                  >
                    {copiedField === 'Email' ? <Check className="size-4" /> : <Copy className="size-4" />}
                    <span className="sr-only">Salin email akun</span>
                  </Button>
                </div>
              </div>

              <Button onClick={() => setCredentials(null)} className="w-full min-h-11 sm:min-h-0">
                Tutup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Hapus pegawai"
        description="Akun pegawai ini dihapus dari daftar pemilih dan tidak dapat dikembalikan."
        confirmLabel="Hapus"
        isLoading={isDeleting}
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm)
        }}
      />

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cetak kartu pegawai</DialogTitle>
            <DialogDescription>
              Kartu berisi QR identitas pemilih, tiga kolom per halaman A4, dan
              langsung diunduh sebagai PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Hanya pegawai berstatus aktif yang masuk ke kartu.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="min-h-11 sm:min-h-0" onClick={() => setShowPrintDialog(false)}>
              Batal
            </Button>
            <Button type="button" className="min-h-11 sm:min-h-0" onClick={handlePrintCards}>
              <FileDown />
              Buat PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog
        open={showImportModal}
        onOpenChange={(open) => {
          if (!isImporting) {
            setShowImportModal(open)
            if (!open) {
              setImportFile(null)
              setImportResult(null)
              setImportError('')
              setImportProgress(0)
            }
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Data Pegawai</DialogTitle>
            <DialogDescription>
              Import data pegawai dari file Excel dengan format nama, email, dan role
            </DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <Alert>
                <FileSpreadsheet className="size-4" />
                <AlertTitle>Format File yang Diharapkan</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li><strong>Column A - Nama:</strong> Nama lengkap pegawai</li>
                    <li><strong>Column B - Email:</strong> Email yang unik</li>
                    <li><strong>Column C - Role:</strong> Gunakan "guru" atau "tu"</li>
                    <li><strong>Column D - Kelas:</strong> Nama kelas (opsional, harus sesuai dengan kelas yang ada)</li>
                  </ul>
                  <p className="mt-2 text-xs">
                    <strong>Tip:</strong> Gunakan template yang disediakan dengan klik tombol "Template".
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="import-file" className="text-sm font-semibold">Pilih File Excel</Label>
                <div
                  className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary"
                  onClick={() => document.getElementById('import-file')?.click()}
                >
                  <input
                    id="import-file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                    disabled={isImporting}
                    className="hidden"
                  />
                  <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {importFile ? importFile.name : 'Klik atau drag file di sini'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Format: .xlsx, .xls, atau .csv</p>
                </div>
              </div>

              {importError && (
                <Alert variant="destructive">
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Mengimport data...</span>
                    <span className="font-semibold">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  className="min-h-11 sm:min-h-0"
                  disabled={isImporting}
                >
                  Batal
                </Button>
                <Button type="submit" className="min-h-11 sm:min-h-0" disabled={!importFile || isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload />
                      Import
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Berhasil Import</p>
                    <p className="mt-1 text-2xl font-bold text-primary">{importResult.success}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Gagal Import</p>
                    <p className={`mt-1 text-2xl font-bold ${importResult.failed > 0 ? 'text-destructive' : ''}`}>
                      {importResult.failed}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Detail Error</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="mt-2 max-h-40">
                      <div className="space-y-2">
                        {importResult.errors.map((error, idx) => (
                          <div key={idx} className="rounded border p-2 text-xs">
                            <span className="font-semibold">Baris {error.row}:</span>{' '}
                            {error.error}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {importResult.credentials.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold">
                    Akun pegawai baru ({importResult.credentials.length})
                  </h4>
                  <ScrollArea className="max-h-40">
                    <div className="space-y-2">
                      {importResult.credentials.map((cred, idx) => (
                        <div key={idx} className="rounded border bg-background p-2 text-xs">
                          <p className="font-semibold">{cred.nama}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                            <span className="break-all">{cred.email}</span>
                            <Badge variant="outline">
                              {cred.role === 'guru' ? 'Guru' : 'TU'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {importResult.success > 0 && (
                <Alert>
                  <CheckCircle className="size-4" />
                  <AlertTitle>Import selesai</AlertTitle>
                  <AlertDescription className="text-xs">
                    {importResult.success} pegawai ditambahkan dan langsung bisa memilih
                    lewat kartu QR mereka.
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportResult(null)
                    setImportError('')
                    setImportProgress(0)
                  }}
                  className="w-full min-h-11 sm:min-h-0"
                >
                  Selesai
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Kartu pegawai: mount container hidden berisi pegawai aktif, generate
          sekali (autoDownload), lalu unmount lewat onDone. */}
      {kartuRequest && (
        <PegawaiPdfCards
          pegawai={kartuRequest}
          containerId="kartu-pegawai-render"
          hideControls
          autoDownload
          fileName={`kartu-pegawai-${new Date().toISOString().slice(0, 10)}.pdf`}
          onDone={() => setKartuRequest(null)}
        />
      )}
    </div>
  )
}
