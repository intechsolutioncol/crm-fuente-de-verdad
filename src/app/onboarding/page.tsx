'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { miembroSchema, type MiembroSchema } from '@/lib/validations/miembros'
import { PAISES, DEPARTAMENTOS, MUNICIPIOS, BARRIOS } from '@/lib/geo/colombia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MiembroSchema>({
    resolver: zodResolver(miembroSchema),
    defaultValues: { pais: 'Colombia', departamento: '', municipio: '', barrio: '' },
  })

  const pais         = watch('pais')
  const departamento = watch('departamento')
  const municipio    = watch('municipio')

  // Listas derivadas del estado actual
  const esCol       = pais === 'Colombia'
  const municipios  = esCol && departamento ? (MUNICIPIOS[departamento] ?? []) : []
  const barrios     = municipio ? (BARRIOS[municipio] ?? []) : []

  // Refs para detectar cambios y hacer reset en cascada
  const prevPais  = useRef(pais)
  const prevDepto = useRef(departamento)
  const prevMuni  = useRef(municipio)

  useEffect(() => {
    if (prevPais.current !== pais) {
      setValue('departamento', '')
      setValue('municipio', '')
      setValue('barrio', '')
      prevPais.current = pais
    }
  }, [pais, setValue])

  useEffect(() => {
    if (prevDepto.current !== departamento) {
      setValue('municipio', '')
      setValue('barrio', '')
      prevDepto.current = departamento
    }
  }, [departamento, setValue])

  useEffect(() => {
    if (prevMuni.current !== municipio) {
      setValue('barrio', '')
      prevMuni.current = municipio
    }
  }, [municipio, setValue])

  // Cargar datos del usuario logueado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const email = user.email ?? ''
      setUserEmail(email)
      setValue('correo', email)
      const fullName: string = user.user_metadata?.full_name ?? ''
      if (fullName) {
        const parts    = fullName.trim().split(' ')
        const mid      = Math.ceil(parts.length / 2)
        const nombres  = parts.slice(0, mid).join(' ')
        const apellidos = parts.slice(mid).join(' ')
        if (nombres)    setValue('nombres', nombres)
        if (apellidos)  setValue('apellidos', apellidos)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: MiembroSchema) {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('miembros').insert({
        user_id:         userId,
        nombres:         data.nombres,
        apellidos:       data.apellidos,
        fecha_nacimiento: data.fecha_nacimiento,
        pais:            data.pais,
        departamento:    data.departamento || null,
        municipio:       data.municipio    || null,
        barrio:          data.barrio       || null,
        direccion:       data.direccion,
        celular:         data.celular,
        correo:          data.correo,
        rol:             'Miembro Oficial',
        estado:          'Activo',
      })
      if (error) throw error

      await supabase.auth.updateUser({ data: { onboarding_completed: true } })
      toast.success('¡Bienvenido a Fuente de Verdad!')
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el perfil')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper para renderizar campo de selección con datalist (búsqueda nativa)
  function GeoInput({
    id, label, placeholder, listId, options, fieldName, disabled = false,
  }: {
    id: string; label: string; placeholder: string; listId: string
    options: string[]; fieldName: keyof MiembroSchema; disabled?: boolean
  }) {
    const err = errors[fieldName]
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label} {esCol && <span className="text-destructive">*</span>}</Label>
        <Input
          id={id}
          list={listId}
          placeholder={disabled ? '— selecciona antes —' : placeholder}
          disabled={disabled}
          autoComplete="off"
          {...register(fieldName)}
          className={err ? 'border-destructive' : ''}
        />
        <datalist id={listId}>
          {options.map(o => <option key={o} value={o} />)}
        </datalist>
        {err && <p className="text-xs text-destructive">{err.message as string}</p>}
      </div>
    )
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

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-5">

          {/* ── Datos personales ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombres">Nombres <span className="text-destructive">*</span></Label>
              <Input id="nombres" placeholder="Ej. Juan Carlos" {...register('nombres')} className={errors.nombres ? 'border-destructive' : ''} />
              {errors.nombres && <p className="text-xs text-destructive">{errors.nombres.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellidos">Apellidos <span className="text-destructive">*</span></Label>
              <Input id="apellidos" placeholder="Ej. García López" {...register('apellidos')} className={errors.apellidos ? 'border-destructive' : ''} />
              {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fecha_nacimiento">Fecha de nacimiento <span className="text-destructive">*</span></Label>
            <Input id="fecha_nacimiento" type="date" {...register('fecha_nacimiento')} className={errors.fecha_nacimiento ? 'border-destructive' : ''} />
            {errors.fecha_nacimiento && <p className="text-xs text-destructive">{errors.fecha_nacimiento.message}</p>}
          </div>

          {/* ── Ubicación ── */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Lugar de residencia</p>

            {/* País */}
            <div className="space-y-1.5 mb-4">
              <Label>País <span className="text-destructive">*</span></Label>
              <Select
                value={pais}
                onValueChange={v => setValue('pais', v, { shouldValidate: true })}
              >
                <SelectTrigger className={`w-full ${errors.pais ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent>
                  {PAISES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.pais && <p className="text-xs text-destructive">{errors.pais.message}</p>}
            </div>

            {/* Si es Colombia → selects en cascada */}
            {esCol ? (
              <div className="space-y-4">
                {/* Departamento */}
                <div className="space-y-1.5">
                  <Label>Departamento <span className="text-destructive">*</span></Label>
                  <Select
                    value={departamento ?? ''}
                    onValueChange={v => setValue('departamento', v, { shouldValidate: true })}
                  >
                    <SelectTrigger className={`w-full ${errors.departamento ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Selecciona el departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTAMENTOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.departamento && <p className="text-xs text-destructive">{errors.departamento.message}</p>}
                </div>

                {/* Municipio — input con datalist (buscable) */}
                <GeoInput
                  id="municipio" label="Municipio"
                  placeholder="Escribe o selecciona..."
                  listId="list-municipios" options={municipios}
                  fieldName="municipio" disabled={!departamento}
                />

                {/* Barrio — input con datalist (buscable, permite libre) */}
                <GeoInput
                  id="barrio" label="Barrio"
                  placeholder={barrios.length ? 'Escribe o selecciona...' : 'Escribe tu barrio'}
                  listId="list-barrios" options={barrios}
                  fieldName="barrio" disabled={!municipio}
                />
              </div>
            ) : (
              /* Exterior → campo ciudad libre */
              <div className="space-y-1.5">
                <Label htmlFor="departamento">Ciudad de residencia</Label>
                <Input
                  id="departamento"
                  placeholder="Ej. Miami, Madrid, Lima..."
                  {...register('departamento')}
                />
              </div>
            )}
          </div>

          {/* ── Dirección y contacto ── */}
          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dirección y contacto</p>

            <div className="space-y-1.5">
              <Label htmlFor="direccion">Dirección <span className="text-destructive">*</span></Label>
              <Input id="direccion" placeholder="Ej. Calle 10 # 43A - 25" {...register('direccion')} className={errors.direccion ? 'border-destructive' : ''} />
              {errors.direccion && <p className="text-xs text-destructive">{errors.direccion.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="celular">Celular <span className="text-destructive">*</span></Label>
              <Input id="celular" type="tel" placeholder="Ej. 3001234567" {...register('celular')} className={errors.celular ? 'border-destructive' : ''} />
              {errors.celular && <p className="text-xs text-destructive">{errors.celular.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input id="correo" type="email" readOnly value={userEmail}
                className="bg-muted cursor-not-allowed text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Tomado de tu cuenta Google.</p>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Guardando…
              </>
            ) : 'Completar registro como Miembro Oficial'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          CRM v2.0 · INTECH Solution
        </p>
      </div>
    </div>
  )
}
