import { z } from 'zod'

export const aporteSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120),
  tipo: z.enum(['Diezmo', 'Ofrenda', 'Donación'] as const, {
    error: 'Selecciona un tipo de aporte válido',
  }),
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
})

export type AporteSchema = z.infer<typeof aporteSchema>
