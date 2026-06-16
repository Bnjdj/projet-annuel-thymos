-- ═══════════════════════════════════════════
-- THYMOS — Suivi des blessures
-- Table + RLS. À exécuter dans le SQL Editor Supabase.
-- ═══════════════════════════════════════════

create table if not exists public.blessures (
  id uuid default gen_random_uuid() primary key,
  combattant_id uuid references public.combattants(id) on delete cascade not null,
  salle_id uuid references public.salles(id) on delete cascade not null,
  type text not null,                       -- ex: 'Entorse', 'Fracture', 'Contusion', 'Déchirure'...
  zone text,                                -- ex: 'Genou', 'Épaule', 'Main', 'Côtes'...
  gravite text not null default 'legere' check (gravite in ('legere', 'moderee', 'severe')),
  date_blessure date not null,
  date_retour_estimee date,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'retabli')),
  notes text,
  created_at timestamptz default now()
);

create index if not exists blessures_combattant_idx on public.blessures(combattant_id);

alter table public.blessures enable row level security;

create policy "Salle owner can view blessures" on public.blessures for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can manage blessures" on public.blessures for all
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
