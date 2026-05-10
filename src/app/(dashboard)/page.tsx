import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCOP } from '@/lib/utils/format'

async function getPreviewFinanzas() {
  const supabase = await createClient()
  const anioActual = new Date().getFullYear()
  const mesActual = new Date().getMonth() + 1
  const mesStr = String(mesActual).padStart(2, '0')

  const [resAnual, resMes, resTotal] = await Promise.all([
    supabase
      .from('finanzas')
      .select('monto')
      .gte('fecha', `${anioActual}-01-01`)
      .lte('fecha', `${anioActual}-12-31`),
    supabase
      .from('finanzas')
      .select('monto')
      .gte('fecha', `${anioActual}-${mesStr}-01`)
      .lte('fecha', `${anioActual}-${mesStr}-31`),
    supabase.from('finanzas').select('id', { count: 'exact', head: true }),
  ])

  const totalAnual = (resAnual.data ?? []).reduce((s: number, r: { monto: number }) => s + r.monto, 0)
  const totalMes = (resMes.data ?? []).reduce((s: number, r: { monto: number }) => s + r.monto, 0)
  const totalRegistros = resTotal.count ?? 0

  return { totalAnual, totalMes, totalRegistros }
}

const MODULOS = [
  { label: 'Finanzas', desc: 'Diezmos, ofrendas y donaciones', href: '/finanzas', activo: true },
  { label: 'Miembros', desc: 'Gestión de la congregación', href: '#', activo: false },
  { label: 'Asistencia', desc: 'Control de reuniones', href: '#', activo: false },
  { label: 'Ministerios', desc: 'Grupos y equipos de servicio', href: '#', activo: false },
  { label: 'Eventos', desc: 'Planificación de actividades', href: '#', activo: false },
  { label: 'Reportes', desc: 'Análisis e informes', href: '#', activo: false },
]

export default async function HomePage() {
  const preview = await getPreviewFinanzas()
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const anio = new Date().getFullYear()

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">{saludo} 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenido al sistema de gestión de <strong>Fuente de Verdad · Poblado</strong>
        </p>
      </div>

      {/* Stats de Finanzas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Mes Actual', value: formatCOP(preview.totalMes), sub: 'Finanzas · aportes' },
          { label: `Total Año ${anio}`, value: formatCOP(preview.totalAnual), sub: 'Finanzas · acumulado' },
          { label: 'Registros Totales', value: String(preview.totalRegistros), sub: 'Finanzas · todos los aportes' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-extrabold text-primary leading-none mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Módulos */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-bold text-foreground">Módulos del Sistema</p>
          <p className="text-xs text-muted-foreground mt-0.5">Haz clic para acceder a un módulo activo</p>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {MODULOS.map(m => (
            m.activo ? (
              <Link
                key={m.label}
                href={m.href}
                className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all"
              >
                <span className="text-sm font-bold text-foreground">{m.label}</span>
                <span className="text-xs text-muted-foreground">{m.desc}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-full w-fit">
                  Activo
                </span>
              </Link>
            ) : (
              <div
                key={m.label}
                className="flex flex-col gap-2 p-4 rounded-xl border border-border opacity-40 cursor-not-allowed"
              >
                <span className="text-sm font-bold text-foreground">{m.label}</span>
                <span className="text-xs text-muted-foreground">{m.desc}</span>
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full w-fit">
                  En desarrollo
                </span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
