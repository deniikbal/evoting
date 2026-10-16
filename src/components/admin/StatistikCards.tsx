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
      <Card className="col-span-2 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 sm:col-span-1 dark:from-sky-950/40 dark:to-blue-950/40 dark:border-sky-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-sky-700 sm:text-sm dark:text-sky-300">Total Pemilih</CardTitle>
          <Users className="size-4 text-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-sky-900 sm:text-2xl dark:text-sky-100">{statistik.totalVoters}</div>
          <p className="text-xs text-sky-600 dark:text-sky-400">
            Siswa ({statistik.totalSiswa}) + Pegawai ({statistik.totalPegawai})
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 sm:col-span-1 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-emerald-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-emerald-700 sm:text-sm dark:text-emerald-300">Sudah Memilih</CardTitle>
          <UserCheck className="size-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-emerald-900 sm:text-2xl dark:text-emerald-100">{statistik.sudahMemilih}</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {persentaseMemilih}% dari total
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 sm:col-span-1 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-amber-700 sm:text-sm dark:text-amber-300">Belum Memilih</CardTitle>
          <UserX className="size-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-amber-900 sm:text-2xl dark:text-amber-100">{statistik.belumMemilih}</div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {100 - persentaseMemilih}% dari total
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2 border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 sm:col-span-1 dark:from-violet-950/40 dark:to-fuchsia-950/40 dark:border-violet-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-violet-700 sm:text-sm dark:text-violet-300">Status Voting</CardTitle>
          <BarChart3 className="size-4 text-violet-500" />
        </CardHeader>
        <CardContent>
          <Badge
            className={
              statistik.votingAktif
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                : 'bg-violet-200 text-violet-800 dark:bg-violet-900 dark:text-violet-100'
            }
          >
            {statistik.votingAktif ? '● Aktif' : '○ Non-Aktif'}
          </Badge>
          <p className="mt-2 text-xs text-violet-600 dark:text-violet-400">
            Status saat ini
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
