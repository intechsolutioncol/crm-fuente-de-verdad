import { formatFecha } from '@/lib/utils/format'
import type { createClient } from '@/lib/supabase/server'
import type { Miembro } from '@/types'
import type { ReporteExportData } from './export'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export const DIAS_VENTANA_ALERTA = 180
export const UMBRAL_AUSENCIA_DIAS = 21 // 3 domingos
const MAX_PUNTOS_TENDENCIA = 20

export interface AsistenciaFiltro {
  desde: string
  hasta: string
}

export interface AsistenciaData {
  filtro: AsistenciaFiltro
  tendencia: { fecha: string; miembros: number; visitantes: number }[]
  totalConfirmaciones: number
  totalMiembros: number
  totalVisitantes: number
  promedioPorDomingo: number
  totalMismoRangoAnioAnterior: number
  deltaPct: number | null
  alertaInasistencia: { miembro: Miembro; ultima: string | null; dias: number | null }[]
}

function diasDesde(fecha: string, referencia: Date) {
  const [y, m, d] = fecha.split('-').map(Number)
  const inicio = new Date(y, m - 1, d)
  const ref = new Date(referencia)
  ref.setHours(0, 0, 0, 0)
  inicio.setHours(0, 0, 0, 0)
  return Math.round((ref.getTime() - inicio.getTime()) / 86_400_000)
}

function haceUnAnio(fechaISO: string) {
  const [y, m, d] = fechaISO.split('-').map(Number)
  return `${y - 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export async function getAsistenciaData(supabase: SupabaseClient, filtro: AsistenciaFiltro): Promise<AsistenciaData> {
  const desdeAnioAnterior = haceUnAnio(filtro.desde)
  const hastaAnioAnterior = haceUnAnio(filtro.hasta)

  const desdeAlerta = new Date()
  desdeAlerta.setDate(desdeAlerta.getDate() - DIAS_VENTANA_ALERTA)

  const [asistenciaRes, anioAnteriorRes, alertaRes, miembrosRes] = await Promise.all([
    supabase.from('asistencia').select('miembro_id, visitante_id, fecha').gte('fecha', filtro.desde).lte('fecha', filtro.hasta),
    supabase.from('asistencia').select('id', { count: 'exact', head: true }).gte('fecha', desdeAnioAnterior).lte('fecha', hastaAnioAnterior),
    supabase.from('asistencia').select('miembro_id, fecha').gte('fecha', desdeAlerta.toISOString().slice(0, 10)),
    supabase.from('miembros').select('*').eq('estado', 'Activo'),
  ])

  const asistencia = asistenciaRes.data ?? []
  const alertaData = alertaRes.data ?? []
  const activos = (miembrosRes.data ?? []) as Miembro[]

  const porFecha = new Map<string, { miembros: number; visitantes: number }>()
  for (const a of asistencia) {
    const actual = porFecha.get(a.fecha) ?? { miembros: 0, visitantes: 0 }
    if (a.miembro_id) actual.miembros++
    if (a.visitante_id) actual.visitantes++
    porFecha.set(a.fecha, actual)
  }
  const tendencia = Array.from(porFecha.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-MAX_PUNTOS_TENDENCIA)
    .map(([fecha, v]) => ({ fecha, ...v }))

  const totalConfirmaciones = asistencia.length
  const totalMiembros = asistencia.filter(a => a.miembro_id).length
  const totalVisitantes = asistencia.filter(a => a.visitante_id).length
  const promedioPorDomingo = porFecha.size > 0 ? Math.round(totalConfirmaciones / porFecha.size) : 0

  const totalMismoRangoAnioAnterior = anioAnteriorRes.count ?? 0
  const deltaPct = totalMismoRangoAnioAnterior !== 0
    ? Math.round(((totalConfirmaciones - totalMismoRangoAnioAnterior) / totalMismoRangoAnioAnterior) * 100)
    : null

  const ultimaPorMiembro = new Map<string, string>()
  for (const a of alertaData) {
    if (!a.miembro_id) continue
    const actual = ultimaPorMiembro.get(a.miembro_id)
    if (!actual || a.fecha > actual) ultimaPorMiembro.set(a.miembro_id, a.fecha)
  }

  const hoy = new Date()
  const alertaInasistencia = activos
    .map(m => {
      const ultima = ultimaPorMiembro.get(m.id) ?? null
      const dias = ultima ? diasDesde(ultima, hoy) : null
      return { miembro: m, ultima, dias }
    })
    .filter(x => x.dias === null || x.dias >= UMBRAL_AUSENCIA_DIAS)
    .sort((a, b) => (b.dias ?? Infinity) - (a.dias ?? Infinity))

  return {
    filtro,
    tendencia,
    totalConfirmaciones,
    totalMiembros,
    totalVisitantes,
    promedioPorDomingo,
    totalMismoRangoAnioAnterior,
    deltaPct,
    alertaInasistencia,
  }
}

export function toExportAsistencia(d: AsistenciaData): ReporteExportData {
  return {
    titulo: 'Reporte de Asistencia',
    subtitulo: `${formatFecha(d.filtro.desde)} — ${formatFecha(d.filtro.hasta)}`,
    generadoEl: formatFecha(new Date().toISOString().slice(0, 10)),
    kpis: [
      { label: 'Confirmaciones', value: String(d.totalConfirmaciones) },
      { label: 'Miembros', value: String(d.totalMiembros) },
      { label: 'Visitantes', value: String(d.totalVisitantes) },
      { label: 'Promedio por domingo', value: String(d.promedioPorDomingo) },
      { label: 'Mismo rango, año anterior', value: String(d.totalMismoRangoAnioAnterior) },
      { label: 'Variación vs. año anterior', value: d.deltaPct === null ? 'N/A' : `${d.deltaPct > 0 ? '+' : ''}${d.deltaPct}%` },
    ],
    tablas: [
      { titulo: 'Tendencia por domingo', columnas: ['Fecha', 'Miembros', 'Visitantes'], filas: d.tendencia.map(t => [formatFecha(t.fecha), t.miembros, t.visitantes]) },
      {
        titulo: 'Alerta de inasistencia',
        columnas: ['Miembro', 'Última asistencia', 'Días de ausencia'],
        filas: d.alertaInasistencia.map(({ miembro, ultima, dias }) => [
          `${miembro.nombres} ${miembro.apellidos}`,
          ultima ? formatFecha(ultima) : 'Sin registro',
          dias === null ? `${DIAS_VENTANA_ALERTA}+` : dias,
        ]),
      },
    ],
  }
}
