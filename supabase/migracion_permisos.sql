-- ================================================================
-- Migración: rol Diácono + sistema de permisos por módulo
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Ampliar el enum de rol (agregar 'Diácono')
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.miembros
  drop constraint if exists miembros_rol_valido;

alter table fuente_verdad.miembros
  add constraint miembros_rol_valido
  check (rol in ('Miembro Oficial', 'Diácono', 'Líder', 'Pastor', 'Administrador'));

-- ────────────────────────────────────────────────────────────────
-- 2. Tabla de permisos por rol y módulo
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.permisos (
  rol    text not null,
  modulo text not null check (modulo in ('miembros', 'finanzas')),
  nivel  text not null default 'lector' check (nivel in ('ninguno', 'lector', 'editor')),

  primary key (rol, modulo),
  constraint permisos_rol_valido check (rol in ('Miembro Oficial', 'Diácono', 'Líder', 'Pastor'))
);

-- Semilla: todos los roles no-administrador arrancan en "lector" en ambos
-- módulos. Administrador no tiene filas aquí — su acceso total se
-- resuelve en código (es_administrador()), no en esta tabla.
insert into fuente_verdad.permisos (rol, modulo, nivel)
select rol, modulo, 'lector'
from unnest(array['Miembro Oficial', 'Diácono', 'Líder', 'Pastor']) as rol
cross join unnest(array['miembros', 'finanzas']) as modulo
on conflict (rol, modulo) do nothing;

-- ────────────────────────────────────────────────────────────────
-- 3. Helpers de seguridad (security definer, mismo patrón que
--    is_miembro() — evitan RLS recursiva)
-- ────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────
-- 4. RLS de la tabla permisos — solo Administrador la lee/escribe
--    (mi_permiso() la sigue leyendo igual, corre security definer)
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.permisos enable row level security;

drop policy if exists "permisos_select" on fuente_verdad.permisos;
drop policy if exists "permisos_write" on fuente_verdad.permisos;

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
-- 5. Actualizar RLS de finanzas y miembros para usar mi_permiso()
--    en vez del blanket is_miembro()
-- ────────────────────────────────────────────────────────────────
drop policy if exists "finanzas_select" on fuente_verdad.finanzas;
drop policy if exists "finanzas_insert" on fuente_verdad.finanzas;
drop policy if exists "finanzas_update" on fuente_verdad.finanzas;
drop policy if exists "finanzas_delete" on fuente_verdad.finanzas;

create policy "finanzas_select"
  on fuente_verdad.finanzas for select
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') in ('lector', 'editor'));

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

drop policy if exists "miembros_select" on fuente_verdad.miembros;
drop policy if exists "miembros_update" on fuente_verdad.miembros;
-- miembros_insert NO se toca: sigue siendo el bootstrap del onboarding
-- (auth.uid() = user_id), antes de que el miembro tenga rol asignado.

create policy "miembros_select"
  on fuente_verdad.miembros for select
  to authenticated
  using (fuente_verdad.mi_permiso('miembros') in ('lector', 'editor'));

-- Cualquiera edita su propio perfil; solo Administrador edita
-- (o reasigna el rol de) el perfil de otros miembros.
create policy "miembros_update"
  on fuente_verdad.miembros for update
  to authenticated
  using (auth.uid() = user_id or fuente_verdad.es_administrador())
  with check (auth.uid() = user_id or fuente_verdad.es_administrador());

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select * from fuente_verdad.permisos order by rol, modulo;
-- select policyname, cmd, qual from pg_policies where schemaname = 'fuente_verdad';
