import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { formatFecha } from '@/lib/utils/format'
import type { Ministerio, PublicacionMinisterio } from '@/types'

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

export default async function ReportesMinisteriosPage() {
  const supabase = await createClient()
  const { data: esAdmin } = await supabase.rpc('es_administrador')

  if (!esAdmin) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <AccesoDenegado mensaje="Solo el Administrador puede entrar a Reportes." />
      </div>
    )
  }

  const [{ data: ministeriosData }, { data: publicacionesData }] = await Promise.all([
    supabase.from('ministerios').select('*').order('orden'),
    supabase.from('publicaciones_ministerio').select('*'),
  ])

  const ministerios = (ministeriosData ?? []) as Ministerio[]
  const publicaciones = (publicacionesData ?? []) as PublicacionMinisterio[]
  const nombrePorId = new Map(ministerios.map(m => [m.id, m.nombre]))
  const slugPorId = new Map(ministerios.map(m => [m.id, m.slug]))

  const totalVistas = publicaciones.reduce((s, p) => s + p.vistas_count, 0)
  const totalPublicaciones = publicaciones.length

  // Publicaciones con más vistas
  const topPublicaciones = [...publicaciones]
    .sort((a, b) => b.vistas_count - a.vistas_count)
    .slice(0, 10)

  // Ministerio más visitado (suma de vistas de sus publicaciones)
  const vistasPorMinisterio = new Map<string, number>()
  const publicacionesPorMinisterio = new Map<string, number>()
  for (const p of publicaciones) {
    vistasPorMinisterio.set(p.ministerio_id, (vistasPorMinisterio.get(p.ministerio_id) ?? 0) + p.vistas_count)
    publicacionesPorMinisterio.set(p.ministerio_id, (publicacionesPorMinisterio.get(p.ministerio_id) ?? 0) + 1)
  }

  const rankingVistas = ministerios
    .map(m => ({ nombre: m.nombre, valor: vistasPorMinisterio.get(m.id) ?? 0 }))
    .sort((a, b) => b.valor - a.valor)
  const maxVistas = Math.max(...rankingVistas.map(r => r.valor), 1)

  const rankingPublicaciones = ministerios
    .map(m => ({ nombre: m.nombre, valor: publicacionesPorMinisterio.get(m.id) ?? 0 }))
    .sort((a, b) => b.valor - a.valor)
  const maxPublicaciones = Math.max(...rankingPublicaciones.map(r => r.valor), 1)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes de Ministerios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vistas y actividad de los blogs públicos</p>
        </div>
        <Link href="/reportes" className="text-xs font-semibold text-primary hover:underline">← Reportes</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vistas totales', value: totalVistas },
          { label: 'Publicaciones', value: totalPublicaciones },
          { label: 'Ministerios activos', value: ministerios.filter(m => m.activo).length },
          { label: 'Vistas por publicación', value: totalPublicaciones > 0 ? Math.round(totalVistas / totalPublicaciones) : 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-primary leading-none">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ministerio más visitado */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-0.5">Ministerio más visitado</p>
          <p className="text-xs text-muted-foreground mb-4">Suma de vistas de sus publicaciones</p>
          <div className="space-y-3">
            {rankingVistas.map(r => (
              <BarraRanking key={r.nombre} label={r.nombre} valor={r.valor} max={maxVistas} color="hsl(var(--primary))" />
            ))}
            {rankingVistas.length === 0 && <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </div>

        {/* Ministerio con más publicaciones */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-0.5">Ministerio con más publicaciones</p>
          <p className="text-xs text-muted-foreground mb-4">Cantidad de entradas publicadas</p>
          <div className="space-y-3">
            {rankingPublicaciones.map(r => (
              <BarraRanking key={r.nombre} label={r.nombre} valor={r.valor} max={maxPublicaciones} color="hsl(var(--chart-3))" />
            ))}
            {rankingPublicaciones.length === 0 && <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </div>
      </div>

      {/* Publicaciones con más vistas */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-bold text-foreground">Publicaciones con más vistas</p>
          <p className="text-xs text-muted-foreground mt-0.5">Top 10 de todos los ministerios</p>
        </div>
        {topPublicaciones.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground text-center">Aún no hay publicaciones.</p>
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
                {topPublicaciones.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <a
                        href={`/ministerios/${slugPorId.get(p.ministerio_id)}/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        {p.titulo}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{nombrePorId.get(p.ministerio_id) ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {p.vistas_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatFecha(p.created_at.slice(0, 10))}</td>
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
