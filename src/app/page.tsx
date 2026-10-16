'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  role: string
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

  const navItems = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Kandidat', href: '#kandidat' },
    { label: 'Statistik', href: '#statistik' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Kontak', href: '#kontak' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                <Vote className="size-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold sm:text-xl">E-Voting OSIS</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="flex flex-col gap-1 border-t py-4 md:hidden">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="beranda" className="border-b py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge className="mb-4">Pemilihan 2025</Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
              E-Voting OSIS
              <span className="mt-2 block text-2xl text-muted-foreground sm:text-3xl">
                SMAN 1 Bantarujeg
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
              Sistem pemilihan elektronik yang modern, aman, dan transparan untuk
              memilih Ketua OSIS periode 2025/2026
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => (window.location.href = '/login')}
              >
                <UserCheck />
                Login &amp; Voting
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Kandidat Section */}
      <section id="kandidat" className="border-b bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">Kandidat OSIS 2025</Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Kenali Kandidat Anda
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Pelajari visi dan misi setiap kandidat untuk membuat pilihan yang tepat
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Memuat data kandidat...</p>
            </div>
          ) : kandidatList.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Belum ada kandidat yang terdaftar.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {['mitramuda', 'mitratama'].map((roleType) => {
                const roleKandidat = kandidatList.filter(k => k.role === roleType)
                const roleLabel = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'

                return (
                  <div key={roleType}>
                    <div className="mb-8 flex items-center gap-4">
                      <Badge variant="outline" className="px-4 py-1.5 text-sm font-bold sm:text-base">
                        {roleLabel}
                      </Badge>
                      <Separator className="flex-1" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {roleKandidat.length} kandidat
                      </span>
                    </div>

                    {roleKandidat.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Belum ada kandidat untuk kategori ini
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {roleKandidat.map((kandidat) => (
                          <Card key={kandidat.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                            <CardHeader className="p-0">
                              <div className="relative h-64 bg-muted">
                                {kandidat.fotoUrl ? (
                                  <img
                                    src={kandidat.fotoUrl}
                                    alt={kandidat.namaCalon}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <User className="size-24 text-muted-foreground/40" />
                                  </div>
                                )}
                                <div className="absolute left-4 top-4">
                                  <Badge className="px-4 py-2 text-lg">
                                    Nomor {kandidat.nomorUrut}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-6">
                              <CardTitle className="mb-4 text-center text-2xl">
                                {kandidat.namaCalon}
                              </CardTitle>

                              <div className="space-y-4">
                                <div>
                                  <div className="mb-2 flex items-center gap-2">
                                    <Target className="size-5 text-primary" />
                                    <h4 className="font-semibold">Visi</h4>
                                  </div>
                                  <p className="text-sm leading-relaxed text-muted-foreground">
                                    {kandidat.visi || 'Visi belum ditambahkan'}
                                  </p>
                                </div>

                                <div>
                                  <div className="mb-2 flex items-center gap-2">
                                    <BookOpen className="size-5 text-primary" />
                                    <h4 className="font-semibold">Misi</h4>
                                  </div>
                                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
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
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section id="statistik" className="border-b py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <Users className="mx-auto mb-4 size-12 text-primary" />
                <CardTitle className="text-3xl font-bold">
                  {isLoading ? '...' : stats.totalSiswa}
                </CardTitle>
                <CardDescription>Siswa Terdaftar</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Trophy className="mx-auto mb-4 size-12 text-primary" />
                <CardTitle className="text-3xl font-bold">
                  {isLoading ? '...' : stats.totalKandidat}
                </CardTitle>
                <CardDescription>Kandidat Berkualitas</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="mx-auto mb-4 size-12 text-primary" />
                <CardTitle className="text-3xl font-bold">
                  {isLoading ? '...' : (stats.votingAktif ? 'Aktif' : 'Non-Aktif')}
                </CardTitle>
                <CardDescription>Status Voting</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="border-b bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Mengapa E-Voting OSIS?
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Sistem voting modern dengan berbagai keunggulan untuk pemilihan yang adil dan transparan
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Shield className="mb-4 size-10 text-primary" />
                <CardTitle>Aman &amp; Terpercaya</CardTitle>
                <CardDescription>
                  Sistem keamanan berlapis dengan enkripsi data dan autentikasi
                  yang kuat untuk menjaga kerahasiaan suara
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Zap className="mb-4 size-10 text-primary" />
                <CardTitle>Cepat &amp; Efisien</CardTitle>
                <CardDescription>
                  Proses voting yang instan dan hasil real-time,
                  menghemat waktu dan sumber daya
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <BarChart3 className="mb-4 size-10 text-primary" />
                <CardTitle>Transparan</CardTitle>
                <CardDescription>
                  Hasil voting dapat dipantau secara real-time dengan
                  statistik yang lengkap dan akurat
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Target className="mb-4 size-10 text-primary" />
                <CardTitle>Mudah Digunakan</CardTitle>
                <CardDescription>
                  Interface yang user-friendly dan intuitif,
                  mudah digunakan oleh semua siswa
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Clock className="mb-4 size-10 text-primary" />
                <CardTitle>24/7 Access</CardTitle>
                <CardDescription>
                  Sistem dapat diakses kapan saja selama periode voting,
                  memberikan fleksibilitas maksimal
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <BookOpen className="mb-4 size-10 text-primary" />
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
      <section className="border-y bg-primary py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground">
            Siap untuk Memberikan Suaramu?
          </h2>
          <p className="mb-8 text-xl text-primary-foreground/90">
            Bergabunglah dalam pemilihan OSIS yang akan menentukan masa depan organisasi kita
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => (window.location.href = '/login')}
          >
            <Vote />
            Mulai Voting Sekarang
            <ArrowRight />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                  <Vote className="size-4 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold">E-Voting OSIS</h3>
              </div>
              <p className="text-muted-foreground">
                Sistem pemilihan elektronik modern untuk OSIS SMAN 1 Bantarujeg
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <button
                    onClick={() => (window.location.href = '/login')}
                    className="transition-colors hover:text-foreground"
                  >
                    Login Siswa
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Kontak</h4>
              <p className="text-muted-foreground">
                SMAN 1 Bantarujeg<br />
                Panitia Pemilihan OSIS 2025/2026
              </p>
            </div>
          </div>

          <Separator className="my-8" />

          <p className="text-center text-muted-foreground">
            &copy; 2025 E-Voting OSIS SMAN 1 Bantarujeg. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
