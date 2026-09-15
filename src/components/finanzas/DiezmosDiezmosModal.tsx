'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCOP } from '@/lib/utils/format'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

interface NotificacionPendiente {
  id: string
  ejecucion: { anio: number; mes: number; monto: number }
}

interface Props {
  miembroId: string
}

export function DiezmosDiezmosModal({ miembroId }: Props) {
  const [pendiente, setPendiente] = useState<NotificacionPendiente | null>(null)

  async function buscarPendiente() {
    const supabase = createClient()
    const { data } = await supabase
      .from('diezmos_diezmos_notificaciones')
      .select('id, diezmos_diezmos_ejecuciones(anio, mes, monto)')
      .eq('miembro_id', miembroId)
      .eq('visto', false)
      .order('creado_en', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (data?.diezmos_diezmos_ejecuciones) {
      const ejecucion = data.diezmos_diezmos_ejecuciones as unknown as { anio: number; mes: number; monto: number }
      setPendiente({ id: data.id, ejecucion })
    }
  }

  useEffect(() => {
    buscarPendiente() // cubre "la próxima vez que entre"

    const supabase = createClient()
    const canal = supabase
      .channel(`ddn-${miembroId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'fuente_verdad', table: 'diezmos_diezmos_notificaciones', filter: `miembro_id=eq.${miembroId}` },
        () => buscarPendiente() // cubre "si está en la plataforma en ese momento"
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miembroId])

  async function cerrar() {
    if (!pendiente) return
    const supabase = createClient()
    await supabase
      .from('diezmos_diezmos_notificaciones')
      .update({ visto: true })
      .eq('id', pendiente.id)
    setPendiente(null)
  }

  if (!pendiente) return null

  return (
    <Dialog open onOpenChange={open => !open && cerrar()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Diezmos de Diezmos registrado</DialogTitle>
        </DialogHeader>
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Se registró automáticamente el egreso de <strong className="text-foreground">Diezmos de Diezmos</strong> de{' '}
            {NOMBRES_MES[pendiente.ejecucion.mes - 1]} de {pendiente.ejecucion.anio}.
          </p>
          <p className="text-2xl font-extrabold text-primary my-3">{formatCOP(pendiente.ejecucion.monto)}</p>
          <Button className="w-full mt-2" onClick={cerrar}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
