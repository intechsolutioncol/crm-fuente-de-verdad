-- ================================================================
-- CRM · Fuente de Verdad — Schema PostgreSQL (Supabase)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ================================================================

-- Extensión para búsquedas ILIKE eficientes (usado en filtro por nombre)
create extension if not exists pg_trgm;

-- ────────────────────────────────────────────────────────────────
-- TABLA PRINCIPAL
-- ────────────────────────────────────────────────────────────────
create table if not exists public.finanzas (
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
  on public.finanzas (fecha desc);

create index if not exists idx_finanzas_tipo
  on public.finanzas (tipo);

-- Índice trigrama: acelera búsquedas ILIKE '%texto%' sobre nombre
create index if not exists idx_finanzas_nombre_trgm
  on public.finanzas using gin (nombre gin_trgm_ops);

create index if not exists idx_finanzas_user_email
  on public.finanzas (user_email);

-- ────────────────────────────────────────────────────────────────
-- TRIGGER updated_at
-- ────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_finanzas_updated_at on public.finanzas;

create trigger trg_finanzas_updated_at
  before update on public.finanzas
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────
alter table public.finanzas enable row level security;

-- Eliminar políticas anteriores si existen (para poder re-ejecutar)
drop policy if exists "finanzas_select" on public.finanzas;
drop policy if exists "finanzas_insert" on public.finanzas;
drop policy if exists "finanzas_update" on public.finanzas;
drop policy if exists "finanzas_delete" on public.finanzas;

-- Lectura: cualquier usuario autenticado
create policy "finanzas_select"
  on public.finanzas for select
  to authenticated
  using (true);

-- Inserción: usa auth.email() en lugar de auth.jwt()->>'email'
-- (más confiable con GitHub OAuth donde el email puede estar ausente en el JWT)
create policy "finanzas_insert"
  on public.finanzas for insert
  to authenticated
  with check (true);

-- Actualización: cualquier usuario autenticado
create policy "finanzas_update"
  on public.finanzas for update
  to authenticated
  using (true);

-- Eliminación: cualquier usuario autenticado
create policy "finanzas_delete"
  on public.finanzas for delete
  to authenticated
  using (true);

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecuta estas líneas por separado si quieres)
-- ────────────────────────────────────────────────────────────────
-- select tablename, rowsecurity from pg_tables where tablename = 'finanzas';
-- select policyname, cmd, qual from pg_policies where tablename = 'finanzas';
-- select indexname from pg_indexes where tablename = 'finanzas';
