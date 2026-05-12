import { z } from 'zod'

export const miembroSchema = z.object({
  nombres:          z.string().min(2, 'Mínimo 2 caracteres').max(80),
  apellidos:        z.string().min(2, 'Mínimo 2 caracteres').max(80),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  pais:             z.string().min(1, 'Selecciona un país'),
  departamento:     z.string().optional(),
  municipio:        z.string().optional(),
  barrio:           z.string().optional(),
  direccion:        z.string().min(3, 'Mínimo 3 caracteres').max(200),
  celular:          z.string().regex(/^[0-9+\s\-]{7,15}$/, 'Ingresa un número de celular válido'),
  correo:           z.string().email('Correo electrónico inválido'),
}).superRefine((data, ctx) => {
  if (data.pais === 'Colombia') {
    if (!data.departamento) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['departamento'], message: 'Selecciona el departamento' })
    }
    if (!data.municipio) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['municipio'], message: 'Escribe o selecciona el municipio' })
    }
    if (!data.barrio) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['barrio'], message: 'Escribe o selecciona el barrio' })
    }
  }
})

export type MiembroSchema = z.infer<typeof miembroSchema>
