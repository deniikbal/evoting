'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/admin/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Trash2, Edit, RefreshCw, Shield, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface Admin {
  id: number
  username: string
  nama: string
  role: 'admin' | 'superadmin'
  createdAt: string
}

interface AdminSession {
  id: number
  username: string
  role: 'admin' | 'superadmin'
}

export default function UserManagementPage() {
  const router = useRouter()
  const [adminData, setAdminData] = useState<Admin[]>([])
  const [filteredAdminData, setFilteredAdminData] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'superadmin'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    password: '',
    role: 'admin' as 'admin' | 'superadmin',
  })

  const [editFormData, setEditFormData] = useState({
    nama: '',
    role: 'admin' as 'admin' | 'superadmin',
  })

  useEffect(() => {
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }

    const session = JSON.parse(sessionData)
    setAdmin(session)
    fetchAdmins()
  }, [router])

  useEffect(() => {
    // Filter data
    let filtered = adminData

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(adm =>
        adm.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(adm => adm.role === roleFilter)
    }

    setFilteredAdminData(filtered)
    setCurrentPage(1) // Reset to first page
  }, [adminData, searchTerm, roleFilter])

  const fetchAdmins = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/user')
      if (response.ok) {
        const data = await response.json()
        setAdminData(data)
      }
    } catch (err) {
      toast.error('Gagal memuat data admin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setFormData({ username: '', nama: '', password: '', role: 'admin' })
    setShowAddDialog(true)
  }

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.nama || !formData.password) {
      toast.error('Username, nama, dan password harus diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Admin berhasil ditambahkan')
        setShowAddDialog(false)
        fetchAdmins()
      } else {
        toast.error(data.message || 'Gagal menambahkan admin')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (adminItem: Admin) => {
    setSelectedAdmin(adminItem)
    setEditFormData({ nama: adminItem.nama, role: adminItem.role })
    setShowEditDialog(true)
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAdmin) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/user/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Admin berhasil diperbarui')
        setShowEditDialog(false)
        fetchAdmins()
      } else {
        toast.error(data.message || 'Gagal memperbarui admin')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAdmin) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/user/${selectedAdmin.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Admin berhasil dihapus')
        setShowDeleteDialog(false)
        fetchAdmins()
      } else {
        toast.error(data.message || 'Gagal menghapus admin')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredAdminData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredAdminData.length / itemsPerPage)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-700">Total Admin</CardTitle>
              <Shield className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{adminData.length}</div>
              <p className="text-xs text-slate-500 mt-1">Akun admin terdaftar</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-red-700">SuperAdmin</CardTitle>
              <Shield className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-900">{adminData.filter(a => a.role === 'superadmin').length}</div>
              <p className="text-xs text-red-600 mt-1">🔓 Full access</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">Admin</CardTitle>
              <Shield className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-900">{adminData.filter(a => a.role === 'admin').length}</div>
              <p className="text-xs text-blue-600 mt-1">🔐 Limited access</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-indigo-700">Pencarian</CardTitle>
              <Search className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-indigo-900">{filteredAdminData.length}</div>
              <p className="text-xs text-indigo-600 mt-1">Hasil filter</p>
            </CardContent>
          </Card>
        </div>

        {admin?.role !== 'superadmin' && (
          <Alert className="border-amber-200 bg-amber-50 mb-6">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Anda login sebagai {admin?.role || 'user tanpa role'}. Hanya SuperAdmin yang dapat menambah, mengedit, atau menghapus admin. Hubungi SuperAdmin untuk mengubah role Anda.
            </AlertDescription>
          </Alert>
        )}

        {/* Data Admin */}
        <Card className="bg-white border-slate-200 rounded-sm mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  Daftar Admin
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  <span className="block sm:inline">Total {adminData.length} admin terdaftar</span>
                  {filteredAdminData.length !== adminData.length && (
                    <span className="text-orange-600 block sm:inline ml-0 sm:ml-2">
                      ({filteredAdminData.length} hasil filter)
                    </span>
                  )}
                  {filteredAdminData.length > 0 && (
                    <span className="text-gray-600 block sm:inline ml-0 sm:ml-2">
                      Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredAdminData.length)} dari {filteredAdminData.length}
                    </span>
                  )}
                </CardDescription>
              </div>
              {admin?.role === 'superadmin' && (
                <Button
                  onClick={handleAddNew}
                  className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Admin
                </Button>
              )}
            </div>
          </CardHeader>

          {/* Search & Filter */}
          <div className="px-6 pb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Cari username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-sm"
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="w-full sm:w-48 rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="admin">🔐 Admin</SelectItem>
                  <SelectItem value="superadmin">🔓 SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Dibuat</TableHead>
                    {admin?.role === 'superadmin' && <TableHead>Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={admin?.role === 'superadmin' ? 4 : 3} className="text-center py-8">
                        <p className="text-slate-500">Tidak ada data admin</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((adm) => (
                      <TableRow key={adm.id}>
                        <TableCell className="font-medium">{adm.username}</TableCell>
                        <TableCell>{adm.nama}</TableCell>
                        <TableCell>
                          <Badge
                            className={adm.role === 'superadmin' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}
                            variant="outline"
                          >
                            {adm.role === 'superadmin' ? '🔓 SuperAdmin' : '🔐 Admin'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {new Date(adm.createdAt).toLocaleDateString('id-ID')}
                        </TableCell>
                        {admin?.role === 'superadmin' && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(adm)}
                                className="text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              {adminData.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedAdmin(adm)
                                    setShowDeleteDialog(true)
                                  }}
                                  className="text-xs"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Hapus
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Halaman {currentPage} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Admin Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Masukkan username"
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Masukkan password"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as 'admin' | 'superadmin' })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">🔐 Admin</SelectItem>
                  <SelectItem value="superadmin">🔓 SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin: {selectedAdmin?.username}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={editFormData.nama}
                onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, role: value as 'admin' | 'superadmin' })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">🔐 Admin</SelectItem>
                  <SelectItem value="superadmin">🔓 SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Batal
              </Button>
              <Button disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Admin?</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin ingin menghapus admin "{selectedAdmin?.username}"? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
