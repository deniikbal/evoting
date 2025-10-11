'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface Admin {
  id: number
  username: string
}

interface DashboardHeaderProps {
  admin: Admin | null
  onLogout: () => void
}

export default function DashboardHeader({ admin, onLogout }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 py-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Dashboard Admin</h1>
            <p className="text-sm text-gray-500 truncate">E-Voting OSIS SMAN 1 Bantarujeg</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-right">Admin: {admin?.username}</span>
            <Button variant="outline" onClick={onLogout} size="sm" className="w-full sm:w-auto">
              <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
