import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { formatFecha } from '@/lib/utils/format'
import type { Miembro } from '@/types'

const DIAS_VENTANA = 180
const UMBRAL_AUSENCIA_DIAS = 21 // 3 domingos

function formatCorto(fecha: string) {
  const [, m, d] = fecha.split('-')
  return `${d}/${m}`
}

function diasDesde(fecha: string) {
  const [y, m, d] = fecha.split('-').map(Number)
  const inicio = new Date(y, m - 1, d)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  inicio.setHours(0, 0, 0, 0)
  return Math.round((hoy.getTime() - inicio.getTime()) / 86_400_000)
}

function TendenciaChart({ data }: { data: { fecha: string; miembros: number; visitantes: number }[] }) {
  const W = 640, H = 220
  const pad = { top: 20, right: 12, bottom: 30, left: 30 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom
  const totales = data.map(d => d.miembros + d.visitantes)
  const maxVal = Math.max(...totales, 1)
  const barW = data.length > 0 ? cW / data.length : cW

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
        {data.map((d, i) => {
          const total = d.miembros + d.visitantes
          const hMiembros = (d.miembros / maxVal) * cH
          const hVisitantes = (d.visitantes / maxVal) * cH
          const bx = pad.left + i * barW + barW * 0.15
          const bwi = barW * 0.7
          const byVisitantes = pad.top + cH - hVisitantes
          const byMiembros = byVisitantes - hMiembros
          return (
            <g key={d.fecha}>
              {d.miembros > 0 && (
                <rect x={bx} y={byMiembros} width={bwi} height={hMiembros} fill="hsl(var(--primary))" rx="2" opacity="0.9" />
              )}
              {d.visitantes > 0 && (
                <rect x={bx} y={byVisitantes} width={bwi} height={hVisitantes} fill="hsl(var(--chart-3))" rx="2" opacity="0.9" />
              )}
              {total > 0 && (
                <text x={bx + bwi / 2} y={byMiembros - 5} textAnchor="middle" fontSize="9" className="fill-muted-foreground">{total}</text>
              )}
              <text x={bx + bwi / 2} y={H - pad.bottom + 14} textAnchor="middle" fontSize="9" className="fill-muted-foreground">{formatCorto(d.fecha)}</text>
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 justify-center">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(var(--primary))' }} /> Miembros
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(var(--chart-3))' }} /> Visitantes
        </span>
      </div>
    </div>
  )
}

export default async function ReportesAsistenciaPage() {
  const supabase = await createClient()
  const { data: esAdmin } = await supabase.rpc('es_administrador')

  if (!esAdmin) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <AccesoDenegado mensaje="Solo el Administrador puede entrar a Reportes." />
      </div>
    )
  }

  const desde = new Date()
  desde.setDate(desde.getDate() - DIAS_VENTANA)
  const desdeISO = desde.toISOString().slice(0, 10)

  const [{ data: asistenciaData }, { data: miembrosData }] = await Promise.all([
    supabase.from('asistencia').select('miembro_id, visitante_id, fecha').gte('fecha', desdeISO),
    supabase.from('miembros').select('*').eq('estado', 'Activo'),
  ])

  const asistencia = asistenciaData ?? []
  const activos = (miembrosData ?? []) as Miembro[]

  // Tendencia por domingo (últimos 10 domingos con datos) + miembros vs visitantes
  const porFecha = new Map<string, { miembros: number; visitantes: number }>()
  for (const a of asistencia) {
    const actual = porFecha.get(a.fecha) ?? { miembros: 0, visitantes: 0 }
    if (a.miembro_id) actual.miembros++
    if (a.visitante_id) actual.visitantes++
    porFecha.set(a.fecha, actual)
  }
  const tendencia = Array.from(porFecha.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-10)
    .map(([fecha, v]) => ({ fecha, ...v }))

  const totalConfirmaciones = asistencia.length
  const totalMiembros = asistencia.filter(a => a.miembro_id).length
  const totalVisitantes = asistencia.filter(a => a.visitante_id).length
  const promedioPorDomingo = porFecha.size > 0 ? Math.round(totalConfirmaciones / porFecha.size) : 0

  // Última asistencia por miembro activo (dentro de la ventana)
  const ultimaPorMiembro = new Map<string, string>()
  for (const a of asistencia) {
    if (!a.miembro_id) continue
    const actual = ultimaPorMiembro.get(a.miembro_id)
    if (!actual || a.fecha > actual) ultimaPorMiembro.set(a.miembro_id, a.fecha)
  }

  const alertaInasistencia = activos
    .map(m => {
      const ultima = ultimaPorMiembro.get(m.id) ?? null
      const dias = ultima ? diasDesde(ultima) : null
      return { miembro: m, ultima, dias }
    })
    .filter(x => x.dias === null || x.dias >= UMBRAL_AUSENCIA_DIAS)
    .sort((a, b) => (b.dias ?? Infinity) - (a.dias ?? Infinity))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes de Asistencia</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tendencia y seguimiento de asistencia — últimos {DIAS_VENTANA} días</p>
        </div>
        <Link href="/reportes" className="text-xs font-semibold text-primary hover:underline">← Reportes</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Confirmaciones', value: totalConfirmaciones },
          { label: 'Miembros', value: totalMiembros },
          { label: 'Visitantes', value: totalVisitantes },
          { label: 'Promedio por domingo', value: promedioPorDomingo },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-primary leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Tendencia */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-sm font-bold text-foreground mb-0.5">Tendencia de asistencia</p>
        <p className="text-xs text-muted-foreground mb-4">Miembros vs. visitantes — últimos {tendencia.length} domingos con datos</p>
        {tendencia.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Aún no hay confirmaciones registradas.</p>
        ) : (
          <TendenciaChart data={tendencia} />
        )}
      </div>

      {/* Alerta de inasistencia */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-bold text-foreground">Alerta de inasistencia</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Miembros activos sin confirmar asistencia en {UMBRAL_AUSENCIA_DIAS}+ días
          </p>
        </div>
        {alertaInasistencia.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground text-center">
            Todos los miembros activos han asistido recientemente. 🎉
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Nombre', 'Última asistencia', 'Días de ausencia'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alertaInasistencia.map(({ miembro, ultima, dias }) => (
                  <tr key={miembro.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {miembro.nombres} {miembro.apellidos}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {ultima ? formatFecha(ultima) : `Sin registro (${DIAS_VENTANA}+ días)`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {dias === null ? `${DIAS_VENTANA}+` : dias} días
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
