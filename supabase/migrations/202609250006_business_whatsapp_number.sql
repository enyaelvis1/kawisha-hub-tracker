-- Owner-managed WhatsApp destination for the public checkout handoff.

alter table public.businesses
  add column if not exists whatsapp_number text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_whatsapp_number_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_whatsapp_number_check
      check (char_length(whatsapp_number) <= 32 and whatsapp_number ~ '^[0-9]*$');
  end if;
end;
$$;
