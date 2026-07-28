-- Fix: param name "target" collided with profiles.target column (42702 ambiguous).
drop function if exists public.admin_credit(uuid, numeric);

create function public.admin_credit(p_target uuid, p_amt numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare newbal numeric;
begin
  if not public.is_admin(auth.uid()) then raise exception 'not admin'; end if;
  if p_amt is null or p_amt <= 0 then raise exception 'bad amount'; end if;
  update public.profiles set balance = balance + p_amt
    where id = p_target returning balance into newbal;
  if newbal is null then raise exception 'target not found'; end if;
  insert into public.transactions(user_id, type, amount) values (p_target, 'deposit', p_amt);
  return newbal;
end; $$;

grant execute on function public.admin_credit(uuid, numeric) to authenticated;
