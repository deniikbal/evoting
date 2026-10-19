'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'

/**
 * Build a compact page list with ellipsis, e.g. [1, 'ellipsis', 4, 5, 6, 'ellipsis', 20]
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 5
): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (currentPage > 3) pages.push('ellipsis')

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (currentPage < totalPages - 2) pages.push('ellipsis')
  pages.push(totalPages)

  return pages
}

interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onItemsPerPageChange: (value: number) => void
  /** Label sebelum select, default "Tampilkan" */
  pageSizeLabel?: string
  /** Label sesudah select, default "per halaman" */
  pageSizeSuffix?: string
}

/**
 * Kontrol pagination standar ala shadcn:
 * - kiri: pilihan jumlah baris per halaman
 * - kanan: Previous / nomor halaman / Next
 */
export function DataTablePagination({
  currentPage,
  totalPages,
  itemsPerPage,
  pageSizeOptions = [5, 10, 20, 50],
  onPageChange,
  onItemsPerPageChange,
  pageSizeLabel = 'Tampilkan',
  pageSizeSuffix = 'per halaman',
}: DataTablePaginationProps) {
  if (totalPages <= 0) return null

  return (
    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Rows per page */}
      <div className="flex items-center justify-center gap-2 sm:justify-start">
        <span className="text-sm text-muted-foreground">{pageSizeLabel}</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => onItemsPerPageChange(Number(value))}
        >
          <SelectTrigger className="h-9 max-sm:min-h-11! w-auto min-w-[4.5rem] px-2.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{pageSizeSuffix}</span>
      </div>

      {/* Pagination */}
      <Pagination className="mx-0 w-auto justify-center sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : undefined}
              className={
                currentPage === 1 ? 'pointer-events-none opacity-50' : undefined
              }
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) onPageChange(currentPage - 1)
              }}
            />
          </PaginationItem>

          {getPageNumbers(currentPage, totalPages).map((page, index) => (
            <PaginationItem key={`${page}-${index}`}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  isActive={currentPage === page}
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(page)
                  }}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : undefined}
              className={
                currentPage === totalPages
                  ? 'pointer-events-none opacity-50'
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) onPageChange(currentPage + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
