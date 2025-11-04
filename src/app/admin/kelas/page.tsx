'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  School, Plus, Edit, Trash2, RefreshCw, AlertTriangle, Upload, Download, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/admin/DashboardHeader'
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-blue-900">Memuat data kelas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      <DashboardHeader admin={admin} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Card className="rounded-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <School className="w-4 h-4 sm:w-5 sm:h-5" />
                  Data Kelas
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Total {classrooms.length} kelas terdaftar
                  {classrooms.length > 0 && (
                    <span className="text-gray-600 block sm:inline ml-0 sm:ml-2">
                      • Menampilkan {startIndex + 1}-{Math.min(endIndex, classrooms.length)} dari {classrooms.length}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Import</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle>Import Data Kelas</DialogTitle>
                      <DialogDescription>
                        Upload file Excel dengan kolom: name, angkatan
                      </DialogDescription>
                    </DialogHeader>
                    
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

                    <form onSubmit={handleImportExcel} className="space-y-4">
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
                          {isImporting ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Mengimpor...
                            </>
                          ) : (
                            'Import'
                          )}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowImportDialog(false)} disabled={isImporting}>
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                      Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle>Tambah Kelas Baru</DialogTitle>
                      <DialogDescription>
                        Masukkan data kelas yang akan ditambahkan
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nama Kelas</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Contoh: XII IPA 1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="angkatan">Angkatan</Label>
                        <Input
                          id="angkatan"
                          value={formData.angkatan}
                          onChange={(e) => setFormData({...formData, angkatan: e.target.value})}
                          placeholder="Contoh: 2024"
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

                <Button variant="outline" size="sm" onClick={fetchClassrooms}>
                  <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop View */}
            <div className="hidden sm:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kelas</TableHead>
                    <TableHead>Angkatan</TableHead>
                    <TableHead>Tanggal Dibuat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        {classrooms.length === 0 ? 'Belum ada data kelas' : 'Tidak ada data pada halaman ini'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((classroom) => (
                      <TableRow key={classroom.id}>
                        <TableCell className="font-medium">{classroom.name}</TableCell>
                        <TableCell>{classroom.angkatan}</TableCell>
                        <TableCell>
                          {new Date(classroom.createdAt).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditDialog(classroom)}
                              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105"
                              title="Edit kelas"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(classroom)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105"
                              title="Hapus kelas"
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

            {/* Mobile View */}
            <div className="sm:hidden space-y-3">
              {currentItems.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border">
                  {classrooms.length === 0 ? 'Belum ada data kelas' : 'Tidak ada data pada halaman ini'}
                </div>
              ) : (
                currentItems.map((classroom) => (
                  <div key={classroom.id} className="bg-white rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{classroom.name}</p>
                        <p className="text-xs text-gray-500">Angkatan: {classroom.angkatan}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(classroom.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditDialog(classroom)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 text-xs font-medium flex-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteDialog(classroom)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 text-xs font-medium flex-1"
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
            {classrooms.length > 0 && (
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

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Edit Kelas</DialogTitle>
              <DialogDescription>
                Update data kelas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nama Kelas</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: XII IPA 1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-angkatan">Angkatan</Label>
                <Input
                  id="edit-angkatan"
                  value={formData.angkatan}
                  onChange={(e) => setFormData({...formData, angkatan: e.target.value})}
                  placeholder="Contoh: 2024"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">
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
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Konfirmasi Hapus
              </DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus kelas <strong>{selectedClassroom?.name}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 sm:gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false)
                  setSelectedClassroom(null)
                }}
                disabled={isDeleting}
                className="flex-1 sm:flex-none"
              >
                Batal
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 sm:flex-none"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Ya, Hapus
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
