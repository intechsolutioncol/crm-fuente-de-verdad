import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { calcEdad } from '@/lib/utils/format'
import type { Miembro } from '@/types'

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const ROLES_ORDEN = ['Administrador', 'Pastor', 'Líder', 'Diácono', 'Miembro Oficial']
const ESTADOS_ORDEN = ['Activo', 'Inactivo', 'Visitante']
const RANGOS_EDAD = [
  { label: '0-12', min: 0, max: 12 },
  { label: '13-17', min: 13, max: 17 },
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-50', min: 36, max: 50 },
  { label: '51-65', min: 51, max: 65 },
  { label: '66+', min: 66, max: 200 },
]

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

export default async function ReportesMiembrosPage() {
  const supabase = await createClient()
  const { data: esAdmin } = await supabase.rpc('es_administrador')

  if (!esAdmin) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <AccesoDenegado mensaje="Solo el Administrador puede entrar a Reportes." />
      </div>
    )
  }

  const { data } = await supabase.from('miembros').select('*')
  const miembros = (data ?? []) as Miembro[]
  const total = miembros.length

  // Crecimiento por mes (últimos 12 meses, por fecha de registro)
  const hoy = new Date()
  const porMes = new Map<string, number>()
  for (const m of miembros) {
    const clave = m.created_at.slice(0, 7) // 'YYYY-MM'
    porMes.set(clave, (porMes.get(clave) ?? 0) + 1)
  }
  const crecimiento = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1)
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { mes: NOMBRES_MES[d.getMonth()], total: porMes.get(clave) ?? 0 }
  })

  // Distribución por rol
  const porRol = ROLES_ORDEN.map(rol => ({ rol, valor: miembros.filter(m => m.rol === rol).length }))

  // Distribución por estado
  const porEstado = ESTADOS_ORDEN.map(estado => ({ estado, valor: miembros.filter(m => m.estado === estado).length }))
  const COLOR_ESTADO: Record<string, string> = { Activo: 'hsl(var(--primary))', Inactivo: 'hsl(var(--destructive))', Visitante: 'hsl(var(--chart-3))' }

  // Distribución por país / departamento
  const porPais = new Map<string, number>()
  const porDepartamento = new Map<string, number>()
  for (const m of miembros) {
    porPais.set(m.pais, (porPais.get(m.pais) ?? 0) + 1)
    if (m.pais === 'Colombia' && m.departamento) {
      porDepartamento.set(m.departamento, (porDepartamento.get(m.departamento) ?? 0) + 1)
    }
  }
  const paisesOrdenados = Array.from(porPais.entries()).sort((a, b) => b[1] - a[1])
  const departamentosOrdenados = Array.from(porDepartamento.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Pirámide de edades
  const porEdad = RANGOS_EDAD.map(r => ({
    label: r.label,
    valor: miembros.filter(m => {
      const edad = calcEdad(m.fecha_nacimiento)
      return edad >= r.min && edad <= r.max
    }).length,
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes de Miembros</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Crecimiento y composición de la congregación</p>
        </div>
        <Link href="/reportes" className="text-xs font-semibold text-primary hover:underline">← Reportes</Link>
      </div>

      {/* Crecimiento */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-sm font-bold text-foreground mb-0.5">Crecimiento de la membresía</p>
        <p className="text-xs text-muted-foreground mb-4">Miembros nuevos por mes — últimos 12 meses</p>
        <CrecimientoChart data={crecimiento} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Por rol */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-4">Distribución por rol</p>
          <div className="space-y-3">
            {porRol.map(r => (
              <BarraDistribucion key={r.rol} label={r.rol} valor={r.valor} total={total} color="hsl(var(--primary))" />
            ))}
          </div>
        </div>

        {/* Por estado */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-4">Distribución por estado</p>
          <div className="space-y-3">
            {porEstado.map(e => (
              <BarraDistribucion key={e.estado} label={e.estado} valor={e.valor} total={total} color={COLOR_ESTADO[e.estado]} />
            ))}
          </div>
        </div>

        {/* Por país */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-4">Distribución por país</p>
          <div className="space-y-3">
            {paisesOrdenados.map(([pais, valor]) => (
              <BarraDistribucion key={pais} label={pais} valor={valor} total={total} color="hsl(var(--chart-2))" />
            ))}
            {paisesOrdenados.length === 0 && <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </div>

        {/* Por departamento (Colombia) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-4">Departamentos (Colombia)</p>
          <div className="space-y-3">
            {departamentosOrdenados.map(([depto, valor]) => (
              <BarraDistribucion key={depto} label={depto} valor={valor} total={total} color="hsl(var(--chart-3))" />
            ))}
            {departamentosOrdenados.length === 0 && <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </div>
      </div>

      {/* Pirámide de edades */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-sm font-bold text-foreground mb-4">Distribución por edad</p>
        <div className="space-y-3">
          {porEdad.map(e => (
            <BarraDistribucion key={e.label} label={`${e.label} años`} valor={e.valor} total={total} color="hsl(var(--primary))" />
          ))}
        </div>
      </div>
    </div>
  )
}
