import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { ExportButtons } from '@/components/reportes/ExportButtons'
import { getAsistenciaData, DIAS_VENTANA_ALERTA, UMBRAL_AUSENCIA_DIAS } from '@/lib/reportes/asistencia'
import { formatFecha } from '@/lib/utils/format'

function formatCorto(fecha: string) {
  const [, m, d] = fecha.split('-')
  return `${d}/${m}`
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

function haceNDias(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">Sin datos del año anterior</span>
  const positivo = pct >= 0
  return (
    <span className={`text-xs font-bold ${positivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
      {positivo ? '▲' : '▼'} {Math.abs(pct)}% vs. mismo rango año anterior
    </span>
  )
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

export default async function ReportesAsistenciaPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const supabase = await createClient()
  const { data: esAdmin } = await supabase.rpc('es_administrador')

  if (!esAdmin) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <AccesoDenegado mensaje="Solo el Administrador puede entrar a Reportes." />
      </div>
    )
  }

  const sp = await searchParams
  const desde = sp.desde || haceNDias(DIAS_VENTANA_ALERTA)
  const hasta = sp.hasta || hoyISO()

  const d = await getAsistenciaData(supabase, { desde, hasta })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes de Asistencia</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tendencia y seguimiento de asistencia</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/reportes" className="text-xs font-semibold text-primary hover:underline">← Reportes</Link>
          <ExportButtons modulo="asistencia" params={{ desde, hasta }} />
        </div>
      </div>

      {/* Filtro de fecha */}
      <form method="get" className="flex items-center gap-2 flex-wrap bg-card border border-border rounded-xl p-4">
        <label htmlFor="desde" className="text-xs font-medium text-muted-foreground">Desde</label>
        <input type="date" id="desde" name="desde" defaultValue={desde} max={hasta}
          className="text-sm px-2 py-1 rounded-md border border-input bg-transparent outline-none focus:ring-2 focus:ring-ring/50" />
        <label htmlFor="hasta" className="text-xs font-medium text-muted-foreground">Hasta</label>
        <input type="date" id="hasta" name="hasta" defaultValue={hasta} max={hoyISO()}
          className="text-sm px-2 py-1 rounded-md border border-input bg-transparent outline-none focus:ring-2 focus:ring-ring/50" />
        <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary transition-colors">
          Aplicar
        </button>
      </form>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Confirmaciones', value: d.totalConfirmaciones },
          { label: 'Miembros', value: d.totalMiembros },
          { label: 'Visitantes', value: d.totalVisitantes },
          { label: 'Promedio por domingo', value: d.promedioPorDomingo },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-primary leading-none">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">Mismo rango, año anterior: <span className="font-bold text-foreground">{d.totalMismoRangoAnioAnterior}</span> confirmaciones</p>
        <DeltaBadge pct={d.deltaPct} />
      </div>

      {/* Tendencia */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-sm font-bold text-foreground mb-0.5">Tendencia de asistencia</p>
        <p className="text-xs text-muted-foreground mb-4">Miembros vs. visitantes — últimos {d.tendencia.length} domingos con datos en el rango</p>
        {d.tendencia.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No hay confirmaciones registradas en este rango.</p>
        ) : (
          <TendenciaChart data={d.tendencia} />
        )}
      </div>

      {/* Alerta de inasistencia */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-bold text-foreground">Alerta de inasistencia</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Miembros activos sin confirmar asistencia en {UMBRAL_AUSENCIA_DIAS}+ días (independiente del filtro de fecha)
          </p>
        </div>
        {d.alertaInasistencia.length === 0 ? (
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
                {d.alertaInasistencia.map(({ miembro, ultima, dias }) => (
                  <tr key={miembro.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {miembro.nombres} {miembro.apellidos}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {ultima ? formatFecha(ultima) : `Sin registro (${DIAS_VENTANA_ALERTA}+ días)`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {dias === null ? `${DIAS_VENTANA_ALERTA}+` : dias} días
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
