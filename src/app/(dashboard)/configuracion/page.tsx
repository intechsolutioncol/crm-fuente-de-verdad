import { createClient } from '@/lib/supabase/server'
import { AccesoDenegado } from '@/components/layout/AccesoDenegado'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RolesTab } from '@/components/configuracion/RolesTab'
import { PermisosTab } from '@/components/configuracion/PermisosTab'
import { CategoriasFinanzasTab } from '@/components/configuracion/CategoriasFinanzasTab'
import { MetodosPagoTab } from '@/components/configuracion/MetodosPagoTab'
import { ReglasFinanzasTab } from '@/components/configuracion/ReglasFinanzasTab'
import type { Miembro, Permiso, CategoriaFinanzas, MetodoFinanzas, ConfiguracionFinanzas } from '@/types'

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

  const [{ data: miembros }, { data: permisos }, { data: categoriasFinanzas }, { data: metodosPago }, { data: configuracionFinanzas }] = await Promise.all([
    supabase.from('miembros').select('*').order('nombres', { ascending: true }),
    supabase.from('permisos').select('*'),
    supabase.from('categorias_finanzas').select('*'),
    supabase.from('metodos_pago').select('*'),
    supabase.from('configuracion_finanzas').select('*').eq('id', 1).single(),
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
          <TabsTrigger value="categorias-finanzas">Módulo Finanzas</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <RolesTab miembrosIniciales={(miembros ?? []) as Miembro[]} />
        </TabsContent>

        <TabsContent value="permisos">
          <PermisosTab permisosIniciales={(permisos ?? []) as Permiso[]} />
        </TabsContent>

        <TabsContent value="categorias-finanzas" className="space-y-8">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">Reglas de registro</h3>
            <ReglasFinanzasTab
              configuracionInicial={(configuracionFinanzas as ConfiguracionFinanzas) ?? { id: 1, exigir_registro_48h: false }}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">Categorías</h3>
            <CategoriasFinanzasTab categoriasIniciales={(categoriasFinanzas ?? []) as CategoriaFinanzas[]} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">Métodos de pago</h3>
            <MetodosPagoTab metodosIniciales={(metodosPago ?? []) as MetodoFinanzas[]} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
