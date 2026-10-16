'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Home } from 'lucide-react'

export default function TerimaKasihPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [])

  useEffect(() => {
    // Handle redirect when countdown reaches 0
    if (countdown <= 0) {
      localStorage.removeItem('siswaSession')
      router.push('/login')
    }
  }, [countdown, router])

  const handleLogoutNow = () => {
    localStorage.removeItem('siswaSession')
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="size-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Terima Kasih!</CardTitle>
            <CardDescription>
              Suara Anda telah berhasil direkam.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Anda telah berhasil menggunakan hak suara Anda dalam Pemilihan Ketua OSIS SMAN 1 Bantarujeg.
            </p>
            <p className="text-sm text-muted-foreground">
              Partisipasi Anda sangat berarti untuk kemajuan OSIS kita.
            </p>

            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-center text-sm text-muted-foreground">
                Anda akan otomatis keluar dalam{' '}
                <span className="text-lg font-bold text-foreground">{countdown}</span> detik
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Button onClick={handleLogoutNow} className="w-full">
                <Home className="size-4" />
                Logout Sekarang
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Untuk keamanan, Anda akan otomatis keluar dari sistem
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
