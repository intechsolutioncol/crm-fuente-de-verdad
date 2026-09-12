-- ================================================================
-- Migración: ingresos y egresos en Finanzas (gastos: arriendo, etc.)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Dirección del movimiento (default 'ingreso' — todas las filas
--    existentes hoy son aportes recibidos, quedan consistentes sin
--    backfill manual)
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.finanzas
  add column if not exists tipo_movimiento text not null default 'ingreso';

alter table fuente_verdad.finanzas
  drop constraint if exists finanzas_tipo_movimiento_valido;
alter table fuente_verdad.finanzas
  add constraint finanzas_tipo_movimiento_valido
  check (tipo_movimiento in ('ingreso', 'egreso'));

-- ────────────────────────────────────────────────────────────────
-- 2. La columna `tipo` (ya existente) pasa a ser la categoría; el
--    set válido depende de la dirección del movimiento.
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.finanzas
  drop constraint if exists finanzas_tipo_valido;
alter table fuente_verdad.finanzas
  add constraint finanzas_tipo_valido check (
    (tipo_movimiento = 'ingreso' and tipo in ('Diezmo', 'Ofrenda', 'Donación'))
    or
    (tipo_movimiento = 'egreso' and tipo in (
      'Arriendo', 'Servicios Públicos', 'Mantenimiento',
      'Honorarios y Pastoral', 'Eventos y Logística', 'Otro'
    ))
  );

create index if not exists idx_finanzas_tipo_movimiento
  on fuente_verdad.finanzas (tipo_movimiento);

-- No se toca RLS: las políticas de finanzas ya usan mi_permiso('finanzas'),
-- que cubre ingresos y egresos por igual (mismo permiso Editor/Lector).

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select tipo_movimiento, tipo, count(*) from fuente_verdad.finanzas group by 1, 2;
