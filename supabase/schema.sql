-- ═══════════════════════════════════════════
-- THYMOS PLATFORM — DATABASE SCHEMA
-- Run this in Supabase SQL Editor (supabase.com > SQL Editor)
-- ═══════════════════════════════════════════

-- ─── PROFILES (extends auth.users) ──────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text not null default '',
  last_name text not null default '',
  role text not null default 'owner' check (role in ('owner', 'coach', 'fighter', 'mental_coach')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'owner')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── SALLES (gyms) ─────────────────────────
create table public.salles (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique,
  description text,
  address text,
  city text,
  zip_code text,
  phone text,
  email text,
  website text,
  instagram text,
  facebook text,
  youtube text,
  logo_url text,
  bg_image_url text,
  bg_opacity int default 8,
  plan text default 'decouverte' check (plan in ('decouverte', 'guerrier', 'champion')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create salle on signup (if gym_name provided)
create or replace function public.handle_new_salle()
returns trigger as $$
begin
  if new.raw_user_meta_data->>'gym_name' is not null then
    insert into public.salles (owner_id, name)
    values (new.id, new.raw_user_meta_data->>'gym_name');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_salle
  after insert on auth.users
  for each row execute procedure public.handle_new_salle();

-- ─── SALLE MEMBERS (team) ──────────────────
create table public.salle_members (
  id uuid default gen_random_uuid() primary key,
  salle_id uuid references public.salles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  email text, -- for pending invites
  role text not null default 'coach' check (role in ('owner', 'coach', 'mental_coach')),
  status text default 'active' check (status in ('active', 'pending', 'inactive')),
  created_at timestamptz default now()
);

-- ─── COMBATTANTS ────────────────────────────
create table public.combattants (
  id uuid default gen_random_uuid() primary key,
  salle_id uuid references public.salles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null, -- optional: fighter can have own account
  first_name text not null,
  last_name text not null,
  age int,
  city text,
  style text check (style in ('striker', 'grappler', 'mma_complet')),
  weight_category text, -- '-70 kg', '-84 kg', etc.
  current_weight numeric(5,1),
  status text default 'training' check (status in ('camp', 'training', 'rest', 'injured')),
  record_wins int default 0,
  record_losses int default 0,
  record_draws int default 0,
  avatar_url text,
  avatar_color text default '#6b0000',
  -- Physical scores
  score_physique int default 70,
  score_cardio int default 70,
  score_force int default 70,
  score_vitesse int default 70,
  score_endurance int default 70,
  score_recuperation int default 70,
  score_flexibilite int default 70,
  -- Mental scores
  score_mental int default 70,
  score_confiance int default 70,
  score_stress int default 70,
  score_focus int default 70,
  score_motivation int default 70,
  score_resilience int default 70,
  score_controle_emotionnel int default 70,
  -- Nutrition
  calories_jour int,
  proteines_jour int,
  hydratation numeric(3,1),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── COMBATS ────────────────────────────────
create table public.combats (
  id uuid default gen_random_uuid() primary key,
  salle_id uuid references public.salles(id) on delete cascade not null,
  combattant_id uuid references public.combattants(id) on delete cascade not null,
  opponent_name text not null,
  opponent_weight_category text,
  event_name text,
  event_location text,
  fight_date date not null,
  weight_category text,
  -- Result (null if upcoming)
  result text check (result in ('win', 'loss', 'draw', 'nc', null)),
  method text, -- 'KO', 'TKO', 'Soumission', 'Decision unanime', etc.
  round int,
  time text, -- '3:42'
  -- Scores
  readiness_score int default 50,
  -- Analysis
  strengths text[], -- array of strings
  weaknesses text[],
  strike_accuracy int,
  strikes_landed int,
  strikes_received int,
  takedowns_landed int,
  takedowns_received int,
  has_video boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- ─── ALERTES ────────────────────────────────
create table public.alertes (
  id uuid default gen_random_uuid() primary key,
  salle_id uuid references public.salles(id) on delete cascade not null,
  combattant_id uuid references public.combattants(id) on delete cascade not null,
  level text not null check (level in ('critical', 'warning', 'info')),
  category text not null, -- 'mental', 'physique', 'poids', 'blessure'
  title text not null,
  message text not null,
  recommendations text[],
  is_resolved boolean default false,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- ─── QUESTIONNAIRES ─────────────────────────
create table public.questionnaires (
  id uuid default gen_random_uuid() primary key,
  combattant_id uuid references public.combattants(id) on delete cascade not null,
  salle_id uuid references public.salles(id) on delete cascade not null,
  -- Responses (1-10 scale)
  feeling_physique int check (feeling_physique between 1 and 10),
  feeling_confiance int check (feeling_confiance between 1 and 10),
  feeling_apprehensions int check (feeling_apprehensions between 1 and 10),
  feeling_motivation int check (feeling_motivation between 1 and 10),
  -- Free text
  text_physique text,
  text_confiance text,
  text_apprehensions text,
  text_motivation text,
  completed_at timestamptz default now()
);

-- ─── SPARRING SUGGESTIONS ───────────────────
create table public.sparring_suggestions (
  id uuid default gen_random_uuid() primary key,
  salle_id uuid references public.salles(id) on delete cascade not null,
  fighter_a_id uuid references public.combattants(id) on delete cascade not null,
  fighter_b_id uuid references public.combattants(id) on delete cascade not null,
  compatibility_score int default 50,
  reasons text[],
  restriction text,
  is_priority boolean default false,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'scheduled')),
  scheduled_date date,
  feedback text, -- 'positif', 'difficile', 'excellent', etc.
  created_at timestamptz default now()
);

-- ─── CAMP DE PREPARATION ────────────────────
create table public.camps (
  id uuid default gen_random_uuid() primary key,
  combattant_id uuid references public.combattants(id) on delete cascade not null,
  combat_id uuid references public.combats(id) on delete set null,
  salle_id uuid references public.salles(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  total_weeks int,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

create table public.camp_weeks (
  id uuid default gen_random_uuid() primary key,
  camp_id uuid references public.camps(id) on delete cascade not null,
  week_number int not null,
  title text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'done', 'alert', 'current')),
  alert_note text,
  created_at timestamptz default now()
);

-- ─── PLANNING / SESSIONS ────────────────────
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  salle_id uuid references public.salles(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('frappe', 'grappling', 'cardio', 'muscu', 'sparring', 'physio', 'autre')),
  session_date date not null,
  start_time time not null,
  end_time time not null,
  notes text,
  created_at timestamptz default now()
);

create table public.session_participants (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  combattant_id uuid references public.combattants(id) on delete cascade not null,
  role text default 'participant', -- 'participant', 'sparring_a', 'sparring_b'
  unique(session_id, combattant_id)
);

-- ═══ ROW LEVEL SECURITY ═════════════════════

alter table public.profiles enable row level security;
alter table public.salles enable row level security;
alter table public.salle_members enable row level security;
alter table public.combattants enable row level security;
alter table public.combats enable row level security;
alter table public.alertes enable row level security;
alter table public.questionnaires enable row level security;
alter table public.sparring_suggestions enable row level security;
alter table public.camps enable row level security;
alter table public.camp_weeks enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Salles: owner can CRUD
create policy "Owner can view own salles" on public.salles for select using (owner_id = auth.uid());
create policy "Owner can insert salles" on public.salles for insert with check (owner_id = auth.uid());
create policy "Owner can update own salles" on public.salles for update using (owner_id = auth.uid());
create policy "Owner can delete own salles" on public.salles for delete using (owner_id = auth.uid());

-- Combattants: salle owner/members can access
create policy "Salle owner can view combattants" on public.combattants for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can insert combattants" on public.combattants for insert
  with check (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can update combattants" on public.combattants for update
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can delete combattants" on public.combattants for delete
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));

-- Combats: same pattern
create policy "Salle owner can view combats" on public.combats for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can manage combats" on public.combats for all
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));

