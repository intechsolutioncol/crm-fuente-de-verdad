import { createClient } from '@/lib/supabase/client'

const BUCKET = 'comprobantes-finanzas'

export async function subirComprobante(file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error
  return path
}

// Bucket privado: no hay URL pública, se pide una firmada de corta vida.
export async function urlComprobante(path: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60)
  if (error) return null
  return data.signedUrl
}
