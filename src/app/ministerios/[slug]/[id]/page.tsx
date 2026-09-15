import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFechaLarga } from '@/lib/utils/format'
import type { Ministerio, PublicacionMinisterio } from '@/types'

const BUCKET = 'publicaciones-ministerios'

export default async function PublicacionDetallePage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const supabase = createAdminClient()

  const { data: ministerio } = await supabase
    .from('ministerios')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (!ministerio) notFound()
  const m = ministerio as Ministerio

  const { data: publicacion } = await supabase
    .from('publicaciones_ministerio')
    .select('*')
    .eq('id', id)
    .eq('ministerio_id', m.id)
    .single()

  if (!publicacion) notFound()
  const p = publicacion as PublicacionMinisterio

  await supabase.rpc('incrementar_vista_publicacion', { p_publicacion_id: p.id })

  function urlImagen(path: string) {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-10">
        <Link href={`/ministerios/${slug}`} className="text-xs font-semibold text-primary hover:underline">
          ← Ministerio {m.nombre}
        </Link>

        <div className="text-center my-8">
          <div className="inline-block mb-4 bg-white rounded-2xl px-5 py-3 shadow-sm">
            <Image src="/logo.webp" alt="Iglesia Apostólica Fuente de Verdad" width={120} height={60} className="object-contain" priority />
          </div>
        </div>

        <article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {p.imagen_path && (
            <div className="relative w-full aspect-video bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlImagen(p.imagen_path)} alt={p.titulo} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <p className="text-xs text-muted-foreground mb-1 capitalize">{formatFechaLarga(p.created_at.slice(0, 10))}</p>
            <h1 className="text-xl font-bold text-foreground mb-3">{p.titulo}</h1>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{p.contenido}</p>
          </div>
        </article>
      </div>
    </div>
  )
}
