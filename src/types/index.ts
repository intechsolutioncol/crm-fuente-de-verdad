// ── Miembros ──────────────────────────────────────────────────
export type RolMiembro = 'Miembro Oficial' | 'Diácono' | 'Líder' | 'Pastor' | 'Administrador'
export type EstadoMiembro = 'Activo' | 'Inactivo' | 'Visitante'

// ── Permisos ──────────────────────────────────────────────────
export type Modulo = 'miembros' | 'finanzas'
export type NivelPermiso = 'ninguno' | 'lector' | 'editor'
export const ROLES_CONFIGURABLES: Exclude<RolMiembro, 'Administrador'>[] =
  ['Miembro Oficial', 'Diácono', 'Líder', 'Pastor']
export const MODULOS_PERMISO: { id: Modulo; label: string }[] = [
  { id: 'miembros', label: 'Miembros' },
  { id: 'finanzas', label: 'Finanzas' },
]

export interface Permiso {
  rol: Exclude<RolMiembro, 'Administrador'>
  modulo: Modulo
  nivel: NivelPermiso
}

export interface Miembro {
  id: string
  user_id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string  // 'YYYY-MM-DD'
  pais: string
  departamento: string | null
  municipio: string | null
  barrio: string | null
  direccion: string
  celular: string
  correo: string
  rol: RolMiembro
  estado: EstadoMiembro
  created_at: string
  updated_at: string
}

export interface MiembroFormData {
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  pais: string
  departamento: string
  municipio: string
  barrio: string
  direccion: string
  celular: string
  correo: string
}

// ── Finanzas ───────────────────────────────────────────────────
export type TipoMovimiento = 'ingreso' | 'egreso'
export type CategoriaIngreso = 'Diezmo' | 'Ofrenda' | 'Donación'
export type CategoriaEgreso =
  | 'Arriendo'
  | 'Servicios Públicos'
  | 'Mantenimiento'
  | 'Honorarios y Pastoral'
  | 'Eventos y Logística'
  | 'Otro'
export type Categoria = CategoriaIngreso | CategoriaEgreso
export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Otro'

export const CATEGORIAS_INGRESO: CategoriaIngreso[] = ['Diezmo', 'Ofrenda', 'Donación']
export const CATEGORIAS_EGRESO: CategoriaEgreso[] = [
  'Arriendo', 'Servicios Públicos', 'Mantenimiento',
  'Honorarios y Pastoral', 'Eventos y Logística', 'Otro',
]

export interface Movimiento {
  id: string
  fecha: string          // 'YYYY-MM-DD'
  nombre: string
  tipo_movimiento: TipoMovimiento
  tipo: Categoria
  metodo_pago: MetodoPago
  monto: number
  observaciones: string
  user_email: string
  created_at: string
  updated_at: string
}

export interface MovimientoFormData {
  fecha: string
  nombre: string
  tipo_movimiento: TipoMovimiento
  tipo: Categoria | ''
  metodo_pago: MetodoPago | ''
  monto: string
  observaciones: string
}

export interface FiltrosFinanzas {
  nombre: string
  tipoMovimiento: TipoMovimiento | 'Todos'
  tipo: Categoria | 'Todos'
  fechaInicio: string
  fechaFin: string
}

export interface DashboardData {
  totalIngresosMes: number
  totalEgresosMes: number
  balanceMes: number
  totalIngresosAnual: number
  totalEgresosAnual: number
  balanceAnual: number
  totalRegistros: number
  porCategoriaIngreso: Record<CategoriaIngreso, number>
  porCategoriaEgreso: Record<CategoriaEgreso, number>
  graficoData: { mes: string; total: number }[]
  ultimosMovimientos: Movimiento[]
}
