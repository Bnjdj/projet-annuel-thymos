/* ═══════════════════════════════════════════
   THYMOS — API.JS
   Supabase CRUD layer for all data operations
════════════════════════════════════════════ */

const db = window.supabase;

// ─── CURRENT USER & SALLE ───────────────────
let _currentSalle = null;

async function getCurrentSalle() {
  if (_currentSalle) return _currentSalle;
  const { data, error } = await db.from('salles').select('*').limit(1).maybeSingle();
  if (error) { console.warn('getSalle error:', error); return null; }
  _currentSalle = data;
  return data;
}

function clearSalleCache() { _currentSalle = null; }

// ─── COMBATTANTS ────────────────────────────
async function getCombattants(salleId) {
  const { data, error } = await db
    .from('combattants')
    .select('*')
    .eq('salle_id', salleId)
    .order('created_at', { ascending: false });
  if (error) { console.warn('getCombattants:', error); return []; }
  return data;
}

async function getCombattant(id) {
  const { data, error } = await db
    .from('combattants')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.warn('getCombattant:', error); return null; }
  return data;
}

async function createCombattant(salleId, fighter) {
  // Server-side plan limit check before insert (2nd barrier after the UI pre-check).
  // A technical RPC failure (e.g. network) is logged but does NOT block creation;
  // only an explicit allowed === false from the server blocks the insert.
  const { data: limitCheck, error: limitErr } = await db.rpc('check_plan_limit', { action_type: 'add_fighter' });
  if (limitErr) { console.warn('check_plan_limit:', limitErr); }
  if (limitCheck && limitCheck.allowed === false) {
    return { error: { message: limitCheck.error || 'Limite de combattants atteinte pour votre plan.' } };
  }

  const { data, error } = await db
    .from('combattants')
    .insert({ salle_id: salleId, ...fighter })
    .select()
    .single();
  if (error) { console.warn('createCombattant:', error); return { error }; }
  return { data };
}

