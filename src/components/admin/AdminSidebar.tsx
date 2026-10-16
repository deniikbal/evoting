'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users2,
  Trophy,
  User,
  School,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  ChevronsUpDown,
  Vote,
  BadgeCheck,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Admin {
  id: number
  username: string
  nama?: string
  role?: 'admin' | 'superadmin'
}

const dataMasterItems = [
  { title: 'Kelas', url: '/admin/kelas', icon: School },
  { title: 'Siswa', url: '/admin/siswa', icon: Users2 },
  { title: 'Guru & TU', url: '/admin/pegawai', icon: User },
  { title: 'Kandidat', url: '/admin/kandidat', icon: Trophy },
]

// Hover berwarna untuk item sidebar (khusus panel admin)
const menuHover =
  'transition-colors duration-200 hover:bg-sky-100 hover:text-sky-700 focus-visible:bg-sky-100 focus-visible:text-sky-700 data-[active=true]:bg-sky-100 data-[active=true]:font-semibold data-[active=true]:text-sky-700 data-[state=open]:bg-sky-100 data-[state=open]:text-sky-700 dark:hover:bg-sky-500/15 dark:hover:text-sky-300 dark:focus-visible:bg-sky-500/15 dark:focus-visible:text-sky-300 dark:data-[active=true]:bg-sky-500/15 dark:data-[active=true]:text-sky-300 dark:data-[state=open]:bg-sky-500/15 dark:data-[state=open]:text-sky-300'

export default function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = React.useState<Admin | null>(null)

  React.useEffect(() => {
    const sessionData = localStorage.getItem('adminSession')
    if (sessionData) {
      try {
        setAdmin(JSON.parse(sessionData))
      } catch {
        setAdmin(null)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login/admin')
  }

  const isDataMasterActive = dataMasterItems.some((item) =>
    pathname.startsWith(item.url)
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <button onClick={() => router.push('/admin/dashboard')}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Vote className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">E-Voting OSIS</span>
                  <span className="truncate text-xs">Panel Admin</span>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/dashboard'}
                tooltip="Dashboard"
                className={menuHover}
              >
                <button onClick={() => router.push('/admin/dashboard')}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible
              asChild
              defaultOpen={isDataMasterActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Data Master" isActive={isDataMasterActive} className={menuHover}>
                    <Users2 />
                    <span>Data Master</span>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {dataMasterItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.url}
                            className={menuHover}
                          >
                            <button onClick={() => router.push(item.url)}>
                              <Icon />
                              <span>{item.title}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/hasil'}
                tooltip="Hasil Voting"
                className={menuHover}
              >
                <button onClick={() => router.push('/admin/hasil')}>
                  <BarChart3 />
                  <span>Hasil Voting</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/pengaturan'}
                tooltip="Pengaturan"
                className={menuHover}
              >
                <button onClick={() => router.push('/admin/pengaturan')}>
                  <Settings />
                  <span>Pengaturan</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/user'}
                tooltip={
                  admin?.role !== 'superadmin'
                    ? 'Hanya SuperAdmin yang dapat mengelola admin'
                    : 'Kelola admin pengguna'
                }
                className={menuHover}
              >
                <button onClick={() => router.push('/admin/user')}>
                  <Shield />
                  <span>User</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={menuHover}
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                    <BadgeCheck className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {admin?.nama || admin?.username || 'Admin'}
                    </span>
                    <span className="truncate text-xs">
                      {admin?.role === 'superadmin' ? 'SuperAdmin' : 'Admin'}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                      <BadgeCheck className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {admin?.nama || admin?.username || 'Admin'}
                      </span>
                      <span className="truncate text-xs">
                        {admin?.username}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
