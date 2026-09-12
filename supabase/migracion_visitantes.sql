-- ================================================================
-- Migración: check-in de visitantes (invitados que no están en el
-- sistema) en el módulo Asistencia
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Tabla de visitantes
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.visitantes (
  id                  uuid primary key default gen_random_uuid(),
  nombres             text not null,
  apellidos           text not null default '',
  celular             text,
  referido_por        text,
  como_se_entero      text not null default 'Otro'
    check (como_se_entero in ('Invitado por un miembro', 'Redes sociales', 'Buscando en internet', 'Pasaba por el lugar', 'Otro')),
  como_se_entero_otro text,
  primera_visita      date not null,
  created_at          timestamptz not null default now()
);

alter table fuente_verdad.visitantes enable row level security;

drop policy if exists "visitantes_select" on fuente_verdad.visitantes;
create policy "visitantes_select"
  on fuente_verdad.visitantes for select
  to authenticated
  using (fuente_verdad.mi_permiso('asistencia') in ('lector', 'editor'));

-- Sin política de insert/update para authenticated: los visitantes se
-- crean únicamente desde el Route Handler público (cliente admin),
-- igual que hoy con asistencia.

-- ────────────────────────────────────────────────────────────────
-- 2. asistencia pasa a ser polimórfica: una fila es de un miembro
--    O de un visitante, nunca ambos ni ninguno.
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.asistencia alter column miembro_id drop not null;

alter table fuente_verdad.asistencia add column if not exists visitante_id uuid
  references fuente_verdad.visitantes(id) on delete cascade;

alter table fuente_verdad.asistencia drop constraint if exists asistencia_persona_check;
alter table fuente_verdad.asistencia add constraint asistencia_persona_check check (
  (miembro_id is not null and visitante_id is null) or
  (miembro_id is null and visitante_id is not null)
);

alter table fuente_verdad.asistencia drop constraint if exists asistencia_visitante_fecha_key;
alter table fuente_verdad.asistencia add constraint asistencia_visitante_fecha_key
  unique (visitante_id, fecha);

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select conname from pg_constraint where conrelid = 'fuente_verdad.asistencia'::regclass;
-- select * from fuente_verdad.visitantes order by primera_visita desc;
