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

-- Extensión para tareas programadas (egreso automático de Diezmos de
-- Diezmos). En algunos planes de Supabase debe activarse primero desde
-- el Dashboard → Database → Extensions; si este create extension falla,
-- actívala ahí y vuelve a correr el script.
create extension if not exists pg_cron;

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
  modulo text not null check (modulo in ('miembros', 'finanzas', 'asistencia')),
  nivel  text not null default 'lector' check (nivel in ('ninguno', 'lector', 'editor')),

  primary key (rol, modulo),
  constraint permisos_rol_valido check (rol in ('Miembro Oficial', 'Diácono', 'Líder', 'Pastor'))
);

-- Semilla: todos los roles no-administrador arrancan en "lector"
insert into fuente_verdad.permisos (rol, modulo, nivel)
select rol, modulo, 'lector'
from unnest(array['Miembro Oficial', 'Diácono', 'Líder', 'Pastor']) as rol
cross join unnest(array['miembros', 'finanzas', 'asistencia']) as modulo
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
-- CATEGORÍAS DE FINANZAS
-- Configurables desde /configuracion — agregar una categoría nueva
-- no requiere migración ni deploy. Nunca se borran (solo se
-- desactivan) para no romper el historial de movimientos.
-- ================================================================
create table if not exists fuente_verdad.categorias_finanzas (
  id              uuid primary key default gen_random_uuid(),
  tipo_movimiento text not null check (tipo_movimiento in ('ingreso', 'egreso')),
  nombre          text not null,
  activo          boolean not null default true,
  orden           int not null default 0,
  created_at      timestamptz not null default now(),

  unique (tipo_movimiento, nombre)
);

insert into fuente_verdad.categorias_finanzas (tipo_movimiento, nombre, orden) values
  ('ingreso', 'Diezmos', 1), ('ingreso', 'Ofrendas', 2), ('ingreso', 'Votos', 4), ('ingreso', 'Primicias', 5),
  ('egreso', 'Arriendo', 1), ('egreso', 'Servicios Públicos', 2), ('egreso', 'Mantenimiento', 3),
  ('egreso', 'Honorarios y Pastoral', 4), ('egreso', 'Eventos y Logística', 5), ('egreso', 'Otro', 6),
  ('egreso', 'Diezmos de Diezmos', 7)
on conflict (tipo_movimiento, nombre) do nothing;

alter table fuente_verdad.categorias_finanzas enable row level security;

drop policy if exists "categorias_finanzas_select" on fuente_verdad.categorias_finanzas;
drop policy if exists "categorias_finanzas_insert" on fuente_verdad.categorias_finanzas;
drop policy if exists "categorias_finanzas_update" on fuente_verdad.categorias_finanzas;

-- Leer requiere el mismo permiso de Finanzas (los <Select> del formulario las necesitan)
create policy "categorias_finanzas_select"
  on fuente_verdad.categorias_finanzas for select
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') in ('lector', 'editor'));

-- Crear/editar categorías es exclusivo de Administrador (sin política de delete)
create policy "categorias_finanzas_insert"
  on fuente_verdad.categorias_finanzas for insert
  to authenticated
  with check (fuente_verdad.es_administrador());

create policy "categorias_finanzas_update"
  on fuente_verdad.categorias_finanzas for update
  to authenticated
  using (fuente_verdad.es_administrador())
  with check (fuente_verdad.es_administrador());

-- ================================================================
-- MÉTODOS DE PAGO
-- Configurables desde /configuracion, mismo patrón que categorías:
-- nunca se borran (solo se desactivan) para no romper el historial.
-- ================================================================
create table if not exists fuente_verdad.metodos_pago (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  activo     boolean not null default true,
  orden      int not null default 0,
  created_at timestamptz not null default now()
);

insert into fuente_verdad.metodos_pago (nombre, activo, orden) values
  ('Bold', true, 1), ('Efectivo', true, 2)
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