async function updateCombattant(id, updates) {
  const { data, error } = await db
    .from('combattants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) { console.warn('updateCombattant:', error); return { error }; }
  return { data };
}

async function deleteCombattant(id) {
  const { error } = await db.from('combattants').delete().eq('id', id);
  if (error) { console.warn('deleteCombattant:', error); return { error }; }
  return { success: true };
}

// ─── COMBATS ────────────────────────────────
async function getCombats(salleId, { upcoming = false } = {}) {
  let query = db.from('combats').select('*, combattants(first_name, last_name, weight_category, style, avatar_color)').eq('salle_id', salleId);
  if (upcoming) {
    query = query.gte('fight_date', new Date().toISOString().split('T')[0]).order('fight_date', { ascending: true });
  } else {
    query = query.order('fight_date', { ascending: false });
  }
  const { data, error } = await query;
  if (error) { console.warn('getCombats:', error); return []; }
  return data;
}

async function createCombat(salleId, combat) {
  const { data, error } = await db.from('combats').insert({ salle_id: salleId, ...combat }).select().single();
  if (error) { console.warn('createCombat:', error); return { error }; }
  return { data };
}

async function updateCombat(id, updates) {
  const { data, error } = await db.from('combats').update(updates).eq('id', id).select().single();
  if (error) { console.warn('updateCombat:', error); return { error }; }
  return { data };
}

async function deleteCombat(id) {
  const { error } = await db.from('combats').delete().eq('id', id);
  if (error) { console.warn('deleteCombat:', error); return { error }; }
  return { success: true };
}

// ─── ALERTES ────────────────────────────────
async function getAlertes(salleId, { resolved = false } = {}) {
  const { data, error } = await db
    .from('alertes')
    .select('*, combattants(first_name, last_name, avatar_color)')
    .eq('salle_id', salleId)
    .eq('is_resolved', resolved)
    .order('created_at', { ascending: false });
  if (error) { console.warn('getAlertes:', error); return []; }
  return data;
}

async function resolveAlerte(id) {
  const { error } = await db.from('alertes').update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
  if (error) { console.warn('resolveAlerte:', error); return { error }; }
  return { success: true };
}

// ─── QUESTIONNAIRES ─────────────────────────
async function createQuestionnaire(salleId, questionnaire) {
  const { data, error } = await db.from('questionnaires').insert({ salle_id: salleId, ...questionnaire }).select().single();
  if (error) { console.warn('createQuestionnaire:', error); return { error }; }
  return { data };
}

async function getQuestionnaires(combattantId) {
  const { data, error } = await db
    .from('questionnaires')
    .select('*')
    .eq('combattant_id', combattantId)
    .order('completed_at', { ascending: false });
  if (error) { console.warn('getQuestionnaires:', error); return []; }
  return data;
}

// ─── CAMPS DE PREPARATION ───────────────────
async function getCamps(combattantId) {
  const { data, error } = await db
    .from('camps')
    .select('*, camp_weeks(*)')
    .eq('combattant_id', combattantId)
    .order('start_date', { ascending: false });
  if (error) { console.warn('getCamps:', error); return []; }
  return data;
}

async function createCamp(salleId, camp) {
  const { data, error } = await db
    .from('camps')
    .insert({ salle_id: salleId, ...camp })
    .select()
    .single();
  if (error) { console.warn('createCamp:', error); return { error }; }
  return { data };
}

async function createCampWeek(week) {
  const { data, error } = await db.from('camp_weeks').insert(week).select().single();
  if (error) { console.warn('createCampWeek:', error); return { error }; }
  return { data };
}

async function updateCampWeek(id, updates) {
  const { data, error } = await db.from('camp_weeks').update(updates).eq('id', id).select().single();
  if (error) { console.warn('updateCampWeek:', error); return { error }; }
  return { data };
}

async function deleteCamp(id) {
  const { error } = await db.from('camps').delete().eq('id', id);
  if (error) { console.warn('deleteCamp:', error); return { error }; }
  return { success: true };
}

// ─── BLESSURES ──────────────────────────────
async function getBlessures(combattantId) {
  const { data, error } = await db
    .from('blessures')
    .select('*')
    .eq('combattant_id', combattantId)
    .order('date_blessure', { ascending: false });
  if (error) { console.warn('getBlessures:', error); return []; }
  return data;
}

async function createBlessure(salleId, blessure) {
  const { data, error } = await db
    .from('blessures')
    .insert({ salle_id: salleId, ...blessure })
    .select()
    .single();
  if (error) { console.warn('createBlessure:', error); return { error }; }
  return { data };
}

async function updateBlessure(id, updates) {
  const { data, error } = await db.from('blessures').update(updates).eq('id', id).select().single();
  if (error) { console.warn('updateBlessure:', error); return { error }; }
  return { data };
}

async function deleteBlessure(id) {
  const { error } = await db.from('blessures').delete().eq('id', id);
  if (error) { console.warn('deleteBlessure:', error); return { error }; }
  return { success: true };
}

// ─── SPARRING ───────────────────────────────
async function getSparringSuggestions(salleId) {
  const { data, error } = await db
    .from('sparring_suggestions')
    .select('*, fighter_a:combattants!fighter_a_id(*), fighter_b:combattants!fighter_b_id(*)')
    .eq('salle_id', salleId)
    .order('created_at', { ascending: false });
  if (error) { console.warn('getSparringSuggestions:', error); return []; }
  return data;
}

// ─── SESSIONS / PLANNING ────────────────────
async function getSessions(salleId, startDate, endDate) {
  const { data, error } = await db
    .from('sessions')
    .select('*, session_participants(combattant_id, role, combattants(first_name, last_name, avatar_color))')
    .eq('salle_id', salleId)
    .gte('session_date', startDate)
    .lte('session_date', endDate)
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) { console.warn('getSessions:', error); return []; }
  return data;
}

// ─── CREATE SESSION ─────────────────────────
async function createSession(salleId, session) {
  const { data, error } = await db
    .from('sessions')
    .insert({ salle_id: salleId, ...session })
    .select()
    .single();
  if (error) { console.warn('createSession:', error); return { error }; }
  return { data };
}

async function addSessionParticipant(sessionId, combattantId, role = 'participant') {
  const { error } = await db
    .from('session_participants')
    .insert({ session_id: sessionId, combattant_id: combattantId, role });
  if (error) { console.warn('addSessionParticipant:', error); return { error }; }
  return { success: true };
}

async function deleteSession(id) {
  const { error } = await db.from('sessions').delete().eq('id', id);
  if (error) { console.warn('deleteSession:', error); return { error }; }
  return { success: true };
}

