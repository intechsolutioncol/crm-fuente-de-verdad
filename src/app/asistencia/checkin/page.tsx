'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { formatFechaLarga, todayISO } from '@/lib/utils/format'

interface Resultado {
  id: string
  nombres: string
  apellidos: string
}

type Estado =
  | { paso: 'buscando' }
  | { paso: 'confirmando'; nombre: string }
  | { paso: 'confirmado'; nombre: string; yaConfirmado: boolean }

export default function AsistenciaCheckinPage() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [estado, setEstado] = useState<Estado>({ paso: 'buscando' })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResultados([])
      return
    }
    setBuscando(true)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/asistencia/buscar?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      setResultados(data.resultados ?? [])
      setBuscando(false)
    }, 350)
  }, [query])

  async function confirmar(m: Resultado) {
    const nombreCompleto = `${m.nombres} ${m.apellidos}`
    setEstado({ paso: 'confirmando', nombre: nombreCompleto })

    const res = await fetch('/api/asistencia/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ miembro_id: m.id }),
    })
    const data = await res.json()
    setEstado({ paso: 'confirmado', nombre: nombreCompleto, yaConfirmado: !!data.yaConfirmado })
  }

  function buscarOtro() {
    setEstado({ paso: 'buscando' })
    setQuery('')
    setResultados([])
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 bg-white rounded-2xl px-5 py-3 shadow-sm">
            <Image
              src="/logo.webp"
              alt="Iglesia Apostólica Fuente de Verdad"
              width={140}
              height={70}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm font-semibold text-foreground capitalize">{formatFechaLarga(todayISO())}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Servicio dominical · Poblado, Medellín</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {estado.paso === 'confirmado' ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">
                {estado.yaConfirmado ? `¡Ya estabas registrado, ${estado.nombre}!` : `¡Gracias, ${estado.nombre}!`}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {estado.yaConfirmado
                  ? 'Tu asistencia de hoy ya había sido confirmada.'
                  : 'Tu asistencia quedó registrada. ¡Bienvenido!'}
              </p>
              <button
                onClick={buscarOtro}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Registrar a alguien más
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">Confirma tu asistencia</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Escribe tu nombre para registrarte.
              </p>

              <Input
                autoFocus
                placeholder="Escribe tu nombre..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={estado.paso === 'confirmando'}
              />

              <div className="mt-3 space-y-1.5">
                {buscando && (
                  <p className="text-xs text-muted-foreground text-center py-2">Buscando...</p>
                )}
                {!buscando && query.trim().length >= 2 && resultados.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No encontramos a nadie con ese nombre.
                  </p>
                )}
                {resultados.map(m => (
                  <button
                    key={m.id}
                    onClick={() => confirmar(m)}
                    disabled={estado.paso === 'confirmando'}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium text-foreground disabled:opacity-50"
                  >
                    {m.nombres} {m.apellidos}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Iglesia Apostólica Fuente de Verdad
        </p>
      </div>
    </div>
  )
}
