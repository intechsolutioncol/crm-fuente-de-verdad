import { z } from 'zod'

export const miembroSchema = z.object({
  nombres:          z.string().min(2, 'Mínimo 2 caracteres').max(80, 'Máximo 80 caracteres'),
  apellidos:        z.string().min(2, 'Mínimo 2 caracteres').max(80, 'Máximo 80 caracteres'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  direccion:        z.string().min(3, 'Mínimo 3 caracteres').max(200),
  barrio:           z.string().min(2, 'Mínimo 2 caracteres').max(100),
  municipio:        z.string().min(2, 'Mínimo 2 caracteres').max(100),
  celular:          z.string().regex(/^[0-9+\s\-]{7,15}$/, 'Ingresa un número de celular válido'),
  correo:           z.string().email('Correo electrónico inválido'),
})

export type MiembroSchema = z.infer<typeof miembroSchema>
