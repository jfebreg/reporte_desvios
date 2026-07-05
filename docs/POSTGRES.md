# PostgreSQL para Backend Productivo

El backend puede guardar el estado en PostgreSQL usando `DATABASE_URL`. Si esa variable no existe, sigue usando `backend/data/state.json`.

## Configuracion

Variables:

```env
DATABASE_URL=postgres://usuario:clave@host:5432/base
DATABASE_SSL=true
```

En Render, Railway, Supabase o Neon normalmente `DATABASE_SSL=true` funciona bien.

## Tabla usada por la primera version

La primera etapa usa una tabla JSONB simple:

```sql
create table if not exists app_state (
  key text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
```

Esto permite tener datos compartidos y persistentes sin reescribir todo el frontend todavia.

## Siguiente evolucion

Cuando el flujo ya este validado con usuarios reales, migrar desde `app_state.state` al esquema normalizado de `docs/productivo-schema.sql`.
