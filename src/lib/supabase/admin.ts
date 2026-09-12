import { createClient } from '@supabase/supabase-js'

// Usa la service role key — bypasea RLS. SOLO se importa desde
// Route Handlers (código de servidor); nunca se empaqueta hacia el
// navegador. Se usa para el check-in público por QR (sin login),
// que no puede pasar por las políticas RLS `to authenticated`.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'fuente_verdad' },
      auth: { persistSession: false },
    }
  )
}
