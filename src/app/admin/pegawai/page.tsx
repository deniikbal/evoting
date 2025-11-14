'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/admin/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Plus, Upload, Download, RefreshCw, Trash2, RotateCcw, Copy, Check, Loader2, 
  Edit, Key, Search, ChevronLeft, ChevronRight, AlertTriangle, Printer, Users, Briefcase, CheckCircle
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import PegawaiCard from '@/components/admin/PegawaiCard'

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

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
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
    // TODO: Open import modal
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      <DashboardHeader admin={admin} onLogout={handleLogout} />
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-6">Daftar Guru & TU</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="col-span-1 rounded-sm bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">Total Pegawai</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-blue-900">{totalPegawai}</div>
                <p className="text-xs text-blue-600 mt-1">Terdaftar</p>
              </CardContent>
            </Card>
            <Card className="col-span-1 rounded-sm bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">Guru</CardTitle>
                <Users className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-purple-900">{totalGuru}</div>
                <p className="text-xs text-purple-600 mt-1">{totalPegawai > 0 ? Math.round((totalGuru / totalPegawai) * 100) : 0}% dari total</p>
              </CardContent>
            </Card>
            <Card className="col-span-1 rounded-sm bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-orange-700">TU</CardTitle>
                <Briefcase className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-orange-900">{totalTu}</div>
                <p className="text-xs text-orange-600 mt-1">{totalPegawai > 0 ? Math.round((totalTu / totalPegawai) * 100) : 0}% dari total</p>
              </CardContent>
            </Card>
            <Card className="col-span-1 rounded-sm bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700">Sudah Vote</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-emerald-900">{sudahVote}</div>
                <p className="text-xs text-emerald-600 mt-1">{totalPegawai > 0 ? Math.round((sudahVote / totalPegawai) * 100) : 0}% partisipasi</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Table */}
        <Card className="bg-white border-slate-200 rounded-sm">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Pegawai</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white border-0 shadow-md hover:shadow-lg transition-all text-xs"
                  >
                    <Download className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Template</span>
                  </Button>
                  <Button
                    onClick={handleImport}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md hover:shadow-lg transition-all text-xs"
                  >
                    <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Import</span>
                  </Button>
                  <Button
                    onClick={() => setShowPrintDialog(true)}
                    size="sm"
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-all text-xs"
                  >
                    <Printer className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Cetak Kartu</span>
                  </Button>
                  <Button
                    onClick={handleAddNew}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md hover:shadow-lg transition-all text-xs"
                  >
                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Tambah</span>
                  </Button>
                  <Button
                    onClick={fetchPegawai}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
                  >
                    <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="w-full sm:w-40">
                <Select
                  value={roleFilter}
                  onValueChange={(value: 'all' | 'guru' | 'tu') => setRoleFilter(value)}
                >
                  <SelectTrigger className="text-sm sm:text-base">
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
                  <SelectTrigger className="text-sm sm:text-base">
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

            {/* Desktop Table View */}
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
              </div>
            ) : (
              <>
                <div className="hidden sm:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vote</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {searchQuery ? 'Tidak ada pegawai yang cocok dengan pencarian' : 'Belum ada data pegawai'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentItems.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(p.id)}
                                onCheckedChange={(checked) => handleSelectOne(p.id, checked as boolean)}
                                aria-label={`Select ${p.nama}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{p.nama}</TableCell>
                            <TableCell className="text-sm text-slate-600">{p.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="px-2 py-1 bg-slate-100 rounded text-xs font-mono font-bold">
                                  {p.tokenPlain}
                                </code>
                                <button
                                  onClick={() => handleCopyToken(p.tokenPlain, p.nama)}
                                  className="p-1 rounded hover:bg-slate-100 transition-colors"
                                  title="Copy token"
                                >
                                  {copiedField === `token-${p.tokenPlain}` ? (
                                    <Check className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-500" />
                                  )}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  p.role === 'guru'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }
                              >
                                {p.role === 'guru' ? 'Guru' : 'TU'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  p.status === 'aktif'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }
                              >
                                {p.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={p.sudahMemilih ? 'default' : 'secondary'}
                              >
                                {p.sudahMemilih ? '✓ Sudah' : 'Belum'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleRegenerateToken(p.id)}
                                  disabled={regeneratingIds.includes(p.id)}
                                  className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                  title="Generate ulang token"
                                >
                                  {regeneratingIds.includes(p.id) ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Key className="w-4 h-4" />
                                  )}
                                </button>
                                {p.sudahMemilih && (
                                  <button
                                    onClick={() => handleResetStatus(p.id)}
                                    className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                                    title="Reset status pemilihan"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeleteConfirm(p.id)}
                                  className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                                  title="Hapus pegawai"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredPegawai.length > 0 && (
                  <div className="flex flex-col gap-4 mt-4">
                    {/* Mobile Pagination */}
                    <div className="sm:hidden flex flex-col gap-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-xs"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground px-2">
                          Hal {currentPage} dari {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-xs"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="text-gray-600">Tampilkan:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => handleItemsPerPageChange(Number(value))}
                        >
                          <SelectTrigger className="w-12 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-gray-600">data/halaman</span>
                      </div>
                    </div>

                    {/* Desktop Pagination */}
                    <div className="hidden sm:flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Tampilkan:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => handleItemsPerPageChange(Number(value))}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-600">data per halaman</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {(() => {
                            const pages = []
                            const maxVisible = 5
                            if (totalPages <= maxVisible) {
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i)
                              }
                            } else {
                              pages.push(1)
                              if (currentPage > 3) pages.push('...')
                              const start = Math.max(2, currentPage - 1)
                              const end = Math.min(totalPages - 1, currentPage + 1)
                              for (let i = start; i <= end; i++) {
                                if (i !== 1 && i !== totalPages) pages.push(i)
                              }
                              if (currentPage < totalPages - 2) pages.push('...')
                              if (totalPages > 1) pages.push(totalPages)
                            }
                            return pages.map((page, index) => {
                              if (page === '...') {
                                return (
                                  <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-gray-500">
                                    ...
                                  </span>
                                )
                              }
                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handlePageChange(page as number)}
                                  className="w-8 h-8 p-0"
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
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Halaman {currentPage} dari {totalPages}
                      </div>
                    </div>
                  </div>
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
          <DialogContent className="max-w-sm rounded-sm">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg">Tambah Pegawai Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitForm} className="space-y-3">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                  {formError}
                </div>
              )}

              {/* Row 1: Nama & Email */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="nama" className="text-xs">Nama *</Label>
                  <Input
                    id="nama"
                    placeholder="Nama lengkap"
                    value={formData.nama}
                    onChange={(e) =>
                      setFormData({ ...formData, nama: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@sekolah"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Role & Kelas */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="role" className="text-xs">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        role: value as 'guru' | 'tu',
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guru">Guru</SelectItem>
                      <SelectItem value="tu">TU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="classroomId" className="text-xs">Kelas</Label>
                  <Select
                    value={formData.classroomId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, classroomId: value })
                      setClassroomSearch('')
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm w-full">
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <div className="p-2 sticky top-0 bg-white border-b z-50">
                        <Input
                          placeholder="Cari kelas..."
                          value={classroomSearch}
                          onChange={(e) => setClassroomSearch(e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      {loadingClassrooms ? (
                        <div className="p-2 text-xs text-gray-500 text-center">Memuat...</div>
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
                        <div className="p-2 text-xs text-gray-500 text-center">
                          Tidak ada kelas
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: NIP & Nomor Induk */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="nip" className="text-xs">NIP</Label>
                  <Input
                    id="nip"
                    placeholder="123456789"
                    value={formData.nip}
                    onChange={(e) =>
                      setFormData({ ...formData, nip: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nomorInduk" className="text-xs">No. Induk</Label>
                  <Input
                    id="nomorInduk"
                    placeholder="G001"
                    value={formData.nomorInduk}
                    onChange={(e) =>
                      setFormData({ ...formData, nomorInduk: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Row 4: Status */}
              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as 'aktif' | 'non-aktif',
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
        {credentials && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white rounded-sm">
              <CardHeader>
                <CardTitle>Akun Pegawai Dibuat</CardTitle>
                <CardDescription>
                  Bagikan email & token untuk login di halaman voting (tab: Guru & TU)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email */}
                <div>
                  <p className="text-sm font-medium mb-2">Email</p>
                  <div className="flex gap-2">
                    <Input value={credentials.email} readOnly className="text-xs" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyCredential(credentials.email, 'email')}
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Token */}
                <div>
                  <p className="text-sm font-medium mb-2">Token (6 karakter)</p>
                  <div className="flex gap-2">
                    <Input
                      value={credentials.token}
                      readOnly
                      className="text-xs font-mono font-bold"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopyCredential(credentials.token, 'token')
                      }
                    >
                      {copiedField === 'token' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => setCredentials(null)}
                  className="w-full"
                >
                  Tutup
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent className="rounded-sm">
            <AlertDialogTitle>Hapus Pegawai</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pegawai ini? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteConfirm) {
                    handleDelete(deleteConfirm)
                    setDeleteConfirm(null)
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Hapus
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Print Dialog */}
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Cetak Kartu Pegawai</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Pilih pegawai yang akan dicetak kartunya. Hanya pegawai dengan status "Aktif" yang akan ditampilkan.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                <p className="text-xs text-blue-700">
                  💡 <strong>Info:</strong> Kartu akan ditampilkan dalam 2 kolom dan siap untuk dicetak.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPrintDialog(false)}
              >
                Batal
              </Button>
              <Button 
                type="button" 
                className="flex-1" 
                onClick={handlePrintCards}
              >
                <Printer className="w-4 h-4 mr-2" />
                Cetak
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
