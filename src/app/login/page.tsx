'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, User, Lock, BookOpen, Users } from 'lucide-react'

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
        localStorage.setItem('siswaSession', JSON.stringify(data.user))
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
        body: JSON.stringify({ username: email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('pegawaiSession', JSON.stringify(data.user))
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            E-Voting OSIS
          </h1>
          <p className="text-gray-600">
            SMAN 1 Bantarujeg
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Pemilihan Ketua OSIS 2025
          </p>
        </div>

        {/* Login Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-center">Masuk ke Akun Anda</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="siswa" className="text-xs sm:text-sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Siswa</span>
                  <span className="sm:hidden">Siswa</span>
                </TabsTrigger>
                <TabsTrigger value="pegawai" className="text-xs sm:text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Guru & TU</span>
                  <span className="sm:hidden">Staff</span>
                </TabsTrigger>
              </TabsList>

              {/* Siswa Login */}
              <TabsContent value="siswa">
                <form onSubmit={handleSiswaLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nis">Nomor Induk Siswa (NIS)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="nis"
                        type="text"
                        placeholder="Contoh: 001"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="token">Token</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="token"
                        type="password"
                        placeholder="Contoh: A1B2C3"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                <form onSubmit={handlePegawaiLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Contoh: guru@sekolah.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Masukkan password Anda"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              <p className="text-xs sm:text-sm text-gray-500">
                Hubungi panitia jika Anda mengalami kesulitan login
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}