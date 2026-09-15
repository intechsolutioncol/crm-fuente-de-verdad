import { formatCOP, formatFecha } from '@/lib/utils/format'
import type { createClient } from '@/lib/supabase/server'
import type { ReporteExportData } from './export'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface CentroMandoFiltro {
  anio: number
  mes: number // 1-12
}

export interface CentroMandoData {
  filtro: CentroMandoFiltro
  balanceMes: number
  balanceMesAnterior: number
  deltaPct: number | null
  miembrosActivos: number
  fechaUltimoDomingo: string | null
  asistenciaUltimoDomingo: number
  publicacionesTotal: number
  ministeriosActivos: number
}

function rangoMes(anio: number, mes: number) {
  const mesStr = String(mes).padStart(2, '0')
  const ultimoDia = new Date(anio, mes, 0).getDate()
  return { desde: `${anio}-${mesStr}-01`, hasta: `${anio}-${mesStr}-${ultimoDia}` }
}

async function balanceDeMes(supabase: SupabaseClient, anio: number, mes: number) {
  const { desde, hasta } = rangoMes(anio, mes)
  const { data } = await supabase.from('finanzas').select('monto, tipo_movimiento').gte('fecha', desde).lte('fecha', hasta)
  return (data ?? []).reduce((s, r) => s + (r.tipo_movimiento === 'egreso' ? -r.monto : r.monto), 0)
}

export async function getCentroMandoData(supabase: SupabaseClient, filtro: CentroMandoFiltro): Promise<CentroMandoData> {
  const anioAnterior = filtro.anio - 1

  const [
    balanceMes,
    balanceMesAnterior,
    { count: miembrosActivos },
    { data: ultimaAsistencia },
    { count: publicacionesTotal },
    { count: ministeriosActivos },
  ] = await Promise.all([
    balanceDeMes(supabase, filtro.anio, filtro.mes),
    balanceDeMes(supabase, anioAnterior, filtro.mes),
    supabase.from('miembros').select('id', { count: 'exact', head: true }).eq('estado', 'Activo'),
    supabase.from('asistencia').select('fecha').order('fecha', { ascending: false }).limit(1),
    supabase.from('publicaciones_ministerio').select('id', { count: 'exact', head: true }),
    supabase.from('ministerios').select('id', { count: 'exact', head: true }).eq('activo', true),
  ])

  const fechaUltimoDomingo = ultimaAsistencia?.[0]?.fecha ?? null
  let asistenciaUltimoDomingo = 0
  if (fechaUltimoDomingo) {
    const { count } = await supabase.from('asistencia').select('id', { count: 'exact', head: true }).eq('fecha', fechaUltimoDomingo)
    asistenciaUltimoDomingo = count ?? 0
  }

  const deltaPct = balanceMesAnterior !== 0
    ? Math.round(((balanceMes - balanceMesAnterior) / Math.abs(balanceMesAnterior)) * 100)
    : null

  return {
    filtro,
    balanceMes,
    balanceMesAnterior,
    deltaPct,
    miembrosActivos: miembrosActivos ?? 0,
    fechaUltimoDomingo,
    asistenciaUltimoDomingo,
    publicacionesTotal: publicacionesTotal ?? 0,
    ministeriosActivos: ministeriosActivos ?? 0,
  }
}

const NOMBRES_MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function toExportCentroMando(d: CentroMandoData): ReporteExportData {
  return {
    titulo: 'Centro de mando',
    subtitulo: `${NOMBRES_MES[d.filtro.mes - 1]} ${d.filtro.anio}`,
    generadoEl: formatFecha(new Date().toISOString().slice(0, 10)),
    kpis: [
      { label: `Balance de ${NOMBRES_MES[d.filtro.mes - 1]} ${d.filtro.anio}`, value: formatCOP(d.balanceMes) },
      { label: `Balance de ${NOMBRES_MES[d.filtro.mes - 1]} ${d.filtro.anio - 1} (año anterior)`, value: formatCOP(d.balanceMesAnterior) },
      { label: 'Variación vs. año anterior', value: d.deltaPct === null ? 'N/A' : `${d.deltaPct > 0 ? '+' : ''}${d.deltaPct}%` },
      { label: 'Miembros activos', value: String(d.miembrosActivos) },
      { label: 'Asistencia último domingo', value: d.fechaUltimoDomingo ? `${d.asistenciaUltimoDomingo} (${formatFecha(d.fechaUltimoDomingo)})` : 'Sin registros' },
      { label: 'Publicaciones de Ministerios', value: String(d.publicacionesTotal) },
      { label: 'Ministerios activos', value: String(d.ministeriosActivos) },
    ],
    tablas: [],
  }
}
