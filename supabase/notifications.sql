-- ═══════════════════════════════════════════
-- THYMOS PLATFORM — NOTIFICATIONS TABLE
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  salle_id uuid references public.salles(id) on delete cascade not null,
  combattant_id uuid references public.combattants(id) on delete cascade not null,
  type text not null check (type in ('session', 'combat', 'alerte', 'questionnaire', 'general')),
  title text not null,
  message text not null,
  link text,              -- ex: 'planning.html', 'combattant.html?id=xxx'
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Index pour lecture rapide par combattant
create index idx_notifications_combattant on public.notifications(combattant_id, is_read, created_at desc);

-- RLS
alter table public.notifications enable row level security;

-- Le gerant de salle peut voir/gerer les notifications de sa salle
create policy "Salle owner can view notifications" on public.notifications for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can manage notifications" on public.notifications for all
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));

-- Le combattant peut voir ses propres notifications (pour l'app combattant plus tard)
create policy "Fighter can view own notifications" on public.notifications for select
  using (combattant_id in (select id from public.combattants where user_id = auth.uid()));
create policy "Fighter can update own notifications" on public.notifications for update
  using (combattant_id in (select id from public.combattants where user_id = auth.uid()));
