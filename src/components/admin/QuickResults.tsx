'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Lock } from 'lucide-react'

interface Kandidat {
  id: number
  nomorUrut: number
  namaCalon: string
  jumlahSuara: number
  role: string
}

interface Admin {
  id: number
  username: string
  role?: 'admin' | 'superadmin'
}

interface QuickResultsProps {
  kandidat: Kandidat[]
  sudahMemilih: number
  votingAktif: boolean
  admin?: Admin
  adminRole?: string
}

export default function QuickResults({ kandidat, sudahMemilih, votingAktif, admin, adminRole }: QuickResultsProps) {
  // Show results if voting is not active, OR if user is superadmin
  // Hide results if voting is active AND user is not superadmin
  const displayKandidat = (votingAktif && adminRole !== 'superadmin') ? [] : kandidat

  const renderKandidatByRole = (role: 'mitratama' | 'mitramuda') => {
    const roleKandidat = displayKandidat.filter(k => k.role === role).sort((a, b) => b.jumlahSuara - a.jumlahSuara)
    const roleLabel = role === 'mitramuda' ? 'Mitra Muda (Kelas X)' : 'Mitra Tama (Kelas XI)'

    return (
      <div key={role} className="mb-8 last:mb-0">
        <div className="mb-4 flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1 text-sm font-bold">
            {roleLabel}
          </Badge>
          <Separator className="flex-1" />
          <span className="text-sm font-medium text-muted-foreground">{roleKandidat.length} kandidat</span>
        </div>

        {roleKandidat.length === 0 ? (
          <div className="rounded-md border bg-muted/40 py-6 text-center">
            <p className="text-sm text-muted-foreground">Belum ada kandidat</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roleKandidat.map((k) => {
              const persentase = sudahMemilih > 0
                ? Math.round((k.jumlahSuara / sudahMemilih) * 100)
                : 0

              return (
                <div
                  key={k.id}
                  className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge variant="secondary" className="text-xs">No. {k.nomorUrut}</Badge>
                    <span className="truncate text-sm font-medium sm:text-base">{k.namaCalon}</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-sm font-bold sm:text-base">{k.jumlahSuara} suara</span>
                      <span className="block text-xs text-muted-foreground sm:ml-2 sm:inline sm:text-sm">({persentase}%)</span>
                    </div>
                    <Progress value={persentase} className="h-2 w-full sm:w-24" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Hasil Akhir Perolehan Akhir Pemilihan Ketua OSIS</CardTitle>
        <CardDescription>
          {votingAktif
            ? 'Hasil akan ditampilkan setelah voting selesai'
            : 'Perolehan Akhir Pemilihan Ketua OSIS'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show lock message only if voting is active AND user is NOT superadmin */}
        {votingAktif && adminRole !== 'superadmin' ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Lock className="size-8 text-muted-foreground" />
            </div>
            <p className="mb-2 font-medium">Hasil Disembunyikan</p>
            <p className="text-sm text-muted-foreground">
              Voting sedang berlangsung. Nonaktifkan voting untuk melihat hasil.
            </p>
          </div>
        ) : displayKandidat.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Belum ada kandidat</p>
        ) : (
          <div>
            {renderKandidatByRole('mitratama')}
            {renderKandidatByRole('mitramuda')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
