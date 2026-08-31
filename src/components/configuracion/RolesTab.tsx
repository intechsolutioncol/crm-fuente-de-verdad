'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Miembro, RolMiembro, EstadoMiembro } from '@/types'

const ROLES: RolMiembro[] = ['Miembro Oficial', 'Diácono', 'Líder', 'Pastor', 'Administrador']
const ESTADOS: EstadoMiembro[] = ['Activo', 'Inactivo', 'Visitante']

interface Props {
  miembrosIniciales: Miembro[]
}

export function RolesTab({ miembrosIniciales }: Props) {
  const router = useRouter()
  const [miembros, setMiembros] = useState(miembrosIniciales)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function actualizar(id: string, cambios: Partial<Pick<Miembro, 'rol' | 'estado'>>) {
    setSavingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('miembros').update(cambios).eq('id', id)
    setSavingId(null)

    if (error) {
      toast.error('No se pudo actualizar: ' + error.message)
      return
    }
    setMiembros(prev => prev.map(m => (m.id === id ? { ...m, ...cambios } : m)))
    toast.success('Actualizado correctamente')
    router.refresh()
  }

  if (miembros.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">Aún no hay miembros registrados.</p>
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Nombre', 'Correo', 'Rol', 'Estado'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {miembros.map(m => (
              <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                  {m.nombres} {m.apellidos}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{m.correo}</td>
                <td className="px-4 py-3">
                  <Select
                    value={m.rol}
                    disabled={savingId === m.id}
                    onValueChange={v => v && actualizar(m.id, { rol: v as RolMiembro })}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={m.estado}
                    disabled={savingId === m.id}
                    onValueChange={v => v && actualizar(m.id, { estado: v as EstadoMiembro })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
