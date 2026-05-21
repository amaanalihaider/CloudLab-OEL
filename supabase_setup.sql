-- =====================================================================
-- BSE-6 Cloud Computing — Lab 10A: Campus Notice Board
-- Supabase backend setup — run this entire file in Supabase SQL Editor
-- Project: CloudOpenEnded (tuqjtxsjbvgobyparuik)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SCHEMA
-- ---------------------------------------------------------------------

-- profiles: one row per registered user
create table if not exists public.profiles (
    id           uuid primary key default auth.uid(),
    email        text not null,
    display_name text,
    created_at   timestamptz not null default now()
);

-- notices: all posted notices, each tied to a profile
create table if not exists public.notices (
    id         bigserial primary key,
    user_id    uuid not null references public.profiles(id) on delete cascade,
    title      text not null,
    body       text not null,
    category   text not null check (category in ('Academic','Event','Urgent','General')),
    created_at timestamptz not null default now()
);

-- Helpful index for the "newest first" feed query
create index if not exists notices_created_at_desc_idx
    on public.notices (created_at desc);

-- ---------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.notices  enable row level security;

-- Drop existing policies if re-running this script
drop policy if exists "profiles_select_own"   on public.profiles;
drop policy if exists "profiles_insert_self"  on public.profiles;
drop policy if exists "notices_select_all"    on public.notices;
drop policy if exists "notices_insert_self"   on public.notices;
drop policy if exists "notices_delete_own"    on public.notices;

-- profiles: a user can only read their own profile row
create policy "profiles_select_own"
    on public.profiles for select
    using (id = auth.uid());

-- profiles: a user can only insert a profile row for themselves
create policy "profiles_insert_self"
    on public.profiles for insert
    with check (id = auth.uid());

-- notices: everyone (signed in or not) can read all notices
create policy "notices_select_all"
    on public.notices for select
    using (true);

-- notices: only a signed-in user can insert, and only as themselves
create policy "notices_insert_self"
    on public.notices for insert
    with check (auth.uid() is not null and user_id = auth.uid());

-- notices: a user can only delete their own notices
create policy "notices_delete_own"
    on public.notices for delete
    using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. AUTO-CREATE PROFILE ON SIGNUP
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4. REALTIME
-- ---------------------------------------------------------------------

-- Add notices table to the realtime publication so the frontend
-- receives INSERT/DELETE events in real time.
alter publication supabase_realtime add table public.notices;

-- ---------------------------------------------------------------------
-- 5. VERIFICATION QUERIES — run these manually after the setup
-- ---------------------------------------------------------------------
-- All 5 policies present:
--   select tablename, polname, polcmd
--   from pg_policies
--   where tablename in ('profiles','notices');
--
-- Trigger present:
--   select trigger_name, event_object_table
--   from information_schema.triggers
--   where trigger_schema = 'public';
--
-- Realtime publication includes notices:
--   select schemaname, tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime';
-- =====================================================================
