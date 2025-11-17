'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, Plus, Download, Upload, Edit, Trash2, RefreshCw, 
  ArrowLeft, Search, Eye, EyeOff, CheckCircle, XCircle, 
  ChevronLeft, ChevronRight, AlertTriangle, Key, Copy, Printer
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/admin/DashboardHeader'
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
  const [showTokenDialog, setShowTokenDialog] = useState(false)
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

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

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

  const handleCopyToken = async (token: string, nama: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(token)
        toast.success(`Token ${nama} berhasil disalin`)
      } else {
        // Fallback for non-HTTPS or older browsers
        const textArea = document.createElement('textarea')
        textArea.value = token
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
          textArea.remove()
          toast.success(`Token ${nama} berhasil disalin`)
        } catch (err) {
          textArea.remove()
          toast.error('Gagal menyalin token. Silakan copy manual.')
        }
      }
    } catch (err) {
      console.error('Copy failed:', err)
      toast.error('Gagal menyalin token. Silakan copy manual.')
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-blue-900">Memuat data siswa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      <DashboardHeader admin={admin} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Statistik Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-700">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{siswa.length}</div>
              <p className="text-xs text-slate-500 mt-1">Terdaftar</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700">Sudah Memilih</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-emerald-900">{siswa.filter(s => s.sudahMemilih).length}</div>
              <p className="text-xs text-emerald-600 mt-1">
                {siswa.length > 0 ? Math.round((siswa.filter(s => s.sudahMemilih).length / siswa.length) * 100) : 0}% partisipasi
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-amber-700">Belum Memilih</CardTitle>
              <XCircle className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-amber-900">{siswa.filter(s => !s.sudahMemilih).length}</div>
              <p className="text-xs text-amber-600 mt-1">
                {siswa.length > 0 ? Math.round((siswa.filter(s => !s.sudahMemilih).length / siswa.length) * 100) : 0}% belum
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-indigo-700">Tingkat Partisipasi</CardTitle>
              <Users className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-indigo-900">
                {siswa.length > 0 ? Math.round((siswa.filter(s => s.sudahMemilih).length / siswa.length) * 100) : 0}%
              </div>
              <p className="text-xs text-indigo-600 mt-1">Dari total siswa</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="mb-6 rounded-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Data Siswa
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  <span className="block sm:inline">Total {siswa.length} siswa terdaftar</span>
                  {filteredSiswa.length !== siswa.length && (
                    <span className="text-orange-600 block sm:inline ml-0 sm:ml-2">
                      ({filteredSiswa.length} hasil filter)
                    </span>
                  )}
                  {filteredSiswa.length > 0 && (
                    <span className="text-gray-600 block sm:inline ml-0 sm:ml-2">
                      Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredSiswa.length)} dari {filteredSiswa.length}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedIds.length > 0 && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleRegenerateToken(selectedIds)}
                      disabled={regeneratingIds.length > 0}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
                    >
                      <Key className="w-4 h-4 mr-1 sm:mr-2" />
                      Generate Token ({selectedIds.length})
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={openBulkDeleteDialog}
                      className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                      Hapus {selectedIds.length}
                    </Button>
                  </>
                )}
                
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
                      <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                      Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle>Tambah Siswa Baru</DialogTitle>
                      <DialogDescription>
                        Masukkan data siswa yang akan ditambahkan
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSiswa} className="space-y-4">
                      <div>
                        <Label htmlFor="nis">NIS</Label>
                        <Input
                          id="nis"
                          value={formData.nis}
                          onChange={(e) => setFormData({...formData, nis: e.target.value})}
                          placeholder="Masukkan NIS"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                        <Input
                          id="namaLengkap"
                          value={formData.namaLengkap}
                          onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                          placeholder="Masukkan nama lengkap"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="classroom">Kelas</Label>
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
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1" disabled={!formData.classroomId || isAdding}>
                          {isAdding ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Menambahkan...
                            </>
                          ) : (
                            'Tambah'
                          )}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowAddDialog(false)} disabled={isAdding}>
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle>Edit Siswa</DialogTitle>
                      <DialogDescription>
                        Update data siswa
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSiswa} className="space-y-4">
                      <div>
                        <Label htmlFor="edit-nis">NIS</Label>
                        <Input
                          id="edit-nis"
                          value={formData.nis}
                          onChange={(e) => setFormData({...formData, nis: e.target.value})}
                          placeholder="Masukkan NIS"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-namaLengkap">Nama Lengkap</Label>
                        <Input
                          id="edit-namaLengkap"
                          value={formData.namaLengkap}
                          onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                          placeholder="Masukkan nama lengkap"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-classroom">Kelas</Label>
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
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1" disabled={!formData.classroomId || isEditing}>
                          {isEditing ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={showImportDialog} onOpenChange={(open) => {
                  if (!isImporting) {
                    setShowImportDialog(open)
                    if (!open) {
                      setImportProgress({ current: 0, total: 0, message: '' })
                    }
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
                      <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Import</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle>Import Data Siswa</DialogTitle>
                      <DialogDescription>
                        Upload file Excel dengan kolom: nis, nama_lengkap, kelas
                      </DialogDescription>
                    </DialogHeader>
                    
                    {!isImporting ? (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-blue-900 mb-2">
                            Belum punya template? Download template terlebih dahulu
                          </p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={handleDownloadTemplate}
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Template Excel
                          </Button>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-amber-800">
                            <strong>Tips:</strong> Nama kelas di Excel harus sama persis dengan nama kelas yang sudah terdaftar di menu Kelas untuk relasi otomatis.
                          </p>
                        </div>

                        <form onSubmit={handleImportCSV} className="space-y-4">
                          <div>
                            <Label htmlFor="xlsFile">File Excel</Label>
                            <Input
                              id="xlsFile"
                              name="xlsFile"
                              type="file"
                              accept=".xls,.xlsx"
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" className="flex-1" disabled={isImporting}>
                              <Upload className="w-4 h-4 mr-2" />
                              Import
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowImportDialog(false)} disabled={isImporting}>
                              Batal
                            </Button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="space-y-4 py-4">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            {importProgress.total > 0 && (
                              <span className="font-medium text-blue-600">
                                {importProgress.current} / {importProgress.total}
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                              style={{ 
                                width: importProgress.total > 0 
                                  ? `${(importProgress.current / importProgress.total) * 100}%`
                                  : '100%',
                                animation: importProgress.total === 0 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                              }}
                            ></div>
                          </div>
                          <p className="text-center text-sm text-gray-600 mt-2">
                            {importProgress.message || 'Memproses data...'}
                          </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800 text-center">
                            Mohon tunggu, jangan tutup dialog ini...
                          </p>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Button size="sm" onClick={handleExportTokens} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
                  <Download className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
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
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
                      <Printer className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Cetak Kartu</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Cetak Kartu Pemilih</DialogTitle>
                      <DialogDescription>
                        Pilih cara mencetak kartu peserta
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Print Mode Selector */}
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
                              className="w-4 h-4 cursor-pointer"
                            />
                            <Label htmlFor="mode-class" className="font-medium cursor-pointer">
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
                              className="w-4 h-4 cursor-pointer"
                            />
                            <Label htmlFor="mode-individual" className="font-medium cursor-pointer">
                              Pilih Peserta
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Class Mode */}
                      {printMode === 'class' && (
                        <div>
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

                      {/* Individual Mode */}
                      {printMode === 'individual' && (
                        <div className="space-y-3">
                          <div>
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Cari NIS, nama, atau kelas..."
                                value={printSearchTerm}
                                onChange={(e) => setPrintSearchTerm(e.target.value)}
                                className="pl-10 text-sm"
                              />
                            </div>
                          </div>
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
                              className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                            >
                              {printSearchTerm ? 'Pilih/Batal Hasil Pencarian' : 'Pilih/Batal Semua'}
                            </button>
                            <span className="text-xs text-gray-500">
                              ({selectedSiswaForPrint.length}/{siswa.length})
                            </span>
                          </div>
                          <div className="border rounded-lg max-h-64 overflow-y-auto p-3 space-y-2">
                            {getSearchedSiswaForSelection().length > 0 ? (
                              getSearchedSiswaForSelection().map((s) => (
                                <div key={s.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
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
                                    <span className="text-gray-500 ml-2">({s.nis}) - {s.kelas}</span>
                                  </Label>
                                </div>
                              ))
                            ) : printSearchTerm ? (
                              <p className="text-center text-sm text-gray-500 py-4">
                                Tidak ada siswa yang cocok dengan pencarian
                              </p>
                            ) : (
                              <p className="text-center text-sm text-gray-500 py-4">
                                Tidak ada siswa yang terdaftar
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900">
                          <strong>Preview:</strong> {getFilteredSiswaForPrint().length} kartu akan dicetak
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          className="flex-1" 
                          onClick={handlePrintCards}
                          disabled={getFilteredSiswaForPrint().length === 0}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Cetak ({getFilteredSiswaForPrint().length})
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowPrintDialog(false)}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button size="sm" onClick={fetchSiswa} className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
                  <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari NIS, nama, atau kelas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
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

            {/* Table - Desktop View */}
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
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada data siswa'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(s.id)}
                            onCheckedChange={(checked) => handleSelectOne(s.id, checked as boolean)}
                            aria-label={`Select ${s.namaLengkap}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{s.nis}</TableCell>
                        <TableCell>{s.namaLengkap}</TableCell>
                        <TableCell>{s.kelas}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">
                              {s.plainToken}
                            </code>
                            <button
                              onClick={() => handleCopyToken(s.plainToken, s.namaLengkap)}
                              className="p-1 rounded hover:bg-slate-100 transition-colors"
                              title="Copy token"
                            >
                              <Copy className="w-3 h-3 text-slate-500" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.sudahMemilih ? "default" : "secondary"}>
                            {s.sudahMemilih ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Sudah Memilih
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Belum Memilih
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditDialog(s)}
                              className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                              title="Edit siswa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRegenerateToken([s.id])}
                              disabled={regeneratingIds.includes(s.id)}
                              className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50"
                              title="Generate ulang token"
                            >
                              {regeneratingIds.includes(s.id) ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Key className="w-4 h-4" />
                              )}
                            </button>
                            {s.sudahMemilih && (
                              <button
                                onClick={() => handleResetStatus(s.id)}
                                className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                                title="Reset status pemilihan"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openDeleteDialog(s.id)}
                              className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                              title="Hapus siswa"
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

            {/* Table - Mobile View */}
            <div className="sm:hidden space-y-3">
              {currentItems.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border">
                  {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada data siswa'}
                </div>
              ) : (
                currentItems.map((s) => (
                  <div key={s.id} className="bg-white rounded-lg border p-4 space-y-3">
                    <div className="flex gap-3 items-start">
                      <Checkbox
                        checked={selectedIds.includes(s.id)}
                        onCheckedChange={(checked) => handleSelectOne(s.id, checked as boolean)}
                        aria-label={`Select ${s.namaLengkap}`}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{s.namaLengkap}</p>
                            <p className="text-xs text-gray-500">NIS: {s.nis}</p>
                            <p className="text-xs text-gray-500">Kelas: {s.kelas}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">
                                {s.plainToken}
                              </code>
                              <button
                                onClick={() => handleCopyToken(s.plainToken, s.namaLengkap)}
                                className="p-1 rounded hover:bg-slate-100"
                              >
                                <Copy className="w-3 h-3 text-slate-500" />
                              </button>
                            </div>
                          </div>
                          <Badge variant={s.sudahMemilih ? "default" : "secondary"} className="text-xs flex-shrink-0">
                            {s.sudahMemilih ? 'Sudah' : 'Belum'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-8 flex-wrap">
                      <button
                        onClick={() => openEditDialog(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleRegenerateToken([s.id])}
                        disabled={regeneratingIds.includes(s.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium disabled:opacity-50"
                      >
                        {regeneratingIds.includes(s.id) ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Key className="w-3.5 h-3.5" />
                        )}
                        Token
                      </button>
                      {s.sudahMemilih && (
                        <button
                          onClick={() => handleResetStatus(s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => openDeleteDialog(s.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {filteredSiswa.length > 0 && (
              <div className="flex flex-col gap-4 mt-4">
                {/* Mobile View */}
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

                {/* Desktop View */}
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
                          // Show all pages if total pages <= maxVisible
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i)
                          }
                        } else {
                          // Show first page
                          pages.push(1)

                          if (currentPage > 3) {
                            pages.push('...')
                          }

                          // Show pages around current page
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

                          // Show last page
                          if (totalPages > 1) {
                            pages.push(totalPages)
                          }
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
                              variant={currentPage === page ? "default" : "outline"}
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
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Konfirmasi Hapus
              </DialogTitle>
              <DialogDescription>
                {deleteType === 'single' 
                  ? 'Apakah Anda yakin ingin menghapus siswa ini? Tindakan ini tidak dapat dibatalkan.'
                  : `Apakah Anda yakin ingin menghapus ${selectedIds.length} siswa yang dipilih? Tindakan ini tidak dapat dibatalkan.`
                }
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
      </main>

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
            const pages = []
            
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