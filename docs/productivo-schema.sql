-- Esquema base PostgreSQL para la version productiva.

create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'manager')),
  area text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table action_criteria (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  days integer not null check (days >= 0),
  suggested_priority text not null check (suggested_priority in ('Alta', 'Media', 'Baja')),
  active boolean not null default true
);

create table findings (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  source text not null default 'google_form',
  source_row_id text unique,
  site_id uuid references sites(id),
  location text not null,
  description text not null,
  report_type text,
  reporter text,
  initial_photo_url text,
  detected_at date not null,
  criticality text not null check (criticality in ('Critica', 'Alta', 'Media', 'Baja')),
  priority text not null check (priority in ('Alta', 'Media', 'Baja')),
  action_criterion_id uuid references action_criteria(id),
  owner_id uuid references users(id),
  assigned_email_at date,
  due_date date,
  status text not null check (status in ('Nuevo', 'Asignado', 'En gestion', 'Completado por responsable', 'Observado', 'Cerrado', 'Vencido', 'No procesable')),
  non_processable_reason text,
  comments text,
  closed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table finding_evidence (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references findings(id) on delete cascade,
  drive_file_id text,
  file_name text not null,
  file_url text,
  note text,
  uploaded_by uuid references users(id),
  uploaded_at timestamptz not null default now()
);

create table finding_history (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references findings(id) on delete cascade,
  actor_id uuid references users(id),
  actor_name text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create table outbound_emails (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid references findings(id) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index findings_owner_idx on findings(owner_id);
create index findings_status_idx on findings(status);
create index findings_due_date_idx on findings(due_date);
create index findings_site_idx on findings(site_id);
create index findings_detected_at_idx on findings(detected_at);
