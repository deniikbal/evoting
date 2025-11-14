'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  jumlahSuara: number
  role: string
}

interface QuickResultsProps {
  kandidat: Kandidat[]
  sudahMemilih: number
  votingAktif: boolean
}

export default function QuickResults({ kandidat, sudahMemilih, votingAktif }: QuickResultsProps) {
  // Prevent rendering candidate data if voting is active (double protection)
  const displayKandidat = votingAktif ? [] : kandidat

  const renderKandidatByRole = (role: 'mitratama' | 'mitramuda') => {
    const roleKandidat = displayKandidat.filter(k => k.role === role).sort((a, b) => b.jumlahSuara - a.jumlahSuara)
    const roleLabel = role === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'
    const badgeColor = role === 'mitramuda' 
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-purple-100 text-purple-700 border-purple-200'
    const barColor = role === 'mitramuda'
      ? 'bg-gradient-to-r from-blue-400 to-blue-500'
      : 'bg-gradient-to-r from-purple-400 to-purple-500'

    return (
      <div key={role} className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <div className={`px-4 py-2 rounded-full font-bold text-white text-sm ${role === 'mitramuda' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
            {roleLabel}
          </div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
          <span className="text-gray-600 font-medium text-sm">{roleKandidat.length} kandidat</span>
        </div>

        {roleKandidat.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-sm border border-slate-200">
            <p className="text-slate-500 text-sm">Belum ada kandidat</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roleKandidat.map((k) => {
              const persentase = sudahMemilih > 0 
                ? Math.round((k.jumlahSuara / sudahMemilih) * 100)
                : 0
              
              return (
                <div key={k.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-sm bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge variant="secondary" className={`text-xs ${badgeColor} border`}>No. {k.nomorUrut}</Badge>
                    <span className="font-medium text-sm sm:text-base truncate text-slate-800">{k.namaCalon}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{k.jumlahSuara} suara</span>
                      <span className="text-xs sm:text-sm text-slate-500 sm:ml-2 block sm:inline">({persentase}%)</span>
                    </div>
                    <div className="w-full sm:w-24 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`${barColor} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${persentase}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

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
          <div>
            {renderKandidatByRole('mitratama')}
            {renderKandidatByRole('mitramuda')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
