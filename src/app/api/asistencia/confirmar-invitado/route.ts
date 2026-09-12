import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hoyColombia } from '@/lib/utils/fecha-servidor'
import { OPCIONES_COMO_SE_ENTERO } from '@/types'

async function registrarAsistencia(supabase: ReturnType<typeof createAdminClient>, visitanteId: string) {
  const { error } = await supabase
    .from('asistencia')
    .insert({ visitante_id: visitanteId, fecha: hoyColombia(), metodo: 'qr' })

  if (error) {
    // Violacion del unique(visitante_id, fecha) -> ya habia confirmado hoy
    if (error.code === '23505') return { yaConfirmado: true }
    throw error
  }
  return { yaConfirmado: false }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    // Modo "visitante recordado": ya existe, solo se agrega la fila de hoy.
    if (typeof body.visitante_id === 'string') {
      const { data: visitante, error: fetchError } = await supabase
        .from('visitantes')
        .select('id, nombres, apellidos')
        .eq('id', body.visitante_id)
        .single()

      if (fetchError || !visitante) {
        return NextResponse.json({ error: 'Visitante no encontrado' }, { status: 404 })
      }

      const resultado = await registrarAsistencia(supabase, visitante.id)
      return NextResponse.json({ ...resultado, visitante_id: visitante.id, nombres: visitante.nombres, apellidos: visitante.apellidos })
    }

    // Modo "visitante nuevo": crea el registro y confirma en el mismo paso.
    const nombres = typeof body.nombres === 'string' ? body.nombres.trim() : ''
    const apellidos = typeof body.apellidos === 'string' ? body.apellidos.trim() : ''
    const celular = typeof body.celular === 'string' && body.celular.trim() ? body.celular.trim() : null
    const referidoPor = typeof body.referido_por === 'string' && body.referido_por.trim() ? body.referido_por.trim() : null
    const comoSeEnteroOtro = typeof body.como_se_entero_otro === 'string' && body.como_se_entero_otro.trim() ? body.como_se_entero_otro.trim() : null
    const comoSeEntero = OPCIONES_COMO_SE_ENTERO.includes(body.como_se_entero) ? body.como_se_entero : 'Otro'

    if (nombres.length < 2) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const { data: visitante, error: insertError } = await supabase
      .from('visitantes')
      .insert({
        nombres,
        apellidos,
        celular,
        referido_por: referidoPor,
        como_se_entero: comoSeEntero,
        como_se_entero_otro: comoSeEnteroOtro,
        primera_visita: hoyColombia(),
      })
      .select('id, nombres, apellidos')
      .single()

    if (insertError || !visitante) {
      return NextResponse.json({ error: 'No se pudo registrar el visitante' }, { status: 500 })
    }

    const resultado = await registrarAsistencia(supabase, visitante.id)
    return NextResponse.json({ ...resultado, visitante_id: visitante.id, nombres: visitante.nombres, apellidos: visitante.apellidos })
  } catch {
    return NextResponse.json({ error: 'No se pudo confirmar la asistencia' }, { status: 500 })
  }
}
