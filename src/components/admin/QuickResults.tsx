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
  // Prevent rendering candidate data if voting is active (double protection)
  const displayKandidat = votingAktif ? [] : kandidat

  return (
    <Card className="rounded-sm bg-gradient-to-br from-white to-slate-50 border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl text-slate-800">Hasil Akhir Perolehan Akhir Pemilihan Ketua OSIS</CardTitle>
        <CardDescription className="text-sm text-slate-600">
          {votingAktif 
            ? "Hasil akan ditampilkan setelah voting selesai"
            : "Perolehan Akhir Pemilihan Ketua OSIS"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {votingAktif ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-medium mb-2 text-slate-800">Hasil Disembunyikan</p>
            <p className="text-sm text-slate-600">
              Voting sedang berlangsung. Nonaktifkan voting untuk melihat hasil.
            </p>
          </div>
        ) : displayKandidat.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Belum ada kandidat</p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {displayKandidat.map((k) => {
              const persentase = sudahMemilih > 0 
                ? Math.round((k.jumlahSuara / sudahMemilih) * 100)
                : 0
              
              return (
                <div key={k.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-sm bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200">No. {k.nomorUrut}</Badge>
                    <span className="font-medium text-sm sm:text-base truncate text-slate-800">{k.namaCalon}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{k.jumlahSuara} suara</span>
                      <span className="text-xs sm:text-sm text-slate-500 sm:ml-2 block sm:inline">({persentase}%)</span>
                    </div>
                    <div className="w-full sm:w-24 bg-slate-200 rounded-full h-2 sm:h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-400 to-indigo-500 h-2 rounded-full transition-all duration-300"
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
