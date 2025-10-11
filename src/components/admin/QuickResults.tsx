'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  jumlahSuara: number
}

interface QuickResultsProps {
  kandidat: Kandidat[]
  sudahMemilih: number
  votingAktif: boolean
}

export default function QuickResults({ kandidat, sudahMemilih, votingAktif }: QuickResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Hasil Sementara</CardTitle>
        <CardDescription className="text-sm">
          {votingAktif 
            ? "Hasil akan ditampilkan setelah voting selesai"
            : "Perolehan suara sementara untuk setiap kandidat"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {votingAktif ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-700 font-medium mb-2">Hasil Disembunyikan</p>
            <p className="text-sm text-gray-500">
              Voting sedang berlangsung. Nonaktifkan voting untuk melihat hasil.
            </p>
          </div>
        ) : kandidat.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Belum ada kandidat</p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {kandidat.map((k) => {
              const persentase = sudahMemilih > 0 
                ? Math.round((k.jumlahSuara / sudahMemilih) * 100)
                : 0
              
              return (
                <div key={k.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge variant="secondary" className="text-xs">No. {k.nomorUrut}</Badge>
                    <span className="font-medium text-sm sm:text-base truncate">{k.namaCalon}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <span className="font-bold text-sm sm:text-base">{k.jumlahSuara} suara</span>
                      <span className="text-xs sm:text-sm text-gray-500 sm:ml-2 block sm:inline">({persentase}%)</span>
                    </div>
                    <div className="w-full sm:w-24 bg-gray-200 rounded-full h-2 sm:h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${persentase}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
