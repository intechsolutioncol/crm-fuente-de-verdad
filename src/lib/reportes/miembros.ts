import { calcEdad, formatFecha } from '@/lib/utils/format'
import type { createClient } from '@/lib/supabase/server'
import type { Miembro } from '@/types'
import type { ReporteExportData } from './export'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const ROLES_ORDEN = ['Administrador', 'Pastor', 'Líder', 'Diácono', 'Miembro Oficial']
export const ESTADOS_ORDEN = ['Activo', 'Inactivo', 'Visitante']
export const RANGOS_EDAD = [
  { label: '0-12', min: 0, max: 12 },
  { label: '13-17', min: 13, max: 17 },
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-50', min: 36, max: 50 },
  { label: '51-65', min: 51, max: 65 },
  { label: '66+', min: 66, max: 200 },
]
export const VENTANAS_MESES = [6, 12, 24] as const

export interface MiembrosFiltro {
  meses: number
}

export interface MiembrosData {
  filtro: MiembrosFiltro
  total: number
  crecimiento: { mes: string; total: number }[]
  nuevosEsteAnio: number
  nuevosAnioAnterior: number
  deltaPct: number | null
  porRol: { rol: string; valor: number }[]
  porEstado: { estado: string; valor: number }[]
  paisesOrdenados: [string, number][]
  departamentosOrdenados: [string, number][]
  porEdad: { label: string; valor: number }[]
}

export async function getMiembrosData(supabase: SupabaseClient, filtro: MiembrosFiltro): Promise<MiembrosData> {
  const { data } = await supabase.from('miembros').select('*')
  const miembros = (data ?? []) as Miembro[]
  const total = miembros.length
  const hoy = new Date()
  const anioActual = hoy.getFullYear()

  const porMes = new Map<string, number>()
  for (const m of miembros) {
    const clave = m.created_at.slice(0, 7)
    porMes.set(clave, (porMes.get(clave) ?? 0) + 1)
  }
  const crecimiento = Array.from({ length: filtro.meses }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (filtro.meses - 1 - i), 1)
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { mes: `${NOMBRES_MES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, total: porMes.get(clave) ?? 0 }
  })

  const nuevosEsteAnio = miembros.filter(m => m.created_at.slice(0, 4) === String(anioActual)).length
  const nuevosAnioAnterior = miembros.filter(m => m.created_at.slice(0, 4) === String(anioActual - 1)).length
  const deltaPct = nuevosAnioAnterior !== 0
    ? Math.round(((nuevosEsteAnio - nuevosAnioAnterior) / nuevosAnioAnterior) * 100)
    : null

  const porRol = ROLES_ORDEN.map(rol => ({ rol, valor: miembros.filter(m => m.rol === rol).length }))
  const porEstado = ESTADOS_ORDEN.map(estado => ({ estado, valor: miembros.filter(m => m.estado === estado).length }))

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

  const porEdad = RANGOS_EDAD.map(r => ({
    label: r.label,
    valor: miembros.filter(m => {
      const edad = calcEdad(m.fecha_nacimiento)
      return edad >= r.min && edad <= r.max
    }).length,
  }))

  return { filtro, total, crecimiento, nuevosEsteAnio, nuevosAnioAnterior, deltaPct, porRol, porEstado, paisesOrdenados, departamentosOrdenados, porEdad }
}

export function toExportMiembros(d: MiembrosData): ReporteExportData {
  return {
    titulo: 'Reporte de Miembros',
    subtitulo: `Crecimiento de los últimos ${d.filtro.meses} meses`,
    generadoEl: formatFecha(new Date().toISOString().slice(0, 10)),
    kpis: [
      { label: 'Total de miembros', value: String(d.total) },
      { label: 'Nuevos este año', value: String(d.nuevosEsteAnio) },
      { label: 'Nuevos el año anterior', value: String(d.nuevosAnioAnterior) },
      { label: 'Variación vs. año anterior', value: d.deltaPct === null ? 'N/A' : `${d.deltaPct > 0 ? '+' : ''}${d.deltaPct}%` },
    ],
    tablas: [
      { titulo: 'Crecimiento mensual', columnas: ['Mes', 'Nuevos miembros'], filas: d.crecimiento.map(c => [c.mes, c.total]) },
      { titulo: 'Distribución por rol', columnas: ['Rol', 'Miembros'], filas: d.porRol.map(r => [r.rol, r.valor]) },
      { titulo: 'Distribución por estado', columnas: ['Estado', 'Miembros'], filas: d.porEstado.map(e => [e.estado, e.valor]) },
      { titulo: 'Distribución por país', columnas: ['País', 'Miembros'], filas: d.paisesOrdenados.map(([p, v]) => [p, v]) },
      { titulo: 'Departamentos (Colombia)', columnas: ['Departamento', 'Miembros'], filas: d.departamentosOrdenados.map(([dep, v]) => [dep, v]) },
      { titulo: 'Distribución por edad', columnas: ['Rango de edad', 'Miembros'], filas: d.porEdad.map(e => [`${e.label} años`, e.valor]) },
    ],
  }
}