-- ================================================================
-- MÓDULO FINANZAS
-- ================================================================
create table if not exists fuente_verdad.finanzas (
  id              uuid primary key default gen_random_uuid(),
  fecha           date        not null,
  nombre          text        not null,
  tipo_movimiento text        not null default 'ingreso',
  tipo            text        not null,
  metodo_pago     text        not null,
  monto           numeric(14, 0) not null,
  observaciones   text        not null default '',
  comprobante_path text,      -- ruta en el bucket privado comprobantes-finanzas (opcional)
  user_email      text        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint finanzas_nombre_min            check (char_length(nombre) >= 2),
  constraint finanzas_tipo_movimiento_valido check (tipo_movimiento in ('ingreso', 'egreso')),
  -- La categoría (`tipo`) debe existir en categorias_finanzas para esa misma
  -- dirección; on update cascade: renombrar una categoría actualiza el historial.
  constraint finanzas_tipo_fk foreign key (tipo_movimiento, tipo)
    references fuente_verdad.categorias_finanzas (tipo_movimiento, nombre)
    on update cascade,
  -- El método de pago debe existir en metodos_pago (mismo mecanismo que la categoría)
  constraint finanzas_metodo_fk foreign key (metodo_pago)
    references fuente_verdad.metodos_pago (nombre)
    on update cascade,
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

create index if not exists idx_finanzas_tipo_movimiento
  on fuente_verdad.finanzas (tipo_movimiento);

-- ────────────────────────────────────────────────────────────────
-- TRIGGER updated_at
-- ────────────────────────────────────────────────────────────────
drop trigger if exists trg_finanzas_updated_at on fuente_verdad.finanzas;

create trigger trg_finanzas_updated_at
  before update on fuente_verdad.finanzas
  for each row execute function fuente_verdad.set_updated_at();

-- ================================================================
-- CONFIGURACIÓN DE FINANZAS
-- Fila única, activable/desactivable desde Configuración → Módulo
-- Finanzas: ventana de registro de 48h, y hora/método del egreso
-- automático mensual de Diezmos de Diezmos.
-- ================================================================
create table if not exists fuente_verdad.configuracion_finanzas (
  id                          int primary key default 1 check (id = 1),
  exigir_registro_48h         boolean not null default false,
  diezmos_diezmos_hora        time not null default '23:30:00',
  diezmos_diezmos_metodo_pago text references fuente_verdad.metodos_pago(nombre)
);

insert into fuente_verdad.configuracion_finanzas (id)
values (1)
on conflict (id) do nothing;

alter table fuente_verdad.configuracion_finanzas enable row level security;

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

-- Escritura: requiere permiso 'editor'. Si exigir_registro_48h está
-- activo, un movimiento nuevo solo se acepta hasta 2 días calendario
-- después de su fecha (hora Colombia) — Administrador siempre exento.
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

create policy "finanzas_update"
  on fuente_verdad.finanzas for update
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') = 'editor');

create policy "finanzas_delete"
  on fuente_verdad.finanzas for delete
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') = 'editor');

-- ================================================================
-- VISITANTES — invitados que aún no están en `miembros`. Se crean
-- únicamente desde el check-in público (cliente admin), nunca desde
-- RLS de usuarios autenticados.
-- ================================================================
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

create policy "visitantes_select"
  on fuente_verdad.visitantes for select
  to authenticated
  using (fuente_verdad.mi_permiso('asistencia') in ('lector', 'editor'));

-- ================================================================
-- MÓDULO ASISTENCIA
-- Check-in por QR sin login: el registro público no pasa por estas
-- políticas (usa el cliente admin desde /api/asistencia). Estas RLS
-- gobiernan el uso dentro del CRM (ver reportes).
--
-- Una fila es de un miembro O de un visitante, nunca ambos ni ninguno
-- (asistencia_persona_check).
-- ================================================================
create table if not exists fuente_verdad.asistencia (
  id           uuid primary key default gen_random_uuid(),
  miembro_id   uuid references fuente_verdad.miembros(id) on delete cascade,
  visitante_id uuid references fuente_verdad.visitantes(id) on delete cascade,
  fecha        date not null,
  hora         timestamptz not null default now(),
  metodo       text not null default 'qr' check (metodo in ('qr', 'manual')),
  created_at   timestamptz not null default now(),

  unique (miembro_id, fecha),
  unique (visitante_id, fecha),
  constraint asistencia_persona_check check (
    (miembro_id is not null and visitante_id is null) or
    (miembro_id is null and visitante_id is not null)
  )
);

create index if not exists idx_asistencia_fecha
  on fuente_verdad.asistencia (fecha desc);
create index if not exists idx_asistencia_miembro
  on fuente_verdad.asistencia (miembro_id);

alter table fuente_verdad.asistencia enable row level security;

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

-- ================================================================
-- COMPROBANTES DE FINANZAS (Storage)
-- Bucket privado — las imágenes se sirven con signed URLs de corta
-- vida, no con un link público permanente.
-- ================================================================
insert into storage.buckets (id, name, public)
values ('comprobantes-finanzas', 'comprobantes-finanzas', false)
on conflict (id) do nothing;

create policy "comprobantes_finanzas_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'comprobantes-finanzas'
    and fuente_verdad.mi_permiso('finanzas') = 'editor'
  );

