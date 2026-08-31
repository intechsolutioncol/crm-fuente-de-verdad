-- ================================================================
-- CRM · Fuente de Verdad — Schema PostgreSQL (Supabase)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
--   (proyecto compartido "intech solution" — este script vive en su
--    propio schema `fuente_verdad`, aislado de `public`)
--
-- Después de correr este script, en el Dashboard:
--   Project Settings > API > Exposed schemas → agregar "fuente_verdad"
--   (si no, PostgREST no expone estas tablas y supabase-js fallará)
--
-- NOTA: esta es la versión "instalación nueva". Si ya tienes datos
-- corriendo con una versión anterior de este schema, usa las
-- migraciones en supabase/migracion_*.sql en vez de re-correr esto.
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- SCHEMA + PERMISOS
-- ────────────────────────────────────────────────────────────────
create schema if not exists fuente_verdad;

grant usage on schema fuente_verdad to anon, authenticated, service_role;

alter default privileges in schema fuente_verdad
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema fuente_verdad
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema fuente_verdad
  grant all on routines to anon, authenticated, service_role;

-- Extensión para búsquedas ILIKE eficientes (usado en filtro por nombre)
-- Se instala a nivel de base de datos, no por schema — no requiere cambios.
create extension if not exists pg_trgm;

-- ────────────────────────────────────────────────────────────────
-- TRIGGER updated_at (compartido por las tablas de este schema)
-- ────────────────────────────────────────────────────────────────
create or replace function fuente_verdad.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ================================================================
-- MÓDULO MIEMBROS
-- (se crea antes que finanzas porque finanzas depende de mi_permiso())
-- ================================================================
create table if not exists fuente_verdad.miembros (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  nombres          text not null,
  apellidos        text not null,
  fecha_nacimiento date not null,
  pais             text not null default 'Colombia',
  departamento     text,                          -- Departamento (Colombia) o ciudad (exterior)
  municipio        text,                          -- Nullable: solo aplica para Colombia
  barrio           text,                          -- Nullable: solo aplica para Colombia
  direccion        text not null,
  celular          text not null,
  correo           text not null,
  rol              text not null default 'Miembro Oficial',
  estado           text not null default 'Activo',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (user_id),
  unique (correo),

  constraint miembros_nombres_min   check (char_length(nombres) >= 2),
  constraint miembros_apellidos_min check (char_length(apellidos) >= 2),
  constraint miembros_rol_valido    check (rol in ('Miembro Oficial', 'Diácono', 'Líder', 'Pastor', 'Administrador')),
  constraint miembros_estado_valido check (estado in ('Activo', 'Inactivo', 'Visitante'))
);

drop trigger if exists trg_miembros_updated_at on fuente_verdad.miembros;
create trigger trg_miembros_updated_at
  before update on fuente_verdad.miembros
  for each row execute function fuente_verdad.set_updated_at();

create index if not exists idx_miembros_user_id on fuente_verdad.miembros (user_id);
create index if not exists idx_miembros_estado  on fuente_verdad.miembros (estado);

alter table fuente_verdad.miembros enable row level security;

-- ────────────────────────────────────────────────────────────────
-- GUARDIA EN LA PUERTA
--
-- auth.users es compartido por TODO el proyecto de Supabase (todas
-- las apps que vivan ahí). "authenticated" por sí solo NO significa
-- "es miembro de la iglesia" — solo significa que tiene sesión en
-- ALGUNA app del proyecto. is_miembro() verifica que además tenga
-- fila propia en fuente_verdad.miembros.
--
-- security definer + search_path fijo evita el problema de RLS
-- recursiva (la función consulta miembros sin volver a disparar
-- la política que la usa). Ver: Supabase docs "Recursive RLS policies".
-- ────────────────────────────────────────────────────────────────
create or replace function fuente_verdad.is_miembro()
returns boolean
language sql
security definer
set search_path = fuente_verdad
stable
as $$
  select exists (
    select 1 from fuente_verdad.miembros where user_id = auth.uid()
  );
$$;

-- ================================================================
-- PERMISOS POR ROL Y MÓDULO
--
-- Cada rol no-administrador tiene un nivel ('ninguno' | 'lector' |
-- 'editor') por módulo ('miembros' | 'finanzas'), configurable desde
-- la pantalla /configuracion. Administrador siempre tiene acceso
-- total y no tiene filas aquí — se resuelve en código.
-- ================================================================
create table if not exists fuente_verdad.permisos (
  rol    text not null,
  modulo text not null check (modulo in ('miembros', 'finanzas')),
  nivel  text not null default 'lector' check (nivel in ('ninguno', 'lector', 'editor')),

  primary key (rol, modulo),
  constraint permisos_rol_valido check (rol in ('Miembro Oficial', 'Diácono', 'Líder', 'Pastor'))
);

-- Semilla: todos los roles no-administrador arrancan en "lector"
insert into fuente_verdad.permisos (rol, modulo, nivel)
select rol, modulo, 'lector'
from unnest(array['Miembro Oficial', 'Diácono', 'Líder', 'Pastor']) as rol
cross join unnest(array['miembros', 'finanzas']) as modulo
on conflict (rol, modulo) do nothing;

create or replace function fuente_verdad.es_administrador()
returns boolean
language sql
security definer
set search_path = fuente_verdad
stable
as $$
  select exists (
    select 1 from fuente_verdad.miembros
    where user_id = auth.uid() and rol = 'Administrador'
  );
$$;

