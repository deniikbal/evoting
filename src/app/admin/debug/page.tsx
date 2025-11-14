'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Admin {
  id: number
  username: string
  role?: string
}

export default function DebugPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)

  useEffect(() => {
    fetchAdmins()
    checkCurrentSession()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/debug-role')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data.data || [])
      }
    } catch (err) {
      toast.error('Gagal mengambil data admin')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const checkCurrentSession = () => {
    const sessionData = localStorage.getItem('adminSession')
    if (sessionData) {
      const session = JSON.parse(sessionData)
      setCurrentAdmin(session)
    }
  }

  const updateRole = async (username: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/debug-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role: newRole }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchAdmins()
        
        // Update session if this is current user
        if (currentAdmin?.username === username) {
          const updated = {
            ...currentAdmin,
            role: newRole,
          }
          localStorage.setItem('adminSession', JSON.stringify(updated))
          setCurrentAdmin(updated)
          toast.info('Session updated. Please refresh page.')
        }
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error('Gagal update role')
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Admin Role</h1>

        {/* Current Session */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session Anda Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAdmin ? (
              <div className="space-y-2">
                <p><strong>Username:</strong> {currentAdmin.username}</p>
                <p>
                  <strong>Role:</strong>{' '}
                  <Badge className={currentAdmin.role === 'superadmin' ? 'bg-red-500' : 'bg-blue-500'}>
                    {currentAdmin.role || 'NOT SET'}
                  </Badge>
                </p>
                <p className="text-sm text-gray-600 mt-4">
                  💡 Jika role menunjukkan 'NOT SET' atau 'admin', ubah ke 'superadmin' di bawah, atau logout & login ulang.
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Tidak ada session. Silakan login terlebih dahulu.</p>
            )}
          </CardContent>
        </Card>

        {/* All Admins */}
        <Card>
          <CardHeader>
            <CardTitle>Semua Admin di Database</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : admins.length === 0 ? (
              <p className="text-gray-500">Tidak ada admin</p>
            ) : (
              <div className="space-y-3">
                {admins.map((adm) => (
                  <div key={adm.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{adm.username}</p>
                      <Badge className={adm.role === 'superadmin' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} variant="outline">
                        {adm.role || 'NOT SET'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {adm.role !== 'superadmin' && (
                        <Button
                          onClick={() => updateRole(adm.username, 'superadmin')}
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Jadikan SuperAdmin
                        </Button>
                      )}
                      {adm.role !== 'admin' && (
                        <Button
                          onClick={() => updateRole(adm.username, 'admin')}
                          size="sm"
                          variant="outline"
                        >
                          Jadikan Admin
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
