'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { aporteSchema } from '@/lib/validations/finanzas'

type AporteSchema = z.infer<typeof aporteSchema>
import { createClient } from '@/lib/supabase/client'
import { todayISO } from '@/lib/utils/format'
import type { Aporte } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface AporteFormProps {
  aporte?: Aporte | null
  userEmail: string
  onSuccess: () => void
  onCancel: () => void
}

export function AporteForm({ aporte, userEmail, onSuccess, onCancel }: AporteFormProps) {
  const isEditing = !!aporte

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(aporteSchema),
    defaultValues: {
      fecha: aporte?.fecha ?? todayISO(),
      nombre: aporte?.nombre ?? '',
      tipo: aporte?.tipo ?? undefined,
      metodo_pago: aporte?.metodo_pago ?? undefined,
      monto: aporte ? String(aporte.monto) : '',
      observaciones: aporte?.observaciones ?? '',
    },
  })

  async function onSubmit(data: z.infer<typeof aporteSchema>) {
    const supabase = createClient()

    const payload = {
      fecha: data.fecha,
      nombre: data.nombre.trim(),
      tipo: data.tipo,
      metodo_pago: data.metodo_pago,
      monto: Number(data.monto),
      observaciones: (data.observaciones ?? '').trim(),
      user_email: userEmail,
    }

    if (isEditing) {
      const { error } = await supabase
        .from('finanzas')
        .update(payload)
        .eq('id', aporte!.id)

      if (error) {
        toast.error('Error al actualizar el aporte: ' + error.message)
        return
      }
      toast.success('Aporte actualizado correctamente')
    } else {
      const { error } = await supabase.from('finanzas').insert(payload)
      if (error) {
        toast.error('Error al registrar el aporte: ' + error.message)
        return
      }
      toast.success('Aporte registrado correctamente')
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

      <div className="grid grid-cols-2 gap-4">
        {/* Fecha */}
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha *</Label>
          <Input id="fecha" type="date" {...register('fecha')} className={errors.fecha ? 'border-destructive' : ''} />
          {errors.fecha && <p className="text-xs text-destructive">{errors.fecha.message}</p>}
        </div>

        {/* Monto */}
        <div className="space-y-1.5">
          <Label htmlFor="monto">Monto (COP) *</Label>
          <Input
            id="monto"
            type="number"
            min="1"
            step="1000"
            placeholder="0"
            {...register('monto')}
            className={errors.monto ? 'border-destructive' : ''}
          />
          {errors.monto && <p className="text-xs text-destructive">{errors.monto.message}</p>}
        </div>
      </div>

      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre del aportante *</Label>
        <Input
          id="nombre"
          placeholder="Nombre completo..."
          {...register('nombre')}
          className={errors.nombre ? 'border-destructive' : ''}
        />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tipo */}
        <div className="space-y-1.5">
          <Label>Tipo de aporte *</Label>
          <Select
            value={watch('tipo')}
            onValueChange={v => setValue('tipo', v as z.infer<typeof aporteSchema>['tipo'], { shouldValidate: true })}
          >
            <SelectTrigger className={errors.tipo ? 'border-destructive' : ''}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Diezmo">Diezmo</SelectItem>
              <SelectItem value="Ofrenda">Ofrenda</SelectItem>
              <SelectItem value="Donación">Donación especial</SelectItem>
            </SelectContent>
          </Select>
          {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
        </div>

        {/* Método de pago */}
        <div className="space-y-1.5">
          <Label>Método de pago *</Label>
          <Select
            value={watch('metodo_pago')}
            onValueChange={v => setValue('metodo_pago', v as z.infer<typeof aporteSchema>['metodo_pago'], { shouldValidate: true })}
          >
            <SelectTrigger className={errors.metodo_pago ? 'border-destructive' : ''}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Efectivo">Efectivo</SelectItem>
              <SelectItem value="Transferencia">Transferencia</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          {errors.metodo_pago && <p className="text-xs text-destructive">{errors.metodo_pago.message}</p>}
        </div>
      </div>

      {/* Observaciones */}
      <div className="space-y-1.5">
        <Label htmlFor="obs">Observaciones</Label>
        <Textarea
          id="obs"
          rows={3}
          placeholder="Notas adicionales (opcional)..."
          {...register('observaciones')}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          )}
          {isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
