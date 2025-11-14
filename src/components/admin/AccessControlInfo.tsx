'use client'

import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, LockIcon } from 'lucide-react'

interface AccessControlInfoProps {
  adminRole?: string
  votingAktif: boolean
  canViewResults: boolean
}

export default function AccessControlInfo({ adminRole, votingAktif, canViewResults }: AccessControlInfoProps) {
  const statusLabel = adminRole === 'superadmin' ? 'SuperAdmin' : 'Admin'
  const votingStatus = votingAktif ? 'Voting Berlangsung' : 'Voting Selesai'
  
  return (
    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={adminRole === 'superadmin' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
            {statusLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={votingAktif ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}>
            {votingStatus}
          </Badge>
        </div>

        <div className="flex items-center gap-2 ml-2">
          {canViewResults ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Hasil Terlihat</span>
            </>
          ) : (
            <>
              <LockIcon className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-700 font-medium">Hasil Tersembunyi</span>
            </>
          )}
        </div>
      </div>

      {/* Status Explanation */}
      <div className="mt-3 text-xs text-slate-600 space-y-1">
        {adminRole === 'superadmin' ? (
          <>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              SuperAdmin dapat melihat hasil kapan saja (voting aktif atau tidak)
            </p>
          </>
        ) : (
          <>
            {votingAktif ? (
              <p className="flex items-center gap-2">
                <LockIcon className="w-3 h-3 text-orange-600" />
                Admin hanya bisa melihat hasil ketika voting selesai
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Admin bisa melihat hasil karena voting sudah selesai
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
