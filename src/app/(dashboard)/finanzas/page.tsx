'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FinanzasDashboard } from '@/components/finanzas/FinanzasDashboard'
import { FinanzasLista } from '@/components/finanzas/FinanzasLista'
import { cn } from '@/lib/utils'

type Tab = 'dashboard' | 'registros'

export default function FinanzasPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '')
    })
  }, [])

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
        : <FinanzasLista userEmail={userEmail} />
      }
    </div>
  )
}
