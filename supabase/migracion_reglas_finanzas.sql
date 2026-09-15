-- ================================================================
-- Migración: ventana de 48 horas para registrar movimientos
-- (Fase 2 de los ajustes acordados con el equipo de finanzas)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Configuración de Finanzas — fila única, activable/desactivable
--    desde Configuración → Módulo Finanzas
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.configuracion_finanzas (
  id                    int primary key default 1 check (id = 1),
  exigir_registro_48h   boolean not null default false
);

insert into fuente_verdad.configuracion_finanzas (id)
values (1)
on conflict (id) do nothing;

alter table fuente_verdad.configuracion_finanzas enable row level security;

drop policy if exists "configuracion_finanzas_select" on fuente_verdad.configuracion_finanzas;
drop policy if exists "configuracion_finanzas_update" on fuente_verdad.configuracion_finanzas;

create policy "configuracion_finanzas_select"
  on fuente_verdad.configuracion_finanzas for select
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') in ('lector', 'editor'));

create policy "configuracion_finanzas_update"
  on fuente_verdad.configuracion_finanzas for update
  to authenticated
  using (fuente_verdad.es_administrador())
  with check (fuente_verdad.es_administrador());

-- ────────────────────────────────────────────────────────────────
-- 2. Ventana de registro: un movimiento nuevo (insert) solo se
--    acepta si "hoy" (hora Colombia) es a más tardar 2 días
--    calendario después de la fecha del movimiento — ej. domingo
--    se puede registrar hasta el martes a las 11:59pm.
--
--    Solo aplica a INSERT (nunca bloquea editar un registro ya
--    guardado), solo cuando exigir_registro_48h = true, y
--    Administrador siempre queda exento.
-- ────────────────────────────────────────────────────────────────
drop policy if exists "finanzas_insert" on fuente_verdad.finanzas;

create policy "finanzas_insert"
  on fuente_verdad.finanzas for insert
  to authenticated
  with check (
    fuente_verdad.mi_permiso('finanzas') = 'editor'
    and (
      fuente_verdad.es_administrador()
      or not coalesce(
        (select exigir_registro_48h from fuente_verdad.configuracion_finanzas where id = 1),
        false
      )
      or (now() at time zone 'America/Bogota')::date <= (fecha + 2)
    )
  );

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select * from fuente_verdad.configuracion_finanzas;
