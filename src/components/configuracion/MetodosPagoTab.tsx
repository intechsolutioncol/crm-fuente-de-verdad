'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { MetodoFinanzas } from '@/types'

interface Props {
  metodosIniciales: MetodoFinanzas[]
}

export function MetodosPagoTab({ metodosIniciales }: Props) {
  const [metodos, setMetodos] = useState(metodosIniciales)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [borrador, setBorrador] = useState('')
  const [nuevoMetodo, setNuevoMetodo] = useState('')

  const ordenados = [...metodos].sort((a, b) => a.orden - b.orden)

  async function toggle(m: MetodoFinanzas) {
    setSavingId(m.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('metodos_pago')
      .update({ activo: !m.activo })
      .eq('id', m.id)
    setSavingId(null)

    if (error) {
      toast.error('No se pudo actualizar: ' + error.message)
      return
    }
    setMetodos(prev => prev.map(x => (x.id === m.id ? { ...x, activo: !m.activo } : x)))
  }

  function empezarEdicion(m: MetodoFinanzas) {
    setEditandoId(m.id)
    setBorrador(m.nombre)
  }

  async function guardarEdicion(m: MetodoFinanzas) {
    const nombre = borrador.trim()
    setEditandoId(null)
    if (!nombre || nombre === m.nombre) return

    setSavingId(m.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('metodos_pago')
      .update({ nombre })
      .eq('id', m.id)
    setSavingId(null)

    if (error) {
      toast.error('No se pudo renombrar: ' + error.message)
      return
    }
    setMetodos(prev => prev.map(x => (x.id === m.id ? { ...x, nombre } : x)))
    toast.success('Método renombrado — los movimientos históricos se actualizaron automáticamente')
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    const nombre = nuevoMetodo.trim()
    if (!nombre) return

    const siguienteOrden = 1 + Math.max(0, ...metodos.map(m => m.orden))
    const supabase = createClient()
    const { data, error } = await supabase
      .from('metodos_pago')
      .insert({ nombre, orden: siguienteOrden })
      .select('*')
      .single()

    if (error) {
      toast.error('No se pudo agregar el método: ' + error.message)
      return
    }
    setMetodos(prev => [...prev, data as MetodoFinanzas])
    setNuevoMetodo('')
    toast.success('Método de pago agregado')
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground max-w-2xl">
        Estos métodos aparecen en el formulario de Finanzas. Desactivar uno lo oculta para
        movimientos nuevos, pero los movimientos históricos que ya lo usan se conservan.
        Renombrar actualiza automáticamente el historial.
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden max-w-md">
        <div className="divide-y divide-border">
          {ordenados.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Sin métodos todavía.</p>
          )}
          {ordenados.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              {editandoId === m.id ? (
                <Input
                  autoFocus
                  value={borrador}
                  onChange={e => setBorrador(e.target.value)}
                  onBlur={() => guardarEdicion(m)}
                  onKeyDown={e => e.key === 'Enter' && guardarEdicion(m)}
                  className="h-8 flex-1"
                />
              ) : (
                <button
                  onClick={() => empezarEdicion(m)}
                  className={`flex-1 text-left text-sm ${m.activo ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                  title="Clic para renombrar"
                >
                  {m.nombre}
                </button>
              )}
              <Switch
                checked={m.activo}
                disabled={savingId === m.id}
                onCheckedChange={() => toggle(m)}
              />
            </div>
          ))}
        </div>
        <form className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20" onSubmit={agregar}>
          <Input
            placeholder="Nuevo método de pago..."
            value={nuevoMetodo}
            onChange={e => setNuevoMetodo(e.target.value)}
            className="h-8 flex-1"
          />
          <Button type="submit" size="sm" variant="outline">Agregar</Button>
        </form>
      </div>
    </div>
  )
}
