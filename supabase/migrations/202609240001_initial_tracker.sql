-- Kawisha Hub NG tracker schema.
-- Apply locally with Supabase CLI before connecting a real project.

create extension if not exists pgcrypto;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  currency_code text not null default 'NGN' check (currency_code ~ '^[A-Z]{3}$'),
  storefront_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id),
  unique (business_id, id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, category_id) references public.categories(business_id, id) on delete restrict
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null,
  variant_name text not null check (char_length(trim(variant_name)) between 1 and 120),
  sku text not null check (char_length(trim(sku)) between 1 and 80),
  selling_price numeric(12, 2) not null check (selling_price >= 0),
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, sku),
  foreign key (business_id, product_id) references public.products(business_id, id) on delete cascade
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_number text not null check (char_length(trim(order_number)) between 1 and 40),
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 160),
  customer_phone text not null default '',
  source text not null check (source in ('whatsapp', 'instagram', 'phone', 'in_person', 'other')),
  status text not null default 'new' check (status in ('new', 'confirmed', 'ready', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  notes text not null default '',
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, order_number)
);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null,
  variant_id uuid not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  unique (business_id, id),
  unique (order_id, variant_id),
  foreign key (business_id, order_id) references public.orders(business_id, id) on delete cascade,
  foreign key (business_id, variant_id) references public.product_variants(business_id, id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  variant_id uuid not null,
  order_id uuid,
  order_line_id uuid,
  movement_type text not null check (movement_type in ('opening_stock', 'restock', 'manual_correction', 'order_confirmed', 'order_cancelled')),
  quantity_delta integer not null check (quantity_delta <> 0),
  reason text not null check (char_length(trim(reason)) between 1 and 240),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, variant_id) references public.product_variants(business_id, id),
  foreign key (business_id, order_id) references public.orders(business_id, id) on delete cascade,
  foreign key (business_id, order_line_id) references public.order_lines(business_id, id) on delete cascade
);

create index products_business_created_idx on public.products(business_id, created_at desc);
create index variants_business_stock_idx on public.product_variants(business_id, quantity_on_hand, low_stock_threshold);
create index orders_business_status_idx on public.orders(business_id, status, created_at desc);
create index movements_business_variant_idx on public.stock_movements(business_id, variant_id, created_at desc);
create unique index one_confirmed_movement_per_line on public.stock_movements(order_line_id) where movement_type = 'order_confirmed';
create unique index one_cancelled_movement_per_line on public.stock_movements(order_line_id) where movement_type = 'order_cancelled';

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_set_updated_at before update on public.businesses for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();

create or replace function public.recalculate_order_total()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  affected_order_id uuid;
begin
  affected_order_id := case when tg_op = 'DELETE' then old.order_id else new.order_id end;
  update public.orders
  set total_amount = coalesce((select sum(quantity * unit_price) from public.order_lines where order_id = affected_order_id), 0)
  where id = affected_order_id;
  return null;
end;
$$;

create trigger order_lines_recalculate_total after insert or update or delete on public.order_lines for each row execute function public.recalculate_order_total();

create or replace function public.is_business_member(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.business_members
    where business_id = p_business_id and user_id = auth.uid()
  );
$$;

create or replace function public.bootstrap_business(p_name text, p_currency_code text default 'NGN')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_business_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.business_members where user_id = auth.uid()) then
    raise exception 'This user already belongs to a business';
  end if;
  insert into public.businesses(name, currency_code) values (trim(p_name), upper(p_currency_code)) returning id into new_business_id;
  insert into public.business_members(business_id, user_id, role) values (new_business_id, auth.uid(), 'owner');
  return new_business_id;
end;
$$;

