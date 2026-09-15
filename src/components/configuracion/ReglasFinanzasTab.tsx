'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ConfiguracionFinanzas, MetodoFinanzas } from '@/types'

interface Props {
  configuracionInicial: ConfiguracionFinanzas
  metodosPago: MetodoFinanzas[]
}

export function ReglasFinanzasTab({ configuracionInicial, metodosPago }: Props) {
  const [config, setConfig] = useState(configuracionInicial)
  const [saving, setSaving] = useState(false)

  async function guardar(cambios: Partial<ConfiguracionFinanzas>) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('configuracion_finanzas')
      .update(cambios)
      .eq('id', 1)
    setSaving(false)

    if (error) {
      toast.error('No se pudo actualizar: ' + error.message)
      return
    }
    setConfig(prev => ({ ...prev, ...cambios }))
  }

  async function toggle48h() {
    const nuevoValor = !config.exigir_registro_48h
    await guardar({ exigir_registro_48h: nuevoValor })
    toast.success(nuevoValor ? 'Ventana de 48 horas activada' : 'Ventana de 48 horas desactivada')
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Exigir registro dentro de 48 horas</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Un movimiento fechado el domingo solo se podrá registrar hasta el martes a las 11:59pm.
              El Administrador siempre puede registrar sin este límite. Mientras la plataforma esté en
              fase de prueba, déjalo desactivado.
            </p>
          </div>
          <Switch checked={config.exigir_registro_48h} disabled={saving} onCheckedChange={toggle48h} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-foreground">Diezmos de Diezmos (egreso automático)</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-md">
          El último día de cada mes, a la hora que definas, se registra automáticamente un egreso por
          el 10% de los diezmos recibidos ese mes, con el método de pago que elijas aquí.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="hora-diezmos">Hora de ejecución</Label>
            <Input
              id="hora-diezmos"
              type="time"
              disabled={saving}
              value={config.diezmos_diezmos_hora.slice(0, 5)}
              onChange={e => guardar({ diezmos_diezmos_hora: `${e.target.value}:00` })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <Select
              value={config.diezmos_diezmos_metodo_pago ?? undefined}
              onValueChange={v => v && guardar({ diezmos_diezmos_metodo_pago: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {metodosPago.map(m => <SelectItem key={m.id} value={m.nombre}>{m.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
