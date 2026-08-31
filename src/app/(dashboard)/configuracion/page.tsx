import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RolesTab } from '@/components/configuracion/RolesTab'
import { PermisosTab } from '@/components/configuracion/PermisosTab'
import type { Miembro, Permiso } from '@/types'

export default async function ConfiguracionPage() {
  const supabase = await createClient()

  const { data: esAdmin } = await supabase.rpc('es_administrador')

  if (!esAdmin) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <AccesoDenegado mensaje="Solo el Administrador puede entrar a Configuración." />
      </div>
    )
  }

  const [{ data: miembros }, { data: permisos }] = await Promise.all([
    supabase.from('miembros').select('*').order('nombres', { ascending: true }),
    supabase.from('permisos').select('*'),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Roles de miembros y permisos por módulo</p>
      </div>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Miembros y roles</TabsTrigger>
          <TabsTrigger value="permisos">Permisos por módulo</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <RolesTab miembrosIniciales={(miembros ?? []) as Miembro[]} />
        </TabsContent>

        <TabsContent value="permisos">
          <PermisosTab permisosIniciales={(permisos ?? []) as Permiso[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
