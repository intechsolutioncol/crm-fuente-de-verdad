'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FinanzasDashboard } from '@/components/finanzas/FinanzasDashboard'
import { FinanzasLista } from '@/components/finanzas/FinanzasLista'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { cn } from '@/lib/utils'
import type { NivelPermiso } from '@/types'

type Tab = 'dashboard' | 'registros'

export default function FinanzasPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [userEmail, setUserEmail] = useState('')
  const [nivel, setNivel] = useState<NivelPermiso | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '')
    })
    supabase.rpc('mi_permiso', { p_modulo: 'finanzas' }).then(({ data }) => {
      setNivel((data as NivelPermiso) ?? 'ninguno')
    })
  }, [])

  if (nivel === null) return null
  if (nivel === 'ninguno') return <AccesoDenegado />

  return (
    <div>
      {/* Tabs */}
      <div className="inline-flex bg-muted rounded-lg p-1 mb-6">
        {(['dashboard', 'registros'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-1.5 rounded-md text-sm font-semibold capitalize transition-all',
              tab === t
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'dashboard' ? 'Dashboard' : 'Registros'}
          </button>
        ))}
      </div>

      {tab === 'dashboard'
        ? <FinanzasDashboard onGoLista={() => setTab('registros')} />
        : <FinanzasLista userEmail={userEmail} isEditor={nivel === 'editor'} />
      }
    </div>
  )
}
