'use client'

import { ReactNode } from 'react'
import { RefreshCw, Trash2, TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loadingLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  /** Ikon di judul; default TriangleAlert (merah). */
  icon?: ReactNode
}

/**
 * Dialog konfirmasi (destruktif) yang konsisten — dibungkus AlertDialog shadcn.
 * Menangani state loading dan mencegah dialog tertutup saat proses berjalan.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  loadingLabel = 'Menghapus...',
  isLoading = false,
  onConfirm,
  icon,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {icon ?? <TriangleAlert className="size-5 text-destructive" />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <RefreshCw className="animate-spin" />
                {loadingLabel}
              </>
            ) : (
              <>
                <Trash2 />
                {confirmLabel}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
