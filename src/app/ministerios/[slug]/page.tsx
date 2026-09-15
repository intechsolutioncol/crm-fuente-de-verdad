import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFechaLarga } from '@/lib/utils/format'
import type { Ministerio, PublicacionMinisterio } from '@/types'

const BUCKET = 'publicaciones-ministerios'
const LARGO_EXTRACTO = 220

function extracto(texto: string) {
  if (texto.length <= LARGO_EXTRACTO) return texto
  return texto.slice(0, LARGO_EXTRACTO).trimEnd() + '…'
}

export default async function MinisterioBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: ministerio } = await supabase
    .from('ministerios')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (!ministerio) notFound()
  const m = ministerio as Ministerio

  const { data: publicaciones } = await supabase
    .from('publicaciones_ministerio')
    .select('*')
    .eq('ministerio_id', m.id)
    .order('created_at', { ascending: false })

  function urlImagen(path: string) {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-10">
        <Link href="/ministerios" className="text-xs font-semibold text-primary hover:underline">
          ← Todos los ministerios
        </Link>

        <div className="text-center my-8">
          <div className="inline-block mb-4 bg-white rounded-2xl px-5 py-3 shadow-sm">
            <Image src="/logo.webp" alt="Iglesia Apostólica Fuente de Verdad" width={120} height={60} className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Ministerio {m.nombre}</h1>
          {m.descripcion && <p className="text-sm text-muted-foreground mt-1">{m.descripcion}</p>}
        </div>

        <div className="space-y-6">
          {((publicaciones ?? []) as PublicacionMinisterio[]).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">
              Todavía no hay publicaciones en este ministerio.
            </p>
          ) : ((publicaciones ?? []) as PublicacionMinisterio[]).map(p => (
            <Link
              key={p.id}
              href={`/ministerios/${slug}/${p.id}`}
              className="block bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
            >
              {p.imagen_path && (
                <div className="relative w-full aspect-video bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlImagen(p.imagen_path)} alt={p.titulo} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <p className="text-xs text-muted-foreground mb-1 capitalize">{formatFechaLarga(p.created_at.slice(0, 10))}</p>
                <h2 className="text-lg font-bold text-foreground mb-2">{p.titulo}</h2>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{extracto(p.contenido)}</p>
                <span className="inline-block mt-3 text-xs font-semibold text-primary">Leer más →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
