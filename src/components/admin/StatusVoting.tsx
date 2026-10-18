'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck, ShieldAlert, CircleDashed } from 'lucide-react'
import type { AdminSession } from './dashboard-types'

interface StatusVotingProps {
  votingAktif: boolean
  admin: AdminSession | null
  /** Hak lihat hasil: superadmin selalu, admin hanya saat voting berhenti. */
  hasilTerlihat: boolean
  diperbaruiPada: Date | null
}

function formatJam(d: Date): string {
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Baris status satu tingkat di atas seluruh halaman.
 * Menjawab satu pertanyaan: apakah pemilihan sedang berjalan, dan apakah saya
 * punya hak melihat hasilnya sekarang.
 */
export default function StatusVoting({
  votingAktif,
  admin,
  hasilTerlihat,
  diperbaruiPada,
}: StatusVotingProps) {
  return (
    <section
      aria-labelledby="status-voting-judul"
      className="rounded-lg border bg-card px-4 py-3 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 id="status-voting-judul" className="text-sm font-medium">
            Status pemilihan
          </h2>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <div className="flex items-center gap-2">
            {/* Aksen tunggal layar ini: --primary hanya untuk keadaan berjalan. */}
            <Badge
              variant={votingAktif ? 'default' : 'secondary'}
              className="font-medium"
            >
              {votingAktif ? 'Voting berlangsung' : 'Voting dihentikan'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {votingAktif
                ? 'Pemilih dapat memindai QR dan memberi suara.'
                : 'Bilik voting tidak menerima suara baru.'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            {hasilTerlihat ? (
              <ShieldCheck className="size-4" aria-hidden="true" />
            ) : (
              <ShieldAlert className="size-4" aria-hidden="true" />
            )}
            {hasilTerlihat
              ? admin?.role === 'superadmin'
                ? 'Anda SuperAdmin, hasil selalu terlihat'
                : 'Hasil terlihat karena voting dihentikan'
              : 'Hasil disembunyikan selama voting berlangsung'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleDashed className="size-4" aria-hidden="true" />
            {diperbaruiPada
              ? `Diperbarui ${formatJam(diperbaruiPada)}`
              : 'Belum pernah diperbarui'}
          </span>
        </div>
      </div>
    </section>
  )
}
