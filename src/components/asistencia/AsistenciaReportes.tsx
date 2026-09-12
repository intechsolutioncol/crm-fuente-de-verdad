'use client'

import { useMemo, useState } from 'react'
import { formatFecha } from '@/lib/utils/format'
import type { Asistencia, Miembro } from '@/types'

interface Props {
  miembros: Pick<Miembro, 'id' | 'nombres' | 'apellidos'>[]
  asistencia: Asistencia[]
}

export function AsistenciaReportes({ miembros, asistencia }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [miembroId, setMiembroId] = useState<string | null>(null)

  const porDomingo = useMemo(() => {
    const conteo = new Map<string, number>()
    for (const a of asistencia) conteo.set(a.fecha, (conteo.get(a.fecha) ?? 0) + 1)
    return Array.from(conteo.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [asistencia])

  const totalConfirmaciones = asistencia.length
  const domingosConDatos = porDomingo.length
  const promedioPorDomingo = domingosConDatos > 0 ? Math.round(totalConfirmaciones / domingosConDatos) : 0

  const nombreDe = (id: string) => {
    const m = miembros.find(x => x.id === id)
    return m ? `${m.nombres} ${m.apellidos}` : 'Miembro'
  }

  const resultadosBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (q.length < 2) return []
    return miembros
      .filter(m => `${m.nombres} ${m.apellidos}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [busqueda, miembros])

  const historialMiembro = useMemo(() => {
    if (!miembroId) return []
    return asistencia.filter(a => a.miembro_id === miembroId)
  }, [miembroId, asistencia])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Confirmaciones (90 días)', value: totalConfirmaciones },
          { label: 'Domingos con datos', value: domingosConDatos },
          { label: 'Promedio por domingo', value: promedioPorDomingo },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Conteo por domingo */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/40">
            <p className="text-sm font-semibold text-foreground">Conteo por domingo</p>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {porDomingo.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">Aún no hay confirmaciones registradas.</p>
            ) : porDomingo.map(([fecha, cantidad]) => (
              <div key={fecha} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-foreground">{formatFecha(fecha)}</span>
                <span className="font-bold text-primary">{cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historial por miembro */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/40">
            <p className="text-sm font-semibold text-foreground">Historial por miembro</p>
          </div>
          <div className="p-4 space-y-3">
            <input
              type="text"
              placeholder="Buscar miembro por nombre..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setMiembroId(null) }}
              className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />

            {!miembroId && resultadosBusqueda.length > 0 && (
              <div className="space-y-1">
                {resultadosBusqueda.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMiembroId(m.id); setBusqueda(`${m.nombres} ${m.apellidos}`) }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 text-sm"
                  >
                    {m.nombres} {m.apellidos}
                  </button>
                ))}
              </div>
            )}

            {miembroId && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  {historialMiembro.length} confirmación(es) en los últimos 90 días — {nombreDe(miembroId)}
                </p>
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {historialMiembro.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3">Sin confirmaciones en este período.</p>
                  ) : historialMiembro.map(a => (
                    <div key={a.id} className="py-2 text-sm text-foreground">{formatFecha(a.fecha)}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
