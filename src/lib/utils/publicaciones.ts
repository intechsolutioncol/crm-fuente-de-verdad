import { createClient } from '@/lib/supabase/client'

const BUCKET = 'publicaciones-ministerios'

export async function subirImagenPublicacion(ministerioId: string, file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${ministerioId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error
  return path
}

// Bucket público: la URL es estable, no necesita firmarse.
export function urlImagenPublicacion(path: string): string {
  const supabase = createClient()
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
