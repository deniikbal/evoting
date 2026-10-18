# Template Halaman Admin (CRUD Data Table)

Template UI konsisten untuk semua halaman admin (Kelas, Siswa, Pegawai, Kandidat, dst.).
Dibangun dari komponen shadcn + helper reusable di `src/components/admin/`.

---

## Komponen yang tersedia

| Komponen | File | Kegunaan |
|---|---|---|
| `StatCard` / `StatCardGrid` | `stat-card.tsx` | Card statistik di atas halaman |
| `DataTableToolbar` | `data-table-toolbar.tsx` | Header tabel: judul + deskripsi + tombol aksi |
| `SortableHeader` | `data-table-toolbar.tsx` | Header kolom yang bisa di-sort |
| `BulkActionBar` | `bulk-action-bar.tsx` | Toolbar aksi massal (muncul saat ada baris dipilih) |
| `DataTablePagination` | `data-table-pagination.tsx` | Pagination + pilih jumlah baris per halaman |
| `ConfirmDialog` | `confirm-dialog.tsx` | Dialog konfirmasi hapus (single & bulk) |

### Khusus halaman pemantauan (`/admin/dashboard`)

| Komponen | File | Kegunaan |
|---|---|---|
| `StatusVoting` | `StatusVoting.tsx` | Baris status: berjalan/dihentikan, hak lihat hasil, jam data terakhir |
| `RingkasanPartisipasi` | `RingkasanPartisipasi.tsx` | Angka utama partisipasi + rincian siswa dan pegawai |
| `KecukupanDataKelas` | `KecukupanDataKelas.tsx` | Tabel kelas, kelas tanpa pemilih di atas, dengan saringan |
| `HasilSuara` | `HasilSuara.tsx` | Perolehan suara per kategori, persentase dari suara kategori |
| `GrafikKehadiran` | `GrafikKehadiran.tsx` | Bar kehadiran per angkatan atau per kelas |
| tipe + `hitungPartisipasi` | `dashboard-types.ts` | Tipe bersama dan perhitungan partisipasi |

Catatan dashboard:

- Entri `GURU` dan `TU` dari `/api/admin/statistik-chart` **bukan kelas**; keduanya disaring di
tabel dan grafik. Pemilih pegawai tetap terhitung di blok partisipasi.
- Persentase kandidat dihitung dari **suara per kategori**, bukan dari jumlah pemilih, karena
setiap pemilih memilih satu kandidat di setiap kategori.
- Grafik memakai satu warna (`--foreground` di atas `--secondary`); panjang batang yang
membawa data, bukan warna berbeda per kandidat.
- `Progress` menerima `value` dan meneruskannya ke Radix supaya `aria-valuenow` terisi.

Semua memakai token tema shadcn (`bg-card`, `text-muted-foreground`, `text-destructive`, dst.)
sehingga otomatis mendukung dark mode.

---

## Struktur halaman

```
<div className="flex flex-1 flex-col gap-6">          {/* konten di dalam SidebarInset */}
  <StatCardGrid>                                      {/* 1..4 kartu statistik */}
    <StatCard title value description icon />
    ...
  </StatCardGrid>

  <Card>
    <DataTableToolbar                                {/* judul + aksi */}
      title="Data X"
      icon={Icon}
      description={<>Total {n} ...</>}
      actions={<>
        <Button>Import</Button>
        <Button>Tambah</Button>
        <Button variant="outline">Refresh</Button>
      </>}
    />
    <CardContent>
      <BulkActionBar                                 {/* hanya tampil saat ada pilihan */}
        selectedCount={selectedIds.length}
        itemLabel="x"
        onClear={() => setSelectedIds([])}
        onDelete={() => setShowBulkDeleteDialog(true)}
      />

      {/* Table (desktop) + Card list (mobile) — lihat pola di bawah */}
      <div className="hidden rounded-md border sm:block">
        <Table> ... </Table>
      </div>
      <div className="space-y-3 sm:hidden"> ... </div>

      <DataTablePagination
        currentPage totalPages itemsPerPage
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </CardContent>
  </Card>

  {/* Dialog Tambah / Edit */}
  <Dialog> ... </Dialog>

  {/* Konfirmasi hapus */}
  <ConfirmDialog
    open={showDeleteDialog}
    onOpenChange={setShowDeleteDialog}
    title="Konfirmasi Hapus"
    description={<>Yakin hapus <strong>{selected?.name}</strong>?</>}
    isLoading={isDeleting}
    onConfirm={handleDelete}
  />
</div>
```

---

## Pola state yang dipakai (copy-paste)

