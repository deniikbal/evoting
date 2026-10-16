'use client'

import { ReactNode } from 'react'
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTableToolbarProps {
  title: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  /** Tombol aksi (Import, Tambah, Refresh, dsb.) */
  actions?: ReactNode
  className?: string
}

/**
 * Header tabel data: judul + deskripsi di kiri, deretan aksi di kanan.
 * Pakai langsung di dalam <Card> sebagai <CardHeader>.
 */
export function DataTableToolbar({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: DataTableToolbarProps) {
  return (
    <CardHeader className={cn(className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {Icon ? <Icon className="size-5" /> : null}
            {title}
          </CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
    </CardHeader>
  )
}

interface SortableHeaderProps {
  label: string
  column: string
  sortKey?: string | null
  sortDir?: 'asc' | 'desc'
  onSort: (column: string) => void
  className?: string
}

/**
 * Header kolom tabel yang bisa di-sort (klik untuk toggle asc/desc).
 * Tampilkan indikator arah panah sesuai state sort saat ini.
 */
export function SortableHeader({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  className,
}: SortableHeaderProps) {
  const active = sortKey === column
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground',
        className
      )}
    >
      {label}
      <SortIcon active={active} dir={sortDir} />
    </button>
  )
}

function SortIcon({
  active,
  dir,
}: {
  active: boolean
  dir?: 'asc' | 'desc'
}) {
  // Inline SVG agar tidak menambah dependency ikon di sini.
  if (!active) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5 opacity-50"
        aria-hidden="true"
      >
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    )
  }
  return dir === 'asc' ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  )
}
