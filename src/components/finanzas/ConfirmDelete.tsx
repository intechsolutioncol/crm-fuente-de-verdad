'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ConfirmDeleteProps {
  id: string
  nombre: string
  onSuccess: () => void
  onCancel: () => void
}

export function ConfirmDelete({ id, nombre, onSuccess, onCancel }: ConfirmDeleteProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('finanzas').delete().eq('id', id)
    setLoading(false)

    if (error) {
      toast.error('Error al eliminar: ' + error.message)
      return
    }
    toast.success('Aporte eliminado correctamente')
    onSuccess()
  }

  return (
    <div className="text-center py-2">
      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
      </div>
      <h4 className="text-base font-bold text-foreground mb-2">¿Eliminar este aporte?</h4>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Se eliminará el aporte de <strong className="text-foreground">{nombre}</strong>.
        <br />Esta acción no se puede deshacer.
      </p>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? (
            <span className="w-4 h-4 border-2 border-destructive-foreground/40 border-t-destructive-foreground rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
          )}
          Eliminar
        </Button>
      </div>
    </div>
  )
}
