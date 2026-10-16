'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Lock, Trophy } from 'lucide-react'

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
    const isMuda = role === 'mitramuda'

    return (
      <div key={role} className="mb-8 last:mb-0">
        <div className="mb-4 flex items-center gap-4">
          <Badge
            variant="outline"
            className={
              isMuda
                ? 'border-cyan-300 bg-cyan-100 px-3 py-1 text-sm font-bold text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-100 dark:border-cyan-700'
                : 'border-fuchsia-300 bg-fuchsia-100 px-3 py-1 text-sm font-bold text-fuchsia-800 dark:bg-fuchsia-900/60 dark:text-fuchsia-100 dark:border-fuchsia-700'
            }
          >
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
            {roleKandidat.map((k, index) => {
              const persentase = sudahMemilih > 0
                ? Math.round((k.jumlahSuara / sudahMemilih) * 100)
                : 0
              const isWinner = index === 0 && k.jumlahSuara > 0

              return (
                <div
                  key={k.id}
                  className={`flex flex-col gap-3 rounded-md border-2 p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                    isWinner
                      ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 dark:border-amber-800'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge
                      className={
                        isWinner
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-xs text-white'
                          : isMuda
                            ? 'bg-cyan-100 text-xs text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-100'
                            : 'bg-fuchsia-100 text-xs text-fuchsia-800 dark:bg-fuchsia-900/60 dark:text-fuchsia-100'
                      }
                    >
                      {isWinner ? <Trophy className="mr-1 size-3" /> : null}
                      No. {k.nomorUrut}
                    </Badge>
                    <span className="truncate text-sm font-medium sm:text-base">{k.namaCalon}</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="text-left sm:text-right">
                      <span className={`text-sm font-bold sm:text-base ${isWinner ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {k.jumlahSuara} suara
                      </span>
                      <span className="block text-xs text-muted-foreground sm:ml-2 sm:inline sm:text-sm">({persentase}%)</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted sm:w-24">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                          isWinner
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                            : isMuda
                              ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                              : 'bg-gradient-to-r from-fuchsia-400 to-pink-500'
                        }`}
                        style={{ width: `${persentase}%` }}
                      />
                    </div>
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
    <Card className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Trophy className="size-5 text-amber-500" />
          Hasil Akhir Perolehan Akhir Pemilihan Ketua OSIS
        </CardTitle>
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
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <Lock className="size-8 text-amber-500" />
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
