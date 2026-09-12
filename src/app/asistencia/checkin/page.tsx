'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { formatFechaLarga, todayISO } from '@/lib/utils/format'
import { OPCIONES_COMO_SE_ENTERO } from '@/types'
import type { ComoSeEntero } from '@/types'

type TipoPersona = 'miembro' | 'visitante'

interface Persona {
  tipo: TipoPersona
  id: string
  nombres: string
  apellidos: string
}

type Estado =
  | { paso: 'cargando' }
  | { paso: 'recordado'; persona: Persona }
  | { paso: 'buscando'; aviso?: string }
  | { paso: 'formularioInvitado' }
  | { paso: 'confirmando'; nombre: string }
  | { paso: 'confirmado'; nombre: string; yaConfirmado: boolean }

const STORAGE_KEY = 'fv_asistencia_recordado'

function leerRecordado(): Persona | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function guardarRecordado(p: Persona) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // localStorage no disponible (modo privado, etc.) — no es crítico
  }
}

function olvidarRecordado() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignorar
  }
}

function nombreCompletoDe(p: Persona): string {
  return `${p.nombres} ${p.apellidos}`.trim()
}

export default function AsistenciaCheckinPage() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Persona[]>([])
  const [buscando, setBuscando] = useState(false)
  const [estado, setEstado] = useState<Estado>({ paso: 'cargando' })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Al cargar: si este celular ya confirmó antes, saltamos directo al paso "recordado"
  useEffect(() => {
    const recordado = leerRecordado()
    setEstado(recordado ? { paso: 'recordado', persona: recordado } : { paso: 'buscando' })
  }, [])

  useEffect(() => {
    if (estado.paso !== 'buscando') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResultados([])
      return
    }
    setBuscando(true)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/asistencia/buscar?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      const miembros: Persona[] = (data.resultados ?? []).map((m: { id: string; nombres: string; apellidos: string }) => ({ tipo: 'miembro' as const, ...m }))
      setResultados(miembros)
      setBuscando(false)
    }, 350)
  }, [query, estado.paso])

  async function confirmar(persona: Persona) {
    const nombreCompleto = nombreCompletoDe(persona)
    setEstado({ paso: 'confirmando', nombre: nombreCompleto })

    try {
      const url = persona.tipo === 'miembro' ? '/api/asistencia/confirmar' : '/api/asistencia/confirmar-invitado'
      const payload = persona.tipo === 'miembro' ? { miembro_id: persona.id } : { visitante_id: persona.id }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('confirmar falló')
      const data = await res.json()

      guardarRecordado(persona) // este celular recuerda quién confirmó, para la próxima vez
      setEstado({ paso: 'confirmado', nombre: nombreCompleto, yaConfirmado: !!data.yaConfirmado })
    } catch {
      olvidarRecordado()
      setEstado({ paso: 'buscando', aviso: 'No pudimos confirmar automáticamente. Busca tu nombre para intentar de nuevo.' })
    }
  }

  async function confirmarInvitadoNuevo(datos: {
    nombres: string; apellidos: string; celular: string
    comoSeEntero: ComoSeEntero; referidoPor: string; comoSeEnteroOtro: string
  }) {
    setEstado({ paso: 'confirmando', nombre: datos.nombres })

    try {
      const res = await fetch('/api/asistencia/confirmar-invitado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          celular: datos.celular || undefined,
          referido_por: datos.referidoPor || undefined,
          como_se_entero: datos.comoSeEntero,
          como_se_entero_otro: datos.comoSeEnteroOtro || undefined,
        }),
      })
      if (!res.ok) throw new Error('confirmar-invitado falló')
      const data = await res.json()

      const persona: Persona = { tipo: 'visitante', id: data.visitante_id, nombres: data.nombres, apellidos: data.apellidos }
      guardarRecordado(persona)
      setEstado({ paso: 'confirmado', nombre: `${data.nombres} ${data.apellidos}`.trim(), yaConfirmado: !!data.yaConfirmado })
    } catch {
      setEstado({ paso: 'buscando', aviso: 'No pudimos registrar tu visita. Intenta de nuevo.' })
    }
  }

  function noSoyYo() {
    olvidarRecordado()
    setEstado({ paso: 'buscando' })
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
          {estado.paso === 'cargando' && (
            <div className="py-6 flex justify-center">
              <span className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {estado.paso === 'recordado' && (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                {estado.persona.nombres.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">
                ¿Eres {nombreCompletoDe(estado.persona)}?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Toca confirmar para registrar tu asistencia de hoy.
              </p>
              <Button className="w-full mb-3" size="lg" onClick={() => confirmar(estado.persona)}>
                Sí, confirmar mi asistencia
              </Button>
              <button onClick={noSoyYo} className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline">
                No soy yo
              </button>
            </div>
          )}

          {estado.paso === 'confirmado' && (
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
          )}

          {(estado.paso === 'buscando' || estado.paso === 'confirmando') && (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">Confirma tu asistencia</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Escribe tu nombre para registrarte.
              </p>

              {estado.paso === 'buscando' && estado.aviso && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">{estado.aviso}</p>
              )}

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
                  <div className="text-center py-2 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      No encontramos a nadie con ese nombre.
                    </p>
                    <button
                      onClick={() => setEstado({ paso: 'formularioInvitado' })}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      ¿Es tu primera vez? Regístrate como visitante
                    </button>
                  </div>
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

          {estado.paso === 'formularioInvitado' && (
            <FormularioInvitado onConfirmar={confirmarInvitadoNuevo} onCancelar={() => setEstado({ paso: 'buscando' })} />
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Iglesia Apostólica Fuente de Verdad
        </p>
      </div>
    </div>
  )
}

interface FormularioInvitadoProps {
  onConfirmar: (datos: {
    nombres: string; apellidos: string; celular: string
    comoSeEntero: ComoSeEntero; referidoPor: string; comoSeEnteroOtro: string
  }) => void
  onCancelar: () => void
}

function FormularioInvitado({ onConfirmar, onCancelar }: FormularioInvitadoProps) {
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [celular, setCelular] = useState('')
  const [comoSeEntero, setComoSeEntero] = useState<ComoSeEntero>('Invitado por un miembro')
  const [referidoPor, setReferidoPor] = useState('')
  const [comoSeEnteroOtro, setComoSeEnteroOtro] = useState('')

  const puedeEnviar = nombres.trim().length >= 2

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">¡Bienvenido! Cuéntanos de ti</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Solo tu nombre es obligatorio — lo demás es opcional.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="v-nombres">Nombres *</Label>
            <Input id="v-nombres" value={nombres} onChange={e => setNombres(e.target.value)} placeholder="Tu nombre" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-apellidos">Apellidos</Label>
            <Input id="v-apellidos" value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="Tus apellidos" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="v-celular">Celular (opcional)</Label>
          <Input id="v-celular" type="tel" value={celular} onChange={e => setCelular(e.target.value)} placeholder="300 000 0000" />
        </div>

        <div className="space-y-2">
          <Label>¿Cómo llegaste a la iglesia? (opcional)</Label>
          <RadioGroup
            value={comoSeEntero}
            onValueChange={v => v && setComoSeEntero(v as ComoSeEntero)}
            className="flex-col items-start gap-2"
          >
            {OPCIONES_COMO_SE_ENTERO.map(op => (
              <RadioGroupItem key={op} value={op}>{op}</RadioGroupItem>
            ))}
          </RadioGroup>

          {comoSeEntero === 'Invitado por un miembro' && (
            <Input
              value={referidoPor}
              onChange={e => setReferidoPor(e.target.value)}
              placeholder="¿Quién te invitó?"
              className="mt-2"
            />
          )}
          {comoSeEntero === 'Otro' && (
            <Input
              value={comoSeEnteroOtro}
              onChange={e => setComoSeEnteroOtro(e.target.value)}
              placeholder="Cuéntanos cómo llegaste"
              className="mt-2"
            />
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancelar}>Volver</Button>
        <Button
          type="button"
          disabled={!puedeEnviar}
          onClick={() => onConfirmar({ nombres: nombres.trim(), apellidos: apellidos.trim(), celular: celular.trim(), comoSeEntero, referidoPor: referidoPor.trim(), comoSeEnteroOtro: comoSeEnteroOtro.trim() })}
        >
          Confirmar mi asistencia
        </Button>
      </div>
    </div>
  )
}
