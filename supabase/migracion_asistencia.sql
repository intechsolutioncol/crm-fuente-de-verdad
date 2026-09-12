-- ================================================================
-- Migración: módulo Asistencia (check-in por QR sin login)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Tabla de asistencia — una confirmación por miembro por día
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.asistencia (
  id         uuid primary key default gen_random_uuid(),
  miembro_id uuid not null references fuente_verdad.miembros(id) on delete cascade,
  fecha      date not null,
  hora       timestamptz not null default now(),
  metodo     text not null default 'qr' check (metodo in ('qr', 'manual')),
  created_at timestamptz not null default now(),

  unique (miembro_id, fecha)
);

create index if not exists idx_asistencia_fecha
  on fuente_verdad.asistencia (fecha desc);
create index if not exists idx_asistencia_miembro
  on fuente_verdad.asistencia (miembro_id);

-- ────────────────────────────────────────────────────────────────
-- 2. RLS — gobierna el uso DENTRO del CRM (ver reportes). El
--    check-in público no pasa por aquí: usa el cliente admin
--    (service role) desde los Route Handlers de /api/asistencia,
--    que bypasean RLS a propósito para no exponer las tablas al
--    rol anon.
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.asistencia enable row level security;

drop policy if exists "asistencia_select" on fuente_verdad.asistencia;
drop policy if exists "asistencia_insert" on fuente_verdad.asistencia;
drop policy if exists "asistencia_delete" on fuente_verdad.asistencia;

create policy "asistencia_select"
  on fuente_verdad.asistencia for select
  to authenticated
  using (fuente_verdad.mi_permiso('asistencia') in ('lector', 'editor'));

create policy "asistencia_insert"
  on fuente_verdad.asistencia for insert
  to authenticated
  with check (fuente_verdad.mi_permiso('asistencia') = 'editor');

create policy "asistencia_delete"
  on fuente_verdad.asistencia for delete
  to authenticated
  using (fuente_verdad.mi_permiso('asistencia') = 'editor');

-- ────────────────────────────────────────────────────────────────
-- 3. Asistencia se suma como módulo al sistema de permisos ya
--    existente. Roles no-administrador arrancan en "lector" (mismo
--    default que Miembros/Finanzas) hasta que se ajuste desde
--    Configuración → Permisos por módulo.
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.permisos drop constraint if exists permisos_modulo_check;
alter table fuente_verdad.permisos add constraint permisos_modulo_check
  check (modulo in ('miembros', 'finanzas', 'asistencia'));

insert into fuente_verdad.permisos (rol, modulo, nivel)
select rol, 'asistencia', 'lector'
from unnest(array['Miembro Oficial', 'Diácono', 'Líder', 'Pastor']) as rol
on conflict (rol, modulo) do nothing;

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select * from fuente_verdad.permisos where modulo = 'asistencia';
-- select conname from pg_constraint where conrelid = 'fuente_verdad.permisos'::regclass;
