ALTER TABLE public.claims
  ADD CONSTRAINT claims_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE,
  ADD CONSTRAINT claims_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.supplies(id) ON DELETE SET NULL;

ALTER TABLE public.work_orders
  ADD CONSTRAINT work_orders_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.claims(id) ON DELETE CASCADE,
  ADD CONSTRAINT work_orders_crew_id_fkey FOREIGN KEY (crew_id) REFERENCES public.crews(id) ON DELETE RESTRICT;

ALTER TABLE public.claim_comments
  ADD CONSTRAINT claim_comments_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.claims(id) ON DELETE CASCADE;