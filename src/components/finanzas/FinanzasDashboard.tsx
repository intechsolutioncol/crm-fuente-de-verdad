'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCOP, formatCOPShort, formatFecha } from '@/lib/utils/format'
import type { Aporte, DashboardData, TipoAporte } from '@/types'
import { Badge } from '@/components/ui/badge'

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const TIPO_COLORS: Record<TipoAporte, string> = {
  Diezmo: 'hsl(var(--primary))',
  Ofrenda: 'hsl(var(--chart-2))',
  Donación: 'hsl(var(--chart-3))',
}

function calcularDashboard(aportes: Aporte[]): DashboardData {
  const ahora = new Date()
  const mesActual = ahora.getMonth()
  const anioActual = ahora.getFullYear()

  let totalMensual = 0
  let totalAnual = 0
  const porTipo: Record<TipoAporte, number> = { Diezmo: 0, Ofrenda: 0, Donación: 0 }
  const porMes: Record<number, number> = {}

  for (const a of aportes) {
    if (!a.fecha) continue
    const [anioStr, mesStr] = a.fecha.split('-')
    const anio = parseInt(anioStr)
    const mes = parseInt(mesStr) - 1

    if (anio === anioActual) {
      totalAnual += a.monto
      if (mes === mesActual) totalMensual += a.monto
      porMes[mes] = (porMes[mes] ?? 0) + a.monto
      if (a.tipo in porTipo) porTipo[a.tipo as TipoAporte] += a.monto
    }
  }

  const graficoData = Array.from({ length: 6 }, (_, i) => {
    const mes = (mesActual - (5 - i) + 12) % 12
    return { mes: NOMBRES_MES[mes], total: porMes[mes] ?? 0 }
  })

  return {
    totalMensual,
    totalAnual,
    totalRegistros: aportes.length,
    porTipo,
    graficoData,
    ultimosAportes: aportes.slice(0, 5),
  }
}

function BarChart({ data }: { data: { mes: string; total: number }[] }) {
  const W = 520, H = 200
  const pad = { top: 20, right: 16, bottom: 38, left: 58 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom
  const maxVal = Math.max(...data.map(d => d.total), 1)
  const barW = cW / data.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = pad.top + cH - pct * cH
        return (
          <g key={pct}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-border" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="9" className="fill-muted-foreground">
              {formatCOPShort(maxVal * pct)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const bh = Math.max((d.total / maxVal) * cH, d.total > 0 ? 4 : 0)
        const bx = pad.left + i * barW + barW * 0.15
        const by = pad.top + cH - bh
        const bwi = barW * 0.7
        return (
          <g key={i}>
            <rect x={bx} y={by} width={bwi} height={bh} fill="hsl(var(--primary))" rx="4" opacity="0.85" />
            {d.total > 0 && (
              <text x={bx + bwi / 2} y={by - 5} textAnchor="middle" fontSize="9" className="fill-muted-foreground">
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

function badgeTipo(tipo: TipoAporte) {
  const map: Record<TipoAporte, 'default' | 'secondary' | 'outline'> = {
    Diezmo: 'default',
    Ofrenda: 'secondary',
    Donación: 'outline',
  }
  return <Badge variant={map[tipo]}>{tipo}</Badge>
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

      if (!error && rows) setData(calcularDashboard(rows as Aporte[]))
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Mes Actual', value: formatCOP(data.totalMensual), sub: 'Aportes del mes en curso', color: 'text-primary' },
          { label: `Año ${anioActual}`, value: formatCOP(data.totalAnual), sub: 'Total acumulado del año', color: 'text-chart-2' },
          { label: 'Total Registros', value: String(data.totalRegistros), sub: 'Aportes históricos', color: 'text-chart-3' },
          { label: 'Diezmos (año)', value: formatCOP(data.porTipo.Diezmo), sub: 'Mayor tipo de aporte', color: 'text-primary' },
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
          <p className="text-sm font-bold text-foreground mb-0.5">Aportes — últimos 6 meses</p>
          <p className="text-xs text-muted-foreground mb-4">Tendencia mensual del año en curso</p>
          <BarChart data={data.graficoData} />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-0.5">Distribución por tipo</p>
          <p className="text-xs text-muted-foreground mb-5">Porcentaje del total anual</p>
          <div className="space-y-4">
            {(Object.entries(data.porTipo) as [TipoAporte, number][]).map(([tipo, monto]) => {
              const pct = data.totalAnual > 0 ? Math.round((monto / data.totalAnual) * 100) : 0
              return (
                <div key={tipo} className="flex items-center gap-3">
                  <span className="w-22 text-xs font-semibold text-muted-foreground flex-shrink-0">{tipo}</span>
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: TIPO_COLORS[tipo] }}
                    />
                  </div>
                  <span className="w-24 text-right text-xs font-bold text-primary">{formatCOP(monto)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Últimos aportes */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-sm font-bold text-foreground">Aportes Recientes</p>
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
                {['Fecha', 'Nombre', 'Tipo', 'Método', 'Monto'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.ultimosAportes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    Sin registros recientes
                  </td>
                </tr>
              ) : data.ultimosAportes.map(a => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatFecha(a.fecha)}</td>
                  <td className="px-4 py-3 font-semibold">{a.nombre}</td>
                  <td className="px-4 py-3">{badgeTipo(a.tipo)}</td>
                  <td className="px-4 py-3 text-xs">{a.metodo_pago}</td>
                  <td className="px-4 py-3 font-bold text-primary">{formatCOP(a.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
