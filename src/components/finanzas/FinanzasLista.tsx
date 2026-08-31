'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCOP, formatFecha } from '@/lib/utils/format'
import type { Aporte, FiltrosFinanzas, TipoAporte } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AporteForm } from './AporteForm'
import { ConfirmDelete } from './ConfirmDelete'

const TIPO_VARIANT: Record<TipoAporte, 'default' | 'secondary' | 'outline'> = {
  Diezmo: 'default',
  Ofrenda: 'secondary',
  Donación: 'outline',
}

interface Props {
  userEmail: string
  isEditor: boolean
}

export function FinanzasLista({ userEmail, isEditor }: Props) {
  const [aportes, setAportes] = useState<Aporte[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosFinanzas>({
    nombre: '', tipo: 'Todos', fechaInicio: '', fechaFin: '',
  })

  const [modalForm, setModalForm] = useState<{ open: boolean; aporte: Aporte | null }>({ open: false, aporte: null })
  const [modalDel, setModalDel] = useState<{ open: boolean; id: string; nombre: string }>({ open: false, id: '', nombre: '' })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cargar = useCallback(async (f: FiltrosFinanzas) => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('finanzas').select('*').order('fecha', { ascending: false })

    if (f.tipo !== 'Todos') query = query.eq('tipo', f.tipo)
    if (f.fechaInicio) query = query.gte('fecha', f.fechaInicio)
    if (f.fechaFin) query = query.lte('fecha', f.fechaFin)
    if (f.nombre.trim()) query = query.ilike('nombre', `%${f.nombre.trim()}%` as string)

    const { data } = await query
    setAportes((data ?? []) as Aporte[])
    setLoading(false)
  }, [])

  useEffect(() => { cargar(filtros) }, [])  // carga inicial

  function onFiltro(key: keyof FiltrosFinanzas, value: string) {
    const next = { ...filtros, [key]: value }
    setFiltros(next)
    if (key === 'nombre') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => cargar(next), 400)
    } else {
      cargar(next)
    }
  }

  function limpiarFiltros() {
    const vacio: FiltrosFinanzas = { nombre: '', tipo: 'Todos', fechaInicio: '', fechaFin: '' }
    setFiltros(vacio)
    cargar(vacio)
  }

  const totalFiltrado = aportes.reduce((s, a) => s + a.monto, 0)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 min-w-[220px] flex-1 max-w-xs focus-within:ring-2 focus-within:ring-ring/50">
          <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtros.nombre}
            onChange={e => onFiltro('nombre', e.target.value)}
            className="flex-1 py-2 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
          />
        </div>

        <Select value={filtros.tipo} onValueChange={v => onFiltro('tipo', v ?? 'Todos')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los tipos</SelectItem>
            <SelectItem value="Diezmo">Diezmo</SelectItem>
            <SelectItem value="Ofrenda">Ofrenda</SelectItem>
            <SelectItem value="Donación">Donación</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-auto"
          value={filtros.fechaInicio}
          onChange={e => onFiltro('fechaInicio', e.target.value)}
          title="Desde"
        />
        <Input
          type="date"
          className="w-auto"
          value={filtros.fechaFin}
          onChange={e => onFiltro('fechaFin', e.target.value)}
          title="Hasta"
        />

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={limpiarFiltros}>Limpiar</Button>
          {isEditor && (
            <Button onClick={() => setModalForm({ open: true, aporte: null })}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo Aporte
            </Button>
          )}
        </div>
      </div>

      {/* Resumen */}
      {aportes.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{aportes.length}</strong> registros</span>
          <span>Total filtrado: <strong className="text-primary">{formatCOP(totalFiltrado)}</strong></span>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <span className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            <p className="text-sm">Cargando registros...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Fecha', 'Nombre', 'Tipo', 'Método', 'Monto', 'Observaciones', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aportes.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                        <svg className="w-12 h-12 opacity-30 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <p className="text-sm mb-3">No hay registros con los filtros actuales.</p>
                        {isEditor && (
                          <Button size="sm" onClick={() => setModalForm({ open: true, aporte: null })}>
                            Registrar primer aporte
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : aportes.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatFecha(a.fecha)}</td>
                    <td className="px-4 py-3 font-semibold">{a.nombre}</td>
                    <td className="px-4 py-3"><Badge variant={TIPO_VARIANT[a.tipo]}>{a.tipo}</Badge></td>
                    <td className="px-4 py-3 text-xs">{a.metodo_pago}</td>
                    <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">{formatCOP(a.monto)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{a.observaciones || '—'}</td>
                    <td className="px-4 py-3">
                      {isEditor && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setModalForm({ open: true, aporte: a })}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Editar"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setModalDel({ open: true, id: a.id, nombre: a.nombre })}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar */}
      <Dialog open={modalForm.open} onOpenChange={open => !open && setModalForm({ open: false, aporte: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalForm.aporte ? 'Editar Aporte' : 'Registrar Nuevo Aporte'}</DialogTitle>
          </DialogHeader>
          <AporteForm
            aporte={modalForm.aporte}
            userEmail={userEmail}
            onSuccess={() => { setModalForm({ open: false, aporte: null }); cargar(filtros) }}
            onCancel={() => setModalForm({ open: false, aporte: null })}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar eliminación */}
      <Dialog open={modalDel.open} onOpenChange={open => !open && setModalDel({ open: false, id: '', nombre: '' })}>
        <DialogContent className="max-w-sm">
          <ConfirmDelete
            id={modalDel.id}
            nombre={modalDel.nombre}
            onSuccess={() => { setModalDel({ open: false, id: '', nombre: '' }); cargar(filtros) }}
            onCancel={() => setModalDel({ open: false, id: '', nombre: '' })}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
