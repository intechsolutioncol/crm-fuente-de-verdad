import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatCOP(value: number): string {
  return '$ ' + Math.round(value).toLocaleString('es-CO')
}

export function formatCOPShort(value: number): string {
  if (value >= 1_000_000) return '$ ' + (value / 1_000_000).toFixed(1) + 'M'
  if (value >= 1_000) return '$ ' + (value / 1_000).toFixed(0) + 'k'
  return '$ ' + Math.round(value).toString()
}

export function formatFecha(fecha: string): string {
  if (!fecha) return '—'
  try {
    return format(parseISO(fecha), 'dd/MM/yyyy')
  } catch {
    return fecha
  }
}

export function formatFechaLarga(fecha: string): string {
  if (!fecha) return ''
  try {
    return format(parseISO(fecha), "d 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return fecha
  }
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getCodigoAporte(id: string, createdAt: string): string {
  try {
    const fecha = format(parseISO(createdAt), 'yyyyMMdd')
    return `FIN-${fecha}-${id.slice(0, 4).toUpperCase()}`
  } catch {
    return `FIN-${id.slice(0, 8).toUpperCase()}`
  }
}
