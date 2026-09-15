import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { ExportButtons } from '@/components/reportes/ExportButtons'
import { getMiembrosData, VENTANAS_MESES } from '@/lib/reportes/miembros'

function CrecimientoChart({ data }: { data: { mes: string; total: number }[] }) {
  const W = 640, H = 200
  const pad = { top: 20, right: 12, bottom: 30, left: 30 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom
  const maxVal = Math.max(...data.map(d => d.total), 1)
  const barW = cW / data.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
      {data.map((d, i) => {
        const bh = Math.max((d.total / maxVal) * cH, d.total > 0 ? 4 : 0)
        const bx = pad.left + i * barW + barW * 0.2
        const by = pad.top + cH - bh
        const bwi = barW * 0.6
        return (
          <g key={i}>
            <rect x={bx} y={by} width={bwi} height={bh} fill="hsl(var(--primary))" rx="3" opacity="0.85" />
            {d.total > 0 && (
              <text x={bx + bwi / 2} y={by - 5} textAnchor="middle" fontSize="9" className="fill-muted-foreground">{d.total}</text>
            )}
            <text x={bx + bwi / 2} y={H - pad.bottom + 14} textAnchor="middle" fontSize="9" className="fill-muted-foreground">{d.mes}</text>
          </g>
        )
      })}
    </svg>
  )
}

function BarraDistribucion({ label, valor, total, color }: { label: string; valor: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-xs font-semibold text-muted-foreground flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-16 text-right text-xs font-bold text-foreground">{valor} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
    </div>
  )
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">Sin datos del año anterior</span>
  const positivo = pct >= 0
  return (
    <span className={`text-xs font-bold ${positivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
      {positivo ? '▲' : '▼'} {Math.abs(pct)}% vs. año anterior
    </span>
  )
}

const COLOR_ESTADO: Record<string, string> = { Activo: 'hsl(var(--primary))', Inactivo: 'hsl(var(--destructive))', Visitante: 'hsl(var(--chart-3))' }

export default async function ReportesMiembrosPage({ searchParams }: { searchParams: Promise<{ meses?: string }> }) {
  const supabase = await createClient()
  const { data: esAdmin } = await supabase.rpc('es_administrador')

  if (!esAdmin) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <AccesoDenegado mensaje="Solo el Administrador puede entrar a Reportes." />
      </div>
    )
  }

  const { meses: mesesParam } = await searchParams
  const meses = VENTANAS_MESES.includes(Number(mesesParam) as (typeof VENTANAS_MESES)[number]) ? Number(mesesParam) : 12

  const d = await getMiembrosData(supabase, { meses })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes de Miembros</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Crecimiento y composición de la congregación</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/reportes" className="text-xs font-semibold text-primary hover:underline">← Reportes</Link>
          <ExportButtons modulo="miembros" params={{ meses: String(meses) }} />
        </div>
      </div>

      {/* KPIs + comparativa */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Total de miembros</p>
          <p className="text-2xl font-extrabold text-primary leading-none">{d.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Nuevos este año</p>
          <p className="text-2xl font-extrabold text-primary leading-none mb-1">{d.nuevosEsteAnio}</p>
          <DeltaBadge pct={d.deltaPct} />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Nuevos año anterior</p>
          <p className="text-2xl font-extrabold text-primary leading-none">{d.nuevosAnioAnterior}</p>
        </div>
      </div>

      {/* Crecimiento */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <p className="text-sm font-bold text-foreground mb-0.5">Crecimiento de la membresía</p>
            <p className="text-xs text-muted-foreground">Miembros nuevos por mes — últimos {meses} meses</p>
          </div>
          <form method="get" className="flex items-center gap-1.5">
            {VENTANAS_MESES.map(v => (
              <button
                key={v}
                type="submit"
                name="meses"
                value={v}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                  v === meses ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {v}m
              </button>
            ))}
          </form>
        </div>
        <CrecimientoChart data={d.crecimiento} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Por rol */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-4">Distribución por rol</p>
          <div className="space-y-3">
            {d.porRol.map(r => (
              <BarraDistribucion key={r.rol} label={r.rol} valor={r.valor} total={d.total} color="hsl(var(--primary))" />
            ))}
          </div>
        </div>

        {/* Por estado */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-4">Distribución por estado</p>
          <div className="space-y-3">
            {d.porEstado.map(e => (
              <BarraDistribucion key={e.estado} label={e.estado} valor={e.valor} total={d.total} color={COLOR_ESTADO[e.estado]} />
            ))}
          </div>
        </div>

        {/* Por país */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-4">Distribución por país</p>
          <div className="space-y-3">
            {d.paisesOrdenados.map(([pais, valor]) => (
              <BarraDistribucion key={pais} label={pais} valor={valor} total={d.total} color="hsl(var(--chart-2))" />
            ))}
            {d.paisesOrdenados.length === 0 && <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </div>

        {/* Por departamento (Colombia) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-4">Departamentos (Colombia)</p>
          <div className="space-y-3">
            {d.departamentosOrdenados.map(([depto, valor]) => (
              <BarraDistribucion key={depto} label={depto} valor={valor} total={d.total} color="hsl(var(--chart-3))" />
            ))}
            {d.departamentosOrdenados.length === 0 && <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </div>
      </div>

      {/* Pirámide de edades */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-sm font-bold text-foreground mb-4">Distribución por edad</p>
        <div className="space-y-3">
          {d.porEdad.map(e => (
            <BarraDistribucion key={e.label} label={`${e.label} años`} valor={e.valor} total={d.total} color="hsl(var(--primary))" />
          ))}
        </div>
      </div>
    </div>
  )
}
