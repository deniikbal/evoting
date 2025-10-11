'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { User, CheckCircle, Eye, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  visi: string
  misi: string
  fotoUrl?: string
  jumlahSuara: number
}

interface Siswa {
  id: number
  nis: string
  namaLengkap: string
  kelas: string
  sudahMemilih: boolean
}

export default function VotingPage() {
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [siswa, setSiswa] = useState<Siswa | null>(null)
  const [selectedKandidat, setSelectedKandidat] = useState<Kandidat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check session
    const sessionData = localStorage.getItem('siswaSession')
    if (!sessionData) {
      router.push('/login')
      return
    }

    const session = JSON.parse(sessionData)
    setSiswa(session)

    // Fetch kandidat data
    fetchKandidat()
  }, [router])

  const fetchKandidat = async () => {
    try {
      const response = await fetch('/api/kandidat')
      if (response.ok) {
        const data = await response.json()
        setKandidat(data)
      } else {
        setError('Gagal memuat data kandidat')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async () => {
    if (!selectedKandidat || !siswa) return

    setIsVoting(true)
    setError('')

    try {
      const response = await fetch('/api/voting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kandidatId: selectedKandidat.id,
          siswaId: siswa.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Clear session and redirect to thank you page
        localStorage.removeItem('siswaSession')
        router.push('/terima-kasih')
      } else {
        setError(data.message || 'Gagal melakukan voting')
        setShowConfirmDialog(false)
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setShowConfirmDialog(false)
    } finally {
      setIsVoting(false)
    }
  }

  const confirmVote = (kandidat: Kandidat) => {
    setSelectedKandidat(kandidat)
    setShowConfirmDialog(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Memuat data...</p>
        </div>
      </div>
    )
  }

  // Jika siswa sudah voting, tampilkan ucapan terimakasih
  if (siswa?.sudahMemilih) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Terima Kasih!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Anda telah berhasil menggunakan hak suara Anda dalam Pemilihan Ketua OSIS SMAN 1 Bantarujeg.
              </p>
              <p className="text-sm text-gray-600">
                Partisipasi Anda sangat berarti untuk kemajuan OSIS kita.
              </p>
              
              <div className="pt-4">
                <Button 
                  onClick={() => {
                    localStorage.removeItem('siswaSession')
                    router.push('/')
                  }}
                  className="w-full"
                >
                  Kembali ke Halaman Utama
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Pemilihan Ketua OSIS</h1>
              <p className="text-gray-600">SMAN 1 Bantarujeg 2024</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Pemilih:</p>
              <p className="font-semibold">{siswa?.namaLengkap}</p>
              <p className="text-sm text-gray-600">{siswa?.kelas}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Kandidat Cards */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 text-center">Pilih Salah Satu Kandidat</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kandidat.map((k) => (
            <Card key={k.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center">
                  {k.fotoUrl ? (
                    <img 
                      src={k.fotoUrl} 
                      alt={k.namaCalon}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <Badge variant="secondary" className="w-fit mx-auto mb-2">
                  Nomor {k.nomorUrut}
                </Badge>
                <CardTitle className="text-lg">{k.namaCalon}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Visi & Misi Preview */}
                <div className="text-sm">
                  <p className="font-semibold mb-1">Visi:</p>
                  <p className="text-gray-600 line-clamp-2">
                    {k.visi || 'Belum ada visi'}
                  </p>
                </div>

                <div className="text-sm">
                  <p className="font-semibold mb-1">Misi:</p>
                  <p className="text-gray-600 line-clamp-2">
                    {k.misi || 'Belum ada misi'}
                  </p>
                </div>

                {/* View Details Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Lihat Visi & Misi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Badge variant="secondary">Nomor {k.nomorUrut}</Badge>
                        {k.namaCalon}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Visi</h4>
                        <p className="text-gray-600">{k.visi || 'Belum ada visi'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Misi</h4>
                        <p className="text-gray-600">{k.misi || 'Belum ada misi'}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Vote Button */}
                <Button 
                  onClick={() => confirmVote(k)}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                  disabled={isVoting}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  PILIH
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pilihan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin memilih kandidat ini?
            </DialogDescription>
          </DialogHeader>
          
          {selectedKandidat && (
            <div className="text-center py-4">
              <Badge variant="secondary" className="mb-2">
                Nomor {selectedKandidat.nomorUrut}
              </Badge>
              <h3 className="text-lg font-semibold">{selectedKandidat.namaCalon}</h3>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1"
              disabled={isVoting}
            >
              Batal
            </Button>
            <Button 
              onClick={handleVote}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              disabled={isVoting}
            >
              {isVoting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Ya, Yakin'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}