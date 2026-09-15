-- ================================================================
-- Migración: imagen de soporte (comprobante) para movimientos de
-- Finanzas (Fase 3 de los ajustes acordados con el equipo)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (proyecto compartido intech solution, schema fuente_verdad)
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Columna para guardar la ruta del archivo (no la URL pública:
--    el bucket es privado, se sirve con signed URLs de corta vida)
-- ────────────────────────────────────────────────────────────────
alter table fuente_verdad.finanzas add column if not exists comprobante_path text;

-- ────────────────────────────────────────────────────────────────
-- 2. Bucket privado para los comprobantes
-- ────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('comprobantes-finanzas', 'comprobantes-finanzas', false)
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────────
-- 3. RLS de storage.objects para este bucket — mismo permiso de
--    Finanzas ya usado en toda la app (mi_permiso/es_administrador).
-- ────────────────────────────────────────────────────────────────
drop policy if exists "comprobantes_finanzas_insert" on storage.objects;
drop policy if exists "comprobantes_finanzas_select" on storage.objects;
drop policy if exists "comprobantes_finanzas_delete" on storage.objects;

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

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ────────────────────────────────────────────────────────────────
-- select id, public from storage.buckets where id = 'comprobantes-finanzas';
-- select policyname from pg_policies where tablename = 'objects' and policyname like 'comprobantes_finanzas%';
