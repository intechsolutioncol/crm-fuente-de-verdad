import { formatFecha } from '@/lib/utils/format'
import type { createClient } from '@/lib/supabase/server'
import type { Ministerio, PublicacionMinisterio } from '@/types'
import type { ReporteExportData } from './export'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface MinisteriosFiltro {
  desde: string
  hasta: string
}

export interface MinisteriosData {
  filtro: MinisteriosFiltro
  totalVistas: number
  totalPublicaciones: number
  ministeriosActivos: number
  publicacionesEsteAnio: number
  publicacionesAnioAnterior: number
  deltaPct: number | null
  topPublicaciones: { publicacion: PublicacionMinisterio; ministerioNombre: string; ministerioSlug: string }[]
  rankingVistas: { nombre: string; valor: number }[]
  rankingPublicaciones: { nombre: string; valor: number }[]
}

function haceUnAnio(fechaISO: string) {
  const [y, m, d] = fechaISO.split('-').map(Number)
  return `${y - 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export async function getMinisteriosData(supabase: SupabaseClient, filtro: MinisteriosFiltro): Promise<MinisteriosData> {
  const desdeAnioAnterior = haceUnAnio(filtro.desde)
  const hastaAnioAnterior = haceUnAnio(filtro.hasta)

  const [ministeriosRes, publicacionesRes, anioAnteriorRes] = await Promise.all([
    supabase.from('ministerios').select('*').order('orden'),
    supabase.from('publicaciones_ministerio').select('*').gte('created_at', filtro.desde).lte('created_at', `${filtro.hasta}T23:59:59`),
    supabase.from('publicaciones_ministerio').select('id', { count: 'exact', head: true }).gte('created_at', desdeAnioAnterior).lte('created_at', `${hastaAnioAnterior}T23:59:59`),
  ])

  const ministerios = (ministeriosRes.data ?? []) as Ministerio[]
  const publicaciones = (publicacionesRes.data ?? []) as PublicacionMinisterio[]
  const nombrePorId = new Map(ministerios.map(m => [m.id, m.nombre]))
  const slugPorId = new Map(ministerios.map(m => [m.id, m.slug]))

  const totalVistas = publicaciones.reduce((s, p) => s + p.vistas_count, 0)
  const totalPublicaciones = publicaciones.length

  const anioActual = new Date().getFullYear()
  const publicacionesEsteAnio = publicaciones.filter(p => p.created_at.slice(0, 4) === String(anioActual)).length
  const publicacionesAnioAnterior = anioAnteriorRes.count ?? 0
  const deltaPct = publicacionesAnioAnterior !== 0
    ? Math.round(((publicacionesEsteAnio - publicacionesAnioAnterior) / publicacionesAnioAnterior) * 100)
    : null

  const topPublicaciones = [...publicaciones]
    .sort((a, b) => b.vistas_count - a.vistas_count)
    .slice(0, 10)
    .map(p => ({
      publicacion: p,
      ministerioNombre: nombrePorId.get(p.ministerio_id) ?? '—',
      ministerioSlug: slugPorId.get(p.ministerio_id) ?? '',
    }))

  const vistasPorMinisterio = new Map<string, number>()
  const publicacionesPorMinisterio = new Map<string, number>()
  for (const p of publicaciones) {
    vistasPorMinisterio.set(p.ministerio_id, (vistasPorMinisterio.get(p.ministerio_id) ?? 0) + p.vistas_count)
    publicacionesPorMinisterio.set(p.ministerio_id, (publicacionesPorMinisterio.get(p.ministerio_id) ?? 0) + 1)
  }

  const rankingVistas = ministerios
    .map(m => ({ nombre: m.nombre, valor: vistasPorMinisterio.get(m.id) ?? 0 }))
    .sort((a, b) => b.valor - a.valor)

  const rankingPublicaciones = ministerios
    .map(m => ({ nombre: m.nombre, valor: publicacionesPorMinisterio.get(m.id) ?? 0 }))
    .sort((a, b) => b.valor - a.valor)

  return {
    filtro,
    totalVistas,
    totalPublicaciones,
    ministeriosActivos: ministerios.filter(m => m.activo).length,
    publicacionesEsteAnio,
    publicacionesAnioAnterior,
    deltaPct,
    topPublicaciones,
    rankingVistas,
    rankingPublicaciones,
  }
}

export function toExportMinisterios(d: MinisteriosData): ReporteExportData {
  return {
    titulo: 'Reporte de Ministerios',
    subtitulo: `Publicaciones entre ${formatFecha(d.filtro.desde)} y ${formatFecha(d.filtro.hasta)} — vistas acumuladas desde su publicación`,
    generadoEl: formatFecha(new Date().toISOString().slice(0, 10)),
    kpis: [
      { label: 'Vistas totales', value: String(d.totalVistas) },
      { label: 'Publicaciones en el rango', value: String(d.totalPublicaciones) },
      { label: 'Ministerios activos', value: String(d.ministeriosActivos) },
      { label: 'Publicaciones este año', value: String(d.publicacionesEsteAnio) },
      { label: 'Publicaciones el año anterior (mismo rango)', value: String(d.publicacionesAnioAnterior) },
      { label: 'Variación vs. año anterior', value: d.deltaPct === null ? 'N/A' : `${d.deltaPct > 0 ? '+' : ''}${d.deltaPct}%` },
    ],
    tablas: [
      {
        titulo: 'Publicaciones con más vistas',
        columnas: ['Publicación', 'Ministerio', 'Vistas', 'Fecha'],
        filas: d.topPublicaciones.map(({ publicacion, ministerioNombre }) => [
          publicacion.titulo, ministerioNombre, publicacion.vistas_count, formatFecha(publicacion.created_at.slice(0, 10)),
        ]),
      },
      { titulo: 'Ministerio más visitado', columnas: ['Ministerio', 'Vistas'], filas: d.rankingVistas.map(r => [r.nombre, r.valor]) },
      { titulo: 'Ministerio con más publicaciones', columnas: ['Ministerio', 'Publicaciones'], filas: d.rankingPublicaciones.map(r => [r.nombre, r.valor]) },
    ],
  }
}
