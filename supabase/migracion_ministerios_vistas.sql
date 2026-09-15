-- Fase 4 de Reportes: analítica de Ministerios.
-- Agrega conteo de vistas por publicación, incrementado desde la
-- página de detalle pública (src/app/ministerios/[slug]/[id]/page.tsx).

alter table fuente_verdad.publicaciones_ministerio
  add column if not exists vistas_count integer not null default 0;

-- Incremento atómico (evita condiciones de carrera de leer-y-escribir).
-- Se llama desde el cliente admin (service role) al renderizar el
-- detalle público de una publicación, así que no necesita bypass de
-- RLS adicional, pero se deja security definer por si en el futuro
-- se llama desde un cliente anónimo autenticado con RLS activo.
create or replace function fuente_verdad.incrementar_vista_publicacion(p_publicacion_id uuid)
returns void
language sql
security definer
set search_path = fuente_verdad
as $$
  update fuente_verdad.publicaciones_ministerio
  set vistas_count = vistas_count + 1
  where id = p_publicacion_id;
$$;

grant execute on function fuente_verdad.incrementar_vista_publicacion(uuid) to anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecuta estas líneas por separado si quieres)
-- ────────────────────────────────────────────────────────────────
-- select id, titulo, vistas_count from fuente_verdad.publicaciones_ministerio limit 5;
-- select fuente_verdad.incrementar_vista_publicacion('<uuid-de-una-publicacion>');