```tsx
// Loading & dialogs
const [isLoading, setIsLoading] = useState(true)
const [items, setItems] = useState<T[]>([])
const [showAddDialog, setShowAddDialog] = useState(false)
const [showEditDialog, setShowEditDialog] = useState(false)
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
const [selectedItem, setSelectedItem] = useState<T | null>(null)
const [isDeleting, setIsDeleting] = useState(false)

// Pagination
const [currentPage, setCurrentPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(10)

// Bulk selection
const [selectedIds, setSelectedIds] = useState<number[]>([])
const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
const [isBulkDeleting, setIsBulkDeleting] = useState(false)

// Sorting
const [sortConfig, setSortConfig] =
  useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)
```

### Derived (jangan fetch ulang)

```tsx
// Statistik dari data yang sudah ada
const statistik = useMemo(() => ({
  total: items.length,
  // ...
}), [items])

// Sorting
const sorted = useMemo(() => {
  if (!sortConfig) return items
  const { key, dir } = sortConfig
  const factor = dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => ((a as any)[key] > (b as any)[key] ? 1 : -1) * factor)
}, [items, sortConfig])

// Pagination
const totalPages = Math.ceil(sorted.length / itemsPerPage)
const startIndex = (currentPage - 1) * itemsPerPage
const currentItems = sorted.slice(startIndex, startIndex + itemsPerPage)

// Pilih semua di halaman ini
const allCurrentSelected =
  currentItems.length > 0 && currentItems.every((i) => selectedIds.includes(i.id))
const someCurrentSelected =
  currentItems.some((i) => selectedIds.includes(i.id)) && !allCurrentSelected
```

### Handler wajib

```tsx
const toggleSort = (key: string) =>
  setSortConfig((prev) =>
    prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
  )

const toggleSelectAll = (checked: boolean) =>
  setSelectedIds(checked ? currentItems.map((i) => i.id) : [])

const toggleSelectOne = (id: number, checked: boolean) =>
  setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))

const handlePageChange = (page: number) => setCurrentPage(page)
const handleItemsPerPageChange = (value: number) => {
  setItemsPerPage(value)
  setCurrentPage(1)
}

// Bersihkan pilihan yang sudah tidak ada & jaga halaman valid
useEffect(() => {
  setSelectedIds((prev) => prev.filter((id) => items.some((i) => i.id === id)))
}, [items])

useEffect(() => {
  if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages)
}, [totalPages, currentPage])
```

---

## Tabel desktop

```tsx
<Table>
  <TableHeader className="bg-muted/50">
    <TableRow className="hover:bg-transparent">
      <TableHead className="w-12">
        <Checkbox
          checked={allCurrentSelected ? true : someCurrentSelected ? 'indeterminate' : false}
          onCheckedChange={(v) => toggleSelectAll(v === true)}
          aria-label="Pilih semua"
        />
      </TableHead>
      <TableHead>
        <SortableHeader label="Nama" column="name"
          sortKey={sortConfig?.key} sortDir={sortConfig?.dir} onSort={toggleSort} />
      </TableHead>
      <TableHead className="w-24 text-right">Aksi</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {currentItems.map((item) => (
      <TableRow key={item.id}
        data-state={selectedIds.includes(item.id) ? 'selected' : undefined}
        className="data-[state=selected]:bg-muted">
        <TableCell>
          <Checkbox checked={selectedIds.includes(item.id)}
            onCheckedChange={(v) => toggleSelectOne(item.id, v === true)} />
        </TableCell>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal /><span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(item)}><Pencil />Edit</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => openDelete(item)}>
                <Trash2 />Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Empty state di dalam tabel

```tsx
<TableRow className="hover:bg-transparent">
  <TableCell colSpan={N} className="py-10">
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon"><Icon /></EmptyMedia>
        <EmptyTitle>Belum ada data</EmptyTitle>
        <EmptyDescription>Tambahkan data untuk memulai.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </TableCell>
</TableRow>
```

---

## Loading state

```tsx
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
```

---

## Konvensi wajib (checklist)

- [ ] Semua warna pakai **token** (`bg-card`, `text-muted-foreground`, `text-destructive`), **bukan** `text-gray-*`, `bg-white`, `bg-gradient-*`.
- [ ] Tombol ikon pakai `<Button variant="ghost" size="icon">` — bukan `<button>` mentah.
- [ ] Hapus pakai `ConfirmDialog` (AlertDialog), bukan `Dialog` biasa.
- [ ] Aksi massal pakai `BulkActionBar`.
- [ ] Pagination pakai `DataTablePagination` (jangan bikin manual).
- [ ] Statistik dihitung **derived** dari data (tidak menambah request).
- [ ] **Logic fetch/handler tidak diubah** — hanya tampilan.
- [ ] Tampilkan varian **mobile** (card) + **desktop** (table).
- [ ] Kartu cetak (VoterCard/PegawaiCard) **jangan** diubah ke tema (khusus print).

---

## Contoh nyata

Lihat `src/app/admin/kelas/page.tsx` sebagai referensi implementasi lengkap
(stat cards, sort, bulk delete, pagination, dialog, empty state).
