'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, User, Lock, BookOpen, Users, Info, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('siswa')

  // Siswa login
  const [nis, setNis] = useState('')
  const [token, setToken] = useState('')

  // Pegawai login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSiswaLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: nis, token }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.removeItem('pegawaiSession')
        localStorage.setItem('siswaSession', JSON.stringify(data.user))
        // Tiket pemilih: bukti bertanda tangan dari server. Tanpa ini suara
        // tidak akan diterima /api/voting.
        if (data.tiket) localStorage.setItem('tiketPemilih', data.tiket)
        window.location.href = '/voting'
      } else {
        setError(data.message || 'Login gagal. Silakan coba lagi.')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePegawaiLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, token: password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.removeItem('siswaSession')
        localStorage.setItem('pegawaiSession', JSON.stringify(data.user))
        if (data.tiket) localStorage.setItem('tiketPemilih', data.tiket)
        window.location.href = '/voting'
      } else {
        setError(data.message || 'Login gagal. Silakan coba lagi.')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">E-Voting OSIS</h1>
          <p className="text-muted-foreground">SMAN 1 Bantarujeg</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pemilihan Ketua OSIS 2025
          </p>
        </div>

        {/* Login Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Masuk ke Akun Anda</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="siswa">
                  <BookOpen className="size-4" />
                  Siswa
                </TabsTrigger>
                <TabsTrigger value="pegawai">
                  <Users className="size-4" />
                  Guru &amp; TU
                </TabsTrigger>
              </TabsList>

              {/* Siswa Login */}
              <TabsContent value="siswa">
                <Alert className="mb-4">
                  <Info className="size-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>Login untuk Siswa:</strong> Gunakan NIS dan token (6 karakter) yang diberikan oleh sekolah
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleSiswaLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nis">Nomor Induk Siswa (NIS)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="nis"
                        type="text"
                        placeholder="Contoh: 252610XXX"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token">Token (6 karakter, bukan password)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="token"
                        type="text"
                        placeholder="Contoh: A1B2C3"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Pegawai Login */}
              <TabsContent value="pegawai">
                <Alert className="mb-4">
                  <Info className="size-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>Login untuk Guru &amp; TU:</strong> Gunakan email dan token (6 karakter) yang diberikan oleh admin
                  </AlertDescription>
                </Alert>

                <form onSubmit={handlePegawaiLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Contoh: deniikbal@evoting.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pegawai-token">Token (6 karakter)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="pegawai-token"
                        type="text"
                        placeholder="Contoh: A1B2C3"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground sm:text-sm">
                Hubungi panitia jika Anda mengalami kesulitan login
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
