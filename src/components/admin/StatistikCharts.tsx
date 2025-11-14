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
  role?: string
}

interface StatistikChartsProps {
  votingAktif: boolean
  adminRole?: string
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444']

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

  // Show lock message only if voting is active AND user is NOT superadmin
  const shouldShowCharts = !votingAktif || adminRole === 'superadmin'

  if (!shouldShowCharts) {
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

  // Prepare data for Mitra Tama votes
  const totalMitraTamaVotes = mitraTamaVotes.reduce((sum, k) => sum + k.jumlahSuara, 0)
  const mitraTamaChartData = mitraTamaVotes
    .filter(k => k.jumlahSuara > 0)
    .map(item => ({
      name: `No. ${item.nomorUrut} - ${item.namaCalon}`,
      value: item.jumlahSuara,
      percentage: totalMitraTamaVotes > 0 ? Math.round((item.jumlahSuara / totalMitraTamaVotes) * 100) : 0
    }))

  // Prepare data for Mitra Muda votes
  const totalMitraMudaVotes = mitraMudaVotes.reduce((sum, k) => sum + k.jumlahSuara, 0)
  const mitraMudaChartData = mitraMudaVotes
    .filter(k => k.jumlahSuara > 0)
    .map(item => ({
      name: `No. ${item.nomorUrut} - ${item.namaCalon}`,
      value: item.jumlahSuara,
      percentage: totalMitraMudaVotes > 0 ? Math.round((item.jumlahSuara / totalMitraMudaVotes) * 100) : 0
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
    <div className="space-y-6">
      {/* Row 1: Charts by Angkatan and Kelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: By Angkatan */}
      <Card className="rounded-sm bg-gradient-to-br from-white to-slate-50 border-slate-200">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl text-slate-800">Suara Kandidat per Angkatan</CardTitle>
              </div>
              <div className="flex gap-1.5 sm:gap-2 ml-auto">
                <div className="flex-1 sm:flex-none sm:w-32">
                  <Select value={selectedAngkatan} onValueChange={setSelectedAngkatan}>
                    <SelectTrigger className="text-xs h-7 px-2">
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
                <div className="flex-1 sm:flex-none sm:w-32">
                  <Select value={selectedAngkatanRole} onValueChange={setSelectedAngkatanRole}>
                    <SelectTrigger className="text-xs h-7 px-2">
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
            <CardDescription className="text-xs sm:text-sm text-slate-600">
              Distribusi suara kandidat berdasarkan angkatan
            </CardDescription>
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
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl text-slate-800">Suara Kandidat per Kelas</CardTitle>
              </div>
              <div className="flex gap-1.5 sm:gap-2 ml-auto">
                <div className="flex-1 sm:flex-none sm:w-32">
                  <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                    <SelectTrigger className="text-xs h-7 px-2">
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
                <div className="flex-1 sm:flex-none sm:w-32">
                  <Select value={selectedKelasRole} onValueChange={setSelectedKelasRole}>
                    <SelectTrigger className="text-xs h-7 px-2">
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
            <CardDescription className="text-xs sm:text-sm text-slate-600">
              Distribusi suara kandidat berdasarkan kelas
            </CardDescription>
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

      {/* Row 2: Charts by Role (Mitra Tama & Mitra Muda) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 3: By Mitra Tama */}
      <Card className="rounded-sm bg-gradient-to-br from-white to-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-slate-800">Suara Kandidat Mitra Tama</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Distribusi suara kandidat Mitra Tama (Kelas XI)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMitraTamaVotes ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : mitraTamaChartData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Belum ada data voting untuk Mitra Tama</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mitraTamaChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mitraTamaChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#a855f7', '#ec4899', '#f97316', '#8b5cf6', '#d946ef', '#f43f5e', '#fb923c', '#fbbf24'][index % 8]} />
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

      {/* Chart 4: By Mitra Muda */}
      <Card className="rounded-sm bg-gradient-to-br from-white to-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-slate-800">Suara Kandidat Mitra Muda</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Distribusi suara kandidat Mitra Muda (Kelas X)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMitraMudaVotes ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : mitraMudaChartData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Belum ada data voting untuk Mitra Muda</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mitraMudaChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mitraMudaChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#0ea5e9', '#06b6d4', '#00d4ff', '#4f46e5', '#1e40af', '#0369a1', '#0c4a6e'][index % 8]} />
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
    </div>
  )
}
