'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, BarChart3 } from 'lucide-react'

interface Statistik {
  totalSiswa: number
  sudahMemilih: number
  belumMemilih: number
  votingAktif: boolean
}

interface StatistikCardsProps {
  statistik: Statistik
}

export default function StatistikCards({ statistik }: StatistikCardsProps) {
  const persentaseMemilih = statistik.totalSiswa > 0 
    ? Math.round((statistik.sudahMemilih / statistik.totalSiswa) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-slate-700">Total Siswa</CardTitle>
          <Users className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{statistik.totalSiswa}</div>
          <p className="text-xs text-slate-500">
            Terdaftar dalam sistem
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700">Sudah Memilih</CardTitle>
          <UserCheck className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-emerald-900">{statistik.sudahMemilih}</div>
          <p className="text-xs text-emerald-600">
            {persentaseMemilih}% dari total
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-amber-700">Belum Memilih</CardTitle>
          <UserX className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-amber-900">{statistik.belumMemilih}</div>
          <p className="text-xs text-amber-600">
            {100 - persentaseMemilih}% dari total
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-sm bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-indigo-700">Status Voting</CardTitle>
          <BarChart3 className="h-4 w-4 text-indigo-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            <Badge variant={statistik.votingAktif ? "default" : "secondary"} className={statistik.votingAktif ? "bg-indigo-600" : ""}>
              {statistik.votingAktif ? "Aktif" : "Non-Aktif"}
            </Badge>
          </div>
          <p className="text-xs text-indigo-600">
            Status saat ini
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