// ─── CALENDAR EXPORT (.ics) ──────────────────
function escapeICS(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function generateICS(sessions, salleName) {
  const pad = (n) => String(n).padStart(2, '0');
  const toICSDate = (dateStr, timeStr) => {
    const d = new Date(dateStr + 'T' + timeStr);
    return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//THYMOS Platform//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:THYMOS - ' + escapeICS(salleName || 'Ma Salle'),
  ];

  sessions.forEach(s => {
    const participants = (s.session_participants || [])
      .map(p => p.combattants ? (p.combattants.first_name + ' ' + p.combattants.last_name) : '')
      .filter(Boolean)
      .join(', ');

    ics.push(
      'BEGIN:VEVENT',
      'UID:' + s.id + '@thymos-platform',
      'DTSTART:' + toICSDate(s.session_date, s.start_time || '09:00:00'),
      'DTEND:' + toICSDate(s.session_date, s.end_time || '10:00:00'),
      'SUMMARY:' + escapeICS(s.title || s.type || 'Seance THYMOS'),
      'DESCRIPTION:Type: ' + escapeICS(s.type || '') + (participants ? '\\nParticipants: ' + escapeICS(participants) : '') + (s.notes ? '\\nNotes: ' + escapeICS(s.notes) : ''),
      'CATEGORIES:' + escapeICS((s.type || 'entrainement').toUpperCase()),
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

function downloadICS(sessions, salleName) {
  const content = generateICS(sessions, salleName);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'thymos-planning.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── NOTIFICATIONS ──────────────────────────
async function createNotification(salleId, combattantId, type, title, message, link) {
  const { data, error } = await db
    .from('notifications')
    .insert({ salle_id: salleId, combattant_id: combattantId, type, title, message, link })
    .select()
    .single();
  if (error) { console.warn('createNotification:', error); return { error }; }
  return { data };
}

async function getNotifications(combattantId, { unreadOnly = false } = {}) {
  let query = db
    .from('notifications')
    .select('*')
    .eq('combattant_id', combattantId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (unreadOnly) query = query.eq('is_read', false);
  const { data, error } = await query;
  if (error) { console.warn('getNotifications:', error); return []; }
  return data;
}

async function getNotificationsBySalle(salleId, { limit: lim = 20 } = {}) {
  const { data, error } = await db
    .from('notifications')
    .select('*, combattants(first_name, last_name, avatar_color)')
    .eq('salle_id', salleId)
    .order('created_at', { ascending: false })
    .limit(lim);
  if (error) { console.warn('getNotificationsBySalle:', error); return []; }
  return data;
}

async function markNotificationRead(id) {
  const { error } = await db
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error };
  return { success: true };
}

async function notifySessionParticipants(salleId, session, participantIds) {
  const TYPE_LABELS = {
    frappe: 'Frappe', grappling: 'Grappling', cardio: 'Cardio',
    muscu: 'Musculation', sparring: 'Sparring', physio: 'Physio', autre: 'Seance'
  };
  const typeLabel = TYPE_LABELS[session.type] || 'Seance';
  const dateObj = new Date(session.session_date + 'T12:00:00');
  const dayNames = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const dateStr = dayNames[dateObj.getDay()] + ' ' + dateObj.getDate();
  const startH = (session.start_time || '').substring(0,5).replace(':','h');
  const endH = (session.end_time || '').substring(0,5).replace(':','h');

  const title = typeLabel + ' — ' + dateStr;
  const message = (session.title || typeLabel) + ' le ' + dateStr + ' de ' + startH + ' a ' + endH + '.';

  const promises = participantIds.map(cId =>
    createNotification(salleId, cId, 'session', title, message, 'planning.html')
  );
  await Promise.all(promises);
  return { success: true, count: participantIds.length };
}

// ─── AUTO ALERTS ────────────────────────────
async function checkAndCreateAlerts(salleId, fighter) {
  const alerts = [];
  const name = (fighter.first_name || '') + ' ' + (fighter.last_name || '');

  if (fighter.score_mental && fighter.score_mental < 60) {
    alerts.push({
      salle_id: salleId,
      combattant_id: fighter.id,
      level: fighter.score_mental < 40 ? 'critical' : 'warning',
      category: 'mental',
      title: 'Score mental bas — ' + name,
      message: 'Score mental a ' + fighter.score_mental + '%. Un suivi renforce est recommande.',
      recommendations: [
        'Planifier un entretien individuel avec le coach mental.',
        'Reduire temporairement la charge de sparring intense.',
        'Mettre en place une routine de recuperation et de sommeil.',
      ],
    });
  }
  if (fighter.score_physique && fighter.score_physique < 50) {
    alerts.push({
      salle_id: salleId,
      combattant_id: fighter.id,
      level: fighter.score_physique < 30 ? 'critical' : 'warning',
      category: 'physique',
      title: 'Score physique bas — ' + name,
      message: 'Score physique a ' + fighter.score_physique + '%. Risque de blessure eleve.',
      recommendations: [
        'Alleger l\'intensite des prochaines seances.',
        'Prevoir un bilan avec le preparateur physique ou le physio.',
        'Renforcer le travail de mobilite et de recuperation active.',
      ],
    });
  }
  if (fighter.score_confiance && fighter.score_confiance < 50) {
    alerts.push({
      salle_id: salleId,
      combattant_id: fighter.id,
      level: 'warning',
      category: 'mental',
      title: 'Confiance en baisse — ' + name,
      message: 'Indice de confiance a ' + fighter.score_confiance + '%. Intervention recommandee.',
      recommendations: [
        'Valoriser les progres recents lors du debrief.',
        'Fixer des objectifs courts et atteignables.',
        'Travailler des situations maitrisees pour rebatir la confiance.',
      ],
    });
  }

  // ── Rappel « combat a venir » (J-7) — alerte de niveau info ──
  // On categorise sous 'combat' (distinct de 'mental'/'physique') : l'anti-doublon
  // ci-dessous reste valide (1 alerte info combat active par combattant a la fois).
  // Entierement defensif : toute erreur de requete laisse les autres alertes intactes.
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const horizon = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const { data: upcoming } = await db
      .from('combats')
      .select('opponent_name, event_name, fight_date')
      .eq('salle_id', salleId)
      .eq('combattant_id', fighter.id)
      .is('result', null)
      .gte('fight_date', todayStr)
      .lte('fight_date', horizon)
      .order('fight_date', { ascending: true })
      .limit(1);
    const nextFight = upcoming && upcoming[0];
    if (nextFight) {
      const diffDays = Math.max(0, Math.ceil(
        (new Date(nextFight.fight_date) - today) / (1000 * 60 * 60 * 24)
      ));
      const jLabel = diffDays === 0 ? "aujourd'hui" : 'dans ' + diffDays + ' jour' + (diffDays > 1 ? 's' : '');
      const opp = nextFight.opponent_name ? ' contre ' + nextFight.opponent_name : '';
      alerts.push({
        salle_id: salleId,
        combattant_id: fighter.id,
        level: 'info',
        category: 'combat',
        title: 'Combat a venir — ' + name,
        message: 'Combat ' + jLabel + opp + (nextFight.event_name ? ' (' + nextFight.event_name + ')' : '') + '. Verifier le pic de forme et le poids.',
        recommendations: [
          'Confirmer l\'affutage du poids et l\'hydratation.',
          'Planifier les dernieres seances et la decharge avant le combat.',
          'Valider l\'aptitude (pas de blessure en cours) et le plan tactique.',
        ],
      });
    }
  } catch (combatAlertErr) {
    console.warn('checkAndCreateAlerts (J-7):', combatAlertErr);
  }

  for (const alert of alerts) {
    // Check if similar alert already exists (not resolved)
    const { data: existing } = await db.from('alertes')
      .select('id')
      .eq('combattant_id', alert.combattant_id)
      .eq('category', alert.category)
      .eq('is_resolved', false)
      .limit(1);
    if (!existing || existing.length === 0) {
      await db.from('alertes').insert(alert);
    }
  }
  return alerts.length;
}

// ─── SALLE UPDATE ───────────────────────────
async function updateSalle(id, updates) {
  const { data, error } = await db
    .from('salles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) { console.warn('updateSalle:', error); return { error }; }
  _currentSalle = data;
  return { data };
}

// ─── HELPERS ────────────────────────────────
function getInitials(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '??';
}

function getFullName(fighter) {
  return `${fighter.first_name} ${fighter.last_name}`.trim();
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_LABELS = {
  camp: 'Camp actif',
  training: 'Entraînement',
  rest: 'Repos actif',
  injured: 'Blessé'
};

const STYLE_LABELS = {
  striker: 'Striker',
  grappler: 'Grappler',
  mma_complet: 'MMA complet'
};

const AVATAR_COLORS = [
  '#6b0000', '#123058', '#4a2e00', '#143514', '#2e0848',
  '#3a1800', '#0a3a5c', '#1a3a1a', '#1a1a3a', '#2a2a0a',
  '#3a1400', '#222222'
];

function randomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
