-- ================================================================
-- Migración: módulo Ministerios (blogs públicos por ministerio)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Ministerios — configurables desde Configuración, líder
--    asignado desde ahí también (nunca fijo en el código).
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.ministerios (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique,
  slug        text not null unique,
  descripcion text,
  lider_id    uuid references fuente_verdad.miembros(id) on delete set null,
  activo      boolean not null default true,
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

insert into fuente_verdad.ministerios (nombre, slug, descripcion, orden) values
  ('Ella', 'ella', 'Ministerio de las mujeres', 1),
  ('Él', 'el', 'Ministerio de los hombres', 2),
  ('FreshInk', 'freshink', 'Ministerio de los jóvenes', 3),
  ('Kids', 'kids', 'Ministerio de los niños', 4)
on conflict (nombre) do nothing;

alter table fuente_verdad.ministerios enable row level security;

drop policy if exists "ministerios_select" on fuente_verdad.ministerios;
drop policy if exists "ministerios_insert" on fuente_verdad.ministerios;
drop policy if exists "ministerios_update" on fuente_verdad.ministerios;

-- No sensible: cualquier miembro autenticado puede ver la lista
-- (la necesita /mis-ministerios). La lectura pública del blog
-- bypasea RLS vía el cliente admin (ver src/lib/supabase/admin.ts).
create policy "ministerios_select"
  on fuente_verdad.ministerios for select
  to authenticated
  using (true);

create policy "ministerios_insert"
  on fuente_verdad.ministerios for insert
  to authenticated
  with check (fuente_verdad.es_administrador());

create policy "ministerios_update"
  on fuente_verdad.ministerios for update
  to authenticated
  using (fuente_verdad.es_administrador())
  with check (fuente_verdad.es_administrador());

-- ────────────────────────────────────────────────────────────────
-- 2. Helper: ¿el usuario actual puede gestionar ESTE ministerio?
--    (es su líder, o es Administrador). Se reutiliza en las
--    políticas de publicaciones_ministerio y de Storage.
-- ────────────────────────────────────────────────────────────────
create or replace function fuente_verdad.puede_gestionar_ministerio(p_ministerio_id uuid)
returns boolean
language sql
security definer
set search_path = fuente_verdad
stable
as $$
  select fuente_verdad.es_administrador() or exists (
    select 1 from fuente_verdad.ministerios
    where id = p_ministerio_id
      and lider_id = (select id from fuente_verdad.miembros where user_id = auth.uid())
  );
$$;

-- ────────────────────────────────────────────────────────────────
-- 3. Publicaciones del blog de cada ministerio
-- ────────────────────────────────────────────────────────────────
create table if not exists fuente_verdad.publicaciones_ministerio (
  id            uuid primary key default gen_random_uuid(),
  ministerio_id uuid not null references fuente_verdad.ministerios(id) on delete cascade,
  titulo        text not null check (char_length(titulo) >= 2),
  contenido     text not null check (char_length(contenido) >= 1),
  imagen_path   text,
  autor_id      uuid references fuente_verdad.miembros(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_publicaciones_ministerio_ministerio
  on fuente_verdad.publicaciones_ministerio (ministerio_id, created_at desc);

drop trigger if exists trg_publicaciones_ministerio_updated_at on fuente_verdad.publicaciones_ministerio;
create trigger trg_publicaciones_ministerio_updated_at
  before update on fuente_verdad.publicaciones_ministerio
  for each row execute function fuente_verdad.set_updated_at();

alter table fuente_verdad.publicaciones_ministerio enable row level security;

drop policy if exists "publicaciones_ministerio_select" on fuente_verdad.publicaciones_ministerio;
drop policy if exists "publicaciones_ministerio_insert" on fuente_verdad.publicaciones_ministerio;
drop policy if exists "publicaciones_ministerio_update" on fuente_verdad.publicaciones_ministerio;
drop policy if exists "publicaciones_ministerio_delete" on fuente_verdad.publicaciones_ministerio;

-- Esta select es para la vista de gestión dentro del CRM (líder viendo
-- sus propias publicaciones). La lectura pública del blog no pasa por
-- aquí — usa el cliente admin desde un Server Component.
create policy "publicaciones_ministerio_select"
  on fuente_verdad.publicaciones_ministerio for select
  to authenticated
  using (fuente_verdad.puede_gestionar_ministerio(ministerio_id));

create policy "publicaciones_ministerio_insert"
  on fuente_verdad.publicaciones_ministerio for insert
  to authenticated
  with check (fuente_verdad.puede_gestionar_ministerio(ministerio_id));

create policy "publicaciones_ministerio_update"
  on fuente_verdad.publicaciones_ministerio for update
  to authenticated
  using (fuente_verdad.puede_gestionar_ministerio(ministerio_id))
  with check (fuente_verdad.puede_gestionar_ministerio(ministerio_id));

create policy "publicaciones_ministerio_delete"
  on fuente_verdad.publicaciones_ministerio for delete
  to authenticated
  using (fuente_verdad.puede_gestionar_ministerio(ministerio_id));

-- ────────────────────────────────────────────────────────────────
-- 4. Bucket PÚBLICO para las imágenes de portada (a diferencia de
--    comprobantes-finanzas, que es privado) — el blog ya es público,
--    así que las imágenes se sirven con URL pública estable.
-- ────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('publicaciones-ministerios', 'publicaciones-ministerios', true)
on conflict (id) do nothing;

drop policy if exists "publicaciones_ministerios_insert" on storage.objects;
drop policy if exists "publicaciones_ministerios_update" on storage.objects;
drop policy if exists "publicaciones_ministerios_delete" on storage.objects;

-- La ruta de cada archivo empieza con "<ministerio_id>/...", así que
-- storage.foldername(name) da el ministerio_id a validar.
create policy "publicaciones_ministerios_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'publicaciones-ministerios'
    and fuente_verdad.puede_gestionar_ministerio(((storage.foldername(name))[1])::uuid)
  );

create policy "publicaciones_ministerios_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'publicaciones-ministerios'
    and fuente_verdad.puede_gestionar_ministerio(((storage.foldername(name))[1])::uuid)
  );

create policy "publicaciones_ministerios_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'publicaciones-ministerios'
    and fuente_verdad.puede_gestionar_ministerio(((storage.foldername(name))[1])::uuid)
  );

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select nombre, slug, lider_id, activo from fuente_verdad.ministerios order by orden;
-- select id, name, public from storage.buckets where id = 'publicaciones-ministerios';
