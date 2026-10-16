'use client'

import { Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BulkActionBarProps {
  selectedCount: number
  /** Kata benda yang dihitung, mis. "kelas", "siswa". Default "item". */
  itemLabel?: string
  onClear: () => void
  onDelete: () => void
  deleteLabel?: string
}

/**
 * Toolbar aksi massal yang muncul saat ada baris terpilih.
 * Dipakai di atas tabel (biasanya di dalam CardContent).
 */
export function BulkActionBar({
  selectedCount,
  itemLabel = 'item',
  onClear,
  onDelete,
  deleteLabel,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="secondary">{selectedCount} dipilih</Badge>
        <span className="text-muted-foreground">
          {selectedCount} {itemLabel} siap dihapus
        </span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onClear}>
          <X />
          Batal Pilih
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 />
          {deleteLabel ?? `Hapus ${selectedCount} ${itemLabel}`}
        </Button>
      </div>
    </div>
  )
}
