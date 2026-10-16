'use client'

import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Lock, Info } from 'lucide-react'

interface AccessControlInfoProps {
  adminRole?: string
  votingAktif: boolean
  canViewResults: boolean
}

export default function AccessControlInfo({ adminRole, votingAktif, canViewResults }: AccessControlInfoProps) {
  const isSuperadmin = adminRole === 'superadmin'
  const statusLabel = isSuperadmin ? 'SuperAdmin' : 'Admin'
  const votingStatus = votingAktif ? 'Voting Berlangsung' : 'Voting Selesai'

  return (
    <Alert className="border-violet-200 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-purple-50 dark:from-violet-950/40 dark:via-fuchsia-950/40 dark:to-purple-950/40 dark:border-violet-900">
      <Info className="size-4 text-violet-500" />
      <AlertDescription>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            className={
              isSuperadmin
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white'
                : 'bg-gradient-to-r from-sky-500 to-blue-500 text-white'
            }
          >
            {statusLabel}
          </Badge>

          <Badge
            variant="outline"
            className={
              votingAktif
                ? 'border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-100 dark:border-amber-700'
                : 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100 dark:border-emerald-700'
            }
          >
            {votingStatus}
          </Badge>

          <div className="flex items-center gap-1.5">
            {canViewResults ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Hasil Terlihat</span>
              </>
            ) : (
              <>
                <Lock className="size-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Hasil Tersembunyi</span>
              </>
            )}
          </div>
        </div>

        {/* Status Explanation */}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {isSuperadmin ? (
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-3 text-emerald-500" />
              SuperAdmin dapat melihat hasil kapan saja (voting aktif atau tidak)
            </p>
          ) : (
            votingAktif ? (
              <p className="flex items-center gap-2">
                <Lock className="size-3 text-amber-500" />
                Admin hanya bisa melihat hasil ketika voting selesai
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-3 text-emerald-500" />
                Admin bisa melihat hasil karena voting sudah selesai
              </p>
            )
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
