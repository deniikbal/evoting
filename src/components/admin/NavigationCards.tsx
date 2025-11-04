'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users2, Trophy, BarChart3, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NavigationCards() {
  const router = useRouter()

  const navigationItems = [
    {
      title: "Manajemen Siswa",
      description: "Tambah, edit, dan impor data siswa",
      icon: Users2,
      href: "/admin/siswa"
    },
    {
      title: "Manajemen Kandidat",
      description: "Kelola data kandidat OSIS",
      icon: Trophy,
      href: "/admin/kandidat"
    },
    {
      title: "Hasil Voting",
      description: "Lihat dan ekspor hasil voting",
      icon: BarChart3,
      href: "/admin/hasil"
    },
    {
      title: "Pengaturan",
      description: "Konfigurasi sistem voting",
      icon: Settings,
      href: "/admin/pengaturan"
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {navigationItems.map((item, index) => {
        const Icon = item.icon
        return (
          <Card 
            key={index}
            className="bg-white rounded-sm shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer col-span-1 border border-gray-200" 
            onClick={() => router.push(item.href)}
          >
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-2 bg-blue-50 rounded-sm">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm sm:text-base leading-tight text-gray-800">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 leading-tight text-gray-600">
                    {item.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
