'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Play, Square } from 'lucide-react'

interface VotingControlProps {
  votingAktif: boolean
  isTogglingVoting: boolean
  onToggleVoting: () => void
}

export default function VotingControl({ 
  votingAktif, 
  isTogglingVoting, 
  onToggleVoting 
}: VotingControlProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-base">
          <Settings className="w-5 h-5" />
          Pengaturan Voting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-sm sm:text-base">Status Voting</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {votingAktif 
                ? 'Voting sedang aktif, siswa dapat melakukan login dan memilih'
                : 'Voting tidak aktif, siswa tidak dapat melakukan voting'
              }
            </p>
          </div>
          <Button
            onClick={onToggleVoting}
            disabled={isTogglingVoting}
            variant={votingAktif ? "destructive" : "default"}
            size="sm"
            className="w-full sm:w-auto"
          >
            {isTogglingVoting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : votingAktif ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Hentikan Voting</span>
                <span className="sm:hidden">Stop</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Mulai Voting</span>
                <span className="sm:hidden">Start</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
