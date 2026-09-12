import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function hoyColombia(): string {
  // El servidor (Vercel) corre en UTC; la fecha del check-in debe ser
  // la fecha en Colombia, no la fecha UTC (evita que domingo en la
  // noche cuente como lunes).
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  return formatter.format(new Date()) // 'en-CA' produce YYYY-MM-DD
}

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
