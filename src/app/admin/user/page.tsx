'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { StatCard, StatCardGrid } from '@/components/admin/stat-card'
import { DataTableToolbar } from '@/components/admin/data-table-toolbar'
import { DataTablePagination } from '@/components/admin/data-table-pagination'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import {
  Plus, Trash2, Pencil, RefreshCw, Shield, ShieldCheck, ShieldAlert,
  Search, MoreHorizontal, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { ambilSesiAdmin } from '@/lib/sesi-klien'

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
    // Sesi admin diverifikasi server lewat cookie httpOnly. Nilai di
    // localStorage hanya untuk tampilan, bukan penentu hak akses.
    const muatSesi = async () => {
      const sesi = await ambilSesiAdmin()
      if (!sesi) {
        router.push('/login/admin')
        return
      }
      setAdmin(sesi as unknown as AdminSession)
      fetchAdmins()
    }

    void muatSesi()
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

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredAdminData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredAdminData.length / itemsPerPage)

  const handlePageChange = (page: number) => setCurrentPage(page)
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

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

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Statistik Cards */}
      <StatCardGrid>
        <StatCard
          title="Total Admin"
          value={adminData.length}
          description="Akun admin terdaftar"
          icon={Shield}
        />
        <StatCard
          title="SuperAdmin"
          value={adminData.filter(a => a.role === 'superadmin').length}
          description="Akses penuh"
          icon={ShieldCheck}
        />
        <StatCard
          title="Admin"
          value={adminData.filter(a => a.role === 'admin').length}
          description="Akses terbatas"
          icon={ShieldAlert}
        />
        <StatCard
          title="Hasil Filter"
          value={filteredAdminData.length}
          description="Sesuai pencarian"
          icon={Search}
        />
      </StatCardGrid>

      {admin?.role !== 'superadmin' && (
        <Alert>
          <Info className="size-4" />
          <AlertTitle>Hak Akses Terbatas</AlertTitle>
          <AlertDescription>
            Anda login sebagai {admin?.role || 'user tanpa role'}. Hanya SuperAdmin yang dapat menambah, mengedit, atau menghapus admin. Hubungi SuperAdmin untuk mengubah role Anda.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Admin */}
      <Card>
        <DataTableToolbar
          title="Daftar Admin"
          icon={Shield}
          description={
            <>
              Total {adminData.length} admin terdaftar
              {filteredAdminData.length !== adminData.length && (
                <span className="ml-2">({filteredAdminData.length} hasil filter)</span>
              )}
              {filteredAdminData.length > 0 && (
                <span className="ml-2">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredAdminData.length)} dari {filteredAdminData.length}
                </span>
              )}
            </>
          }
          actions={
            admin?.role === 'superadmin' ? (
              <>
                <Button variant="outline" size="sm" onClick={fetchAdmins}>
                  <RefreshCw />
                  Refresh
                </Button>
                <Button size="sm" onClick={handleAddNew}>
                  <Plus />
                  Tambah Admin
                </Button>
              </>
            ) : null
          }
        />
        <CardContent>
          {/* Search & Filter */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <InputGroup className="flex-1">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Cari username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">SuperAdmin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Dibuat</TableHead>
                  {admin?.role === 'superadmin' && <TableHead className="w-24 text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={admin?.role === 'superadmin' ? 5 : 4} className="py-10">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Shield />
                          </EmptyMedia>
                          <EmptyTitle>Tidak ada data admin</EmptyTitle>
                          <EmptyDescription>
                            {searchTerm || roleFilter !== 'all'
                              ? 'Coba ubah kata kunci atau filter role.'
                              : 'Belum ada admin terdaftar.'}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((adm) => (
                    <TableRow key={adm.id}>
                      <TableCell className="font-medium">{adm.username}</TableCell>
                      <TableCell>{adm.nama}</TableCell>
                      <TableCell>
                        <Badge variant={adm.role === 'superadmin' ? 'default' : 'secondary'}>
                          {adm.role === 'superadmin' ? 'SuperAdmin' : 'Admin'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(adm.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      {admin?.role === 'superadmin' && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal />
                                <span className="sr-only">Menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(adm)}>
                                <Pencil />
                                Edit
                              </DropdownMenuItem>
                              {adminData.length > 1 && (
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedAdmin(adm)
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 />
                                  Hapus
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredAdminData.length > 0 && (
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Admin Baru</DialogTitle>
            <DialogDescription>
              Buat akun admin baru dengan username, nama, dan password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-username">Username</Label>
              <Input
                id="add-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Masukkan username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-nama">Nama Lengkap</Label>
              <Input
                id="add-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
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
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
            <DialogDescription>
              Perbarui nama atau role admin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama Lengkap</Label>
              <Input
                id="edit-nama"
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
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Admin?"
        description={
          <>
            Yakin ingin menghapus admin <strong>{selectedAdmin?.username}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </>
        }
        confirmLabel="Hapus"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
