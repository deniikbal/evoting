'use client'

/*
 * Design Read: manajemen akun admin untuk superadmin, gaya bersih hangat
 * identitas e-voting, dial ENERGY 1 / RHYTHM 1 / MOTION 1.
 *
 * Palet berpangkat makna:
 * - biru #1e3a8a : lencana SuperAdmin + tombol aksi utama (identitas)
 * - netral slate : lencana Admin biasa, teks pendukung
 * - merah        : aksi destruktif (hapus)
 *
 * Keputusan utama (R-31):
 * - Empat kartu statistik dihapus: satu kartunya ("Hasil Filter") bukan
 *   statistik, hanya cacah hasil pencarian (R-17). Jumlah akun kini satu
 *   baris keterangan di kepala daftar, dihitung dari data asli.
 * - Tabel di desktop, kartu baris di ponsel: daftar berisi 5 kolom termasuk
   * menu aksi; di 375px tabel pasti luapan (R-03), jadi ponsel mendapat
 *   susunan ulang yang disengaja, sama pola dengan halaman kehadiran.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Eye, EyeOff, Plus, Pencil, RefreshCw, Shield, Trash2, EllipsisVertical } from 'lucide-react'
import { toast } from 'sonner'
import { ambilSesiAdmin } from '@/lib/sesi-klien'
import { DataTablePagination } from '@/components/admin/data-table-pagination'

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

/* Lencana role: biru = superadmin (identitas), abu = admin biasa. */
function LencanaRole({ role }: { role: Admin['role'] }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        role === 'superadmin'
          ? 'border-blue-200 bg-blue-50 text-blue-800'
          : 'border-slate-200 bg-slate-100 text-slate-600'
      }`}
    >
      {role === 'superadmin' ? 'SuperAdmin' : 'Admin'}
    </span>
  )
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
  const [tampilPassword, setTampilPassword] = useState(false)

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
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const superadmin = admin?.role === 'superadmin'

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Kepala halaman + aksi */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Manajemen Admin
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {adminData.length} akun terdaftar
            {filteredAdminData.length !== adminData.length && (
              ' · ' + filteredAdminData.length + ' sisanya sesuai pencarian'
            )}
          </p>
        </div>
        {superadmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              onClick={fetchAdmins}
            >
              <RefreshCw className="size-3.5" /> Segarkan
            </Button>
            <Button
              size="sm"
              className="h-9 bg-[#1e3a8a] text-white hover:bg-[#172554]"
              onClick={handleAddNew}
            >
              <Plus className="size-3.5" /> Tambah admin
            </Button>
          </div>
        )}
      </div>

      {/* Catatan hak akses untuk admin biasa */}
      {!superadmin && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <Shield className="size-4 flex-shrink-0 mt-0.5" />
          <p>
            Anda login sebagai {admin?.role || 'pengguna tanpa role'}: daftar hanya
            bisa dilihat. Menambah, mengedit, dan menghapus akun hanya untuk
            SuperAdmin.
          </p>
        </div>
      )}

      {/* Pencarian + filter role */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative sm:flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-9"
            aria-label="Cari username"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
          <SelectTrigger className="h-11 w-full sm:w-52" aria-label="Filter role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua role</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superadmin">SuperAdmin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Daftar admin */}
      {paginatedData.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Shield />
              </EmptyMedia>
              <EmptyTitle>Tidak ada data admin</EmptyTitle>
              <EmptyDescription>
                {searchTerm || roleFilter !== 'all'
                  ? 'Coba ubah kata pencarian atau filter role.'
                  : 'Belum ada admin terdaftar.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          {/* Desktop: tabel */}
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-500">Username</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Nama</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Dibuat</th>
                  {superadmin && <th className="w-20 px-4 py-3 text-right font-medium text-slate-500">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((adm) => (
                  <tr key={adm.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{adm.username}</td>
                    <td className="px-4 py-3 text-slate-700">{adm.nama}</td>
                    <td className="px-4 py-3"><LencanaRole role={adm.role} /></td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(adm.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    {superadmin && (
                      <td className="px-4 py-3 text-right">
                        <ActionsMenu
                          onEdit={() => handleEdit(adm)}
                          onDelete={() => { setSelectedAdmin(adm); setShowDeleteDialog(true) }}
                          bisaHapus={adminData.length > 1}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ponsel: kartu baris, susunan ulang */}
          <ul className="space-y-2 sm:hidden">
            {paginatedData.map((adm) => (
              <li
                key={adm.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{adm.username}</p>
                    <p className="truncate text-sm text-slate-600">{adm.nama}</p>
                  </div>
                  {superadmin && (
                    <ActionsMenu
                      onEdit={() => handleEdit(adm)}
                      onDelete={() => { setSelectedAdmin(adm); setShowDeleteDialog(true) }}
                      bisaHapus={adminData.length > 1}
                    />
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <LencanaRole role={adm.role} />
                  <span className="text-xs text-slate-400">
                    dibuat {new Date(adm.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </li>
            ))}
          </ul>

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
        </>
      )}

      {/* Dialog tambah */}
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
                className="h-10"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Masukkan username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-nama">Nama Lengkap</Label>
              <Input
                id="add-nama"
                className="h-10"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={tampilPassword ? 'text' : 'password'}
                  className="h-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setTampilPassword((t) => !t)}
                  aria-label={tampilPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  aria-pressed={tampilPassword}
                  className="absolute right-0 top-0 flex size-10 items-center justify-center rounded-md text-slate-500 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  {tampilPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as 'admin' | 'superadmin' })
                }
              >
                <SelectTrigger className="h-10 w-full">
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1e3a8a] hover:bg-[#172554]"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog edit */}
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
                className="h-10"
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
                <SelectTrigger className="h-10 w-full">
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1e3a8a] hover:bg-[#172554]"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(o) => { setShowDeleteDialog(o); if (!o) setSelectedAdmin(null) }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus admin {selectedAdmin?.username}?</DialogTitle>
            <DialogDescription>
              Akun ini langsung tidak bisa dipakai login. Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* Menu aksi baris: edit + hapus. Dipanggil di tabel desktop dan kartu ponsel. */
function ActionsMenu({ onEdit, onDelete, bisaHapus }: {
  onEdit: () => void
  onDelete: () => void
  bisaHapus: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-slate-500 hover:text-slate-700"
          aria-label="Menu aksi admin"
        >
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" /> Edit
        </DropdownMenuItem>
        {bisaHapus && (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" /> Hapus
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
