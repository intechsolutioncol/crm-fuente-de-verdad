'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCOP, formatCOPShort, formatFecha } from '@/lib/utils/format'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO } from '@/types'
import type { Movimiento, DashboardData, Categoria } from '@/types'
import { Badge } from '@/components/ui/badge'

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function calcularDashboard(movimientos: Movimiento[]): DashboardData {
  const ahora = new Date()
  const mesActual = ahora.getMonth()
  const anioActual = ahora.getFullYear()

  let totalIngresosMes = 0, totalEgresosMes = 0
  let totalIngresosAnual = 0, totalEgresosAnual = 0
  const porCategoriaIngreso = Object.fromEntries(CATEGORIAS_INGRESO.map(c => [c, 0])) as DashboardData['porCategoriaIngreso']
  const porCategoriaEgreso = Object.fromEntries(CATEGORIAS_EGRESO.map(c => [c, 0])) as DashboardData['porCategoriaEgreso']
  const ingresosPorMes: Record<number, number> = {}
  const egresosPorMes: Record<number, number> = {}

  for (const m of movimientos) {
    if (!m.fecha) continue
    const [anioStr, mesStr] = m.fecha.split('-')
    const anio = parseInt(anioStr)
    const mes = parseInt(mesStr) - 1
    if (anio !== anioActual) continue

    if (m.tipo_movimiento === 'ingreso') {
      totalIngresosAnual += m.monto
      if (mes === mesActual) totalIngresosMes += m.monto
      ingresosPorMes[mes] = (ingresosPorMes[mes] ?? 0) + m.monto
      if (m.tipo in porCategoriaIngreso) porCategoriaIngreso[m.tipo as keyof typeof porCategoriaIngreso] += m.monto
    } else {
      totalEgresosAnual += m.monto
      if (mes === mesActual) totalEgresosMes += m.monto
      egresosPorMes[mes] = (egresosPorMes[mes] ?? 0) + m.monto
      if (m.tipo in porCategoriaEgreso) porCategoriaEgreso[m.tipo as keyof typeof porCategoriaEgreso] += m.monto
    }
  }

  const graficoData = Array.from({ length: 6 }, (_, i) => {
    const mes = (mesActual - (5 - i) + 12) % 12
    const balanceMesGrafico = (ingresosPorMes[mes] ?? 0) - (egresosPorMes[mes] ?? 0)
    return { mes: NOMBRES_MES[mes], total: balanceMesGrafico }
  })

  return {
    totalIngresosMes,
    totalEgresosMes,
    balanceMes: totalIngresosMes - totalEgresosMes,
    totalIngresosAnual,
    totalEgresosAnual,
    balanceAnual: totalIngresosAnual - totalEgresosAnual,
    totalRegistros: movimientos.length,
    porCategoriaIngreso,
    porCategoriaEgreso,
    graficoData,
    ultimosMovimientos: movimientos.slice(0, 5),
  }
}

