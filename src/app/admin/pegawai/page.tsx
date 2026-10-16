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
import { Checkbox } from '@/components/ui/checkbox'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatCard, StatCardGrid } from '@/components/admin/stat-card'
import { DataTableToolbar } from '@/components/admin/data-table-toolbar'
import { DataTablePagination } from '@/components/admin/data-table-pagination'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import {
  Plus, Upload, Download, RefreshCw, Trash2, RotateCcw, Copy, Check, Loader2,
  Key, Search, Printer, Users, Briefcase, CheckCircle, MoreHorizontal, FileSpreadsheet, Info
} from 'lucide-react'
import { toast } from 'sonner'

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
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [classroomSearch, setClassroomSearch] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [regeneratingIds, setRegeneratingIds] = useState<number[]>([])
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

  const checkAdminSession = () => {
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }
    const session = JSON.parse(sessionData)
    setAdmin(session)
  }

  const fetchPegawai = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/pegawai?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPegawaiList(data)
      }
    } catch (err) {
      console.error('Error fetching pegawai:', err)
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

  const handlePrintCards = () => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Cetak Kartu Pegawai</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 10px; }
            .print-header { text-align: center; margin-bottom: 20px; font-size: 18px; font-weight: bold; }
            .print-cards-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 8px;
              margin-bottom: 20px;
            }
            .voter-card {
              border: 1px solid #1f2937;
              border-radius: 4px;
              padding: 6px;
              background: white;
              break-inside: avoid;
              width: 100%;
              box-sizing: border-box;
            }
            .print-header { text-align: center; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #1f2937; }
            .print-header h2 { font-size: 8px; font-weight: bold; color: #111827; margin: 0; line-height: 1; }
            .voter-card .space-y-0-5 { display: flex; flex-direction: column; gap: 2px; }
            .voter-card .flex { display: flex; font-size: 6px; line-height: 1; }
            .voter-card .w-16 { width: 64px; font-weight: 600; color: #374151; }
            .voter-card .flex-1 { flex: 1; }
            .voter-card .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .voter-card .flex-items-center { display: flex; align-items: center; margin-top: 4px; padding-top: 2px; border-top: 1px solid #d1d5db; }
            .token-span { font-size: 7px; font-weight: bold; letter-spacing: 0.05em; }
            .card-footer { margin-top: 2px; padding-top: 2px; border-top: 1px solid #d1d5db; font-size: 4px; color: #6b7280; text-align: center; line-height: 1; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>KARTU PEMILIHAN KETUA OSIS - PEGAWAI</h2>
          </div>
          <div class="print-cards-grid">
            ${pegawaiList
              .filter(p => p.status === 'aktif')
              .map(p => `
              <div class="voter-card">
                <div class="print-header">
                  <h2>PEMILIHAN KETUA OSIS</h2>
                </div>
                <div class="space-y-0-5">
                  <div class="flex">
                    <span class="w-16">JABATAN</span>
                    <span class="flex-1">: ${p.role === 'guru' ? 'GURU' : 'TENAGA KEPENDIDIKAN'}</span>
                  </div>
                  <div class="flex">
                    <span class="w-16">NAMA</span>
                    <span class="flex-1 truncate">: ${p.nama}</span>
                  </div>
                  <div class="flex">
                    <span class="w-16">EMAIL</span>
                    <span class="flex-1 truncate" style="font-size: 5px;">: ${p.email}</span>
                  </div>
                  <div class="flex-items-center">
                    <span class="w-16">TOKEN</span>
                    <span class="flex-1">: <span class="token-span">${p.tokenPlain}</span></span>
                  </div>
                </div>
                <div class="card-footer">Simpan kartu ini dengan baik</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
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

  const handleCopyToken = (token: string, nama: string) => {
    navigator.clipboard.writeText(token)
    setCopiedField(`token-${token}`)
    toast.success(`Token ${nama} disalin`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleCopyCredential = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} disalin`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleRegenerateToken = async (id: number) => {
    setRegeneratingIds([...regeneratingIds, id])
    try {
      const response = await fetch(`/api/admin/pegawai/${id}/regenerate-token`, {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        setCredentials(data.credentials)
        await fetchPegawai()
        toast.success('Token berhasil di-regenerate')
      }
    } catch (err) {
      toast.error('Gagal regenerate token')
    } finally {
      setRegeneratingIds(regeneratingIds.filter(rid => rid !== id))
    }
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentItems.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
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

  const isAllSelected = currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id))
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  // Stats
  const totalPegawai = pegawaiList.length
  const totalGuru = pegawaiList.filter(p => p.role === 'guru').length
  const totalTu = pegawaiList.filter(p => p.role === 'tu').length
  const sudahVote = pegawaiList.filter(p => p.sudahMemilih).length

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPegawai()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, roleFilter])

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Statistik Cards */}
      <StatCardGrid>
        <StatCard
          title="Total Pegawai"
          value={totalPegawai}
          description="Terdaftar"
          icon={Users}
        />
        <StatCard
          title="Guru"
          value={totalGuru}
          description={`${totalPegawai > 0 ? Math.round((totalGuru / totalPegawai) * 100) : 0}% dari total`}
          icon={Users}
        />
        <StatCard
          title="TU"
          value={totalTu}
          description={`${totalPegawai > 0 ? Math.round((totalTu / totalPegawai) * 100) : 0}% dari total`}
          icon={Briefcase}
        />
        <StatCard
          title="Sudah Vote"
          value={sudahVote}
          description={`${totalPegawai > 0 ? Math.round((sudahVote / totalPegawai) * 100) : 0}% partisipasi`}
          icon={CheckCircle}
        />
      </StatCardGrid>

      {/* Table */}
      <Card>
        <DataTableToolbar
          title="Daftar Pegawai"
          icon={Users}
          description={`Total ${totalPegawai} pegawai terdaftar`}
          actions={
            <>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download />
                Template
              </Button>
              <Button onClick={handleImport} variant="outline" size="sm">
                <Upload />
                Import
              </Button>
              <Button onClick={() => setShowPrintDialog(true)} variant="outline" size="sm">
                <Printer />
                Cetak Kartu
              </Button>
              <Button onClick={handleAddNew} size="sm">
                <Plus />
                Tambah
              </Button>
              <Button onClick={fetchPegawai} variant="outline" size="sm">
                <RefreshCw />
                Refresh
              </Button>
            </>
          }
        />
        <CardContent>
          {/* Search & Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <InputGroup className="flex-1">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            <div className="w-full sm:w-40">
              <Select
                value={roleFilter}
                onValueChange={(value: 'all' | 'guru' | 'tu') => setRoleFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
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

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
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
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vote</TableHead>
                      <TableHead className="w-24 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={8} className="py-10">
                          <Empty>
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <Users />
                              </EmptyMedia>
                              <EmptyTitle>
                                {searchQuery ? 'Tidak ada pegawai yang cocok' : 'Belum ada data pegawai'}
                              </EmptyTitle>
                              <EmptyDescription>
                                {searchQuery ? 'Coba ubah kata kunci pencarian.' : 'Tambahkan pegawai atau import dari Excel.'}
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((p) => (
                        <TableRow
                          key={p.id}
                          data-state={selectedIds.includes(p.id) ? 'selected' : undefined}
                          className="data-[state=selected]:bg-muted"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(p.id)}
                              onCheckedChange={(checked) => handleSelectOne(p.id, checked as boolean)}
                              aria-label={`Pilih ${p.nama}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{p.nama}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-muted px-2 py-1 font-mono text-xs font-bold">
                                {p.tokenPlain}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => handleCopyToken(p.tokenPlain, p.nama)}
                                title="Copy token"
                              >
                                {copiedField === `token-${p.tokenPlain}` ? (
                                  <Check className="size-3 text-primary" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {p.role === 'guru' ? 'Guru' : 'TU'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'aktif' ? 'default' : 'destructive'}>
                              {p.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.sudahMemilih ? 'default' : 'secondary'}>
                              {p.sudahMemilih ? 'Sudah' : 'Belum'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal />
                                  <span className="sr-only">Menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleRegenerateToken(p.id)}
                                  disabled={regeneratingIds.includes(p.id)}
                                >
                                  {regeneratingIds.includes(p.id) ? (
                                    <RefreshCw className="animate-spin" />
                                  ) : (
                                    <Key />
                                  )}
                                  Generate Token
                                </DropdownMenuItem>
                                {p.sudahMemilih && (
                                  <DropdownMenuItem onClick={() => handleResetStatus(p.id)}>
                                    <RotateCcw />
                                    Reset Status
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => setDeleteConfirm(p.id)}>
                                  <Trash2 />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                        {searchQuery ? 'Tidak ada pegawai yang cocok' : 'Belum ada data pegawai'}
                      </EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  currentItems.map((p) => (
                    <div
                      key={p.id}
                      className={`space-y-3 rounded-lg border p-4 transition-colors ${
                        selectedIds.includes(p.id) ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.includes(p.id)}
                          onCheckedChange={(checked) => handleSelectOne(p.id, checked as boolean)}
                          aria-label={`Pilih ${p.nama}`}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{p.nama}</p>
                          <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                              {p.tokenPlain}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => handleCopyToken(p.tokenPlain, p.nama)}
                            >
                              {copiedField === `token-${p.tokenPlain}` ? (
                                <Check className="size-3 text-primary" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </Button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant="outline">{p.role === 'guru' ? 'Guru' : 'TU'}</Badge>
                            <Badge variant={p.status === 'aktif' ? 'default' : 'destructive'}>
                              {p.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                            </Badge>
                            <Badge variant={p.sudahMemilih ? 'default' : 'secondary'}>
                              {p.sudahMemilih ? 'Sudah' : 'Belum'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="ml-8 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateToken(p.id)}
                          disabled={regeneratingIds.includes(p.id)}
                        >
                          {regeneratingIds.includes(p.id) ? (
                            <RefreshCw className="animate-spin" />
                          ) : (
                            <Key />
                          )}
                          Token
                        </Button>
                        {p.sudahMemilih && (
                          <Button variant="outline" size="sm" onClick={() => handleResetStatus(p.id)}>
                            <RotateCcw />
                            Reset
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
              Isi data pegawai. Email & token dibuat otomatis.
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
                  <SelectTrigger className="w-full">
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
                  <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
                size="sm"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
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


      {/* Credentials Modal */}
      <Dialog open={credentials !== null} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Akun Pegawai Dibuat</DialogTitle>
            <DialogDescription>
              Bagikan email & token untuk login di halaman voting (tab: Guru & TU)
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Email</p>
                <div className="flex gap-2">
                  <Input value={credentials.email} readOnly className="text-xs" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCredential(credentials.email, 'email')}
                  >
                    {copiedField === 'email' ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Token (6 karakter)</p>
                <div className="flex gap-2">
                  <Input
                    value={credentials.token}
                    readOnly
                    className="font-mono text-xs font-bold"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCredential(credentials.token, 'token')}
                  >
                    {copiedField === 'token' ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={() => setCredentials(null)} className="w-full">
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
        title="Hapus Pegawai"
        description="Apakah Anda yakin ingin menghapus pegawai ini? Aksi ini tidak dapat dibatalkan."
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
            <DialogTitle>Cetak Kartu Pegawai</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Hanya pegawai dengan status "Aktif" yang akan ditampilkan pada kartu.
            </p>
            <Alert>
              <Info className="size-4" />
              <AlertDescription className="text-xs">
                <strong>Info:</strong> Kartu akan ditampilkan dalam 4 kolom dan siap untuk dicetak.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setShowPrintDialog(false)}>
              Batal
            </Button>
            <Button type="button" onClick={handlePrintCards}>
              <Printer />
              Cetak
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
                  disabled={isImporting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={!importFile || isImporting}>
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
                    Kredensial Pegawai Baru ({importResult.credentials.length}):
                  </h4>
                  <ScrollArea className="max-h-40">
                    <div className="space-y-3">
                      {importResult.credentials.map((cred, idx) => (
                        <div key={idx} className="rounded border bg-background p-2 text-xs">
                          <p className="font-semibold">{cred.nama}</p>
                          <div className="mt-1 grid grid-cols-2 gap-2 text-muted-foreground">
                            <div>
                              <span>Email:</span>
                              <p className="break-all font-mono text-xs">{cred.email}</p>
                            </div>
                            <div>
                              <span>Role:</span>
                              <p className="font-semibold">{cred.role === 'guru' ? 'Guru' : 'TU'}</p>
                            </div>
                            <div className="col-span-2">
                              <span>Token:</span>
                              <p className="font-mono font-bold text-primary">{cred.token}</p>
                            </div>
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
                  <AlertTitle>Import Berhasil!</AlertTitle>
                  <AlertDescription className="text-xs">
                    {importResult.success} pegawai telah berhasil ditambahkan. Token dan kredensial telah dibuat otomatis.
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
                  className="w-full"
                >
                  Selesai
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
