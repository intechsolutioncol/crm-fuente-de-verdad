import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { ExportButtons } from '@/components/reportes/ExportButtons'
import { getMinisteriosData } from '@/lib/reportes/ministerios'
import { formatFecha } from '@/lib/utils/format'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

const DESDE_POR_DEFECTO = '2000-01-01'

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">Sin datos del año anterior</span>
  const positivo = pct >= 0
  return (
    <span className={`text-xs font-bold ${positivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
      {positivo ? '▲' : '▼'} {Math.abs(pct)}% vs. año anterior
    </span>
  )
}

function BarraRanking({ label, valor, max, color }: { label: string; valor: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-xs font-semibold text-muted-foreground flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-14 text-right text-xs font-bold text-foreground">{valor}</span>
    </div>
  )
}

export default async function ReportesMinisteriosPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
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
  const desde = sp.desde || DESDE_POR_DEFECTO
  const hasta = sp.hasta || hoyISO()

  const d = await getMinisteriosData(supabase, { desde, hasta })
  const maxVistas = Math.max(...d.rankingVistas.map(r => r.valor), 1)
  const maxPublicaciones = Math.max(...d.rankingPublicaciones.map(r => r.valor), 1)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes de Ministerios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vistas y actividad de los blogs públicos</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/reportes" className="text-xs font-semibold text-primary hover:underline">← Reportes</Link>
          <ExportButtons modulo="ministerios" params={{ desde, hasta }} />
        </div>
      </div>

      {/* Filtro de fecha (por fecha de publicación) */}
      <form method="get" className="flex items-center gap-2 flex-wrap bg-card border border-border rounded-xl p-4">
        <label htmlFor="desde" className="text-xs font-medium text-muted-foreground">Publicadas desde</label>
        <input type="date" id="desde" name="desde" defaultValue={desde === DESDE_POR_DEFECTO ? '' : desde} max={hasta}
          className="text-sm px-2 py-1 rounded-md border border-input bg-transparent outline-none focus:ring-2 focus:ring-ring/50" />
        <label htmlFor="hasta" className="text-xs font-medium text-muted-foreground">Hasta</label>
        <input type="date" id="hasta" name="hasta" defaultValue={hasta} max={hoyISO()}
          className="text-sm px-2 py-1 rounded-md border border-input bg-transparent outline-none focus:ring-2 focus:ring-ring/50" />
        <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary transition-colors">
          Aplicar
        </button>
        <span className="text-[11px] text-muted-foreground w-full">
          Las vistas son acumuladas desde que cada publicación salió al aire — el filtro decide qué publicaciones entran, no cuándo se generaron sus vistas.
        </span>
      </form>

      {/* KPIs + comparativa */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vistas totales', value: d.totalVistas },
          { label: 'Publicaciones en el rango', value: d.totalPublicaciones },
          { label: 'Ministerios activos', value: d.ministeriosActivos },
          { label: 'Vistas por publicación', value: d.totalPublicaciones > 0 ? Math.round(d.totalVistas / d.totalPublicaciones) : 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-primary leading-none">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          Publicaciones este año: <span className="font-bold text-foreground">{d.publicacionesEsteAnio}</span>
          {' · '}Año anterior (mismo rango): <span className="font-bold text-foreground">{d.publicacionesAnioAnterior}</span>
        </p>
        <DeltaBadge pct={d.deltaPct} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ministerio más visitado */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-0.5">Ministerio más visitado</p>
          <p className="text-xs text-muted-foreground mb-4">Suma de vistas de sus publicaciones</p>
          <div className="space-y-3">
            {d.rankingVistas.map(r => (
              <BarraRanking key={r.nombre} label={r.nombre} valor={r.valor} max={maxVistas} color="hsl(var(--primary))" />
            ))}
            {d.rankingVistas.length === 0 && <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </div>

        {/* Ministerio con más publicaciones */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-0.5">Ministerio con más publicaciones</p>
          <p className="text-xs text-muted-foreground mb-4">Cantidad de entradas publicadas en el rango</p>
          <div className="space-y-3">
            {d.rankingPublicaciones.map(r => (
              <BarraRanking key={r.nombre} label={r.nombre} valor={r.valor} max={maxPublicaciones} color="hsl(var(--chart-3))" />
            ))}
            {d.rankingPublicaciones.length === 0 && <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </div>
      </div>

      {/* Publicaciones con más vistas */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-bold text-foreground">Publicaciones con más vistas</p>
          <p className="text-xs text-muted-foreground mt-0.5">Top 10 en el rango seleccionado</p>
        </div>
        {d.topPublicaciones.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground text-center">No hay publicaciones en este rango.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Publicación', 'Ministerio', 'Vistas', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.topPublicaciones.map(({ publicacion, ministerioNombre, ministerioSlug }) => (
                  <tr key={publicacion.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <a
                        href={`/ministerios/${ministerioSlug}/${publicacion.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        {publicacion.titulo}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{ministerioNombre}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {publicacion.vistas_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatFecha(publicacion.created_at.slice(0, 10))}</td>
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
