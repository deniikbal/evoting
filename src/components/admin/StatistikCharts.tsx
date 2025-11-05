'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Lock } from 'lucide-react'

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
}

interface StatistikChartsProps {
  votingAktif: boolean
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444']

export default function StatistikCharts({ votingAktif }: StatistikChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAngkatan, setSelectedAngkatan] = useState<string>('')
  const [selectedKelas, setSelectedKelas] = useState<string>('')
  const [angkatanKandidatVotes, setAngkatanKandidatVotes] = useState<KandidatVote[]>([])
  const [kelasKandidatVotes, setKelasKandidatVotes] = useState<KandidatVote[]>([])
  const [loadingAngkatanVotes, setLoadingAngkatanVotes] = useState(false)
  const [loadingKelasVotes, setLoadingKelasVotes] = useState(false)

  useEffect(() => {
    if (!votingAktif) {
      fetchChartData()
    } else {
      setIsLoading(false)
    }
  }, [votingAktif])

  useEffect(() => {
    if (selectedAngkatan && !votingAktif) {
      fetchKandidatVotes('angkatan', selectedAngkatan)
    }
  }, [selectedAngkatan, votingAktif])

  useEffect(() => {
    if (selectedKelas && !votingAktif) {
      fetchKandidatVotes('kelas', selectedKelas)
    }
  }, [selectedKelas, votingAktif])

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/admin/statistik-chart')
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
        // Set default selections
        if (data.byAngkatan.length > 0) {
          setSelectedAngkatan(data.byAngkatan[0].angkatan)
        }
        if (data.byKelas.length > 0) {
          setSelectedKelas(data.byKelas[0].name)
        }
      }
    } catch (err) {
      console.error('Error fetching chart data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchKandidatVotes = async (type: 'angkatan' | 'kelas', value: string) => {
    if (type === 'angkatan') {
      setLoadingAngkatanVotes(true)
    } else {
      setLoadingKelasVotes(true)
    }

    try {
      const response = await fetch(`/api/admin/kandidat-votes?type=${type}&value=${encodeURIComponent(value)}`)
      if (response.ok) {
        const data = await response.json()
        if (type === 'angkatan') {
          setAngkatanKandidatVotes(data.kandidatVotes)
        } else {
          setKelasKandidatVotes(data.kandidatVotes)
        }
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (votingAktif) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-sm bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-slate-800">Statistik per Angkatan</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Hasil pemilihan berdasarkan angkatan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-medium mb-2 text-slate-800">Data Disembunyikan</p>
              <p className="text-sm text-slate-600">
                Voting sedang berlangsung. Nonaktifkan voting untuk melihat statistik.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-slate-800">Statistik per Kelas</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Hasil pemilihan berdasarkan kelas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-medium mb-2 text-slate-800">Data Disembunyikan</p>
              <p className="text-sm text-slate-600">
                Voting sedang berlangsung. Nonaktifkan voting untuk melihat statistik.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-sm">
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 py-8">Gagal memuat data chart</p>
          </CardContent>
        </Card>
        <Card className="rounded-sm">
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 py-8">Gagal memuat data chart</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare data for kandidat votes chart by angkatan
  const totalAngkatanVotes = angkatanKandidatVotes.reduce((sum, k) => sum + k.jumlahSuara, 0)
  const angkatanKandidatChartData = angkatanKandidatVotes
    .filter(k => k.jumlahSuara > 0)
    .map(item => ({
      name: `No. ${item.nomorUrut} - ${item.namaCalon}`,
      value: item.jumlahSuara,
      percentage: totalAngkatanVotes > 0 ? Math.round((item.jumlahSuara / totalAngkatanVotes) * 100) : 0
    }))

  // Prepare data for kandidat votes chart by kelas
  const totalKelasVotes = kelasKandidatVotes.reduce((sum, k) => sum + k.jumlahSuara, 0)
  const kelasKandidatChartData = kelasKandidatVotes
    .filter(k => k.jumlahSuara > 0)
    .map(item => ({
      name: `No. ${item.nomorUrut} - ${item.namaCalon}`,
      value: item.jumlahSuara,
      percentage: totalKelasVotes > 0 ? Math.round((item.jumlahSuara / totalKelasVotes) * 100) : 0
    }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">
            {data.value} suara ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: By Angkatan */}
      <Card className="rounded-sm bg-gradient-to-br from-white to-slate-50 border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl text-slate-800">Suara Kandidat per Angkatan</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Distribusi suara kandidat berdasarkan angkatan
              </CardDescription>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedAngkatan} onValueChange={setSelectedAngkatan}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pilih Angkatan" />
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
          </div>
        </CardHeader>
        <CardContent>
          {loadingAngkatanVotes ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : angkatanKandidatChartData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Belum ada data voting untuk angkatan ini</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={angkatanKandidatChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {angkatanKandidatChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => `${value} (${entry.payload.value} suara)`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: By Kelas */}
      <Card className="rounded-sm bg-gradient-to-br from-white to-slate-50 border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl text-slate-800">Suara Kandidat per Kelas</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Distribusi suara kandidat berdasarkan kelas
              </CardDescription>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pilih Kelas" />
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
          </div>
        </CardHeader>
        <CardContent>
          {loadingKelasVotes ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : kelasKandidatChartData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Belum ada data voting untuk kelas ini</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kelasKandidatChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {kelasKandidatChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => `${value} (${entry.payload.value} suara)`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
