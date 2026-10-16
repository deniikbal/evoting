'use client'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      {navigationItems.map((item) => {
        const Icon = item.icon
        return (
          <Card
            key={item.href}
            className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
            onClick={() => router.push(item.href)}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2">
                  <Icon className="size-5 shrink-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm leading-tight sm:text-base">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs leading-tight sm:text-sm">
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
