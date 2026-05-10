'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; initial: string; email: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login')
        return
      }
      const email = data.user.email ?? ''
      const rawName = data.user.user_metadata?.full_name
        ?? email.split('@')[0].replace(/[._-]/g, ' ')
      const name = rawName
        .split(' ')
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
      setUser({ name, initial: name.charAt(0).toUpperCase(), email })
    })
  }, [router])

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Sidebar escritorio */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          userName={user?.name ?? '…'}
          userInitial={user?.initial ?? '?'}
          userEmail={user?.email ?? ''}
        />
      </div>

      {/* Sidebar móvil + backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-60 h-full shadow-xl" onClick={e => e.stopPropagation()}>
            <Sidebar
              userName={user?.name ?? '…'}
              userInitial={user?.initial ?? '?'}
              userEmail={user?.email ?? ''}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className={cn('flex-1 overflow-y-auto p-6 md:p-8')}>
          {children}
        </main>
      </div>
    </div>
  )
}
