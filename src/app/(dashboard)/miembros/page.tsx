import { createClient } from '@/lib/supabase/server'
import type { Miembro } from '@/types'

function formatFecha(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function calcEdad(fechaNacimiento: string) {
  const [y, m, d] = fechaNacimiento.split('-').map(Number)
  const hoy = new Date()
  let edad  = hoy.getFullYear() - y
  const mesActual = hoy.getMonth() + 1
  if (mesActual < m || (mesActual === m && hoy.getDate() < d)) edad--
  return edad
}

const ROL_COLOR: Record<string, string> = {
  'Miembro Oficial': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Líder':           'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Pastor':          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Administrador':   'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const ESTADO_COLOR: Record<string, string> = {
  'Activo':   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Inactivo': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Visitante':'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default async function MiembrosPage() {
  const supabase = await createClient()

  const { data: miembros } = await supabase
    .from('miembros')
    .select('*')
    .order('created_at', { ascending: false })

  const lista = (miembros ?? []) as Miembro[]

  const totalActivos   = lista.filter(m => m.estado === 'Activo').length
  const totalInactivos = lista.filter(m => m.estado === 'Inactivo').length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Miembros</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Registro oficial de la congregación</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total miembros', value: lista.length },
          { label: 'Activos',        value: totalActivos  },
          { label: 'Inactivos',      value: totalInactivos},
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {lista.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-sm">Aún no hay miembros registrados.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Los miembros aparecen aquí al completar su perfil al iniciar sesión con Google.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Nombre', 'Correo', 'Celular', 'Barrio', 'Edad', 'Rol', 'Estado', 'Registro'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lista.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {m.nombres} {m.apellidos}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.correo}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.celular}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.barrio}</td>
                    <td className="px-4 py-3 text-muted-foreground text-center">
                      {calcEdad(m.fecha_nacimiento)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROL_COLOR[m.rol] ?? ''}`}>
                        {m.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[m.estado] ?? ''}`}>
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatFecha(m.created_at.slice(0, 10))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
