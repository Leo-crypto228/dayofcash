-- Server-side hard ceiling: no player action can ever push a balance past 980.
-- This is the authoritative barrier — the client-side caps are cosmetic only,
-- since anyone can call the RPC directly from the browser console.
-- Admin credits (admin_credit) are deliberately exempt.

create or replace function public.apply_delta(delta numeric, kind text, game_name text default null)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  newbal numeric;
  cur numeric;
  applied numeric;
  ceiling_val constant numeric := 980;
begin
  select balance into cur from public.profiles where id = auth.uid();
  if cur is null then raise exception 'no profile'; end if;

  applied := delta;
  -- Any credit coming from gameplay or self-deposit is clamped to the gap left.
  if applied > 0 then
    applied := least(applied, greatest(0, ceiling_val - cur));
  end if;

  update public.profiles set balance = greatest(0, balance + applied)
    where id = auth.uid() returning balance into newbal;

  insert into public.transactions(user_id, type, amount, game)
    values (auth.uid(), kind, abs(applied), game_name);

  return newbal;
end; $$;

grant execute on function public.apply_delta(numeric, text, text) to authenticated;