create or replace function public.record_stock_movement(
  p_variant_id uuid,
  p_quantity_delta integer,
  p_movement_type text,
  p_reason text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  variant_business_id uuid;
  next_stock integer;
  movement_id uuid;
begin
  select business_id into variant_business_id from public.product_variants where id = p_variant_id for update;
  if variant_business_id is null or not public.is_business_member(variant_business_id) then raise exception 'Variant not found'; end if;
  if p_quantity_delta = 0 then raise exception 'Stock movement cannot be zero'; end if;
  next_stock := (select quantity_on_hand from public.product_variants where id = p_variant_id) + p_quantity_delta;
  if next_stock < 0 then raise exception 'Stock cannot become negative'; end if;
  update public.product_variants set quantity_on_hand = next_stock where id = p_variant_id;
  insert into public.stock_movements(business_id, variant_id, movement_type, quantity_delta, reason, created_by)
  values (variant_business_id, p_variant_id, p_movement_type, p_quantity_delta, trim(p_reason), auth.uid())
  returning id into movement_id;
  return movement_id;
end;
$$;

create or replace function public.confirm_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  order_row public.orders%rowtype;
  line_row public.order_lines%rowtype;
  variant_row public.product_variants%rowtype;
begin
  select * into order_row from public.orders where id = p_order_id for update;
  if order_row.id is null or not public.is_business_member(order_row.business_id) then raise exception 'Order not found'; end if;
  if order_row.status = 'cancelled' then raise exception 'Cancelled orders cannot be confirmed'; end if;
  if order_row.status in ('confirmed', 'ready', 'completed') then return; end if;
  for line_row in select * from public.order_lines where order_id = p_order_id order by id loop
    select * into variant_row from public.product_variants where id = line_row.variant_id and business_id = order_row.business_id for update;
    if variant_row.id is null then raise exception 'Order line references an invalid variant'; end if;
    if variant_row.quantity_on_hand < line_row.quantity then raise exception 'Not enough stock for SKU %', variant_row.sku; end if;
    update public.product_variants set quantity_on_hand = quantity_on_hand - line_row.quantity where id = variant_row.id;
    insert into public.stock_movements(business_id, variant_id, order_id, order_line_id, movement_type, quantity_delta, reason, created_by)
    values (order_row.business_id, line_row.variant_id, order_row.id, line_row.id, 'order_confirmed', -line_row.quantity, 'Stock used by confirmed order ' || order_row.order_number, auth.uid());
  end loop;
  update public.orders set status = 'confirmed' where id = p_order_id;
end;
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  order_row public.orders%rowtype;
  line_row public.order_lines%rowtype;
  confirmed_exists boolean;
begin
  select * into order_row from public.orders where id = p_order_id for update;
  if order_row.id is null or not public.is_business_member(order_row.business_id) then raise exception 'Order not found'; end if;
  if order_row.status = 'cancelled' then return; end if;
  for line_row in select * from public.order_lines where order_id = p_order_id order by id loop
    select exists (select 1 from public.stock_movements where order_line_id = line_row.id and movement_type = 'order_confirmed') into confirmed_exists;
    if confirmed_exists then
      update public.product_variants set quantity_on_hand = quantity_on_hand + line_row.quantity where id = line_row.variant_id and business_id = order_row.business_id;
      insert into public.stock_movements(business_id, variant_id, order_id, order_line_id, movement_type, quantity_delta, reason, created_by)
      values (order_row.business_id, line_row.variant_id, order_row.id, line_row.id, 'order_cancelled', line_row.quantity, 'Stock restored from cancelled order ' || order_row.order_number, auth.uid());
    end if;
  end loop;
  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

grant execute on function public.bootstrap_business(text, text) to authenticated;
grant execute on function public.record_stock_movement(uuid, integer, text, text) to authenticated;
grant execute on function public.confirm_order(uuid) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.stock_movements enable row level security;

create policy businesses_member_select on public.businesses for select to authenticated using (public.is_business_member(id));
create policy businesses_owner_update on public.businesses for update to authenticated using (exists (select 1 from public.business_members member where member.business_id = businesses.id and member.user_id = auth.uid() and member.role = 'owner')) with check (public.is_business_member(id));
create policy business_members_self_select on public.business_members for select to authenticated using (user_id = auth.uid() or public.is_business_member(business_id));
create policy categories_member_all on public.categories for all to authenticated using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy products_member_all on public.products for all to authenticated using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy variants_member_all on public.product_variants for all to authenticated using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy orders_member_all on public.orders for all to authenticated using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy order_lines_member_all on public.order_lines for all to authenticated using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy movements_member_all on public.stock_movements for all to authenticated using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
