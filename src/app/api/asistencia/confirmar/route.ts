import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hoyColombia } from '@/lib/utils/fecha-servidor'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const miembroId = body?.miembro_id

  if (!miembroId || typeof miembroId !== 'string') {
    return NextResponse.json({ error: 'Falta miembro_id' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const fecha = hoyColombia()

  const { error } = await supabase
    .from('asistencia')
    .insert({ miembro_id: miembroId, fecha, metodo: 'qr' })

  if (error) {
    // Violacion del unique(miembro_id, fecha) -> ya habia confirmado hoy
    if (error.code === '23505') {
      return NextResponse.json({ yaConfirmado: true })
    }
    return NextResponse.json({ error: 'No se pudo confirmar la asistencia' }, { status: 500 })
  }

  return NextResponse.json({ yaConfirmado: false })
}
