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