-- Nivel de acceso del usuario actual a un módulo dado.
-- 'ninguno' si no es miembro; 'editor' siempre si es Administrador;
-- si no, lo que diga la tabla permisos para su rol ('ninguno' si no hay fila).
create or replace function fuente_verdad.mi_permiso(p_modulo text)
returns text
language sql
security definer
set search_path = fuente_verdad
stable
as $$
  select case
    when not fuente_verdad.is_miembro() then 'ninguno'
    when fuente_verdad.es_administrador() then 'editor'
    else coalesce(
      (select p.nivel
         from fuente_verdad.permisos p
         join fuente_verdad.miembros m on m.rol = p.rol
        where m.user_id = auth.uid() and p.modulo = p_modulo),
      'ninguno')
  end;
$$;

alter table fuente_verdad.permisos enable row level security;

drop policy if exists "permisos_select" on fuente_verdad.permisos;
drop policy if exists "permisos_write" on fuente_verdad.permisos;

-- Solo Administrador lee/escribe la tabla de permisos (mi_permiso()
-- la sigue leyendo para todos, porque corre security definer)
create policy "permisos_select"
  on fuente_verdad.permisos for select
  to authenticated
  using (fuente_verdad.es_administrador());

create policy "permisos_write"
  on fuente_verdad.permisos for all
  to authenticated
  using (fuente_verdad.es_administrador())
  with check (fuente_verdad.es_administrador());

-- ────────────────────────────────────────────────────────────────
-- RLS · MIEMBROS
-- ────────────────────────────────────────────────────────────────
drop policy if exists "miembros_select" on fuente_verdad.miembros;
drop policy if exists "miembros_insert" on fuente_verdad.miembros;
drop policy if exists "miembros_update" on fuente_verdad.miembros;

-- Lectura: requiere permiso 'lector' o 'editor' en el módulo miembros
-- (Administrador siempre pasa por el bypass de mi_permiso())
create policy "miembros_select"
  on fuente_verdad.miembros for select
  to authenticated
  using (fuente_verdad.mi_permiso('miembros') in ('lector', 'editor'));

-- Inserción: bootstrap — un usuario nuevo aún no tiene rol asignado,
-- por eso esta política NO usa mi_permiso(), solo valida que
-- se esté creando su propio perfil (correo/OAuth ya lo autentica)
create policy "miembros_insert"
  on fuente_verdad.miembros for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Actualización: cualquiera edita su propio perfil; solo Administrador
-- edita (o reasigna el rol de) el perfil de otros miembros
create policy "miembros_update"
  on fuente_verdad.miembros for update
  to authenticated
  using (auth.uid() = user_id or fuente_verdad.es_administrador())
  with check (auth.uid() = user_id or fuente_verdad.es_administrador());

-- ================================================================
-- MÓDULO FINANZAS
-- ================================================================
create table if not exists fuente_verdad.finanzas (
  id            uuid primary key default gen_random_uuid(),
  fecha         date        not null,
  nombre        text        not null,
  tipo          text        not null,
  metodo_pago   text        not null,
  monto         numeric(14, 0) not null,
  observaciones text        not null default '',
  user_email    text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint finanzas_nombre_min     check (char_length(nombre) >= 2),
  constraint finanzas_tipo_valido    check (tipo        in ('Diezmo', 'Ofrenda', 'Donación')),
  constraint finanzas_metodo_valido  check (metodo_pago in ('Efectivo', 'Transferencia', 'Otro')),
  constraint finanzas_monto_positivo check (monto > 0)
);

-- ────────────────────────────────────────────────────────────────
-- ÍNDICES
-- ────────────────────────────────────────────────────────────────
create index if not exists idx_finanzas_fecha
  on fuente_verdad.finanzas (fecha desc);

create index if not exists idx_finanzas_tipo
  on fuente_verdad.finanzas (tipo);

-- Índice trigrama: acelera búsquedas ILIKE '%texto%' sobre nombre
create index if not exists idx_finanzas_nombre_trgm
  on fuente_verdad.finanzas using gin (nombre gin_trgm_ops);

create index if not exists idx_finanzas_user_email
  on fuente_verdad.finanzas (user_email);

-- ────────────────────────────────────────────────────────────────
-- TRIGGER updated_at
-- ────────────────────────────────────────────────────────────────
drop trigger if exists trg_finanzas_updated_at on fuente_verdad.finanzas;

create trigger trg_finanzas_updated_at
  before update on fuente_verdad.finanzas
  for each row execute function fuente_verdad.set_updated_at();

-- ────────────────────────────────────────────────────────────────
-- RLS · FINANZAS
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.finanzas enable row level security;

drop policy if exists "finanzas_select" on fuente_verdad.finanzas;
drop policy if exists "finanzas_insert" on fuente_verdad.finanzas;
drop policy if exists "finanzas_update" on fuente_verdad.finanzas;
drop policy if exists "finanzas_delete" on fuente_verdad.finanzas;

-- Lectura: requiere permiso 'lector' o 'editor' en el módulo finanzas
create policy "finanzas_select"
  on fuente_verdad.finanzas for select
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') in ('lector', 'editor'));

-- Escritura: requiere permiso 'editor' en el módulo finanzas
create policy "finanzas_insert"
  on fuente_verdad.finanzas for insert
  to authenticated
  with check (fuente_verdad.mi_permiso('finanzas') = 'editor');

create policy "finanzas_update"
  on fuente_verdad.finanzas for update
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') = 'editor');

create policy "finanzas_delete"
  on fuente_verdad.finanzas for delete
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') = 'editor');

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecuta estas líneas por separado si quieres)
-- ────────────────────────────────────────────────────────────────
-- select tablename, rowsecurity from pg_tables where schemaname = 'fuente_verdad';
-- select policyname, cmd, qual from pg_policies where schemaname = 'fuente_verdad';
-- select indexname from pg_indexes where schemaname = 'fuente_verdad';
-- select * from fuente_verdad.permisos order by rol, modulo;
