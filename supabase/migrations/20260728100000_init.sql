-- dayofcash schema: profiles + transactions, RLS, admin credit, bet settle.

-- ---------- tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  balance numeric not null default 200,
  target numeric not null default 1000,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric not null,
  game text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

-- ---------- admin check (security definer -> bypasses RLS, no recursion) ----------
create or replace function public.is_admin(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- ---------- policies ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id);

drop policy if exists tx_select on public.transactions;
create policy tx_select on public.transactions for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists tx_insert_own on public.transactions;
create policy tx_insert_own on public.transactions for insert
  with check (auth.uid() = user_id);

-- ---------- new-user trigger: first account becomes admin ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare admin_exists boolean;
begin
  select exists(select 1 from public.profiles where is_admin) into admin_exists;
  insert into public.profiles (id, email, name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    not admin_exists
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- apply a balance delta to the caller + log a transaction ----------
create or replace function public.apply_delta(delta numeric, kind text, game_name text default null)
returns numeric language plpgsql security definer set search_path = public as $$
declare newbal numeric;
begin
  update public.profiles set balance = greatest(0, balance + delta)
    where id = auth.uid() returning balance into newbal;
  if newbal is null then raise exception 'no profile'; end if;
  insert into public.transactions(user_id, type, amount, game)
    values (auth.uid(), kind, abs(delta), game_name);
  return newbal;
end; $$;

-- ---------- admin: credit fictional money to any account ----------
create or replace function public.admin_credit(target uuid, amt numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare newbal numeric;
begin
  if not public.is_admin(auth.uid()) then raise exception 'not admin'; end if;
  if amt is null or amt <= 0 then raise exception 'bad amount'; end if;
  update public.profiles set balance = balance + amt
    where id = target returning balance into newbal;
  if newbal is null then raise exception 'target not found'; end if;
  insert into public.transactions(user_id, type, amount) values (target, 'deposit', amt);
  return newbal;
end; $$;

-- ---------- grants ----------
grant execute on function public.apply_delta(numeric, text, text) to authenticated;
grant execute on function public.admin_credit(uuid, numeric) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
