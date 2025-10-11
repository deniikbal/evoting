'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Database, CheckCircle, XCircle, Info, ArrowLeft, ExternalLink,
  Copy, Eye, EyeOff
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NeonSetupPage() {
  const [connectionString, setConnectionString] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleTestConnection = async () => {
    if (!connectionString.trim()) {
      setError('Connection string harus diisi')
      return
    }

    setIsLoading(true)
    setError('')
    setValidationResult(null)

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString }),
      })

      const data = await response.json()

      if (response.ok) {
        setValidationResult({
          success: true,
          message: data.message
        })
      } else {
        setValidationResult({
          success: false,
          message: data.message
        })
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menguji koneksi')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const maskConnectionString = (url: string) => {
    if (!showPassword && url) {
      return url.replace(/(:[^:]+@)/, ':***@')
    }
    return url
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Setup Neon Database</h1>
                <p className="text-sm text-gray-500">Hubungkan aplikasi ke database Neon Postgres</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Cara Mendapatkan Connection String Neon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              <li>Login ke dashboard Neon: <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">neon.tech <ExternalLink className="w-3 h-3" /></a></li>
              <li>Buat project baru atau pilih project yang ada</li>
              <li>Klik pada project Anda</li>
              <li>Cari menu "Connection details" atau "Connection string"</li>
              <li>Copy connection string yang tersedia</li>
            </ol>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Format connection string:</p>
              <code className="text-sm bg-white p-2 rounded border block">
                postgresql://username:password@host:port/database?sslmode=require
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Connection Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Konfigurasi Koneksi
            </CardTitle>
            <CardDescription>
              Masukkan connection string Neon Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="connectionString">Connection String</Label>
                <div className="relative">
                  <Input
                    id="connectionString"
                    type={showPassword ? "text" : "password"}
                    placeholder="postgresql://username:password@host:port/database?sslmode=require"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    className="pr-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {connectionString && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Preview:</p>
                  <code className="text-xs break-all">
                    {maskConnectionString(connectionString)}
                  </code>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleTestConnection}
                  disabled={isLoading || !connectionString.trim()}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Test Koneksi
                </Button>
                
                {connectionString && (
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(connectionString)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Result */}
        {validationResult && (
          <Card className={`mb-8 ${validationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {validationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className={`font-medium ${validationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {validationResult.success ? '✅ Connection String Valid' : '❌ Connection String Invalid'}
                  </p>
                  <p className={`text-sm ${validationResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {validationResult.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Next Steps */}
        {validationResult?.success && (
          <Card>
            <CardHeader>
              <CardTitle>Langkah Selanjutnya</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800 mb-2">📝 Update File .env:</p>
                  <p className="text-sm text-blue-700 mb-2">
                    Buka file <code className="bg-blue-100 px-1 rounded">.env</code> dan ganti DATABASE_URL dengan connection string Anda:
                  </p>
                  <code className="text-xs bg-blue-100 p-2 rounded block break-all">
                    DATABASE_URL="{connectionString}"
                  </code>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Kemudian jalankan perintah berikut:</p>
                  <div className="space-y-1">
                    <code className="block bg-gray-100 p-2 rounded text-sm">npm run db:push</code>
                    <code className="block bg-gray-100 p-2 rounded text-sm">npm run db:seed</code>
                  </div>
                </div>

                <Button 
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Aplikasi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}