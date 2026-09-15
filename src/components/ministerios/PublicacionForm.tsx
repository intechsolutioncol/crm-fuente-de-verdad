'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { subirImagenPublicacion, urlImagenPublicacion } from '@/lib/utils/publicaciones'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { PublicacionMinisterio } from '@/types'

interface Props {
  ministerioId: string
  miembroId: string
  publicacion?: PublicacionMinisterio | null
  onSuccess: () => void
  onCancel: () => void
}

export function PublicacionForm({ ministerioId, miembroId, publicacion, onSuccess, onCancel }: Props) {
  const isEditing = !!publicacion
  const [titulo, setTitulo] = useState(publicacion?.titulo ?? '')
  const [contenido, setContenido] = useState(publicacion?.contenido ?? '')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)

  const puedeGuardar = titulo.trim().length >= 2 && contenido.trim().length >= 1

  async function guardar() {
    if (!puedeGuardar) return
    setGuardando(true)
    const supabase = createClient()

    let imagenPath = publicacion?.imagen_path ?? null
    if (archivo) {
      try {
        imagenPath = await subirImagenPublicacion(ministerioId, archivo)
      } catch {
        toast.error('No se pudo subir la imagen. Intenta de nuevo.')
        setGuardando(false)
        return
      }
    }

    const payload = {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      imagen_path: imagenPath,
    }

    if (isEditing) {
      const { error } = await supabase.from('publicaciones_ministerio').update(payload).eq('id', publicacion!.id)
      setGuardando(false)
      if (error) { toast.error('No se pudo actualizar: ' + error.message); return }
      toast.success('Publicación actualizada')
    } else {
      const { error } = await supabase.from('publicaciones_ministerio').insert({
        ...payload, ministerio_id: ministerioId, autor_id: miembroId || null,
      })
      setGuardando(false)
      if (error) { toast.error('No se pudo publicar: ' + error.message); return }
      toast.success('Publicación creada')
    }

    onSuccess()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="titulo">Título *</Label>
        <Input id="titulo" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título de la noticia" autoFocus />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contenido">Contenido *</Label>
        <Textarea id="contenido" rows={6} value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Escribe la noticia..." />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="imagen">Imagen de portada (opcional)</Label>
        <Input id="imagen" type="file" accept="image/*" onChange={e => setArchivo(e.target.files?.[0] ?? null)} />
        {archivo && <p className="text-xs text-muted-foreground">Nueva imagen: {archivo.name}</p>}
        {!archivo && publicacion?.imagen_path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlImagenPublicacion(publicacion.imagen_path)} alt="" className="mt-1 h-20 rounded-md object-cover" />
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>Cancelar</Button>
        <Button type="button" onClick={guardar} disabled={!puedeGuardar || guardando}>
          {guardando ? 'Guardando...' : isEditing ? 'Actualizar' : 'Publicar'}
        </Button>
      </div>
    </div>
  )
}
