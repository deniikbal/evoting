'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Lock, ArrowLeft } from 'lucide-react'

export default function SiswaLoginPage() {
  const [nis, setNis] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/siswa/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nis, token }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store session and redirect to voting page
        localStorage.setItem('siswaSession', JSON.stringify(data.siswa))
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
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/'}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Login Siswa
          </h1>
          <p className="text-gray-600">
            E-Voting OSIS SMAN 1 Bantarujeg
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Pemilihan Ketua OSIS 2024
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Masuk ke Akun Anda</CardTitle>
            <CardDescription className="text-center">
              Masukkan NIS dan token Anda untuk menggunakan hak suara
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nis">Nomor Induk Siswa (NIS)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="nis"
                    type="text"
                    placeholder="Masukkan NIS Anda"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="token">Token / Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="token"
                    type="password"
                    placeholder="Masukkan token Anda"
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Hubungi panitia jika Anda mengalami kesulitan login
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Login Link */}
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/login/admin'}
            className="text-sm w-full border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            Login Admin
          </Button>
        </div>
      </div>
    </div>
  )
}