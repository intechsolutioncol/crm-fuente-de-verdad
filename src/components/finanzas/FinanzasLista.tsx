'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCOP, formatFecha } from '@/lib/utils/format'
import { urlComprobante } from '@/lib/utils/comprobantes'
import type { Movimiento, FiltrosFinanzas, TipoMovimiento, CategoriaFinanzas } from '@/types'
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
import { MovimientoForm } from './MovimientoForm'
import { ConfirmDelete } from './ConfirmDelete'

function categoriaVariant(tipoMovimiento: TipoMovimiento): 'default' | 'outline' {
  return tipoMovimiento === 'ingreso' ? 'default' : 'outline'
}

interface Props {
  userEmail: string
  isEditor: boolean
}

export function FinanzasLista({ userEmail, isEditor }: Props) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosFinanzas>({
    nombre: '', tipoMovimiento: 'Todos', tipo: 'Todos', fechaInicio: '', fechaFin: '',
  })

  const [modalForm, setModalForm] = useState<{ open: boolean; movimiento: Movimiento | null; tipoInicial: TipoMovimiento }>({ open: false, movimiento: null, tipoInicial: 'ingreso' })
  const [modalDel, setModalDel] = useState<{ open: boolean; id: string; nombre: string }>({ open: false, id: '', nombre: '' })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [categoriasFinanzas, setCategoriasFinanzas] = useState<CategoriaFinanzas[]>([])
  useEffect(() => {
    createClient()
      .from('categorias_finanzas')
      .select('*')
      .eq('activo', true)
      .order('orden')
      .then(({ data }) => setCategoriasFinanzas((data ?? []) as CategoriaFinanzas[]))
  }, [])

  const cargar = useCallback(async (f: FiltrosFinanzas) => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('finanzas').select('*').order('fecha', { ascending: false })

    if (f.tipoMovimiento !== 'Todos') query = query.eq('tipo_movimiento', f.tipoMovimiento)
    if (f.tipo !== 'Todos') query = query.eq('tipo', f.tipo)
    if (f.fechaInicio) query = query.gte('fecha', f.fechaInicio)
    if (f.fechaFin) query = query.lte('fecha', f.fechaFin)
    if (f.nombre.trim()) query = query.ilike('nombre', `%${f.nombre.trim()}%` as string)

    const { data } = await query
    setMovimientos((data ?? []) as Movimiento[])
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
    const vacio: FiltrosFinanzas = { nombre: '', tipoMovimiento: 'Todos', tipo: 'Todos', fechaInicio: '', fechaFin: '' }
    setFiltros(vacio)
    cargar(vacio)
  }

  function abrirNuevo(tipoInicial: TipoMovimiento) {
    setModalForm({ open: true, movimiento: null, tipoInicial })
  }

  async function verComprobante(path: string) {
    const url = await urlComprobante(path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const totalFiltrado = movimientos.reduce(
    (s, m) => s + (m.tipo_movimiento === 'egreso' ? -m.monto : m.monto), 0
  )

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

        <Select value={filtros.tipoMovimiento} onValueChange={v => onFiltro('tipoMovimiento', v ?? 'Todos')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Ingresos y egresos</SelectItem>
            <SelectItem value="ingreso">Ingresos</SelectItem>
            <SelectItem value="egreso">Egresos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtros.tipo} onValueChange={v => onFiltro('tipo', v ?? 'Todos')}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas las categorías</SelectItem>
            {categoriasFinanzas.map(c => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}
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
            <>
              <Button variant="outline" onClick={() => abrirNuevo('egreso')}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Gasto
              </Button>
              <Button onClick={() => abrirNuevo('ingreso')}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Ingreso
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Resumen */}
      {movimientos.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{movimientos.length}</strong> registros</span>
          <span>Balance filtrado: <strong className={totalFiltrado < 0 ? 'text-destructive' : 'text-primary'}>{formatCOP(totalFiltrado)}</strong></span>
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
                  {['Fecha', 'Nombre', 'Categoría', 'Método', 'Monto', 'Observaciones', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                        <svg className="w-12 h-12 opacity-30 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <p className="text-sm mb-3">No hay registros con los filtros actuales.</p>
                        {isEditor && (
                          <Button size="sm" onClick={() => abrirNuevo('ingreso')}>
                            Registrar primer movimiento
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : movimientos.map(m => {
                  const esEgreso = m.tipo_movimiento === 'egreso'
                  return (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatFecha(m.fecha)}</td>
                    <td className="px-4 py-3 font-semibold">{m.nombre}</td>
                    <td className="px-4 py-3"><Badge variant={categoriaVariant(m.tipo_movimiento)}>{m.tipo}</Badge></td>
                    <td className="px-4 py-3 text-xs">{m.metodo_pago}</td>
                    <td className={`px-4 py-3 font-bold whitespace-nowrap ${esEgreso ? 'text-destructive' : 'text-primary'}`}>
                      {esEgreso ? '- ' : ''}{formatCOP(m.monto)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{m.observaciones || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {m.comprobante_path && (
                          <button
                            onClick={() => verComprobante(m.comprobante_path!)}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
                            title="Ver comprobante"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                        )}
                      {isEditor && (
                        <>
                          <button
                            onClick={() => setModalForm({ open: true, movimiento: m, tipoInicial: m.tipo_movimiento })}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Editar"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setModalDel({ open: true, id: m.id, nombre: m.nombre })}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            </svg>
                          </button>
                        </>
                      )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar */}
      <Dialog open={modalForm.open} onOpenChange={open => !open && setModalForm({ open: false, movimiento: null, tipoInicial: 'ingreso' })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modalForm.movimiento
                ? 'Editar Movimiento'
                : modalForm.tipoInicial === 'egreso' ? 'Registrar Gasto' : 'Registrar Ingreso'}
            </DialogTitle>
          </DialogHeader>
          <MovimientoForm
            movimiento={modalForm.movimiento}
            tipoMovimientoInicial={modalForm.tipoInicial}
            userEmail={userEmail}
            onSuccess={() => { setModalForm({ open: false, movimiento: null, tipoInicial: 'ingreso' }); cargar(filtros) }}
            onCancel={() => setModalForm({ open: false, movimiento: null, tipoInicial: 'ingreso' })}
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