-- Alertes
create policy "Salle owner can view alertes" on public.alertes for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can manage alertes" on public.alertes for all
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));

-- Questionnaires
create policy "Salle owner can view questionnaires" on public.questionnaires for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can manage questionnaires" on public.questionnaires for all
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));

-- Sparring suggestions
create policy "Salle owner can view sparring" on public.sparring_suggestions for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can manage sparring" on public.sparring_suggestions for all
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));

-- Camps
create policy "Salle owner can view camps" on public.camps for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can manage camps" on public.camps for all
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));

-- Camp weeks
create policy "Salle owner can view camp weeks" on public.camp_weeks for select
  using (camp_id in (select id from public.camps where salle_id in (select id from public.salles where owner_id = auth.uid())));
create policy "Salle owner can manage camp weeks" on public.camp_weeks for all
  using (camp_id in (select id from public.camps where salle_id in (select id from public.salles where owner_id = auth.uid())));

-- Sessions
create policy "Salle owner can view sessions" on public.sessions for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can manage sessions" on public.sessions for all
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));

-- Session participants
create policy "Salle owner can view session participants" on public.session_participants for select
  using (session_id in (select id from public.sessions where salle_id in (select id from public.salles where owner_id = auth.uid())));
create policy "Salle owner can manage session participants" on public.session_participants for all
  using (session_id in (select id from public.sessions where salle_id in (select id from public.salles where owner_id = auth.uid())));

-- Salle members
create policy "Salle owner can view members" on public.salle_members for select
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
create policy "Salle owner can manage members" on public.salle_members for all
  using (salle_id in (select id from public.salles where owner_id = auth.uid()));
