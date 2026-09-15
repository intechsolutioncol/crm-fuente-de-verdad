import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Ministerio } from '@/types'

export default async function MinisteriosPage() {
  const supabase = createAdminClient()
  const { data: ministerios } = await supabase
    .from('ministerios')
    .select('*')
    .eq('activo', true)
    .order('orden')

  const lideresIds = (ministerios ?? [])
    .map(m => m.lider_id)
    .filter((id): id is string => !!id)

  const { data: lideres } = lideresIds.length
    ? await supabase.from('miembros').select('id, nombres, apellidos').in('id', lideresIds)
    : { data: [] as { id: string; nombres: string; apellidos: string }[] }

  function nombreLider(liderId: string | null) {
    const l = lideres?.find(x => x.id === liderId)
    return l ? `${l.nombres} ${l.apellidos}` : null
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto py-10">
        <div className="text-center mb-10">
          <div className="inline-block mb-4 bg-white rounded-2xl px-5 py-3 shadow-sm">
            <Image src="/logo.webp" alt="Iglesia Apostólica Fuente de Verdad" width={140} height={70} className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Ministerios</h1>
          <p className="text-sm text-muted-foreground mt-1">Iglesia Apostólica Fuente de Verdad · Poblado, Medellín</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {((ministerios ?? []) as Ministerio[]).map(m => (
            <Link
              key={m.id}
              href={`/ministerios/${m.slug}`}
              className="block bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary hover:shadow-md transition-all"
            >
              <h2 className="text-lg font-bold text-foreground">Ministerio {m.nombre}</h2>
              {m.descripcion && <p className="text-sm text-muted-foreground mt-1">{m.descripcion}</p>}
              {nombreLider(m.lider_id) && (
                <p className="text-xs text-muted-foreground mt-3">Líder: {nombreLider(m.lider_id)}</p>
              )}
            </Link>
          ))}
          {(ministerios ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center col-span-2 py-10">
              Aún no hay ministerios publicados.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
