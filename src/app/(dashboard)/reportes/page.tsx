import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { formatCOP, formatFecha } from '@/lib/utils/format'

async function getResumen() {
  const supabase = await createClient()
  const anioActual = new Date().getFullYear()
  const mesActual = String(new Date().getMonth() + 1).padStart(2, '0')

  const [
    { data: finanzasMes },
    { count: miembrosActivos },
    { data: ultimaAsistencia },
    { count: publicacionesTotal },
    { count: ministeriosActivos },
  ] = await Promise.all([
    supabase.from('finanzas').select('monto, tipo_movimiento')
      .gte('fecha', `${anioActual}-${mesActual}-01`).lte('fecha', `${anioActual}-${mesActual}-31`),
    supabase.from('miembros').select('id', { count: 'exact', head: true }).eq('estado', 'Activo'),
    supabase.from('asistencia').select('fecha').order('fecha', { ascending: false }).limit(1),
    supabase.from('publicaciones_ministerio').select('id', { count: 'exact', head: true }),
    supabase.from('ministerios').select('id', { count: 'exact', head: true }).eq('activo', true),
  ])

  const balanceMes = (finanzasMes ?? []).reduce(
    (s, r) => s + (r.tipo_movimiento === 'egreso' ? -r.monto : r.monto), 0
  )

  const fechaUltimoDomingo = ultimaAsistencia?.[0]?.fecha ?? null
  let asistenciaUltimoDomingo = 0
  if (fechaUltimoDomingo) {
    const { count } = await supabase.from('asistencia').select('id', { count: 'exact', head: true }).eq('fecha', fechaUltimoDomingo)
    asistenciaUltimoDomingo = count ?? 0
  }

  return {
    balanceMes,
    miembrosActivos: miembrosActivos ?? 0,
    fechaUltimoDomingo,
    asistenciaUltimoDomingo,
    publicacionesTotal: publicacionesTotal ?? 0,
    ministeriosActivos: ministeriosActivos ?? 0,
  }
}

const ACCESOS = [
  { label: 'Finanzas', desc: 'Dashboard, categorías y movimientos', href: '/finanzas' },
  { label: 'Miembros', desc: 'Listado y datos de la congregación', href: '/miembros' },
  { label: 'Asistencia', desc: 'Conteo por domingo y visitantes', href: '/asistencia' },
  { label: 'Ministerios', desc: 'Publicaciones por ministerio', href: '/mis-ministerios' },
]

export default async function ReportesPage() {
  const supabase = await createClient()
  const { data: esAdmin } = await supabase.rpc('es_administrador')

  if (!esAdmin) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <AccesoDenegado mensaje="Solo el Administrador puede entrar a Reportes." />
      </div>
    )
  }

  const r = await getResumen()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Un vistazo a Finanzas, Miembros, Asistencia y Ministerios</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Balance del mes</p>
          <p className={`text-2xl font-extrabold leading-none mb-1 ${r.balanceMes < 0 ? 'text-destructive' : 'text-primary'}`}>
            {formatCOP(r.balanceMes)}
          </p>
          <p className="text-xs text-muted-foreground">Finanzas · ingresos − egresos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Miembros activos</p>
          <p className="text-2xl font-extrabold text-primary leading-none mb-1">{r.miembrosActivos}</p>
          <p className="text-xs text-muted-foreground">Miembros · estado activo</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Asistencia último domingo</p>
          <p className="text-2xl font-extrabold text-primary leading-none mb-1">{r.asistenciaUltimoDomingo}</p>
          <p className="text-xs text-muted-foreground">
            {r.fechaUltimoDomingo ? `Asistencia · ${formatFecha(r.fechaUltimoDomingo)}` : 'Asistencia · sin registros aún'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Publicaciones</p>
          <p className="text-2xl font-extrabold text-primary leading-none mb-1">{r.publicacionesTotal}</p>
          <p className="text-xs text-muted-foreground">Ministerios · {r.ministeriosActivos} activos</p>
        </div>
      </div>

      {/* Accesos a cada reporte */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-bold text-foreground">Reportes por módulo</p>
          <p className="text-xs text-muted-foreground mt-0.5">Cada uno tiene su propio detalle</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACCESOS.map(a => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col gap-1 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all"
            >
              <span className="text-sm font-bold text-foreground">{a.label}</span>
              <span className="text-xs text-muted-foreground">{a.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
