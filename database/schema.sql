-- Enable UUID extension if needed (good practice in Supabase)
create extension if not exists "uuid-ossp";

-- Table: students
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text not null,
  attendance numeric(5, 2) not null default 100.00,
  warnings int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: logs (for blockchain-like audit trail readiness)
create table public.logs (
  id uuid default uuid_generate_v4() primary key,
  student_hash text not null,
  action text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now())
);

-- Seed Data
insert into public.students (name, phone, attendance, warnings)
values
  ('Alice Johnson', '+15550101', 85.5, 0),
  ('Bob Smith', '+15550102', 65.0, 1), -- Below 75%
  ('Charlie Davis', '+15550103', 92.0, 0),
  ('Diana Prince', '+15550104', 70.5, 2), -- Below 75%
  ('Evan Wright', '+15550105', 45.0, 3); -- Repeated defaulter
