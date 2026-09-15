-- ================================================================
-- Migración: categorías de finanzas actualizadas + método de pago
-- configurable (Fase 1 de los ajustes acordados con el equipo)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Categorías de ingreso: Diezmos, Ofrendas, Votos, Primicias
--    (Donación queda desactivada, no se borra: preserva el histórico)
-- ────────────────────────────────────────────────────────────────
update fuente_verdad.categorias_finanzas
  set nombre = 'Diezmos'
  where tipo_movimiento = 'ingreso' and nombre = 'Diezmo';

update fuente_verdad.categorias_finanzas
  set nombre = 'Ofrendas'
  where tipo_movimiento = 'ingreso' and nombre = 'Ofrenda';

update fuente_verdad.categorias_finanzas
  set activo = false
  where tipo_movimiento = 'ingreso' and nombre = 'Donación';

insert into fuente_verdad.categorias_finanzas (tipo_movimiento, nombre, orden) values
  ('ingreso', 'Votos', 4),
  ('ingreso', 'Primicias', 5)
on conflict (tipo_movimiento, nombre) do nothing;

-- ────────────────────────────────────────────────────────────────
-- 2. Nueva categoría de egreso "Diezmos de Diezmos"
--    (sin automatización todavía — se define más adelante)
-- ────────────────────────────────────────────────────────────────
insert into fuente_verdad.categorias_finanzas (tipo_movimiento, nombre, orden) values
  ('egreso', 'Diezmos de Diezmos', 7)
on conflict (tipo_movimiento, nombre) do nothing;

-- ────────────────────────────────────────────────────────────────
-- 3. Método de pago configurable (reemplaza el check fijo por una
--    tabla + FK, mismo patrón que categorías_finanzas)
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.metodos_pago (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  activo     boolean not null default true,
  orden      int not null default 0,
  created_at timestamptz not null default now()
);

-- Transferencia y Otro quedan inactivos (no se ofrecen en el
-- formulario), pero existen para no romper el histórico real.
insert into fuente_verdad.metodos_pago (nombre, activo, orden) values
  ('Bold', true, 1),
  ('Efectivo', true, 2),
  ('Transferencia', false, 3),
  ('Otro', false, 4)
on conflict (nombre) do nothing;

alter table fuente_verdad.metodos_pago enable row level security;

drop policy if exists "metodos_pago_select" on fuente_verdad.metodos_pago;
drop policy if exists "metodos_pago_insert" on fuente_verdad.metodos_pago;
drop policy if exists "metodos_pago_update" on fuente_verdad.metodos_pago;

create policy "metodos_pago_select"
  on fuente_verdad.metodos_pago for select
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') in ('lector', 'editor'));

create policy "metodos_pago_insert"
  on fuente_verdad.metodos_pago for insert
  to authenticated
  with check (fuente_verdad.es_administrador());

create policy "metodos_pago_update"
  on fuente_verdad.metodos_pago for update
  to authenticated
  using (fuente_verdad.es_administrador())
  with check (fuente_verdad.es_administrador());

-- Reemplaza el check constraint hardcodeado por una FK dinámica
-- (mismo mecanismo que finanzas_tipo_fk para categorías)
alter table fuente_verdad.finanzas drop constraint if exists finanzas_metodo_valido;
alter table fuente_verdad.finanzas drop constraint if exists finanzas_metodo_fk;
alter table fuente_verdad.finanzas add constraint finanzas_metodo_fk
  foreign key (metodo_pago) references fuente_verdad.metodos_pago (nombre)
  on update cascade;

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select tipo_movimiento, nombre, activo, orden from fuente_verdad.categorias_finanzas order by 1, 4;
-- select * from fuente_verdad.metodos_pago order by orden;
-- select id, tipo, metodo_pago from fuente_verdad.finanzas;
