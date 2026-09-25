-- Owner-controlled public checkout method.
-- Paystack is the safe default for existing businesses; owners can switch to WhatsApp.

alter table public.businesses
  add column if not exists checkout_method text not null default 'paystack';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_checkout_method_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_checkout_method_check
      check (checkout_method in ('paystack', 'whatsapp'));
  end if;
end;
$$;
