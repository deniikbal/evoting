'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Vote, 
  Shield, 
  BarChart3, 
  Clock, 
  CheckCircle,
  ArrowRight,
  User,
  UserCheck,
  Trophy,
  BookOpen,
  Target,
  Zap,
  Menu,
  X
} from 'lucide-react'

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  visi: string | null
  misi: string | null
  fotoUrl: string | null
  jumlahSuara: number
}

export default function LandingPage() {
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalKandidat: 0,
    votingAktif: false
  })
  const [kandidatList, setKandidatList] = useState<Kandidat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [statistikResponse, kandidatResponse] = await Promise.all([
        fetch('/api/admin/statistik'),
        fetch('/api/kandidat')
      ])

      if (statistikResponse.ok) {
        const statistikData = await statistikResponse.json()
        setStats(prev => ({
          ...prev,
          totalSiswa: statistikData.totalSiswa,
          votingAktif: statistikData.votingAktif
        }))
      }

      if (kandidatResponse.ok) {
        const kandidatData = await kandidatResponse.json()
        setKandidatList(kandidatData)
        setStats(prev => ({
          ...prev,
          totalKandidat: kandidatData.length
        }))
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                <Vote className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">E-Voting OSIS</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              <a href="#beranda" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Beranda
              </a>
              <a href="#kandidat" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Kandidat
              </a>
              <a href="#statistik" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Statistik
              </a>
              <a href="#fitur" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Fitur
              </a>
              <a href="#kontak" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Kontak
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-3">
                <a 
                  href="#beranda" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  Beranda
                </a>
                <a 
                  href="#kandidat" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  Kandidat
                </a>
                <a 
                  href="#statistik" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  Statistik
                </a>
                <a 
                  href="#fitur" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  Fitur
                </a>
                <a 
                  href="#kontak" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  Kontak
                </a>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="beranda" className="py-12 sm:py-16 px-4 border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-pink-500">
              Pemilihan 2025
            </Badge>
            <h1 className="text-5xl font-bold text-gray-800 mb-6">
              E-Voting OSIS
              <span className="block text-3xl text-orange-600 mt-2">
                SMAN 1 Bantarujeg
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Sistem pemilihan elektronik yang modern, aman, dan transparan untuk 
              memilih Ketua OSIS periode 2025/2026
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/login'}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Login & Voting
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Kandidat Section */}
      <section id="kandidat" className="py-16 sm:py-20 px-4 bg-white shadow-inner border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-pink-500">
              Kandidat OSIS 2025
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Kenali Kandidat Anda
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Pelajari visi dan misi setiap kandidat untuk membuat pilihan yang tepat
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Memuat data kandidat...</p>
            </div>
          ) : kandidatList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Belum ada kandidat yang terdaftar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {kandidatList.map((kandidat) => (
                <Card key={kandidat.id} className="hover:shadow-xl transition-shadow overflow-hidden">
                  <CardHeader className="p-0">
                    <div className="relative h-64 bg-gradient-to-br from-orange-100 to-pink-100">
                      {kandidat.fotoUrl ? (
                        <img 
                          src={kandidat.fotoUrl} 
                          alt={kandidat.namaCalon}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-24 h-24 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-lg px-4 py-2">
                          Nomor {kandidat.nomorUrut}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardTitle className="text-2xl mb-4 text-center">
                      {kandidat.namaCalon}
                    </CardTitle>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-orange-500" />
                          <h4 className="font-semibold text-gray-800">Visi</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {kandidat.visi || 'Visi belum ditambahkan'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-5 h-5 text-pink-500" />
                          <h4 className="font-semibold text-gray-800">Misi</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {kandidat.misi || 'Misi belum ditambahkan'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section id="statistik" className="py-16 sm:py-20 px-4 bg-gradient-to-b from-orange-50/30 to-pink-50/30 border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                <CardTitle className="text-3xl font-bold text-gray-800">
                  {isLoading ? '...' : stats.totalSiswa}
                </CardTitle>
                <CardDescription>Siswa Terdaftar</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Trophy className="w-12 h-12 mx-auto text-pink-500 mb-4" />
                <CardTitle className="text-3xl font-bold text-gray-800">
                  {isLoading ? '...' : stats.totalKandidat}
                </CardTitle>
                <CardDescription>Kandidat Berkualitas</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <CardTitle className="text-3xl font-bold text-gray-800">
                  {isLoading ? '...' : (stats.votingAktif ? 'Aktif' : 'Non-Aktif')}
                </CardTitle>
                <CardDescription>Status Voting</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 px-4 bg-white shadow-inner border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Mengapa E-Voting OSIS?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistem voting modern dengan berbagai keunggulan untuk pemilihan yang adil dan transparan
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="w-10 h-10 text-orange-500 mb-4" />
                <CardTitle>Aman & Terpercaya</CardTitle>
                <CardDescription>
                  Sistem keamanan berlapis dengan enkripsi data dan autentikasi 
                  yang kuat untuk menjaga kerahasiaan suara
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="w-10 h-10 text-pink-500 mb-4" />
                <CardTitle>Cepat & Efisien</CardTitle>
                <CardDescription>
                  Proses voting yang instan dan hasil real-time, 
                  menghemat waktu dan sumber daya
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="w-10 h-10 text-green-500 mb-4" />
                <CardTitle>Transparan</CardTitle>
                <CardDescription>
                  Hasil voting dapat dipantau secara real-time dengan 
                  statistik yang lengkap dan akurat
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="w-10 h-10 text-orange-500 mb-4" />
                <CardTitle>Mudah Digunakan</CardTitle>
                <CardDescription>
                  Interface yang user-friendly dan intuitif, 
                  mudah digunakan oleh semua siswa
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="w-10 h-10 text-pink-500 mb-4" />
                <CardTitle>24/7 Access</CardTitle>
                <CardDescription>
                  Sistem dapat diakses kapan saja selama periode voting, 
                  memberikan fleksibilitas maksimal
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BookOpen className="w-10 h-10 text-green-500 mb-4" />
                <CardTitle>Edukatif</CardTitle>
                <CardDescription>
                  Mendidik siswa tentang pentingnya demokrasi dan 
                  proses pemilihan yang fair
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg border-y-2 border-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Siap untuk Memberikan Suaramu?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Bergabunglah dalam pemilihan OSIS yang akan menentukan masa depan organisasi kita
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = '/login'}
            className="bg-white text-orange-600 hover:bg-gray-100"
          >
            <Vote className="w-5 h-5 mr-2" />
            Mulai Voting Sekarang
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="bg-gray-800 text-white py-12 px-4 border-t-4 border-gray-700 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                  <Vote className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold">E-Voting OSIS</h3>
              </div>
              <p className="text-gray-400">
                Sistem pemilihan elektronik modern untuk OSIS SMAN 1 Bantarujeg
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="hover:text-white transition-colors"
                  >
                    Login Siswa
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontak</h4>
              <p className="text-gray-400">
                SMAN 1 Bantarujeg<br />
                Panitia Pemilihan OSIS 2025/2026
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 E-Voting OSIS SMAN 1 Bantarujeg. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}