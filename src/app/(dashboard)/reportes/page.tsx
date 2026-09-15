import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { ExportButtons } from '@/components/reportes/ExportButtons'
import { getCentroMandoData } from '@/lib/reportes/centro-mando'
import { formatCOP, formatFecha } from '@/lib/utils/format'

const ACCESOS = [
  { label: 'Finanzas', desc: 'Dashboard, categorías y movimientos', href: '/finanzas' },
  { label: 'Miembros', desc: 'Crecimiento, distribución y edades', href: '/reportes/miembros' },
  { label: 'Asistencia', desc: 'Tendencia, miembros vs. visitantes y alertas', href: '/reportes/asistencia' },
  { label: 'Ministerios', desc: 'Vistas, ranking y publicaciones más leídas', href: '/reportes/ministerios' },
]

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">Sin datos del año anterior</span>
  const positivo = pct >= 0
  return (
    <span className={`text-xs font-bold ${positivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
      {positivo ? '▲' : '▼'} {Math.abs(pct)}% vs. año anterior
    </span>
  )
}

export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const supabase = await createClient()
  const { data: esAdmin } = await supabase.rpc('es_administrador')

  if (!esAdmin) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <AccesoDenegado mensaje="Solo el Administrador puede entrar a Reportes." />
      </div>
    )
  }

  const { periodo } = await searchParams
  const hoy = new Date()
  const [anioParam, mesParam] = (periodo ?? `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`).split('-').map(Number)
  const anio = anioParam || hoy.getFullYear()
  const mes = mesParam || hoy.getMonth() + 1
  const periodoValor = `${anio}-${String(mes).padStart(2, '0')}`

  const r = await getCentroMandoData(supabase, { anio, mes })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Un vistazo a Finanzas, Miembros, Asistencia y Ministerios</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="periodo" className="text-xs font-medium text-muted-foreground">Mes:</label>
            <input
              type="month"
              id="periodo"
              name="periodo"
              defaultValue={periodoValor}
              max={`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`}
              className="text-sm px-2 py-1 rounded-md border border-input bg-transparent outline-none focus:ring-2 focus:ring-ring/50"
            />
            <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary transition-colors">
              Ver
            </button>
          </form>
          <ExportButtons modulo="centro" params={{ anio: String(anio), mes: String(mes) }} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Balance del mes</p>
          <p className={`text-2xl font-extrabold leading-none mb-1 ${r.balanceMes < 0 ? 'text-destructive' : 'text-primary'}`}>
            {formatCOP(r.balanceMes)}
          </p>
          <DeltaBadge pct={r.deltaPct} />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Miembros activos</p>
          <p className="text-2xl font-extrabold text-primary leading-none mb-1">{r.miembrosActivos}</p>
          <p className="text-xs text-muted-foreground">Miembros · estado activo</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Asistencia último domingo</p>
          <p className="text-2xl font-extrabold text-primary leading-none mb-1">{r.asistenciaUltimoDomingo}</p>
          <p className="text-xs text-muted-foreground">
            {r.fechaUltimoDomingo ? `Asistencia · ${formatFecha(r.fechaUltimoDomingo)}` : 'Asistencia · sin registros aún'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Publicaciones</p>
          <p className="text-2xl font-extrabold text-primary leading-none mb-1">{r.publicacionesTotal}</p>
          <p className="text-xs text-muted-foreground">Ministerios · {r.ministeriosActivos} activos</p>
        </div>
      </div>

      {/* Accesos a cada reporte */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-bold text-foreground">Reportes por módulo</p>
          <p className="text-xs text-muted-foreground mt-0.5">Cada uno tiene su propio detalle</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACCESOS.map(a => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col gap-1 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all"
            >
              <span className="text-sm font-bold text-foreground">{a.label}</span>
              <span className="text-xs text-muted-foreground">{a.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
