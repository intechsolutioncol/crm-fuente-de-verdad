'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ROLES_CONFIGURABLES, MODULOS_PERMISO } from '@/types'
import type { Permiso, NivelPermiso } from '@/types'

interface Props {
  permisosIniciales: Permiso[]
}

export function PermisosTab({ permisosIniciales }: Props) {
  const [permisos, setPermisos] = useState(permisosIniciales)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  function nivelDe(rol: string, modulo: string): NivelPermiso {
    return permisos.find(p => p.rol === rol && p.modulo === modulo)?.nivel ?? 'ninguno'
  }

  async function guardar(rol: Permiso['rol'], modulo: Permiso['modulo'], nivel: NivelPermiso) {
    const key = `${rol}:${modulo}`
    setSavingKey(key)
    const supabase = createClient()
    const { error } = await supabase
      .from('permisos')
      .upsert({ rol, modulo, nivel }, { onConflict: 'rol,modulo' })
    setSavingKey(null)

    if (error) {
      toast.error('No se pudo guardar el permiso: ' + error.message)
      return
    }
    setPermisos(prev => {
      const sinEsta = prev.filter(p => !(p.rol === rol && p.modulo === modulo))
      return [...sinEsta, { rol, modulo, nivel }]
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground max-w-2xl">
        Define qué puede hacer cada rol en cada módulo. <strong>Administrador</strong> siempre
        tiene acceso total y no aparece aquí. Los cambios se guardan al instante.
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rol</th>
                {MODULOS_PERMISO.map(m => (
                  <th key={m.id} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROLES_CONFIGURABLES.map(rol => (
                <tr key={rol}>
                  <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap align-top">{rol}</td>
                  {MODULOS_PERMISO.map(m => {
                    const nivel = nivelDe(rol, m.id)
                    const habilitado = nivel !== 'ninguno'
                    const key = `${rol}:${m.id}`
                    return (
                      <td key={m.id} className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Switch
                              checked={habilitado}
                              disabled={savingKey === key}
                              onCheckedChange={checked =>
                                guardar(rol, m.id, checked ? 'lector' : 'ninguno')
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {habilitado ? 'Acceso habilitado' : 'Sin acceso'}
                            </span>
                          </label>
                          {habilitado && (
                            <RadioGroup
                              value={nivel}
                              onValueChange={v => guardar(rol, m.id, v as NivelPermiso)}
                              className="pl-0.5"
                            >
                              <RadioGroupItem value="lector">Lector</RadioGroupItem>
                              <RadioGroupItem value="editor">Editor</RadioGroupItem>
                            </RadioGroup>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="bg-muted/20">
                <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">Administrador</td>
                {MODULOS_PERMISO.map(m => (
                  <td key={m.id} className="px-4 py-4">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Acceso total
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
