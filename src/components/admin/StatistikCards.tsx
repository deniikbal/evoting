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
      <Card className="col-span-2 sm:col-span-1 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Siswa</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{statistik.totalSiswa}</div>
          <p className="text-xs text-muted-foreground">
            Terdaftar dalam sistem
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Sudah Memilih</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{statistik.sudahMemilih}</div>
          <p className="text-xs text-muted-foreground">
            {persentaseMemilih}% dari total
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Belum Memilih</CardTitle>
          <UserX className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-orange-600">{statistik.belumMemilih}</div>
          <p className="text-xs text-muted-foreground">
            {100 - persentaseMemilih}% dari total
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Status Voting</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            <Badge variant={statistik.votingAktif ? "default" : "secondary"}>
              {statistik.votingAktif ? "Aktif" : "Non-Aktif"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Klik tombol untuk mengubah
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
