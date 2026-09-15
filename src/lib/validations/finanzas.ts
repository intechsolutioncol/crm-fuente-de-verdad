import { z } from 'zod'

export const movimientoSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120),
  tipo_movimiento: z.enum(['ingreso', 'egreso'] as const, {
    error: 'Selecciona ingreso o egreso',
  }),
  // La categoría es configurable (fuente_verdad.categorias_finanzas);
  // el <Select> solo ofrece categorías activas válidas para la dirección
  // elegida, y el FK en la base de datos es la validación real.
  tipo: z.string().min(1, 'Selecciona una categoría'),
  // El método de pago también es configurable (fuente_verdad.metodos_pago),
  // mismo tratamiento que la categoría.
  metodo_pago: z.string().min(1, 'Selecciona un método de pago'),
  monto: z
    .string()
    .min(1, 'El monto es requerido')
    .refine(v => !isNaN(Number(v)) && Number(v) > 0, {
      message: 'El monto debe ser mayor a 0',
    }),
  observaciones: z.string().max(500).default(''),
})

export type MovimientoSchema = z.infer<typeof movimientoSchema>
