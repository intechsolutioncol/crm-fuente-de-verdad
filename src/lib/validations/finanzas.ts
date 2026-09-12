import { z } from 'zod'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO } from '@/types'

export const movimientoSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120),
  tipo_movimiento: z.enum(['ingreso', 'egreso'] as const, {
    error: 'Selecciona ingreso o egreso',
  }),
  tipo: z.string().min(1, 'Selecciona una categoría válida'),
  metodo_pago: z.enum(['Efectivo', 'Transferencia', 'Otro'] as const, {
    error: 'Selecciona un método de pago válido',
  }),
  monto: z
    .string()
    .min(1, 'El monto es requerido')
    .refine(v => !isNaN(Number(v)) && Number(v) > 0, {
      message: 'El monto debe ser mayor a 0',
    }),
  observaciones: z.string().max(500).default(''),
}).superRefine((data, ctx) => {
  const categoriasValidas = data.tipo_movimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO
  if (!(categoriasValidas as string[]).includes(data.tipo)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tipo'], message: 'Selecciona una categoría válida' })
  }
})

export type MovimientoSchema = z.infer<typeof movimientoSchema>
