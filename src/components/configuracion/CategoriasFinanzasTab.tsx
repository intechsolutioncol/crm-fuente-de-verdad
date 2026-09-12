'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { CategoriaFinanzas, TipoMovimiento } from '@/types'

interface Props {
  categoriasIniciales: CategoriaFinanzas[]
}

function Columna({
  titulo, tipoMovimiento, categorias, onToggle, onRenombrar, onAgregar, savingId,
}: {
  titulo: string
  tipoMovimiento: TipoMovimiento
  categorias: CategoriaFinanzas[]
  onToggle: (c: CategoriaFinanzas) => void
  onRenombrar: (c: CategoriaFinanzas, nuevoNombre: string) => void
  onAgregar: (nombre: string) => void
  savingId: string | null
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [borrador, setBorrador] = useState('')
  const [nuevaCategoria, setNuevaCategoria] = useState('')

  function empezarEdicion(c: CategoriaFinanzas) {
    setEditandoId(c.id)
    setBorrador(c.nombre)
  }

  function guardarEdicion(c: CategoriaFinanzas) {
    const nombre = borrador.trim()
    if (nombre && nombre !== c.nombre) onRenombrar(c, nombre)
    setEditandoId(null)
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/40">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
      </div>
      <div className="divide-y divide-border">
        {categorias.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">Sin categorías todavía.</p>
        )}
        {categorias.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3">
            {editandoId === c.id ? (
              <Input
                autoFocus
                value={borrador}
                onChange={e => setBorrador(e.target.value)}
                onBlur={() => guardarEdicion(c)}
                onKeyDown={e => e.key === 'Enter' && guardarEdicion(c)}
                className="h-8 flex-1"
              />
            ) : (
              <button
                onClick={() => empezarEdicion(c)}
                className={`flex-1 text-left text-sm ${c.activo ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                title="Clic para renombrar"
              >
                {c.nombre}
              </button>
            )}
            <Switch
              checked={c.activo}
              disabled={savingId === c.id}
              onCheckedChange={() => onToggle(c)}
            />
          </div>
        ))}
      </div>
      <form
        className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20"
        onSubmit={e => {
          e.preventDefault()
          const nombre = nuevaCategoria.trim()
          if (!nombre) return
          onAgregar(nombre)
          setNuevaCategoria('')
        }}
      >
        <Input
          placeholder={`Nueva categoría de ${tipoMovimiento === 'ingreso' ? 'ingreso' : 'egreso'}...`}
          value={nuevaCategoria}
          onChange={e => setNuevaCategoria(e.target.value)}
          className="h-8 flex-1"
        />
        <Button type="submit" size="sm" variant="outline">Agregar</Button>
      </form>
    </div>
  )
}

export function CategoriasFinanzasTab({ categoriasIniciales }: Props) {
  const [categorias, setCategorias] = useState(categoriasIniciales)
  const [savingId, setSavingId] = useState<string | null>(null)

  const ingresos = categorias.filter(c => c.tipo_movimiento === 'ingreso').sort((a, b) => a.orden - b.orden)
  const egresos = categorias.filter(c => c.tipo_movimiento === 'egreso').sort((a, b) => a.orden - b.orden)

  async function toggle(c: CategoriaFinanzas) {
    setSavingId(c.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('categorias_finanzas')
      .update({ activo: !c.activo })
      .eq('id', c.id)
    setSavingId(null)

    if (error) {
      toast.error('No se pudo actualizar: ' + error.message)
      return
    }
    setCategorias(prev => prev.map(x => (x.id === c.id ? { ...x, activo: !c.activo } : x)))
  }

  async function renombrar(c: CategoriaFinanzas, nuevoNombre: string) {
    setSavingId(c.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('categorias_finanzas')
      .update({ nombre: nuevoNombre })
      .eq('id', c.id)
    setSavingId(null)

    if (error) {
      toast.error('No se pudo renombrar: ' + error.message)
      return
    }
    setCategorias(prev => prev.map(x => (x.id === c.id ? { ...x, nombre: nuevoNombre } : x)))
    toast.success('Categoría renombrada — los movimientos históricos se actualizaron automáticamente')
  }

  async function agregar(tipoMovimiento: TipoMovimiento, nombre: string) {
    const siguienteOrden = 1 + Math.max(
      0, ...categorias.filter(c => c.tipo_movimiento === tipoMovimiento).map(c => c.orden)
    )
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categorias_finanzas')
      .insert({ tipo_movimiento: tipoMovimiento, nombre, orden: siguienteOrden })
      .select('*')
      .single()

    if (error) {
      toast.error('No se pudo agregar la categoría: ' + error.message)
      return
    }
    setCategorias(prev => [...prev, data as CategoriaFinanzas])
    toast.success('Categoría agregada')
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground max-w-2xl">
        Estas categorías aparecen en el formulario de Finanzas. Desactivar una categoría la oculta
        para movimientos nuevos, pero los movimientos históricos que ya la usan se conservan.
        Renombrar una categoría actualiza automáticamente su historial.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Columna
          titulo="Categorías de Ingreso"
          tipoMovimiento="ingreso"
          categorias={ingresos}
          onToggle={toggle}
          onRenombrar={renombrar}
          onAgregar={nombre => agregar('ingreso', nombre)}
          savingId={savingId}
        />
        <Columna
          titulo="Categorías de Egreso"
          tipoMovimiento="egreso"
          categorias={egresos}
          onToggle={toggle}
          onRenombrar={renombrar}
          onAgregar={nombre => agregar('egreso', nombre)}
          savingId={savingId}
        />
      </div>
    </div>
  )
}
