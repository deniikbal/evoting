'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/admin/DashboardHeader'
import StatistikCards from '@/components/admin/StatistikCards'
import QuickResults from '@/components/admin/QuickResults'
import StatistikCharts from '@/components/admin/StatistikCharts'
import AccessControlInfo from '@/components/admin/AccessControlInfo'

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

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  jumlahSuara: number
  role: string
}

interface Admin {
  id: number
  username: string
  role?: 'admin' | 'superadmin'
}

export default function DashboardPage() {
  const [statistik, setStatistik] = useState<Statistik>({
    totalVoters: 0,
    totalSiswa: 0,
    siswaMemilih: 0,
    siswaBelumMemilih: 0,
    totalPegawai: 0,
    pegawaiMemilih: 0,
    pegawaiBelumMemilih: 0,
    sudahMemilih: 0,
    belumMemilih: 0,
    votingAktif: false
  })
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [adminRole, setAdminRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check admin session
    const sessionData = localStorage.getItem('adminSession')
    if (!sessionData) {
      router.push('/login/admin')
      return
    }

    const session = JSON.parse(sessionData)
    setAdmin(session)
    setAdminRole(session.role || 'admin')

    // Fetch statistik first with admin role from session
    fetchStatistikWithRole(session.role)

    // Auto refresh every 5 seconds to catch voting status changes
    const interval = setInterval(() => {
      fetchStatistikWithRole(session.role)
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  const fetchStatistikWithRole = async (adminRole?: string) => {
    try {
      const response = await fetch('/api/admin/statistik')
      if (response.ok) {
        const data = await response.json()
        setStatistik(data)
        
        // Access Control Logic:
        // SuperAdmin: Always see results (votingAktif true or false)
        // Admin: Only see results when votingAktif is false
        const shouldShowResults = !data.votingAktif || adminRole === 'superadmin'
        
        if (shouldShowResults) {
          fetchKandidat()
        } else {
          // Hide results for Admin users when voting is active
          setKandidat([])
          setIsLoading(false)
        }
      }
    } catch (err) {
      console.error('Error fetching statistik:', err)
      setIsLoading(false)
    }
  }



  const fetchKandidat = async () => {
    try {
      const response = await fetch('/api/kandidat')
      if (response.ok) {
        const data = await response.json()
        setKandidat(data)
      }
    } catch (err) {
      console.error('Error fetching kandidat:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-blue-900">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      <DashboardHeader admin={admin} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Access Control Info */}
        <AccessControlInfo 
          adminRole={adminRole}
          votingAktif={statistik.votingAktif}
          canViewResults={!statistik.votingAktif || adminRole === 'superadmin'}
        />

        {/* Statistik Cards */}
        <div className="mb-8">
          <StatistikCards statistik={statistik} />
        </div>

        {/* Quick Results */}
        <QuickResults 
          kandidat={kandidat} 
          sudahMemilih={statistik.sudahMemilih}
          votingAktif={statistik.votingAktif}
          admin={admin}
          adminRole={adminRole}
        />

        {/* Statistik Charts */}
        <div className="mt-8">
          <StatistikCharts votingAktif={statistik.votingAktif} adminRole={adminRole} />
        </div>
      </main>
    </div>
  )
}