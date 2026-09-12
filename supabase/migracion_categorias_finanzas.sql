-- ================================================================
-- Migración: categorías de Finanzas configurables desde Configuración
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Tabla de categorías (reemplaza el set hardcodeado)
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.categorias_finanzas (
  id              uuid primary key default gen_random_uuid(),
  tipo_movimiento text not null check (tipo_movimiento in ('ingreso', 'egreso')),
  nombre          text not null,
  activo          boolean not null default true,
  orden           int not null default 0,
  created_at      timestamptz not null default now(),

  unique (tipo_movimiento, nombre)
);

-- Semilla: las categorías que hoy están hardcodeadas en el código
insert into fuente_verdad.categorias_finanzas (tipo_movimiento, nombre, orden) values
  ('ingreso', 'Diezmo', 1), ('ingreso', 'Ofrenda', 2), ('ingreso', 'Donación', 3),
  ('egreso', 'Arriendo', 1), ('egreso', 'Servicios Públicos', 2), ('egreso', 'Mantenimiento', 3),
  ('egreso', 'Honorarios y Pastoral', 4), ('egreso', 'Eventos y Logística', 5), ('egreso', 'Otro', 6)
on conflict (tipo_movimiento, nombre) do nothing;

-- ────────────────────────────────────────────────────────────────
-- 2. Reemplazar el check constraint hardcodeado por una FK dinámica.
--    Agregar una categoría nueva desde Configuración ya no requiere
--    migración ni deploy. `on update cascade`: si el admin renombra
--    una categoría, los movimientos históricos se actualizan solos.
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.finanzas drop constraint if exists finanzas_tipo_valido;

alter table fuente_verdad.finanzas
  add constraint finanzas_tipo_fk
  foreign key (tipo_movimiento, tipo)
  references fuente_verdad.categorias_finanzas (tipo_movimiento, nombre)
  on update cascade;

-- ────────────────────────────────────────────────────────────────
-- 3. RLS — leer requiere el mismo permiso de Finanzas; crear/editar
--    categorías es exclusivo de Administrador. No hay política de
--    delete: una categoría nunca se borra, solo se desactiva
--    (activo = false), para no romper el historial.
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.categorias_finanzas enable row level security;

drop policy if exists "categorias_finanzas_select" on fuente_verdad.categorias_finanzas;
drop policy if exists "categorias_finanzas_insert" on fuente_verdad.categorias_finanzas;
drop policy if exists "categorias_finanzas_update" on fuente_verdad.categorias_finanzas;

create policy "categorias_finanzas_select"
  on fuente_verdad.categorias_finanzas for select
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') in ('lector', 'editor'));

create policy "categorias_finanzas_insert"
  on fuente_verdad.categorias_finanzas for insert
  to authenticated
  with check (fuente_verdad.es_administrador());

create policy "categorias_finanzas_update"
  on fuente_verdad.categorias_finanzas for update
  to authenticated
  using (fuente_verdad.es_administrador())
  with check (fuente_verdad.es_administrador());

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select * from fuente_verdad.categorias_finanzas order by tipo_movimiento, orden;
