-- ================================================================
-- Migración: agregar campos geográficos a tabla miembros
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ================================================================

-- Nuevas columnas
alter table public.miembros
  add column if not exists pais         text not null default 'Colombia',
  add column if not exists departamento text;

-- Hacer municipio y barrio opcionales (residentes fuera de Colombia)
alter table public.miembros
  alter column municipio drop not null,
  alter column barrio    drop not null;

-- Valores por defecto: los registros existentes quedan con Colombia/Medellín
update public.miembros
  set municipio = coalesce(municipio, 'Medellín')
  where pais = 'Colombia' and municipio is null;
