'use client'

import { useState } from 'react'
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
  Zap
} from 'lucide-react'

export default function LandingPage() {
  const [stats] = useState({
    totalSiswa: 150,
    totalKandidat: 3,
    votingAktif: true
  })

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
              <h1 className="text-xl font-bold text-gray-800">E-Voting OSIS</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => window.location.href = '/login'}>
                <User className="w-4 h-4 mr-2" />
                Login Siswa
              </Button>
              <Button onClick={() => window.location.href = '/login/admin'}>
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-pink-500">
              Pemilihan 2024
            </Badge>
            <h1 className="text-5xl font-bold text-gray-800 mb-6">
              E-Voting OSIS
              <span className="block text-3xl text-orange-600 mt-2">
                SMAN 1 Bantarujeg
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Sistem pemilihan elektronik yang modern, aman, dan transparan untuk 
              memilih Ketua OSIS periode 2024/2025
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
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = '/login/admin'}
              >
                <Shield className="w-5 h-5 mr-2" />
                Panel Admin
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                <CardTitle className="text-3xl font-bold text-gray-800">
                  {stats.totalSiswa}+
                </CardTitle>
                <CardDescription>Siswa Terdaftar</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Trophy className="w-12 h-12 mx-auto text-pink-500 mb-4" />
                <CardTitle className="text-3xl font-bold text-gray-800">
                  {stats.totalKandidat}
                </CardTitle>
                <CardDescription>Kandidat Berkualitas</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <CardTitle className="text-3xl font-bold text-gray-800">
                  {stats.votingAktif ? 'Aktif' : 'Non-Aktif'}
                </CardTitle>
                <CardDescription>Status Voting</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
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
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-pink-500">
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
      <footer className="bg-gray-800 text-white py-12 px-4">
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
                <li>
                  <button 
                    onClick={() => window.location.href = '/login/admin'}
                    className="hover:text-white transition-colors"
                  >
                    Login Admin
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontak</h4>
              <p className="text-gray-400">
                SMAN 1 Bantarujeg<br />
                Panitia Pemilihan OSIS 2024
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 E-Voting OSIS SMAN 1 Bantarujeg. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}