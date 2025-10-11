'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/admin/DashboardHeader'
import StatistikCards from '@/components/admin/StatistikCards'
import VotingControl from '@/components/admin/VotingControl'
import NavigationCards from '@/components/admin/NavigationCards'
import QuickResults from '@/components/admin/QuickResults'

interface Statistik {
  totalSiswa: number
  sudahMemilih: number
  belumMemilih: number
  votingAktif: boolean
}

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  jumlahSuara: number
}

interface Admin {
  id: number
  username: string
}

export default function DashboardPage() {
  const [statistik, setStatistik] = useState<Statistik>({
    totalSiswa: 0,
    sudahMemilih: 0,
    belumMemilih: 0,
    votingAktif: false
  })
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTogglingVoting, setIsTogglingVoting] = useState(false)
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

    // Fetch data
    fetchStatistik()
    fetchKandidat()
  }, [router])

  const fetchStatistik = async () => {
    try {
      const response = await fetch('/api/admin/statistik')
      if (response.ok) {
        const data = await response.json()
        setStatistik(data)
      }
    } catch (err) {
      console.error('Error fetching statistik:', err)
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

  const toggleVoting = async () => {
    setIsTogglingVoting(true)
    try {
      const response = await fetch('/api/admin/voting-toggle', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setStatistik(prev => ({ ...prev, votingAktif: data.votingAktif }))
      }
    } catch (err) {
      console.error('Error toggling voting:', err)
    } finally {
      setIsTogglingVoting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

  const persentaseMemilih = statistik.totalSiswa > 0 
    ? Math.round((statistik.sudahMemilih / statistik.totalSiswa) * 100)
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <DashboardHeader admin={admin} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Voting Control */}
        <div className="mb-8">
          <VotingControl
            votingAktif={statistik.votingAktif}
            isTogglingVoting={isTogglingVoting}
            onToggleVoting={toggleVoting}
          />
        </div>

        {/* Statistik Cards */}
        <div className="mb-8">
          <StatistikCards statistik={statistik} />
        </div>

        {/* Navigation Cards */}
        <div className="mb-8">
          <NavigationCards />
        </div>

        {/* Quick Results */}
        <QuickResults 
          kandidat={kandidat} 
          sudahMemilih={statistik.sudahMemilih}
          votingAktif={statistik.votingAktif}
        />
      </main>
    </div>
  )
}