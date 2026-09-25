-- Product photos, customer accounts, public orders, and Paystack payment state.

alter table public.products
  add column if not exists image_path text;

alter table public.orders
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists customer_email text not null default '',
  add column if not exists shipping_address text not null default '',
  add column if not exists payment_reference text;

alter table public.orders
  drop constraint if exists orders_source_check;

alter table public.orders
  add constraint orders_source_check check (source in ('whatsapp', 'instagram', 'phone', 'in_person', 'other', 'web'));

create unique index if not exists orders_payment_reference_idx
  on public.orders(payment_reference)
  where payment_reference is not null;

create policy orders_customer_select
on public.orders
for select
to authenticated
using (customer_user_id = auth.uid());

create policy order_lines_customer_select
on public.order_lines
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_lines.order_id
      and orders.business_id = order_lines.business_id
      and orders.customer_user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

create policy product_images_member_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.business_members
    where business_members.business_id::text = (storage.foldername(name))[1]
      and business_members.user_id = auth.uid()
  )
);

create policy product_images_member_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.business_members
    where business_members.business_id::text = (storage.foldername(name))[1]
      and business_members.user_id = auth.uid()
  )
);

create or replace function public.create_public_order(
  p_business_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_lines jsonb
)
returns table(order_id uuid, order_number text, total_amount numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  new_order_number text;
  line_item jsonb;
  variant_row public.product_variants%rowtype;
  line_variant_id uuid;
  line_quantity integer;
begin
  if auth.uid() is null then
    raise exception 'Customer authentication is required';
  end if;

  if not exists (select 1 from public.businesses where id = p_business_id and storefront_enabled = true) then
    raise exception 'Storefront is not available';
  end if;

  if char_length(trim(coalesce(p_customer_name, ''))) < 1
    or p_customer_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or jsonb_typeof(p_lines) <> 'array'
    or jsonb_array_length(p_lines) = 0 then
    raise exception 'Valid customer details and at least one item are required';
  end if;

  new_order_number := 'KH-WEB-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.orders (
    business_id,
    order_number,
    customer_name,
    customer_phone,
    customer_email,
    shipping_address,
    source,
    status,
    payment_status,
    customer_user_id
  ) values (
    p_business_id,
    new_order_number,
    trim(p_customer_name),
    trim(coalesce(p_customer_phone, '')),
    lower(trim(p_customer_email)),
    trim(coalesce(p_shipping_address, '')),
    'web',
    'new',
    'unpaid',
    auth.uid()
  ) returning id into new_order_id;

  for line_item in select value from jsonb_array_elements(p_lines)
  loop
    begin
      line_variant_id := (line_item->>'variant_id')::uuid;
      line_quantity := (line_item->>'quantity')::integer;
    exception when others then
      raise exception 'Invalid order line';
    end;

    if line_quantity is null or line_quantity < 1 then
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

    insert into public.order_lines (business_id, order_id, variant_id, quantity, unit_price)
    values (p_business_id, new_order_id, variant_row.id, line_quantity, variant_row.selling_price);
  end loop;

  return query
  select orders.id, orders.order_number, orders.total_amount
  from public.orders
  where orders.id = new_order_id;
end;
$$;

create or replace function public.set_public_payment_reference(p_order_id uuid, p_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.orders
    where id = p_order_id
      and customer_user_id = auth.uid()
      and payment_status = 'unpaid'
  ) then
    raise exception 'Order not found';
  end if;

  update public.orders
  set payment_reference = trim(p_reference)
  where id = p_order_id
    and customer_user_id = auth.uid()
    and (payment_reference is null or payment_reference = trim(p_reference));
end;
$$;

create or replace function public.complete_public_payment(p_reference text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.orders%rowtype;
  line_row public.order_lines%rowtype;
  variant_row public.product_variants%rowtype;
  has_insufficient_stock boolean := false;
begin
  select * into order_row
  from public.orders
  where payment_reference = trim(p_reference)
  for update;

  if order_row.id is null then
    raise exception 'Payment order not found';
  end if;

  if order_row.payment_status = 'paid' then
    return order_row.id;
  end if;

  if not exists (select 1 from public.businesses where id = order_row.business_id and storefront_enabled = true) then
    raise exception 'Storefront is not available';
  end if;

  update public.orders
  set payment_status = 'paid'
  where id = order_row.id;

  for line_row in select * from public.order_lines where order_id = order_row.id order by id
  loop
    select * into variant_row
    from public.product_variants
    where id = line_row.variant_id
      and business_id = order_row.business_id
    for update;

    if variant_row.id is null or variant_row.quantity_on_hand < line_row.quantity then
      has_insufficient_stock := true;
    end if;
  end loop;

  if has_insufficient_stock then
    update public.orders
    set notes = trim(coalesce(notes, '') || ' Payment received; stock requires owner review.')
    where id = order_row.id;
    return order_row.id;
  end if;

  for line_row in select * from public.order_lines where order_id = order_row.id order by id
  loop
    update public.product_variants
    set quantity_on_hand = quantity_on_hand - line_row.quantity
    where id = line_row.variant_id
      and business_id = order_row.business_id;

    insert into public.stock_movements (
      business_id,
      variant_id,
      order_id,
      order_line_id,
      movement_type,
      quantity_delta,
      reason,
      created_by
    ) values (
      order_row.business_id,
      line_row.variant_id,
      order_row.id,
      line_row.id,
      'order_confirmed',
      -line_row.quantity,
      'Paid public order ' || order_row.order_number,
      order_row.customer_user_id
    );
  end loop;

  update public.orders
  set status = 'confirmed'
  where id = order_row.id;

  return order_row.id;
end;
$$;

revoke all on function public.create_public_order(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.create_public_order(uuid, text, text, text, text, jsonb) to authenticated;
revoke all on function public.set_public_payment_reference(uuid, text) from public;
grant execute on function public.set_public_payment_reference(uuid, text) to authenticated;
revoke all on function public.complete_public_payment(text) from public;
grant execute on function public.complete_public_payment(text) to service_role;
