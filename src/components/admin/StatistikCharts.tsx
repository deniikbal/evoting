'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'
import { Lock } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface ChartData {
  byAngkatan: Array<{
    angkatan: string
    totalSiswa: number
    totalVoted: number
  }>
  byKelas: Array<{
    name: string
    totalSiswa: number
    totalVoted: number
  }>
}

interface KandidatVote {
  id: number
  nomorUrut: number
  namaCalon: string
  jumlahSuara: number
  role?: string
}

interface StatistikChartsProps {
  votingAktif: boolean
  adminRole?: string
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const chartConfig = {
  value: {
    label: 'Suara',
  },
}

interface VoteItem {
  name: string
  value: number
  percentage: number
}

export default function StatistikCharts({ votingAktif, adminRole }: StatistikChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAngkatan, setSelectedAngkatan] = useState<string>('')
  const [selectedAngkatanRole, setSelectedAngkatanRole] = useState<string>('semua')
  const [selectedKelas, setSelectedKelas] = useState<string>('')
  const [selectedKelasRole, setSelectedKelasRole] = useState<string>('semua')
  const [angkatanKandidatVotes, setAngkatanKandidatVotes] = useState<KandidatVote[]>([])
  const [kelasKandidatVotes, setKelasKandidatVotes] = useState<KandidatVote[]>([])
  const [mitraTamaVotes, setMitraTamaVotes] = useState<KandidatVote[]>([])
  const [mitraMudaVotes, setMitraMudaVotes] = useState<KandidatVote[]>([])
  const [loadingAngkatanVotes, setLoadingAngkatanVotes] = useState(false)
  const [loadingKelasVotes, setLoadingKelasVotes] = useState(false)
  const [loadingMitraTamaVotes, setLoadingMitraTamaVotes] = useState(false)
  const [loadingMitraMudaVotes, setLoadingMitraMudaVotes] = useState(false)

  useEffect(() => {
    // Fetch data if voting is NOT active, OR if admin is SuperAdmin
    const shouldFetchData = !votingAktif || adminRole === 'superadmin'

    if (shouldFetchData) {
      fetchChartData()
      fetchRoleVotes()
    } else {
      setIsLoading(false)
    }
  }, [votingAktif, adminRole])

  useEffect(() => {
    // Fetch selectedAngkatan data if voting is NOT active, OR if admin is SuperAdmin
    const shouldFetchData = !votingAktif || adminRole === 'superadmin'

    if (selectedAngkatan && shouldFetchData) {
      fetchKandidatVotes('angkatan', selectedAngkatan, selectedAngkatanRole)
    }
  }, [selectedAngkatan, selectedAngkatanRole, votingAktif, adminRole])

