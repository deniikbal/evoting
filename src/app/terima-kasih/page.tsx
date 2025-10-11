'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Home } from 'lucide-react'

export default function TerimaKasihPage() {
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
            
            <div className="pt-4">
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Halaman Utama
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}