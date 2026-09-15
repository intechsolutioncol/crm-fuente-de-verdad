'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatFecha } from '@/lib/utils/format'
import { urlImagenPublicacion } from '@/lib/utils/publicaciones'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PublicacionForm } from './PublicacionForm'
import type { PublicacionMinisterio } from '@/types'

interface Props {
  ministerioId: string
  miembroId: string
  publicacionesIniciales: PublicacionMinisterio[]
}

export function PublicacionesManager({ ministerioId, miembroId, publicacionesIniciales }: Props) {
  const [publicaciones, setPublicaciones] = useState(publicacionesIniciales)
  const [modalForm, setModalForm] = useState<{ open: boolean; publicacion: PublicacionMinisterio | null }>({ open: false, publicacion: null })
  const [modalDel, setModalDel] = useState<{ open: boolean; id: string; titulo: string }>({ open: false, id: '', titulo: '' })
  const [borrando, setBorrando] = useState(false)

  async function recargar() {
    const supabase = createClient()
    const { data } = await supabase
      .from('publicaciones_ministerio')
      .select('*')
      .eq('ministerio_id', ministerioId)
      .order('created_at', { ascending: false })
    setPublicaciones((data ?? []) as PublicacionMinisterio[])
  }

  async function eliminar() {
    setBorrando(true)
    const supabase = createClient()
    const { error } = await supabase.from('publicaciones_ministerio').delete().eq('id', modalDel.id)
    setBorrando(false)
    if (error) {
      toast.error('No se pudo eliminar: ' + error.message)
      return
    }
    toast.success('Publicación eliminada')
    setModalDel({ open: false, id: '', titulo: '' })
    recargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalForm({ open: true, publicacion: null })}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva publicación
        </Button>
      </div>

      {publicaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-14 bg-card border border-border rounded-xl">
          Aún no has publicado nada. Toca &quot;Nueva publicación&quot; para empezar.
        </p>
      ) : (
        <div className="space-y-3">
          {publicaciones.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
              {p.imagen_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urlImagenPublicacion(p.imagen_path)} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{formatFecha(p.created_at.slice(0, 10))}</p>
                <h3 className="font-semibold text-foreground truncate">{p.titulo}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{p.contenido}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setModalForm({ open: true, publicacion: p })}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Editar"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => setModalDel({ open: true, id: p.id, titulo: p.titulo })}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  title="Eliminar"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Crear / Editar */}
      <Dialog open={modalForm.open} onOpenChange={open => !open && setModalForm({ open: false, publicacion: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalForm.publicacion ? 'Editar publicación' : 'Nueva publicación'}</DialogTitle>
          </DialogHeader>
          <PublicacionForm
            ministerioId={ministerioId}
            miembroId={miembroId}
            publicacion={modalForm.publicacion}
            onSuccess={() => { setModalForm({ open: false, publicacion: null }); recargar() }}
            onCancel={() => setModalForm({ open: false, publicacion: null })}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar eliminación */}
      <Dialog open={modalDel.open} onOpenChange={open => !open && setModalDel({ open: false, id: '', titulo: '' })}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-foreground mb-2">¿Eliminar esta publicación?</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Se eliminará <strong className="text-foreground">{modalDel.titulo}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setModalDel({ open: false, id: '', titulo: '' })} disabled={borrando}>Cancelar</Button>
              <Button variant="destructive" onClick={eliminar} disabled={borrando}>Eliminar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
