import { createClient } from '@/lib/supabase/server'
import { generarCSV, generarXLSX, generarPDF, nombreArchivo, contentType, type ReporteExportData } from '@/lib/reportes/export'
import { getCentroMandoData, toExportCentroMando } from '@/lib/reportes/centro-mando'
import { getMiembrosData, toExportMiembros } from '@/lib/reportes/miembros'
import { getAsistenciaData, toExportAsistencia, DIAS_VENTANA_ALERTA } from '@/lib/reportes/asistencia'
import { getMinisteriosData, toExportMinisterios } from '@/lib/reportes/ministerios'

const MODULOS = ['centro', 'miembros', 'asistencia', 'ministerios'] as const
const FORMATOS = ['csv', 'xlsx', 'pdf'] as const

type Modulo = (typeof MODULOS)[number]
type Formato = (typeof FORMATOS)[number]

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

function haceNDias(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: esAdmin } = await supabase.rpc('es_administrador')
  if (!esAdmin) {
    return Response.json({ error: 'Solo el Administrador puede exportar reportes.' }, { status: 403 })
  }

  const url = new URL(request.url)
  const modulo = url.searchParams.get('modulo') as Modulo | null
  const formato = url.searchParams.get('formato') as Formato | null

  if (!modulo || !MODULOS.includes(modulo)) {
    return Response.json({ error: 'Módulo inválido' }, { status: 400 })
  }
  if (!formato || !FORMATOS.includes(formato)) {
    return Response.json({ error: 'Formato inválido' }, { status: 400 })
  }

  let data: ReporteExportData

  if (modulo === 'centro') {
    const anio = Number(url.searchParams.get('anio')) || new Date().getFullYear()
    const mes = Number(url.searchParams.get('mes')) || new Date().getMonth() + 1
    data = toExportCentroMando(await getCentroMandoData(supabase, { anio, mes }))
  } else if (modulo === 'miembros') {
    const meses = Number(url.searchParams.get('meses')) || 12
    data = toExportMiembros(await getMiembrosData(supabase, { meses }))
  } else if (modulo === 'asistencia') {
    const desde = url.searchParams.get('desde') || haceNDias(DIAS_VENTANA_ALERTA)
    const hasta = url.searchParams.get('hasta') || hoyISO()
    data = toExportAsistencia(await getAsistenciaData(supabase, { desde, hasta }))
  } else {
    const desde = url.searchParams.get('desde') || '2000-01-01'
    const hasta = url.searchParams.get('hasta') || hoyISO()
    data = toExportMinisterios(await getMinisteriosData(supabase, { desde, hasta }))
  }

  let body: BodyInit
  if (formato === 'csv') {
    body = generarCSV(data)
  } else if (formato === 'xlsx') {
    body = new Uint8Array(await generarXLSX(data))
  } else {
    body = new Uint8Array(await generarPDF(data))
  }

  return new Response(body, {
    headers: {
      'Content-Type': contentType(formato),
      'Content-Disposition': `attachment; filename="${nombreArchivo(modulo, formato)}"`,
    },
  })
}
