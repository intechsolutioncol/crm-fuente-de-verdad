'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import type { ConfiguracionFinanzas } from '@/types'

interface Props {
  configuracionInicial: ConfiguracionFinanzas
}

export function ReglasFinanzasTab({ configuracionInicial }: Props) {
  const [config, setConfig] = useState(configuracionInicial)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const nuevoValor = !config.exigir_registro_48h
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('configuracion_finanzas')
      .update({ exigir_registro_48h: nuevoValor })
      .eq('id', 1)
    setSaving(false)

    if (error) {
      toast.error('No se pudo actualizar: ' + error.message)
      return
    }
    setConfig(prev => ({ ...prev, exigir_registro_48h: nuevoValor }))
    toast.success(nuevoValor ? 'Ventana de 48 horas activada' : 'Ventana de 48 horas desactivada')
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 max-w-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Exigir registro dentro de 48 horas</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Un movimiento fechado el domingo solo se podrá registrar hasta el martes a las 11:59pm.
            El Administrador siempre puede registrar sin este límite. Mientras la plataforma esté en
            fase de prueba, déjalo desactivado.
          </p>
        </div>
        <Switch checked={config.exigir_registro_48h} disabled={saving} onCheckedChange={toggle} />
      </div>
    </div>
  )
}