  useEffect(() => {
    // Fetch selectedKelas data if voting is NOT active, OR if admin is SuperAdmin
    const shouldFetchData = !votingAktif || adminRole === 'superadmin'

    if (selectedKelas && shouldFetchData) {
      fetchKandidatVotes('kelas', selectedKelas, selectedKelasRole)
    }
  }, [selectedKelas, selectedKelasRole, votingAktif, adminRole])

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/admin/statistik-chart')
      if (response.ok) {
        const data = await response.json()
        console.log('Chart data received:', data)
        setChartData(data)
        // Set default selections
        if (data.byAngkatan && data.byAngkatan.length > 0) {
          console.log('Setting default angkatan:', data.byAngkatan[0])
          setSelectedAngkatan(data.byAngkatan[0].angkatan)
        }
        if (data.byKelas && data.byKelas.length > 0) {
          console.log('Setting default kelas:', data.byKelas[0])
          setSelectedKelas(data.byKelas[0].name)
        }
      } else {
        console.error('Chart data response not ok:', response.status)
      }
    } catch (err) {
      console.error('Error fetching chart data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchKandidatVotes = async (type: 'angkatan' | 'kelas', value: string, role: string = 'semua') => {
    if (type === 'angkatan') {
      setLoadingAngkatanVotes(true)
    } else {
      setLoadingKelasVotes(true)
    }

    try {
      let url = `/api/admin/kandidat-votes?type=${type}&value=${encodeURIComponent(value)}`
      if (role !== 'semua') {
        url += `&role=${encodeURIComponent(role)}`
      }

      console.log(`Fetching ${type} votes:`, url)
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log(`${type} votes data:`, data)
        if (type === 'angkatan') {
          setAngkatanKandidatVotes(data.kandidatVotes)
        } else {
          setKelasKandidatVotes(data.kandidatVotes)
        }
      } else {
        console.error(`${type} votes response not ok:`, response.status)
      }
    } catch (err) {
      console.error('Error fetching kandidat votes:', err)
    } finally {
      if (type === 'angkatan') {
        setLoadingAngkatanVotes(false)
      } else {
        setLoadingKelasVotes(false)
      }
    }
  }

  const fetchRoleVotes = async () => {
    try {
      setLoadingMitraTamaVotes(true)
      setLoadingMitraMudaVotes(true)

      const [tamaResponse, mudaResponse] = await Promise.all([
        fetch('/api/admin/kandidat-votes?type=role&value=mitratama'),
        fetch('/api/admin/kandidat-votes?type=role&value=mitramuda')
      ])

      if (tamaResponse.ok) {
        const tamaData = await tamaResponse.json()
        setMitraTamaVotes(tamaData.kandidatVotes)
      }

      if (mudaResponse.ok) {
        const mudaData = await mudaResponse.json()
        setMitraMudaVotes(mudaData.kandidatVotes)
      }
    } catch (err) {
      console.error('Error fetching role votes:', err)
    } finally {
      setLoadingMitraTamaVotes(false)
      setLoadingMitraMudaVotes(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="flex h-64 items-center justify-center pt-6">
              <Spinner className="size-8" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Show lock message only if voting is active AND user is NOT superadmin
  const shouldShowCharts = !votingAktif || adminRole === 'superadmin'

  if (!shouldShowCharts) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[
          { title: 'Statistik per Angkatan', desc: 'Hasil pemilihan berdasarkan angkatan' },
          { title: 'Statistik per Kelas', desc: 'Hasil pemilihan berdasarkan kelas' },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{item.title}</CardTitle>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                  <Lock className="size-8 text-muted-foreground" />
                </div>
                <p className="mb-2 font-medium">Data Disembunyikan</p>
                <p className="text-sm text-muted-foreground">
                  Voting sedang berlangsung. Nonaktifkan voting untuk melihat statistik.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <p className="py-8 text-center text-muted-foreground">Gagal memuat data chart</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Prepare data for kandidat votes chart by angkatan
  const totalAngkatanVotes = angkatanKandidatVotes.reduce((sum, k) => sum + k.jumlahSuara, 0)
  const angkatanKandidatChartData: VoteItem[] = angkatanKandidatVotes
    .filter((k) => k.jumlahSuara > 0)
    .map((item) => ({
      name: `No. ${item.nomorUrut} - ${item.namaCalon}`,
      value: item.jumlahSuara,
      percentage: totalAngkatanVotes > 0 ? Math.round((item.jumlahSuara / totalAngkatanVotes) * 100) : 0
    }))

  // Prepare data for kandidat votes chart by kelas
  const totalKelasVotes = kelasKandidatVotes.reduce((sum, k) => sum + k.jumlahSuara, 0)
  const kelasKandidatChartData: VoteItem[] = kelasKandidatVotes
    .filter((k) => k.jumlahSuara > 0)
    .map((item) => ({
      name: `No. ${item.nomorUrut} - ${item.namaCalon}`,
      value: item.jumlahSuara,
      percentage: totalKelasVotes > 0 ? Math.round((item.jumlahSuara / totalKelasVotes) * 100) : 0
    }))

  // Prepare data for Mitra Tama votes
  const totalMitraTamaVotes = mitraTamaVotes.reduce((sum, k) => sum + k.jumlahSuara, 0)
  const mitraTamaChartData: VoteItem[] = mitraTamaVotes
    .filter((k) => k.jumlahSuara > 0)
    .map((item) => ({
      name: `No. ${item.nomorUrut} - ${item.namaCalon}`,
      value: item.jumlahSuara,
      percentage: totalMitraTamaVotes > 0 ? Math.round((item.jumlahSuara / totalMitraTamaVotes) * 100) : 0
    }))

  // Prepare data for Mitra Muda votes
  const totalMitraMudaVotes = mitraMudaVotes.reduce((sum, k) => sum + k.jumlahSuara, 0)
  const mitraMudaChartData: VoteItem[] = mitraMudaVotes
    .filter((k) => k.jumlahSuara > 0)
    .map((item) => ({
      name: `No. ${item.nomorUrut} - ${item.namaCalon}`,
      value: item.jumlahSuara,
      percentage: totalMitraMudaVotes > 0 ? Math.round((item.jumlahSuara / totalMitraMudaVotes) * 100) : 0
    }))

  const renderPie = (data: VoteItem[]) => (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-80">
      <PieChart>
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const item = payload[0].payload as VoteItem
            return (
              <div className="rounded-lg border bg-background p-3 shadow-lg">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.value} suara ({item.percentage}%)
                </p>
              </div>
            )
          }}
        />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${(entry as unknown as VoteItem).percentage}%`}
          outerRadius={100}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )

  return (
    <div className="space-y-6">
      {/* Row 1: Charts by Angkatan and Kelas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: By Angkatan */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <CardTitle className="text-lg sm:text-xl">Suara Kandidat per Angkatan</CardTitle>
                <div className="ml-auto flex gap-1.5 sm:gap-2">
                  <div className="flex-1 sm:w-32 sm:flex-none">
                    <Select value={selectedAngkatan} onValueChange={setSelectedAngkatan}>
                      <SelectTrigger className="h-7 px-2 text-xs">
                        <SelectValue placeholder="Angkatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {chartData?.byAngkatan.map((item) => (
                          <SelectItem key={item.angkatan} value={item.angkatan}>
                            Angkatan {item.angkatan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 sm:w-32 sm:flex-none">
                    <Select value={selectedAngkatanRole} onValueChange={setSelectedAngkatanRole}>
                      <SelectTrigger className="h-7 px-2 text-xs">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua</SelectItem>
                        <SelectItem value="mitratama">Mitra Tama</SelectItem>
                        <SelectItem value="mitramuda">Mitra Muda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <CardDescription>
                Distribusi suara kandidat berdasarkan angkatan
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAngkatanVotes ? (
              <div className="flex h-80 items-center justify-center">
                <Spinner className="size-8" />
              </div>
            ) : angkatanKandidatChartData.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Belum ada data voting untuk angkatan ini</p>
            ) : (
              renderPie(angkatanKandidatChartData)
            )}
          </CardContent>
        </Card>

        {/* Chart 2: By Kelas */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <CardTitle className="text-lg sm:text-xl">Suara Kandidat per Kelas</CardTitle>
                <div className="ml-auto flex gap-1.5 sm:gap-2">
                  <div className="flex-1 sm:w-32 sm:flex-none">
                    <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                      <SelectTrigger className="h-7 px-2 text-xs">
                        <SelectValue placeholder="Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {chartData?.byKelas.map((item) => (
                          <SelectItem key={item.name} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 sm:w-32 sm:flex-none">
                    <Select value={selectedKelasRole} onValueChange={setSelectedKelasRole}>
                      <SelectTrigger className="h-7 px-2 text-xs">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua</SelectItem>
                        <SelectItem value="mitratama">Mitra Tama</SelectItem>
                        <SelectItem value="mitramuda">Mitra Muda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <CardDescription>
                Distribusi suara kandidat berdasarkan kelas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loadingKelasVotes ? (
              <div className="flex h-80 items-center justify-center">
                <Spinner className="size-8" />
              </div>
            ) : kelasKandidatChartData.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Belum ada data voting untuk kelas ini</p>
            ) : (
              renderPie(kelasKandidatChartData)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Charts by Role (Mitra Tama & Mitra Muda) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 3: By Mitra Tama */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Suara Kandidat Mitra Tama</CardTitle>
            <CardDescription>
              Distribusi suara kandidat Mitra Tama (Kelas XI)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMitraTamaVotes ? (
              <div className="flex h-80 items-center justify-center">
                <Spinner className="size-8" />
              </div>
            ) : mitraTamaChartData.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Belum ada data voting untuk Mitra Tama</p>
            ) : (
              renderPie(mitraTamaChartData)
            )}
          </CardContent>
        </Card>

        {/* Chart 4: By Mitra Muda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Suara Kandidat Mitra Muda</CardTitle>
            <CardDescription>
              Distribusi suara kandidat Mitra Muda (Kelas X)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMitraMudaVotes ? (
              <div className="flex h-80 items-center justify-center">
                <Spinner className="size-8" />
              </div>
            ) : mitraMudaChartData.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Belum ada data voting untuk Mitra Muda</p>
            ) : (
              renderPie(mitraMudaChartData)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
