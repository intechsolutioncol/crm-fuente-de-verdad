-- ================================================================
-- CRM · Fuente de Verdad — Schema PostgreSQL (Supabase)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ================================================================

-- Tabla principal de aportes financieros
create table if not exists public.finanzas (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null,
  nombre        text not null check (char_length(nombre) >= 2),
  tipo          text not null check (tipo in ('Diezmo', 'Ofrenda', 'Donación')),
  metodo_pago   text not null check (metodo_pago in ('Efectivo', 'Transferencia', 'Otro')),
  monto         numeric(14, 0) not null check (monto > 0),
  observaciones text not null default '',
  user_email    text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índices para consultas frecuentes
create index if not exists idx_finanzas_fecha       on public.finanzas (fecha desc);
create index if not exists idx_finanzas_tipo        on public.finanzas (tipo);
create index if not exists idx_finanzas_nombre      on public.finanzas using gin (to_tsvector('spanish', nombre));
create index if not exists idx_finanzas_user_email  on public.finanzas (user_email);

-- Trigger: actualiza updated_at automáticamente al editar
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_finanzas_updated_at
  before update on public.finanzas
  for each row execute function public.set_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- Solo usuarios autenticados pueden acceder a los datos
-- ================================================================

alter table public.finanzas enable row level security;

-- Lectura: cualquier usuario autenticado puede ver todos los registros
create policy "finanzas_select"
  on public.finanzas for select
  to authenticated
  using (true);

-- Inserción: el campo user_email debe coincidir con el usuario autenticado
create policy "finanzas_insert"
  on public.finanzas for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = user_email);

-- Actualización: cualquier usuario autenticado puede editar
-- (ajustar a (auth.jwt() ->> 'email' = user_email) si solo el autor puede editar)
create policy "finanzas_update"
  on public.finanzas for update
  to authenticated
  using (true);

-- Eliminación: cualquier usuario autenticado puede eliminar
create policy "finanzas_delete"
  on public.finanzas for delete
  to authenticated
  using (true);

-- ================================================================
-- VERIFICACIÓN
-- ================================================================
-- Ejecuta esto para confirmar que todo quedó bien:
-- select tablename, rowsecurity from pg_tables where tablename = 'finanzas';
-- select policyname, cmd from pg_policies where tablename = 'finanzas';
