-- New accounts start at €0; reset existing balances to 0.
alter table public.profiles alter column balance set default 0;
update public.profiles set balance = 0;
