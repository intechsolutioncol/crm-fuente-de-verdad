import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { AsistenciaReportes } from '@/components/asistencia/AsistenciaReportes'
import type { Asistencia, Miembro } from '@/types'

export default async function AsistenciaPage() {
  const supabase = await createClient()

  const { data: nivel } = await supabase.rpc('mi_permiso', { p_modulo: 'asistencia' })

  if (nivel !== 'lector' && nivel !== 'editor') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <AccesoDenegado />
      </div>
    )
  }

  const desde = new Date()
  desde.setDate(desde.getDate() - 90)
  const desdeISO = desde.toISOString().slice(0, 10)

  const [{ data: miembros }, { data: asistencia }] = await Promise.all([
    supabase.from('miembros').select('id, nombres, apellidos').order('nombres'),
    supabase.from('asistencia').select('*').gte('fecha', desdeISO).order('fecha', { ascending: false }),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Asistencia</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Confirmaciones de los últimos 90 días · check-in por QR</p>
      </div>

      <AsistenciaReportes
        miembros={(miembros ?? []) as Pick<Miembro, 'id' | 'nombres' | 'apellidos'>[]}
        asistencia={(asistencia ?? []) as Asistencia[]}
      />
    </div>
  )
}
