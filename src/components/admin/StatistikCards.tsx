'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, BarChart3 } from 'lucide-react'

interface Statistik {
  totalVoters: number
  totalSiswa: number
  siswaMemilih: number
  siswaBelumMemilih: number
  totalPegawai: number
  pegawaiMemilih: number
  pegawaiBelumMemilih: number
  sudahMemilih: number
  belumMemilih: number
  votingAktif: boolean
}

interface StatistikCardsProps {
  statistik: Statistik
}

export default function StatistikCards({ statistik }: StatistikCardsProps) {
  const persentaseMemilih = statistik.totalVoters > 0
    ? Math.round((statistik.sudahMemilih / statistik.totalVoters) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      <Card className="col-span-2 sm:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium sm:text-sm">Total Pemilih</CardTitle>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold sm:text-2xl">{statistik.totalVoters}</div>
          <p className="text-xs text-muted-foreground">
            Siswa ({statistik.totalSiswa}) + Pegawai ({statistik.totalPegawai})
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium sm:text-sm">Sudah Memilih</CardTitle>
          <UserCheck className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold sm:text-2xl">{statistik.sudahMemilih}</div>
          <p className="text-xs text-muted-foreground">
            {persentaseMemilih}% dari total
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium sm:text-sm">Belum Memilih</CardTitle>
          <UserX className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold sm:text-2xl">{statistik.belumMemilih}</div>
          <p className="text-xs text-muted-foreground">
            {100 - persentaseMemilih}% dari total
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium sm:text-sm">Status Voting</CardTitle>
          <BarChart3 className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={statistik.votingAktif ? 'default' : 'secondary'}>
            {statistik.votingAktif ? 'Aktif' : 'Non-Aktif'}
          </Badge>
          <p className="mt-2 text-xs text-muted-foreground">
            Status saat ini
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
