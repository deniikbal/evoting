'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, Plus, Download, Upload, Edit, Trash2, RefreshCw, 
  ArrowLeft, Search, Eye, EyeOff, CheckCircle, XCircle, 
  ChevronLeft, ChevronRight 
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Siswa {
  id: number
  nis: string
  namaLengkap: string
  kelas: string
  sudahMemilih: boolean
  createdAt: string
}

export default function SiswaManagementPage() {
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const router = useRouter()

  // Form state for adding student
  const [formData, setFormData] = useState({
    nis: '',
    namaLengkap: '',
    kelas: ''
  })

  useEffect(() => {
    // Check admin session
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }

    fetchSiswa()
  }, [router])

  useEffect(() => {
    // Filter students based on search term
    const filtered = siswa.filter(s => 
      s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSiswa(filtered)
    setCurrentPage(1) // Reset to first page when search changes
  }, [siswa, searchTerm])

  const fetchSiswa = async () => {
    try {
      const response = await fetch('/api/admin/siswa')
      if (response.ok) {
        const data = await response.json()
        setSiswa(data)
      } else {
        setError('Gagal memuat data siswa')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

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
        setSuccess('Siswa berhasil ditambahkan')
        setFormData({ nis: '', namaLengkap: '', kelas: '' })
        setShowAddDialog(false)
        fetchSiswa()
      } else {
        setError(data.message || 'Gagal menambah siswa')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleDeleteSiswa = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return

    try {
      const response = await fetch(`/api/admin/siswa/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Siswa berhasil dihapus')
        fetchSiswa()
      } else {
        const data = await response.json()
        setError(data.message || 'Gagal menghapus siswa')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleResetStatus = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin mereset status pemilihan siswa ini?')) return

    try {
      const response = await fetch(`/api/admin/siswa/${id}/reset`, {
        method: 'POST',
      })

      if (response.ok) {
        setSuccess('Status pemilihan berhasil direset')
        fetchSiswa()
      } else {
        const data = await response.json()
        setError(data.message || 'Gagal mereset status')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleImportCSV = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    const file = formData.get('csvFile') as File

    if (!file) {
      setError('Pilih file CSV terlebih dahulu')
      return
    }

    try {
      const response = await fetch('/api/admin/siswa/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Berhasil mengimpor ${data.count} siswa`)
        setShowImportDialog(false)
        fetchSiswa()
      } else {
        setError(data.message || 'Gagal mengimpor data')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
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
        setSuccess('Token berhasil diekspor dalam format Excel')
      } else {
        setError('Gagal mengekspor token')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengekspor token')
    }
  }

  // Pagination functions
  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredSiswa.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1) // Reset to first page
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2">Memuat data siswa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Manajemen Siswa</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Kelola data siswa pemilih</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Data Siswa
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
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
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
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
              
              <div className="grid grid-cols-2 sm:flex gap-2">
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Tambah</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-lg">Tambah Siswa Baru</DialogTitle>
                      <DialogDescription className="text-sm">
                        Masukkan data siswa yang akan ditambahkan
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSiswa} className="space-y-4">
                      <div>
                        <Label htmlFor="nis" className="text-sm">NIS</Label>
                        <Input
                          id="nis"
                          value={formData.nis}
                          onChange={(e) => setFormData({...formData, nis: e.target.value})}
                          className="text-sm"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="namaLengkap" className="text-sm">Nama Lengkap</Label>
                        <Input
                          id="namaLengkap"
                          value={formData.namaLengkap}
                          onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                          className="text-sm"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="kelas" className="text-sm">Kelas</Label>
                        <Input
                          id="kelas"
                          value={formData.kelas}
                          onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                          placeholder="Contoh: XII IPA 1"
                          className="text-sm"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1">
                          Tambah
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Import</span>
                      <span className="sm:hidden">Import</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-lg">Import Data Siswa</DialogTitle>
                      <DialogDescription className="text-sm">
                        Upload file CSV dengan kolom: nis, nama_lengkap, kelas
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleImportCSV} className="space-y-4">
                      <div>
                        <Label htmlFor="csvFile" className="text-sm">File CSV</Label>
                        <Input
                          id="csvFile"
                          name="csvFile"
                          type="file"
                          accept=".csv"
                          className="text-sm"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1">
                          Import
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowImportDialog(false)}>
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={handleExportTokens} className="w-full sm:w-auto border-orange-200 text-orange-600 hover:bg-orange-50">
                  <Download className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Exp</span>
                </Button>

                <Button variant="outline" size="sm" onClick={fetchSiswa} className="w-full sm:w-auto">
                  <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">⟳</span>
                </Button>
              </div>
            </div>

            {/* Table - Desktop View */}
            <div className="hidden sm:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada data siswa'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nis}</TableCell>
                        <TableCell>{s.namaLengkap}</TableCell>
                        <TableCell>{s.kelas}</TableCell>
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
                          <div className="flex gap-2">
                            {s.sudahMemilih && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetStatus(s.id)}
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Reset
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSiswa(s.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
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
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{s.namaLengkap}</p>
                        <p className="text-xs text-gray-500">NIS: {s.nis}</p>
                        <p className="text-xs text-gray-500">Kelas: {s.kelas}</p>
                      </div>
                      <Badge variant={s.sudahMemilih ? "default" : "secondary"} className="text-xs">
                        {s.sudahMemilih ? 'Sudah' : 'Belum'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {s.sudahMemilih && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetStatus(s.id)}
                          className="text-xs px-2 py-1 h-auto"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSiswa(s.id)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Hapus
                      </Button>
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
                    
                    <span className="text-xs text-gray-600 px-2">
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

                  <div className="text-sm text-gray-600">
                    Halaman {currentPage} dari {totalPages}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}