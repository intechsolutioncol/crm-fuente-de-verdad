import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Ministerio } from '@/types'

export default async function MisMinisteriosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: miembro } = user
    ? await supabase.from('miembros').select('id, rol').eq('user_id', user.id).single()
    : { data: null }

  const { data: ministerios } = await supabase.from('ministerios').select('*').order('orden')
  const lideresIds = (ministerios ?? []).map(m => m.lider_id).filter((id): id is string => !!id)
  const { data: lideres } = lideresIds.length
    ? await supabase.from('miembros').select('id, nombres, apellidos').in('id', lideresIds)
    : { data: [] as { id: string; nombres: string; apellidos: string }[] }

  const esAdmin = miembro?.rol === 'Administrador'

  function nombreLider(liderId: string | null) {
    const l = lideres?.find(x => x.id === liderId)
    return l ? `${l.nombres} ${l.apellidos}` : 'Sin asignar'
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ministerios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ella, Él, FreshInk, Kids — blogs públicos de cada ministerio</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {((ministerios ?? []) as Ministerio[]).map(m => {
          const esLider = esAdmin || (miembro && m.lider_id === miembro.id)
          return (
            <div key={m.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-foreground">Ministerio {m.nombre}</h2>
                {!m.activo && (
                  <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactivo</span>
                )}
              </div>
              {m.descripcion && <p className="text-sm text-muted-foreground mt-1">{m.descripcion}</p>}
              <p className="text-xs text-muted-foreground mt-3">Líder: {nombreLider(m.lider_id)}</p>

              <div className="flex gap-3 mt-4">
                <Link href={`/ministerios/${m.slug}`} target="_blank" className="text-xs font-semibold text-primary hover:underline">
                  Ver blog público →
                </Link>
                {esLider && (
                  <Link href={`/mis-ministerios/${m.id}`} className="text-xs font-semibold text-primary hover:underline">
                    Gestionar publicaciones →
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
