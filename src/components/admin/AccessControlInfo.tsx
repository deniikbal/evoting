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
  const statusLabel = adminRole === 'superadmin' ? 'SuperAdmin' : 'Admin'
  const votingStatus = votingAktif ? 'Voting Berlangsung' : 'Voting Selesai'

  return (
    <Alert>
      <Info className="size-4" />
      <AlertDescription>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={adminRole === 'superadmin' ? 'default' : 'secondary'}>
            {statusLabel}
          </Badge>

          <Badge variant="outline">
            {votingStatus}
          </Badge>

          <div className="flex items-center gap-1.5">
            {canViewResults ? (
              <>
                <CheckCircle2 className="size-4 text-primary" />
                <span className="text-sm font-medium">Hasil Terlihat</span>
              </>
            ) : (
              <>
                <Lock className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Hasil Tersembunyi</span>
              </>
            )}
          </div>
        </div>

        {/* Status Explanation */}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {adminRole === 'superadmin' ? (
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-3" />
              SuperAdmin dapat melihat hasil kapan saja (voting aktif atau tidak)
            </p>
          ) : (
            votingAktif ? (
              <p className="flex items-center gap-2">
                <Lock className="size-3" />
                Admin hanya bisa melihat hasil ketika voting selesai
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-3" />
                Admin bisa melihat hasil karena voting sudah selesai
              </p>
            )
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
