-- ================================================================
-- Migración: Diezmos de Diezmos — egreso automático mensual + aviso
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
--
-- IMPORTANTE: antes de correr este script, activa la extensión
-- pg_cron desde el Dashboard de Supabase → Database → Extensions
-- (algunos planes no dejan activarla vía SQL Editor). Si el
-- `create extension` de abajo falla, ve a activarla ahí primero y
-- vuelve a correr el script completo.
-- ================================================================

create extension if not exists pg_cron;

-- ────────────────────────────────────────────────────────────────
-- 1. Configuración: hora de ejecución + método de pago del egreso
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.configuracion_finanzas
  add column if not exists diezmos_diezmos_hora time not null default '23:30:00';
alter table fuente_verdad.configuracion_finanzas
  add column if not exists diezmos_diezmos_metodo_pago text references fuente_verdad.metodos_pago(nombre);

-- ────────────────────────────────────────────────────────────────
-- 2. Historial de ejecuciones — unique(anio, mes) garantiza que
--    nunca se duplique el egreso aunque el chequeo corra varias
--    veces el mismo día.
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.diezmos_diezmos_ejecuciones (
  id           uuid primary key default gen_random_uuid(),
  anio         int not null,
  mes          int not null,
  monto        numeric(14, 0) not null,
  finanzas_id  uuid references fuente_verdad.finanzas(id) on delete set null,
  ejecutado_en timestamptz not null default now(),

  unique (anio, mes)
);

alter table fuente_verdad.diezmos_diezmos_ejecuciones enable row level security;

drop policy if exists "diezmos_diezmos_ejecuciones_select" on fuente_verdad.diezmos_diezmos_ejecuciones;
create policy "diezmos_diezmos_ejecuciones_select"
  on fuente_verdad.diezmos_diezmos_ejecuciones for select
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') in ('lector', 'editor'));

-- ────────────────────────────────────────────────────────────────
-- 3. Aviso por persona — cada Editor de Finanzas tiene su propia
--    fila para marcar "ya lo vi", independiente de los demás.
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.diezmos_diezmos_notificaciones (
  id           uuid primary key default gen_random_uuid(),
  ejecucion_id uuid not null references fuente_verdad.diezmos_diezmos_ejecuciones(id) on delete cascade,
  miembro_id   uuid not null references fuente_verdad.miembros(id) on delete cascade,
  visto        boolean not null default false,
  creado_en    timestamptz not null default now(),

  unique (ejecucion_id, miembro_id)
);

alter table fuente_verdad.diezmos_diezmos_notificaciones enable row level security;

drop policy if exists "ddn_select_propia" on fuente_verdad.diezmos_diezmos_notificaciones;
drop policy if exists "ddn_update_propia" on fuente_verdad.diezmos_diezmos_notificaciones;

create policy "ddn_select_propia"
  on fuente_verdad.diezmos_diezmos_notificaciones for select
  to authenticated
  using (miembro_id = (select id from fuente_verdad.miembros where user_id = auth.uid()));

create policy "ddn_update_propia"
  on fuente_verdad.diezmos_diezmos_notificaciones for update
  to authenticated
  using (miembro_id = (select id from fuente_verdad.miembros where user_id = auth.uid()))
  with check (miembro_id = (select id from fuente_verdad.miembros where user_id = auth.uid()));

-- Realtime: para que el modal aparezca en vivo sin recargar la página
alter publication supabase_realtime add table fuente_verdad.diezmos_diezmos_notificaciones;

-- ────────────────────────────────────────────────────────────────
-- 4. Función que ejecuta el egreso — security definer, dueña de las
--    tablas, bypasea RLS igual que el resto de funciones del proyecto.
-- ────────────────────────────────────────────────────────────────
create or replace function fuente_verdad.ejecutar_diezmos_de_diezmos()
returns void
language plpgsql
security definer
set search_path = fuente_verdad
as $$
declare
  hoy date := (now() at time zone 'America/Bogota')::date;
  cfg fuente_verdad.configuracion_finanzas%rowtype;
  ultimo_dia date := (date_trunc('month', hoy) + interval '1 month - 1 day')::date;
  monto_calculado numeric(14,0);
  nueva_ejecucion_id uuid;
  nuevo_finanzas_id uuid;
begin
  select * into cfg from fuente_verdad.configuracion_finanzas where id = 1;

  if hoy != ultimo_dia then
    return;
  end if;

  if (now() at time zone 'America/Bogota')::time < cfg.diezmos_diezmos_hora then
    return;
  end if;

  monto_calculado := coalesce((
    select round(sum(monto) * 0.10)
    from fuente_verdad.finanzas
    where tipo_movimiento = 'ingreso' and tipo = 'Diezmos'
      and fecha between date_trunc('month', hoy)::date and ultimo_dia
  ), 0);

  insert into fuente_verdad.diezmos_diezmos_ejecuciones (anio, mes, monto)
  values (extract(year from hoy)::int, extract(month from hoy)::int, monto_calculado)
  on conflict (anio, mes) do nothing
  returning id into nueva_ejecucion_id;

  -- Ya se había ejecutado este mes (el chequeo de 10 min volvió a pasar) — nada más que hacer.
  if nueva_ejecucion_id is null then
    return;
  end if;

  insert into fuente_verdad.finanzas (fecha, nombre, tipo_movimiento, tipo, metodo_pago, monto, observaciones, user_email)
  values (
    hoy,
    'Diezmos de Diezmos',
    'egreso',
    'Diezmos de Diezmos',
    coalesce(cfg.diezmos_diezmos_metodo_pago, 'Transferencia'),
    monto_calculado,
    'Generado automáticamente: 10% de diezmos de ' || to_char(hoy, 'TMMonth YYYY'),
    'automatico@fuenteverdad'
  )
  returning id into nuevo_finanzas_id;

  update fuente_verdad.diezmos_diezmos_ejecuciones
  set finanzas_id = nuevo_finanzas_id
  where id = nueva_ejecucion_id;

  insert into fuente_verdad.diezmos_diezmos_notificaciones (ejecucion_id, miembro_id)
  select nueva_ejecucion_id, m.id
  from fuente_verdad.miembros m
  where m.rol = 'Administrador'
     or exists (
       select 1 from fuente_verdad.permisos p
       where p.rol = m.rol and p.modulo = 'finanzas' and p.nivel = 'editor'
     );
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 5. Programar el chequeo cada 10 minutos
-- ────────────────────────────────────────────────────────────────
select cron.unschedule(jobid) from cron.job where jobname = 'diezmos-de-diezmos';
select cron.schedule('diezmos-de-diezmos', '*/10 * * * *', 'select fuente_verdad.ejecutar_diezmos_de_diezmos();');

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select * from cron.job where jobname = 'diezmos-de-diezmos';
-- select * from fuente_verdad.configuracion_finanzas;
-- -- probar manualmente (no espera al cron ni a la hora/fecha configurada):
-- select fuente_verdad.ejecutar_diezmos_de_diezmos();
