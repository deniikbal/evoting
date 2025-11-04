'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Terima Kasih!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Anda telah berhasil menggunakan hak suara Anda dalam Pemilihan Ketua OSIS SMAN 1 Bantarujeg.
            </p>
            <p className="text-sm text-gray-600">
              Partisipasi Anda sangat berarti untuk kemajuan OSIS kita.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900 text-center">
                Anda akan otomatis keluar dalam <span className="font-bold text-lg">{countdown}</span> detik
              </p>
            </div>
            
            <div className="pt-2 space-y-2">
              <Button 
                onClick={handleLogoutNow}
                className="w-full"
                variant="default"
              >
                <Home className="w-4 h-4 mr-2" />
                Logout Sekarang
              </Button>
              <p className="text-xs text-center text-gray-500">
                Untuk keamanan, Anda akan otomatis keluar dari sistem
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}