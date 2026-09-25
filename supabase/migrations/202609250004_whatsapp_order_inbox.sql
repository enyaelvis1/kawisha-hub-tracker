-- Public WhatsApp order requests are saved for the private owner inbox.
-- They are requests only: payment and stock deduction stay in the existing order workflow.

create table public.whatsapp_order_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  request_number text not null check (char_length(trim(request_number)) between 1 and 48),
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 160),
  customer_phone text not null check (char_length(trim(customer_phone)) between 3 and 40),
  customer_email text not null default '',
  delivery_address text not null default '',
  note text not null default '',
  line_items jsonb not null check (jsonb_typeof(line_items) = 'array'),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, request_number)
);

create index whatsapp_requests_business_status_idx
  on public.whatsapp_order_requests(business_id, status, created_at desc);

create trigger whatsapp_requests_set_updated_at
before update on public.whatsapp_order_requests
for each row execute function public.set_updated_at();

create or replace function public.create_whatsapp_order_request(
  p_business_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_address text,
  p_note text,
  p_lines jsonb
)
returns table(request_id uuid, request_number text, total_amount numeric, line_items jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_request_id uuid;
  new_request_number text;
  line_item jsonb;
  validated_lines jsonb := '[]'::jsonb;
  variant_row public.product_variants%rowtype;
  product_name text;
  line_variant_id uuid;
  line_quantity integer;
  request_total numeric(12, 2) := 0;
begin
  if not exists (
    select 1 from public.businesses
    where id = p_business_id and storefront_enabled = true
  ) then
    raise exception 'Storefront is not available';
  end if;

  if char_length(trim(coalesce(p_customer_name, ''))) < 1
    or char_length(trim(coalesce(p_customer_phone, ''))) < 3
    or char_length(trim(coalesce(p_customer_phone, ''))) > 40
    or (coalesce(p_customer_email, '') <> '' and p_customer_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
    or jsonb_typeof(p_lines) <> 'array'
    or jsonb_array_length(p_lines) = 0
    or jsonb_array_length(p_lines) > 50 then
    raise exception 'Valid contact details and between one and fifty items are required';
  end if;

  if char_length(coalesce(p_delivery_address, '')) > 500 or char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Delivery details and notes must be 500 characters or fewer';
  end if;

  for line_item in select value from jsonb_array_elements(p_lines)
  loop
    begin
      line_variant_id := (line_item ->> 'variant_id')::uuid;
      line_quantity := (line_item ->> 'quantity')::integer;
    exception when others then
      raise exception 'Invalid WhatsApp order line';
    end;

    if line_quantity is null or line_quantity < 1 or line_quantity > 999 then
      raise exception 'Order quantities must be positive whole numbers';
    end if;

    select variants.* into variant_row
    from public.product_variants variants
    join public.products products
      on products.id = variants.product_id
     and products.business_id = variants.business_id
    where variants.id = line_variant_id
      and variants.business_id = p_business_id
      and variants.is_active = true
      and products.is_active = true;

    if not found then
      raise exception 'One or more products is no longer available';
    end if;

    if variant_row.quantity_on_hand < line_quantity then
      raise exception 'One or more products does not have enough stock';
    end if;

    select products.name into product_name
    from public.products
    where products.id = variant_row.product_id
      and products.business_id = p_business_id;

    validated_lines := validated_lines || jsonb_build_array(jsonb_build_object(
      'variant_id', variant_row.id,
      'product_name', product_name,
      'variant_name', variant_row.variant_name,
      'sku', variant_row.sku,
      'quantity', line_quantity,
      'unit_price', variant_row.selling_price
    ));
    request_total := request_total + (variant_row.selling_price * line_quantity);
  end loop;

  new_request_number := 'KH-WA-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.whatsapp_order_requests (
    business_id,
    request_number,
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    note,
    line_items,
    total_amount
  ) values (
    p_business_id,
    new_request_number,
    trim(p_customer_name),
    trim(p_customer_phone),
    lower(trim(coalesce(p_customer_email, ''))),
    trim(coalesce(p_delivery_address, '')),
    trim(coalesce(p_note, '')),
    validated_lines,
    request_total
  ) returning id into new_request_id;

  return query
  select new_request_id, new_request_number, request_total, validated_lines;
end;
$$;

revoke all on function public.create_whatsapp_order_request(uuid, text, text, text, text, text, jsonb) from public;
grant execute on function public.create_whatsapp_order_request(uuid, text, text, text, text, text, jsonb) to anon, authenticated;

alter table public.whatsapp_order_requests enable row level security;

create policy whatsapp_requests_member_select
on public.whatsapp_order_requests
for select to authenticated
using (public.is_business_member(business_id));

create policy whatsapp_requests_member_update
on public.whatsapp_order_requests
for update to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));
