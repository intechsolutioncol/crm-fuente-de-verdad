'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/finanzas': 'Finanzas',
  '/miembros': 'Miembros',
  '/configuracion': 'Configuración',
}

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [dateStr, setDateStr] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setDateStr(format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es }))
    const saved = localStorage.getItem('crm-theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
      setDarkMode(true)
    }
  }, [])

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark')
    setDarkMode(isDark)
    localStorage.setItem('crm-theme', isDark ? 'dark' : 'light')
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada correctamente')
    router.push('/login')
    router.refresh()
  }

  const title = PAGE_TITLES[pathname] ?? pathname.split('/').pop() ?? 'CRM'

  return (
    <header className="h-[60px] bg-card border-b border-border flex items-center gap-4 px-6 sticky top-0 z-40 shadow-sm">

      {/* Botón hamburguesa (solo móvil) */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Título */}
      <div className="flex-1">
        <h1 className="text-[17px] font-bold text-foreground leading-none">{title}</h1>
        <span className="text-[11px] text-muted-foreground">CRM · Fuente de Verdad</span>
      </div>

      {/* Derecha */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-[12px] text-muted-foreground capitalize">{dateStr}</span>

        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
          title="Modo oscuro"
        >
          {darkMode ? (
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Cerrar sesión */}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  )
}
