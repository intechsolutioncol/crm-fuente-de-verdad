'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { miembroSchema, type MiembroSchema } from '@/lib/validations/miembros'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId]   = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MiembroSchema>({
    resolver: zodResolver(miembroSchema),
    defaultValues: { municipio: 'Medellín' },
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const email = user.email ?? ''
      setUserEmail(email)
      setValue('correo', email)
      // Pre-llenar nombre si Google lo provee
      const fullName: string = user.user_metadata?.full_name ?? ''
      if (fullName) {
        const parts = fullName.trim().split(' ')
        // Heurística: primeras 2 palabras = nombres, el resto = apellidos
        const nombres   = parts.slice(0, Math.ceil(parts.length / 2)).join(' ')
        const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ')
        if (nombres)   setValue('nombres', nombres)
        if (apellidos) setValue('apellidos', apellidos)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: MiembroSchema) {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('miembros').insert({
        user_id: userId,
        ...data,
        rol:    'Miembro Oficial',
        estado: 'Activo',
      })
      if (error) throw error

      // Marcar onboarding como completado en los metadatos del usuario
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      })

      toast.success('¡Bienvenido a Fuente de Verdad!')
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el perfil'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">

        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl px-5 py-3 shadow-sm mb-4">
            <Image src="/logo.webp" alt="Fuente de Verdad" width={130} height={65} className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Completa tu perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estos datos te registran como Miembro Oficial de la iglesia.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-5">

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombres">Nombres <span className="text-destructive">*</span></Label>
              <Input id="nombres" placeholder="Ej. Juan Carlos" {...register('nombres')} />
              {errors.nombres && <p className="text-xs text-destructive">{errors.nombres.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellidos">Apellidos <span className="text-destructive">*</span></Label>
              <Input id="apellidos" placeholder="Ej. García López" {...register('apellidos')} />
              {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos.message}</p>}
            </div>
          </div>

          {/* Fecha de nacimiento */}
          <div className="space-y-1.5">
            <Label htmlFor="fecha_nacimiento">Fecha de nacimiento <span className="text-destructive">*</span></Label>
            <Input id="fecha_nacimiento" type="date" {...register('fecha_nacimiento')} />
            {errors.fecha_nacimiento && <p className="text-xs text-destructive">{errors.fecha_nacimiento.message}</p>}
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección <span className="text-destructive">*</span></Label>
            <Input id="direccion" placeholder="Ej. Calle 10 # 43A - 25" {...register('direccion')} />
            {errors.direccion && <p className="text-xs text-destructive">{errors.direccion.message}</p>}
          </div>

          {/* Barrio y Municipio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="barrio">Barrio <span className="text-destructive">*</span></Label>
              <Input id="barrio" placeholder="Ej. El Poblado" {...register('barrio')} />
              {errors.barrio && <p className="text-xs text-destructive">{errors.barrio.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="municipio">Municipio <span className="text-destructive">*</span></Label>
              <Input id="municipio" placeholder="Medellín" {...register('municipio')} />
              {errors.municipio && <p className="text-xs text-destructive">{errors.municipio.message}</p>}
            </div>
          </div>

          {/* Celular */}
          <div className="space-y-1.5">
            <Label htmlFor="celular">Celular <span className="text-destructive">*</span></Label>
            <Input id="celular" type="tel" placeholder="Ej. 3001234567" {...register('celular')} />
            {errors.celular && <p className="text-xs text-destructive">{errors.celular.message}</p>}
          </div>

          {/* Correo — solo lectura, viene del login con Google */}
          <div className="space-y-1.5">
            <Label htmlFor="correo">Correo electrónico</Label>
            <Input
              id="correo"
              type="email"
              readOnly
              value={userEmail}
              className="bg-muted cursor-not-allowed text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Tomado automáticamente de tu cuenta Google.</p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Guardando…
              </>
            ) : (
              'Completar registro como Miembro Oficial'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          CRM v2.0 · INTECH Solution
        </p>
      </div>
    </div>
  )
}
