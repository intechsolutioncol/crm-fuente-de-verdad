'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  disabled?: boolean
}

const ACTIVE_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Miembros',
    href: '/miembros',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Finanzas',
    href: '/finanzas',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
]

const UPCOMING_ITEMS: NavItem[] = [
  { label: 'Asistencia', disabled: true, icon: (<svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>) },
  { label: 'Ministerios', disabled: true, icon: (<svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>) },
  { label: 'Eventos', disabled: true, icon: (<svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>) },
  { label: 'Reportes', disabled: true, icon: (<svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>) },
]

interface SidebarProps {
  userName: string
  userInitial: string
  userEmail: string
  onClose?: () => void
}

export function Sidebar({ userName, userInitial, userEmail, onClose }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col h-full bg-sidebar w-60">

      {/* Header / Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-sidebar-border">
        <div className="bg-white rounded-xl px-3 py-2.5 flex items-center justify-center">
          <Image
            src="/logo.webp"
            alt="Iglesia Apostólica Fuente de Verdad"
            width={148}
            height={74}
            className="object-contain"
            priority
          />
        </div>
        <p className="text-center text-[10px] text-sidebar-foreground/40 tracking-wider mt-2.5">
          Poblado · Medellín
        </p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <p className="text-[10px] font-bold tracking-widest text-sidebar-foreground/35 px-2.5 mb-2">
          MÓDULOS ACTIVOS
        </p>

        {ACTIVE_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href!}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] font-medium mb-0.5 transition-colors',
              isActive(item.href!)
                ? 'bg-sidebar-accent text-sidebar-foreground font-semibold'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
            )}
          >
            <span className={cn('opacity-80', isActive(item.href!) && 'opacity-100')}>
              {item.icon}
            </span>
            {item.label}
            {isActive(item.href!) && (
              <span className="ml-auto w-1 h-5 rounded-full bg-sidebar-ring" />
            )}
          </Link>
        ))}

        <p className="text-[10px] font-bold tracking-widest text-sidebar-foreground/35 px-2.5 mb-2 mt-5">
          PRÓXIMAMENTE
        </p>

        {UPCOMING_ITEMS.map(item => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] font-medium mb-0.5 opacity-35 cursor-not-allowed select-none text-sidebar-foreground"
          >
            {item.icon}
            <span>{item.label}</span>
            <span className="ml-auto text-[10px] font-semibold bg-sidebar-foreground/10 text-sidebar-foreground/60 px-2 py-0.5 rounded-full">
              Pronto
            </span>
          </div>
        ))}
      </nav>

      {/* Footer usuario */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-t border-sidebar-border">
        <div className="w-8 h-8 rounded-full bg-sidebar-ring flex items-center justify-center text-[13px] font-bold text-sidebar-foreground flex-shrink-0">
          {userInitial}
        </div>
        <div className="overflow-hidden">
          <span className="block text-[12px] font-semibold text-sidebar-foreground truncate">{userName}</span>
          <span className="block text-[11px] text-sidebar-foreground/45 truncate">{userEmail}</span>
        </div>
      </div>
    </aside>
  )
}
