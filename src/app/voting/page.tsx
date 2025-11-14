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
  role: string
}

interface Siswa {
  id: number
  nis: string
  namaLengkap: string
  kelas: string
  sudahMemilih: boolean
}

interface Pegawai {
  id: number
  nama: string
  email: string
  role: 'guru' | 'tu'
  sudahMemilih: boolean
}

interface User {
  type: 'siswa' | 'guru' | 'tu'
  data: Siswa | Pegawai
}

export default function VotingPage() {
  const [kandidat, setKandidat] = useState<Kandidat[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [selectedMitraTama, setSelectedMitraTama] = useState<Kandidat | null>(null)
  const [selectedMitraMuda, setSelectedMitraMuda] = useState<Kandidat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check siswa session
    const siswaSessionData = localStorage.getItem('siswaSession')
    if (siswaSessionData) {
      const siswaSession = JSON.parse(siswaSessionData)
      setUser({
        type: 'siswa',
        data: siswaSession
      })
      fetchKandidat()
      return
    }

    // Check pegawai session
    const pegawaiSessionData = localStorage.getItem('pegawaiSession')
    if (pegawaiSessionData) {
      const pegawaiSession = JSON.parse(pegawaiSessionData)
      setUser({
        type: pegawaiSession.role === 'guru' ? 'guru' : 'tu',
        data: pegawaiSession
      })
      fetchKandidat()
      return
    }

    // No session found
    router.push('/login')
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
    if (!selectedMitraTama || !selectedMitraMuda || !user) return

    setIsVoting(true)
    setError('')

    try {
      // Prepare vote payload
      const votePayload = user.type === 'siswa' 
        ? {
            kandidatId: selectedMitraTama.id,
            siswaId: (user.data as Siswa).id,
            voterType: 'siswa'
          }
        : {
            kandidatId: selectedMitraTama.id,
            pegawaiId: (user.data as Pegawai).id,
            voterType: user.type
          }

      // Submit both votes
      const responses = await Promise.all([
        fetch('/api/voting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(votePayload),
        }),
        fetch('/api/voting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...(user.type === 'siswa' 
              ? { siswaId: (user.data as Siswa).id, voterType: 'siswa' }
              : { pegawaiId: (user.data as Pegawai).id, voterType: user.type }
            ),
            kandidatId: selectedMitraMuda.id,
          }),
        })
      ])

      // Check if both votes succeeded
      const allSuccess = responses.every(res => res.ok)

      if (allSuccess) {
        // Clear session and redirect to thank you page
        localStorage.removeItem('siswaSession')
        localStorage.removeItem('pegawaiSession')
        router.push('/terima-kasih')
      } else {
        const errorRes = responses.find(res => !res.ok)
        if (errorRes) {
          const errorData = await errorRes.json()
          setError(errorData.message || 'Gagal melakukan voting. Silakan coba lagi.')
        } else {
          setError('Gagal melakukan voting. Silakan coba lagi.')
        }
        setShowConfirmDialog(false)
      }
    } catch (err) {
      console.error('Vote error:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setShowConfirmDialog(false)
    } finally {
      setIsVoting(false)
    }
  }

  const selectKandidat = (kandidat: Kandidat) => {
    if (kandidat.role === 'mitratama') {
      setSelectedMitraTama(kandidat)
    } else {
      setSelectedMitraMuda(kandidat)
    }
  }

  const openConfirmDialog = () => {
    if (selectedMitraTama && selectedMitraMuda) {
      setShowConfirmDialog(true)
    }
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

  // Jika user sudah voting, tampilkan ucapan terimakasih
  if (user?.data.sudahMemilih) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md">
          <Card className="text-center">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl text-green-600">
                Terima Kasih!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base text-gray-700">
                Anda telah berhasil menggunakan hak suara Anda dalam Pemilihan Ketua OSIS SMAN 1 Bantarujeg.
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Partisipasi Anda sangat berarti untuk kemajuan OSIS kita.
              </p>
              
              <div className="pt-2 sm:pt-4">
                <Button 
                  onClick={() => {
                    localStorage.removeItem('siswaSession')
                    localStorage.removeItem('pegawaiSession')
                    router.push('/')
                  }}
                  className="w-full h-10 sm:h-11 text-sm sm:text-base"
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
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-3 sm:p-4 ${selectedMitraTama && selectedMitraMuda ? 'pb-32 sm:pb-40' : ''}`}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pemilihan Ketua OSIS</h1>
              <p className="text-sm sm:text-base text-gray-600">SMAN 1 Bantarujeg 2025</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500">Pemilih:</p>
              <p className="font-semibold text-sm sm:text-base truncate">
                {user?.type === 'siswa' 
                  ? (user.data as Siswa).namaLengkap 
                  : (user?.data as Pegawai).nama}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                {user?.type === 'siswa' 
                  ? (user.data as Siswa).kelas 
                  : `${user?.type === 'guru' ? 'Guru' : 'TU'}`}
              </p>
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
        <div className="space-y-10 sm:space-y-12">
          {['mitratama', 'mitramuda'].map((roleType) => {
            const roleKandidat = kandidat.filter(k => k.role === roleType)
            const roleLabel = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'
            const roleColor = roleType === 'mitramuda' ? 'text-blue-600' : 'text-purple-600'
            const selectedKandidat = roleType === 'mitratama' ? selectedMitraTama : selectedMitraMuda
            
            return (
              <div key={roleType}>
                <div className="mb-6 sm:mb-8 flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-full font-bold text-white text-sm sm:text-base ${roleType === 'mitramuda' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
                    {roleLabel}
                  </div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                  <span className="text-gray-600 font-medium text-sm">{roleKandidat.length} kandidat</span>
                </div>
                
                {roleKandidat.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada kandidat untuk kategori ini
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {roleKandidat.map((k) => (
            <Card key={k.id} className={`hover:shadow-lg transition-all cursor-pointer ${selectedKandidat?.id === k.id ? 'ring-2 ring-green-500 shadow-lg' : ''}`} onClick={() => selectKandidat(k)}>
              <CardHeader className="text-center pb-3 sm:pb-6 relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center">
                  {k.fotoUrl ? (
                    <img 
                      src={k.fotoUrl} 
                      alt={k.namaCalon}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                  )}
                </div>
                {selectedKandidat?.id === k.id && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
                <Badge variant="secondary" className="w-fit mx-auto mb-2 text-xs sm:text-sm">
                  Nomor {k.nomorUrut}
                </Badge>
                <CardTitle className="text-base sm:text-lg">{k.namaCalon}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Visi & Misi Preview */}
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold mb-1">Visi:</p>
                  <p className="text-gray-600 line-clamp-2">
                    {k.visi || 'Belum ada visi'}
                  </p>
                </div>

                <div className="text-xs sm:text-sm">
                  <p className="font-semibold mb-1">Misi:</p>
                  <p className="text-gray-600 line-clamp-2">
                    {k.misi || 'Belum ada misi'}
                  </p>
                </div>

                {/* View Details Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-9 sm:h-10 text-sm">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Lihat Visi & Misi</span>
                      <span className="sm:hidden">Detail</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-left">
                        <Badge variant="secondary" className="w-fit text-xs sm:text-sm">Nomor {k.nomorUrut}</Badge>
                        <span className="text-base sm:text-lg">{k.namaCalon}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">Visi</h4>
                        <p className="text-gray-600 text-xs sm:text-sm">{k.visi || 'Belum ada visi'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">Misi</h4>
                        <p className="text-gray-600 text-xs sm:text-sm">{k.misi || 'Belum ada misi'}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Selection status */}
                {selectedKandidat?.id === k.id && (
                  <div className="w-full h-10 sm:h-11 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center text-sm sm:text-base font-semibold transition-colors">
                    <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
                    Dipilih
                  </div>
                )}
              </CardContent>
            </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Bar - Show when both candidates selected */}
      {selectedMitraTama && selectedMitraMuda && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-xl p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs text-purple-600 font-semibold mb-2">Pilihan: Mitra Tama</p>
                  <p className="text-sm font-bold text-gray-800">{selectedMitraTama.namaCalon}</p>
                  <p className="text-xs text-gray-600 mt-1">Nomor {selectedMitraTama.nomorUrut}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-semibold mb-2">Pilihan: Mitra Muda</p>
                  <p className="text-sm font-bold text-gray-800">{selectedMitraMuda.namaCalon}</p>
                  <p className="text-xs text-gray-600 mt-1">Nomor {selectedMitraMuda.nomorUrut}</p>
                </div>
              </div>
              <Button 
                onClick={openConfirmDialog}
                className="w-full h-11 text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-semibold"
                disabled={isVoting}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Konfirmasi Pilihan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Konfirmasi Pilihan Akhir</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin dengan pilihan ini? Anda tidak dapat mengubahnya setelah submit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {selectedMitraTama && (
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-600 font-semibold mb-1">Mitra Tama (Kelas XI)</p>
                <p className="text-sm font-bold text-gray-800">{selectedMitraTama.namaCalon}</p>
                <p className="text-xs text-gray-600">Nomor {selectedMitraTama.nomorUrut}</p>
              </div>
            )}
            
            {selectedMitraMuda && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-semibold mb-1">Mitra Muda (Kelas X)</p>
                <p className="text-sm font-bold text-gray-800">{selectedMitraMuda.namaCalon}</p>
                <p className="text-xs text-gray-600">Nomor {selectedMitraMuda.nomorUrut}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
              disabled={isVoting}
            >
              Batal
            </Button>
            <Button 
              onClick={handleVote}
              className="flex-1 h-10 sm:h-11 text-sm sm:text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              disabled={isVoting}
            >
              {isVoting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Ya, Konfirmasi'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}