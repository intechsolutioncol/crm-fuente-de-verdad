'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Ministerio, Miembro } from '@/types'

function slugify(texto: string): string {
  const sinTildes = Array.from(texto.normalize('NFD'))
    .filter(ch => { const c = ch.charCodeAt(0); return c < 0x0300 || c > 0x036f })
    .join('')
  return sinTildes.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface Props {
  ministeriosIniciales: Ministerio[]
  miembros: Pick<Miembro, 'id' | 'nombres' | 'apellidos'>[]
}

export function MinisteriosTab({ ministeriosIniciales, miembros }: Props) {
  const [ministerios, setMinisterios] = useState(ministeriosIniciales)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [borrador, setBorrador] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')

  const ordenados = [...ministerios].sort((a, b) => a.orden - b.orden)

  async function actualizar(id: string, cambios: Partial<Ministerio>) {
    setSavingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('ministerios').update(cambios).eq('id', id)
    setSavingId(null)

    if (error) {
      toast.error('No se pudo actualizar: ' + error.message)
      return
    }
    setMinisterios(prev => prev.map(x => (x.id === id ? { ...x, ...cambios } : x)))
  }

  function empezarEdicion(m: Ministerio) {
    setEditandoId(m.id)
    setBorrador(m.nombre)
  }

  function guardarNombre(m: Ministerio) {
    const nombre = borrador.trim()
    setEditandoId(null)
    if (nombre && nombre !== m.nombre) actualizar(m.id, { nombre })
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    const nombre = nuevoNombre.trim()
    if (!nombre) return

    const slug = slugify(nombre)
    const siguienteOrden = 1 + Math.max(0, ...ministerios.map(m => m.orden))

    const supabase = createClient()
    const { data, error } = await supabase
      .from('ministerios')
      .insert({ nombre, slug, orden: siguienteOrden })
      .select('*')
      .single()

    if (error) {
      toast.error('No se pudo agregar el ministerio: ' + error.message)
      return
    }
    setMinisterios(prev => [...prev, data as Ministerio])
    setNuevoNombre('')
    toast.success('Ministerio agregado')
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground max-w-2xl">
        Cada ministerio tiene un blog público en <code>/ministerios/[slug]</code>. Solo su líder (o el
        Administrador) puede publicar ahí. Desactivar un ministerio oculta su blog sin borrar sus publicaciones.
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden max-w-2xl">
        <div className="divide-y divide-border">
          {ordenados.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                {editandoId === m.id ? (
                  <Input
                    autoFocus
                    value={borrador}
                    onChange={e => setBorrador(e.target.value)}
                    onBlur={() => guardarNombre(m)}
                    onKeyDown={e => e.key === 'Enter' && guardarNombre(m)}
                    className="h-8"
                  />
                ) : (
                  <button
                    onClick={() => empezarEdicion(m)}
                    className={`text-left text-sm font-medium ${m.activo ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                    title="Clic para renombrar"
                  >
                    {m.nombre}
                  </button>
                )}
              </div>

              <Select
                value={m.lider_id ?? undefined}
                disabled={savingId === m.id}
                onValueChange={v => v && actualizar(m.id, { lider_id: v })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sin líder asignado" />
                </SelectTrigger>
                <SelectContent>
                  {miembros.map(mi => (
                    <SelectItem key={mi.id} value={mi.id}>{mi.nombres} {mi.apellidos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Switch
                checked={m.activo}
                disabled={savingId === m.id}
                onCheckedChange={() => actualizar(m.id, { activo: !m.activo })}
              />
            </div>
          ))}
        </div>
        <form className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20" onSubmit={agregar}>
          <Input
            placeholder="Nuevo ministerio..."
            value={nuevoNombre}
            onChange={e => setNuevoNombre(e.target.value)}
            className="h-8 flex-1"
          />
          <Button type="submit" size="sm" variant="outline">Agregar</Button>
        </form>
      </div>
    </div>
  )
}
