import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { PublicacionesManager } from '@/components/ministerios/PublicacionesManager'
import type { Ministerio, PublicacionMinisterio } from '@/types'

export default async function GestionMinisterioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ministerio } = await supabase.from('ministerios').select('*').eq('id', id).single()

  if (!ministerio) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <AccesoDenegado mensaje="Ese ministerio no existe." />
      </div>
    )
  }

  const { data: puede } = await supabase.rpc('puede_gestionar_ministerio', { p_ministerio_id: id })

  if (!puede) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <AccesoDenegado mensaje="Solo el líder de este ministerio (o el Administrador) puede gestionar sus publicaciones." />
      </div>
    )
  }

  const [{ data: publicaciones }, { data: { user } }] = await Promise.all([
    supabase.from('publicaciones_ministerio').select('*').eq('ministerio_id', id).order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  const { data: miembro } = user
    ? await supabase.from('miembros').select('id').eq('user_id', user.id).single()
    : { data: null }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ministerio {(ministerio as Ministerio).nombre}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Publicaciones del blog público</p>
      </div>

      <PublicacionesManager
        ministerioId={id}
        miembroId={miembro?.id ?? ''}
        publicacionesIniciales={(publicaciones ?? []) as PublicacionMinisterio[]}
      />
    </div>
  )
}