function BarChart({ data }: { data: { mes: string; total: number }[] }) {
  const W = 520, H = 200
  const pad = { top: 20, right: 16, bottom: 38, left: 58 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom
  const maxAbs = Math.max(...data.map(d => Math.abs(d.total)), 1)
  const zeroY = pad.top + cH / 2
  const barW = cW / data.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
      <line x1={pad.left} y1={zeroY} x2={W - pad.right} y2={zeroY} stroke="currentColor" strokeWidth="1" className="text-border" />
      {data.map((d, i) => {
        const bh = Math.max((Math.abs(d.total) / maxAbs) * (cH / 2), d.total !== 0 ? 4 : 0)
        const bx = pad.left + i * barW + barW * 0.15
        const by = d.total >= 0 ? zeroY - bh : zeroY
        const bwi = barW * 0.7
        return (
          <g key={i}>
            <rect
              x={bx} y={by} width={bwi} height={bh}
              fill={d.total >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
              rx="4" opacity="0.85"
            />
            {d.total !== 0 && (
              <text
                x={bx + bwi / 2}
                y={d.total >= 0 ? by - 5 : by + bh + 12}
                textAnchor="middle" fontSize="9" className="fill-muted-foreground"
              >
                {formatCOPShort(d.total)}
              </text>
            )}
            <text x={bx + bwi / 2} y={H - pad.bottom + 16} textAnchor="middle" fontSize="10" className="fill-muted-foreground">
              {d.mes}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function badgeCategoria(categoria: Categoria, esEgreso: boolean) {
  if (esEgreso) return <Badge variant="outline">{categoria}</Badge>
  const map: Record<string, 'default' | 'secondary' | 'outline'> = {
    Diezmo: 'default', Ofrenda: 'secondary', Donación: 'outline',
  }
  return <Badge variant={map[categoria] ?? 'outline'}>{categoria}</Badge>
}

interface Props {
  onGoLista: () => void
}

export function FinanzasDashboard({ onGoLista }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: rows, error } = await supabase
        .from('finanzas')
        .select('*')
        .order('fecha', { ascending: false })

      if (!error && rows) setData(calcularDashboard(rows as Movimiento[]))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <span className="w-10 h-10 border-[3px] border-border border-t-primary rounded-full animate-spin" />
        <p className="text-sm">Calculando dashboard...</p>
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground text-center py-12">Error al cargar los datos.</p>
  }

  const anioActual = new Date().getFullYear()

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Ingresos del Mes', value: formatCOP(data.totalIngresosMes), sub: 'Aportes recibidos en el mes', color: 'text-primary' },
          { label: 'Egresos del Mes', value: formatCOP(data.totalEgresosMes), sub: 'Gastos del mes en curso', color: 'text-destructive' },
          { label: 'Balance del Mes', value: formatCOP(data.balanceMes), sub: 'Ingresos − Egresos', color: data.balanceMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive' },
          { label: `Ingresos Año ${anioActual}`, value: formatCOP(data.totalIngresosAnual), sub: 'Total acumulado del año', color: 'text-primary' },
          { label: `Egresos Año ${anioActual}`, value: formatCOP(data.totalEgresosAnual), sub: 'Total acumulado del año', color: 'text-destructive' },
          { label: 'Balance del Año', value: formatCOP(data.balanceAnual), sub: 'Ingresos − Egresos', color: data.balanceAnual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-2xl font-extrabold ${stat.color} leading-none mb-1`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico + Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-0.5">Balance neto — últimos 6 meses</p>
          <p className="text-xs text-muted-foreground mb-4">Ingresos menos egresos por mes</p>
          <BarChart data={data.graficoData} />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <p className="text-sm font-bold text-foreground mb-0.5">Ingresos por categoría</p>
            <p className="text-xs text-muted-foreground mb-3">Del año en curso</p>
            <div className="space-y-3">
              {(Object.entries(data.porCategoriaIngreso) as [string, number][]).map(([cat, monto]) => {
                const pct = data.totalIngresosAnual > 0 ? Math.round((monto / data.totalIngresosAnual) * 100) : 0
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="w-28 text-xs font-semibold text-muted-foreground flex-shrink-0 truncate">{cat}</span>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-20 text-right text-xs font-bold text-primary">{formatCOP(monto)}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm font-bold text-foreground mb-0.5">Egresos por categoría</p>
            <p className="text-xs text-muted-foreground mb-3">Del año en curso</p>
            <div className="space-y-3">
              {(Object.entries(data.porCategoriaEgreso) as [string, number][]).map(([cat, monto]) => {
                const pct = data.totalEgresosAnual > 0 ? Math.round((monto / data.totalEgresosAnual) * 100) : 0
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="w-28 text-xs font-semibold text-muted-foreground flex-shrink-0 truncate">{cat}</span>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-destructive transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-20 text-right text-xs font-bold text-destructive">{formatCOP(monto)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Últimos movimientos */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-sm font-bold text-foreground">Movimientos Recientes</p>
            <p className="text-xs text-muted-foreground">Últimos 5 registros</p>
          </div>
          <button
            onClick={onGoLista}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver todos →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Fecha', 'Nombre', 'Categoría', 'Método', 'Monto'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.ultimosMovimientos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    Sin registros recientes
                  </td>
                </tr>
              ) : data.ultimosMovimientos.map(m => {
                const esEgreso = m.tipo_movimiento === 'egreso'
                return (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatFecha(m.fecha)}</td>
                    <td className="px-4 py-3 font-semibold">{m.nombre}</td>
                    <td className="px-4 py-3">{badgeCategoria(m.tipo, esEgreso)}</td>
                    <td className="px-4 py-3 text-xs">{m.metodo_pago}</td>
                    <td className={`px-4 py-3 font-bold ${esEgreso ? 'text-destructive' : 'text-primary'}`}>
                      {esEgreso ? '- ' : ''}{formatCOP(m.monto)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
