-- Public storefront visibility is opt-in and read-only.

alter table public.businesses
  add column if not exists storefront_enabled boolean not null default false;

create policy businesses_public_store_select
on public.businesses
for select
to anon, authenticated
using (storefront_enabled = true);

create policy categories_public_store_select
on public.categories
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.businesses
    where businesses.id = categories.business_id
      and businesses.storefront_enabled = true
  )
);

create policy products_public_store_select
on public.products
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.businesses
    where businesses.id = products.business_id
      and businesses.storefront_enabled = true
  )
);

create policy variants_public_store_select
on public.product_variants
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.businesses
    join public.products
      on products.business_id = product_variants.business_id
     and products.id = product_variants.product_id
    where businesses.id = product_variants.business_id
      and businesses.storefront_enabled = true
      and products.is_active = true
  )
);
