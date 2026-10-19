'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { User, CheckCircle, Loader2, ChevronDown, LogOut, AlertCircle } from 'lucide-react'
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
  const [expandedKandidat, setExpandedKandidat] = useState<number | null>(null)
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

    // Identitas pemilih kini dibuktikan oleh tiket bertanda tangan dari
    // server, bukan oleh id yang dikirim mentah dari peramban.
    const tiket = localStorage.getItem('tiketPemilih')
    if (!tiket) {
      setError(
        'Sesi pemilih tidak ditemukan atau kedaluwarsa. Silakan login ulang.'
      )
      setShowConfirmDialog(false)
      setIsVoting(false)
      return
    }

    try {
      const kirimSatu = async (kandidatId: number) => {
        try {
          return await fetch('/api/voting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kandidatId, tiket }),
          })
        } catch {
          return null
        }
      }

      // Berurutan, bukan bersamaan: mencegah kondisi balapan pada penutupan
      // hak pilih ketika dua suara disimpan pada saat yang sama.
      let adaYangSudahTersimpan = false

      const responTama = await kirimSatu(selectedMitraTama.id)
      if (responTama && responTama.status === 409) adaYangSudahTersimpan = true

      const responMuda = await kirimSatu(selectedMitraMuda.id)
      if (responMuda && responMuda.status === 409) adaYangSudahTersimpan = true

      const responses = [responTama, responMuda]
      const berhasil = responses.filter((r) => r?.ok).length

      // Kedua kategori harus benar-benar tersimpan. Bila salah satu sudah
      // tersimpan dari percobaan sebelumnya, satu keberhasilan sudah cukup.
      const allSuccess =
        berhasil === 2 || (adaYangSudahTersimpan && berhasil >= 1)

      if (allSuccess) {
        // Clear session and redirect to thank you page
        localStorage.removeItem('siswaSession')
        localStorage.removeItem('pegawaiSession')
        localStorage.removeItem('tiketPemilih')
        router.push('/terima-kasih')
      } else {
        const errorRes = responses.find((res) => res && !res.ok)
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
    // Toggle expanded state
    setExpandedKandidat(expandedKandidat === kandidat.id ? null : kandidat.id)
  }

  const openConfirmDialog = () => {
    if (selectedMitraTama && selectedMitraMuda) {
      setShowConfirmDialog(true)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('siswaSession')
    localStorage.removeItem('pegawaiSession')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40 p-3 sm:p-4">
        <div className="mx-auto max-w-6xl space-y-6 py-8">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Jika user sudah voting, tampilkan ucapan terimakasih
  if (user?.data.sudahMemilih) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-3 sm:p-4">
        <div className="w-full max-w-md">
          <Card className="text-center">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-primary/10 sm:mb-4 sm:size-20">
                <CheckCircle className="size-8 text-primary sm:size-10" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">
                Terima Kasih!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-sm text-muted-foreground sm:text-base">
                Anda telah berhasil menggunakan hak suara Anda dalam Pemilihan Ketua OSIS SMAN 1 Bantarujeg.
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Partisipasi Anda sangat berarti untuk kemajuan OSIS kita.
              </p>

              <div className="pt-2 sm:pt-4">
                <Button
                  onClick={() => {
                    localStorage.removeItem('siswaSession')
                    localStorage.removeItem('pegawaiSession')
                    router.push('/')
                  }}
                  className="h-10 w-full text-sm sm:h-11 sm:text-base"
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
    <div className={`min-h-screen bg-muted/40 p-3 sm:p-4 ${selectedMitraTama && selectedMitraMuda ? 'pb-32 sm:pb-40' : ''}`}>
      {/* Header */}
      <div className="mx-auto mb-6 max-w-6xl sm:mb-8">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h1 className="text-xl font-bold sm:text-2xl">Pemilihan Ketua OSIS</h1>
                <p className="text-sm text-muted-foreground sm:text-base">SMAN 1 Bantarujeg 2025</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted-foreground sm:text-sm">Pemilih:</p>
                  <p className="truncate text-sm font-semibold sm:text-base">
                    {user?.type === 'siswa'
                      ? (user.data as Siswa).namaLengkap
                      : (user?.data as Pegawai).nama}
                  </p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {user?.type === 'siswa'
                      ? (user.data as Siswa).kelas
                      : `${user?.type === 'guru' ? 'Guru' : 'TU'}`}
                  </p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  title="Logout"
                >
                  <LogOut />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mx-auto mb-6 max-w-6xl">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Kandidat Cards */}
      <div className="mx-auto max-w-6xl">
        <div className="space-y-10 sm:space-y-12">
          {['mitratama', 'mitramuda'].map((roleType) => {
            const roleKandidat = kandidat.filter(k => k.role === roleType)
            const roleLabel = roleType === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'
            const selectedKandidat = roleType === 'mitratama' ? selectedMitraTama : selectedMitraMuda

            return (
              <div key={roleType}>
                <div className="mb-6 flex items-center gap-4 sm:mb-8">
                  <Badge variant="outline" className="px-4 py-2 text-sm font-bold sm:text-base">
                    {roleLabel}
                  </Badge>
                  <Separator className="flex-1" />
                  <span className="text-sm font-medium text-muted-foreground">{roleKandidat.length} kandidat</span>
                </div>

                {roleKandidat.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Belum ada kandidat untuk kategori ini
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                    {roleKandidat.map((k) => (
                      <Card
                        key={k.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${selectedKandidat?.id === k.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => selectKandidat(k)}
                      >
                        <CardHeader className="relative pb-3 text-center sm:pb-6">
                          <div className="mx-auto mb-3 flex size-20 items-center justify-center rounded-full bg-muted sm:mb-4 sm:size-24">
                            {k.fotoUrl ? (
                              <img
                                src={k.fotoUrl}
                                alt={k.namaCalon}
                                className="size-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="size-10 text-muted-foreground sm:size-12" />
                            )}
                          </div>
                          {selectedKandidat?.id === k.id && (
                            <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                              <CheckCircle className="size-5" />
                            </div>
                          )}
                          <Badge variant="secondary" className="mx-auto mb-2 w-fit text-xs sm:text-sm">
                            Nomor {k.nomorUrut}
                          </Badge>
                          <CardTitle className="text-base sm:text-lg">{k.namaCalon}</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3 sm:space-y-4">
                          {/* Visi & Misi Preview - Collapsed */}
                          {expandedKandidat !== k.id && (
                            <>
                              <div className="text-xs sm:text-sm">
                                <p className="mb-1 font-semibold">Visi:</p>
                                <p className="line-clamp-2 text-muted-foreground">
                                  {k.visi || 'Belum ada visi'}
                                </p>
                              </div>

                              <div className="text-xs sm:text-sm">
                                <p className="mb-1 font-semibold">Misi:</p>
                                <p className="line-clamp-2 text-muted-foreground">
                                  {k.misi || 'Belum ada misi'}
                                </p>
                              </div>
                            </>
                          )}

                          {/* Visi & Misi Expanded */}
                          {expandedKandidat === k.id && (
                            <div className="space-y-3 rounded-lg border bg-muted/50 p-3 sm:space-y-4 sm:p-4">
                              <div>
                                <h4 className="mb-2 text-xs font-semibold sm:text-sm">Visi</h4>
                                <p className="whitespace-pre-wrap text-xs text-muted-foreground sm:text-sm">
                                  {k.visi || 'Belum ada visi'}
                                </p>
                              </div>
                              <Separator />
                              <div>
                                <h4 className="mb-2 text-xs font-semibold sm:text-sm">Misi</h4>
                                <p className="whitespace-pre-wrap text-xs text-muted-foreground sm:text-sm">
                                  {k.misi || 'Belum ada misi'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Toggle Details Button */}
                          <Button
                            variant={expandedKandidat === k.id ? 'default' : 'outline'}
                            className="h-9 w-full text-sm transition-all sm:h-10"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedKandidat(expandedKandidat === k.id ? null : k.id)
                            }}
                          >
                            <ChevronDown className={`size-3 transition-transform sm:size-4 ${expandedKandidat === k.id ? 'rotate-180' : ''}`} />
                            {expandedKandidat === k.id ? 'Tutup Detail' : 'Lihat Detail'}
                          </Button>

                          {/* Selection status */}
                          {selectedKandidat?.id === k.id && (
                            <div className="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground sm:h-11 sm:text-base">
                              <CheckCircle className="mr-1 size-4 sm:mr-2" />
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
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-lg sm:p-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Pilihan: Mitra Tama</p>
                  <p className="text-sm font-bold">{selectedMitraTama.namaCalon}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Nomor {selectedMitraTama.nomorUrut}</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Pilihan: Mitra Muda</p>
                  <p className="text-sm font-bold">{selectedMitraMuda.namaCalon}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Nomor {selectedMitraMuda.nomorUrut}</p>
                </div>
              </div>
              <Button
                onClick={openConfirmDialog}
                className="h-11 w-full text-base font-semibold"
                disabled={isVoting}
              >
                <CheckCircle className="size-5" />
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
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Mitra Tama (Kelas XI)</p>
                <p className="text-sm font-bold">{selectedMitraTama.namaCalon}</p>
                <p className="text-xs text-muted-foreground">Nomor {selectedMitraTama.nomorUrut}</p>
              </div>
            )}

            {selectedMitraMuda && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Mitra Muda (Kelas X)</p>
                <p className="text-sm font-bold">{selectedMitraMuda.namaCalon}</p>
                <p className="text-xs text-muted-foreground">Nomor {selectedMitraMuda.nomorUrut}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="h-10 flex-1 text-sm sm:h-11 sm:text-base"
              disabled={isVoting}
            >
              Batal
            </Button>
            <Button
              onClick={handleVote}
              className="h-10 flex-1 text-sm sm:h-11 sm:text-base"
              disabled={isVoting}
            >
              {isVoting ? (
                <>
                  <Loader2 className="animate-spin" />
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
