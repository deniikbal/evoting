'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Database, CheckCircle, XCircle, Info, ArrowLeft, ExternalLink,
  Copy, Eye, EyeOff, Loader2,
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Setup Neon Database</h1>
              <p className="text-sm text-muted-foreground">Hubungkan aplikasi ke database Neon Postgres</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-5" />
              Cara Mendapatkan Connection String Neon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-3 text-sm">
              <li>
                Login ke dashboard Neon:{' '}
                <a
                  href="https://neon.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  neon.tech <ExternalLink className="size-3" />
                </a>
              </li>
              <li>Buat project baru atau pilih project yang ada</li>
              <li>Klik pada project Anda</li>
              <li>Cari menu "Connection details" atau "Connection string"</li>
              <li>Copy connection string yang tersedia</li>
            </ol>

            <div className="mt-4 rounded-lg border bg-muted/50 p-4">
              <p className="mb-2 text-sm font-medium">Format connection string:</p>
              <code className="block rounded border bg-background p-2 text-sm">
                postgresql://username:password@host:port/database?sslmode=require
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Connection Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              Konfigurasi Koneksi
            </CardTitle>
            <CardDescription>
              Masukkan connection string Neon Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connectionString">Connection String</Label>
                <InputGroup>
                  <InputGroupInput
                    id="connectionString"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="postgresql://username:password@host:port/database?sslmode=require"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-sm"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              {connectionString && (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="mb-1 text-sm font-medium">Preview:</p>
                  <code className="break-all text-xs">
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
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Database />
                  )}
                  Test Koneksi
                </Button>

                {connectionString && (
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(connectionString)}
                  >
                    <Copy />
                    Copy
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Result */}
        {validationResult && (
          <Alert
            className="mb-8"
            variant={validationResult.success ? 'default' : 'destructive'}
          >
            {validationResult.success ? (
              <CheckCircle className="size-4" />
            ) : (
              <XCircle className="size-4" />
            )}
            <AlertDescription>
              <p className="font-medium">
                {validationResult.success ? '✅ Connection String Valid' : '❌ Connection String Invalid'}
              </p>
              <p className="text-sm">
                {validationResult.message}
              </p>
            </AlertDescription>
          </Alert>
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
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="mb-2 font-medium">📝 Update File .env:</p>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Buka file <code className="rounded bg-muted px-1">.env</code> dan ganti DATABASE_URL dengan connection string Anda:
                  </p>
                  <code className="block break-all rounded border bg-background p-2 text-xs">
                    DATABASE_URL="{connectionString}"
                  </code>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Kemudian jalankan perintah berikut:</p>
                  <div className="space-y-1">
                    <code className="block rounded bg-muted p-2 text-sm">npm run db:push</code>
                    <code className="block rounded bg-muted p-2 text-sm">npm run db:seed</code>
                  </div>
                </div>

                <Button onClick={() => router.push('/')} className="w-full">
                  <ArrowLeft />
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
