'use client'

// Rute lama /kiosk dipertahankan sebagai pengalih supaya tautan lama,
// bookmark panitia, dan QR/link yang sudah tersebar tetap berfungsi.
import { useEffect } from 'react'

export default function KioskRedirectPage() {
  useEffect(() => {
    window.location.replace('/vote')
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
      Mengalihkan ke halaman /vote…
    </div>
  )
}
