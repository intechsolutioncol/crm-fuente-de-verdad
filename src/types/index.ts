// ── Miembros ──────────────────────────────────────────────────
export type RolMiembro = 'Miembro Oficial' | 'Diácono' | 'Líder' | 'Pastor' | 'Administrador'
export type EstadoMiembro = 'Activo' | 'Inactivo' | 'Visitante'

// ── Permisos ──────────────────────────────────────────────────
export type Modulo = 'miembros' | 'finanzas' | 'asistencia'
export type NivelPermiso = 'ninguno' | 'lector' | 'editor'
export const ROLES_CONFIGURABLES: Exclude<RolMiembro, 'Administrador'>[] =
  ['Miembro Oficial', 'Diácono', 'Líder', 'Pastor']
export const MODULOS_PERMISO: { id: Modulo; label: string }[] = [
  { id: 'miembros', label: 'Miembros' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'asistencia', label: 'Asistencia' },
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

// Las categorías y el método de pago ya no son un set fijo: son
// configurables desde /configuracion (tablas categorias_finanzas y
// metodos_pago). El FK en la base de datos es la validación real;
// aquí ambos son `string`.
export interface CategoriaFinanzas {
  id: string
  tipo_movimiento: TipoMovimiento
  nombre: string
  activo: boolean
  orden: number
}

export interface MetodoFinanzas {
  id: string
  nombre: string
  activo: boolean
  orden: number
}

export interface ConfiguracionFinanzas {
  id: number
  exigir_registro_48h: boolean
}

export interface Movimiento {
  id: string
  fecha: string          // 'YYYY-MM-DD'
  nombre: string
  tipo_movimiento: TipoMovimiento
  tipo: string            // categoría — nombre de fuente_verdad.categorias_finanzas
  metodo_pago: string     // nombre de fuente_verdad.metodos_pago
  monto: number
  observaciones: string
  comprobante_path: string | null
  user_email: string
  created_at: string
  updated_at: string
}

export interface MovimientoFormData {
  fecha: string
  nombre: string
  tipo_movimiento: TipoMovimiento
  tipo: string
  metodo_pago: string
  monto: string
  observaciones: string
}

export interface FiltrosFinanzas {
  nombre: string
  tipoMovimiento: TipoMovimiento | 'Todos'
  tipo: string | 'Todos'
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
  porCategoriaIngreso: Record<string, number>
  porCategoriaEgreso: Record<string, number>
  graficoData: { mes: string; total: number }[]
  ultimosMovimientos: Movimiento[]
}

// ── Asistencia ─────────────────────────────────────────────────
export interface Asistencia {
  id: string
  miembro_id: string | null
  visitante_id: string | null
  fecha: string      // 'YYYY-MM-DD'
  hora: string
  metodo: 'qr' | 'manual'
  created_at: string
}

export type ComoSeEntero =
  | 'Invitado por un miembro'
  | 'Redes sociales'
  | 'Buscando en internet'
  | 'Pasaba por el lugar'
  | 'Otro'

export const OPCIONES_COMO_SE_ENTERO: ComoSeEntero[] = [
  'Invitado por un miembro', 'Redes sociales', 'Buscando en internet', 'Pasaba por el lugar', 'Otro',
]

export interface Visitante {
  id: string
  nombres: string
  apellidos: string
  celular: string | null
  referido_por: string | null
  como_se_entero: ComoSeEntero
  como_se_entero_otro: string | null
  primera_visita: string
  created_at: string
}
