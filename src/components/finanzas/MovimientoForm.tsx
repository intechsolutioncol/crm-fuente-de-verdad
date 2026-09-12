'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { movimientoSchema } from '@/lib/validations/finanzas'
import { createClient } from '@/lib/supabase/client'
import { todayISO } from '@/lib/utils/format'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO } from '@/types'
import type { Movimiento, TipoMovimiento } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type MovimientoSchema = z.infer<typeof movimientoSchema>

interface MovimientoFormProps {
  movimiento?: Movimiento | null
  tipoMovimientoInicial?: TipoMovimiento
  userEmail: string
  onSuccess: () => void
  onCancel: () => void
}

export function MovimientoForm({ movimiento, tipoMovimientoInicial, userEmail, onSuccess, onCancel }: MovimientoFormProps) {
  const isEditing = !!movimiento

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      fecha: movimiento?.fecha ?? todayISO(),
      nombre: movimiento?.nombre ?? '',
      tipo_movimiento: movimiento?.tipo_movimiento ?? tipoMovimientoInicial ?? 'ingreso',
      tipo: movimiento?.tipo ?? '',
      metodo_pago: movimiento?.metodo_pago ?? undefined,
      monto: movimiento ? String(movimiento.monto) : '',
      observaciones: movimiento?.observaciones ?? '',
    },
  })

  const tipoMovimiento = watch('tipo_movimiento')
  const esIngreso = tipoMovimiento === 'ingreso'
  const categorias = esIngreso ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO

  function cambiarDireccion(nuevo: TipoMovimiento) {
    setValue('tipo_movimiento', nuevo)
    setValue('tipo', '', { shouldValidate: true })
  }

  async function onSubmit(data: MovimientoSchema) {
    const supabase = createClient()

    const payload = {
      fecha: data.fecha,
      nombre: data.nombre.trim(),
      tipo_movimiento: data.tipo_movimiento,
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
        .eq('id', movimiento!.id)

      if (error) {
        toast.error('Error al actualizar el movimiento: ' + error.message)
        return
      }
      toast.success('Movimiento actualizado correctamente')
    } else {
      const { error } = await supabase.from('finanzas').insert(payload)
      if (error) {
        toast.error('Error al registrar el movimiento: ' + error.message)
        return
      }
      toast.success(esIngreso ? 'Ingreso registrado correctamente' : 'Gasto registrado correctamente')
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

      {/* Dirección del movimiento */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => cambiarDireccion('ingreso')}
          className={cn(
            'py-2 rounded-md text-sm font-semibold transition-all',
            esIngreso ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Ingreso
        </button>
        <button
          type="button"
          onClick={() => cambiarDireccion('egreso')}
          className={cn(
            'py-2 rounded-md text-sm font-semibold transition-all',
            !esIngreso ? 'bg-card text-destructive shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Egreso
        </button>
      </div>

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

      {/* Nombre / concepto */}
      <div className="space-y-1.5">
        <Label htmlFor="nombre">{esIngreso ? 'Nombre del aportante *' : 'Pagado a / Concepto *'}</Label>
        <Input
          id="nombre"
          placeholder={esIngreso ? 'Nombre completo...' : 'Ej. Arrendador, proveedor...'}
          {...register('nombre')}
          className={errors.nombre ? 'border-destructive' : ''}
        />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Categoría */}
        <div className="space-y-1.5">
          <Label>Categoría *</Label>
          <Select
            value={watch('tipo')}
            onValueChange={v => v && setValue('tipo', v, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.tipo ? 'border-destructive' : ''}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
        </div>

        {/* Método de pago */}
        <div className="space-y-1.5">
          <Label>Método de pago *</Label>
          <Select
            value={watch('metodo_pago')}
            onValueChange={v => v && setValue('metodo_pago', v as MovimientoSchema['metodo_pago'], { shouldValidate: true })}
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
