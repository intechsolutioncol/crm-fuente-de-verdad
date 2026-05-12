// ── Miembros ──────────────────────────────────────────────────
export type RolMiembro = 'Miembro Oficial' | 'Líder' | 'Pastor' | 'Administrador'
export type EstadoMiembro = 'Activo' | 'Inactivo' | 'Visitante'

export interface Miembro {
  id: string
  user_id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string  // 'YYYY-MM-DD'
  direccion: string
  barrio: string
  municipio: string
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
  direccion: string
  barrio: string
  municipio: string
  celular: string
  correo: string
}

// ── Finanzas ───────────────────────────────────────────────────
export type TipoAporte = 'Diezmo' | 'Ofrenda' | 'Donación'
export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Otro'

export interface Aporte {
  id: string
  fecha: string          // 'YYYY-MM-DD'
  nombre: string
  tipo: TipoAporte
  metodo_pago: MetodoPago
  monto: number
  observaciones: string
  user_email: string
  created_at: string
  updated_at: string
}

export interface AporteFormData {
  fecha: string
  nombre: string
  tipo: TipoAporte | ''
  metodo_pago: MetodoPago | ''
  monto: string
  observaciones: string
}

export interface FiltrosFinanzas {
  nombre: string
  tipo: TipoAporte | 'Todos'
  fechaInicio: string
  fechaFin: string
}

export interface DashboardData {
  totalMensual: number
  totalAnual: number
  totalRegistros: number
  porTipo: Record<TipoAporte, number>
  graficoData: { mes: string; total: number }[]
  ultimosAportes: Aporte[]
}
