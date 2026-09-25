-- Allow authenticated business members to remove WhatsApp inbox requests.
-- Requests are owner-side inbox records and do not reserve stock or change orders.

create policy whatsapp_requests_member_delete
on public.whatsapp_order_requests
for delete to authenticated
using (public.is_business_member(business_id));
