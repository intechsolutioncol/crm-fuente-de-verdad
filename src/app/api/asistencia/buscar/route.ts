import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (q.length < 2) {
    return NextResponse.json({ resultados: [] })
  }

  const supabase = createAdminClient()

  // Solo campos publicos minimos: nunca correo/celular/direccion/rol.
  const { data, error } = await supabase
    .from('miembros')
    .select('id, nombres, apellidos')
    .eq('estado', 'Activo')
    .or(`nombres.ilike.%${q}%,apellidos.ilike.%${q}%`)
    .limit(8)

  if (error) {
    return NextResponse.json({ error: 'No se pudo buscar' }, { status: 500 })
  }

  return NextResponse.json({ resultados: data ?? [] })
}