create policy "comprobantes_finanzas_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'comprobantes-finanzas'
    and fuente_verdad.mi_permiso('finanzas') in ('lector', 'editor')
  );

create policy "comprobantes_finanzas_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'comprobantes-finanzas'
    and fuente_verdad.mi_permiso('finanzas') = 'editor'
  );

-- ================================================================
-- DIEZMOS DE DIEZMOS — egreso automático mensual
-- El último día del mes, después de la hora configurada, se crea un
-- egreso por el 10% de los diezmos ('Diezmos', ingreso) del mes en
-- curso y se avisa a cada Editor de Finanzas (por persona).
-- ================================================================
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

create policy "diezmos_diezmos_ejecuciones_select"
  on fuente_verdad.diezmos_diezmos_ejecuciones for select
  to authenticated
  using (fuente_verdad.mi_permiso('finanzas') in ('lector', 'editor'));

-- Una fila por persona: cada Editor de Finanzas marca "ya lo vi" por
-- su cuenta, sin afectar a los demás.
create table if not exists fuente_verdad.diezmos_diezmos_notificaciones (
  id           uuid primary key default gen_random_uuid(),
  ejecucion_id uuid not null references fuente_verdad.diezmos_diezmos_ejecuciones(id) on delete cascade,
  miembro_id   uuid not null references fuente_verdad.miembros(id) on delete cascade,
  visto        boolean not null default false,
  creado_en    timestamptz not null default now(),

  unique (ejecucion_id, miembro_id)
);

alter table fuente_verdad.diezmos_diezmos_notificaciones enable row level security;

create policy "ddn_select_propia"
  on fuente_verdad.diezmos_diezmos_notificaciones for select
  to authenticated
  using (miembro_id = (select id from fuente_verdad.miembros where user_id = auth.uid()));

create policy "ddn_update_propia"
  on fuente_verdad.diezmos_diezmos_notificaciones for update
  to authenticated
  using (miembro_id = (select id from fuente_verdad.miembros where user_id = auth.uid()))
  with check (miembro_id = (select id from fuente_verdad.miembros where user_id = auth.uid()));

alter publication supabase_realtime add table fuente_verdad.diezmos_diezmos_notificaciones;

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

select cron.schedule('diezmos-de-diezmos', '*/10 * * * *', 'select fuente_verdad.ejecutar_diezmos_de_diezmos();');

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecuta estas líneas por separado si quieres)
-- ────────────────────────────────────────────────────────────────
-- select tablename, rowsecurity from pg_tables where schemaname = 'fuente_verdad';
-- select policyname, cmd, qual from pg_policies where schemaname = 'fuente_verdad';
-- select indexname from pg_indexes where schemaname = 'fuente_verdad';
-- select * from fuente_verdad.permisos order by rol, modulo;
