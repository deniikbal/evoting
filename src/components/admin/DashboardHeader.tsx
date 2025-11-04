'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, ChevronDown, Users2, Trophy, BarChart3, Settings, LayoutDashboard, School } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Admin {
  id: number
  username: string
}

interface DashboardHeaderProps {
  admin: Admin | null
  onLogout: () => void
}

export default function DashboardHeader({ admin, onLogout }: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-800">Dashboard Admin</h1>
              <p className="text-xs sm:text-sm text-gray-500">E-Voting OSIS</p>
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Dashboard */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/admin/dashboard')}
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              >
                <LayoutDashboard className="mr-1 h-4 w-4" />
                Dashboard
              </Button>

              {/* Data Master Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                    Data Master
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => router.push('/admin/kelas')} className="cursor-pointer hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600">
                    <School className="mr-2 h-4 w-4" />
                    <span>Kelas</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/siswa')} className="cursor-pointer hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600">
                    <Users2 className="mr-2 h-4 w-4" />
                    <span>Siswa</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/kandidat')} className="cursor-pointer hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600">
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>Kandidat</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Hasil Voting */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/admin/hasil')}
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              >
                <BarChart3 className="mr-1 h-4 w-4" />
                Hasil Voting
              </Button>

              {/* Pengaturan */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/admin/pengaturan')}
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              >
                <Settings className="mr-1 h-4 w-4" />
                Pengaturan
              </Button>
            </nav>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-600">Admin: {admin?.username}</span>
            <Button variant="outline" onClick={onLogout} size="default" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/admin/dashboard')}
            className="text-xs text-gray-700"
          >
            <LayoutDashboard className="mr-1 h-3 w-3" />
            Dashboard
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-gray-700">
                Data Master
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={() => router.push('/admin/kelas')} className="cursor-pointer text-xs hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600">
                <School className="mr-2 h-3 w-3" />
                Kelas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/siswa')} className="cursor-pointer text-xs hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600">
                <Users2 className="mr-2 h-3 w-3" />
                Siswa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/kandidat')} className="cursor-pointer text-xs hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600">
                <Trophy className="mr-2 h-3 w-3" />
                Kandidat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/admin/hasil')}
            className="text-xs text-gray-700"
          >
            <BarChart3 className="mr-1 h-3 w-3" />
            Hasil
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/admin/pengaturan')}
            className="text-xs text-gray-700"
          >
            <Settings className="mr-1 h-3 w-3" />
            Pengaturan
          </Button>
        </nav>
      </div>
    </header>
  )
}
