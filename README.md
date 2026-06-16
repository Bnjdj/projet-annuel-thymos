# THYMOS

> Plateforme de gestion pour coachs et salles de MMA — suivi physique, mental, préparation aux combats, planning et alertes automatiques. L'outil pensé pour les coachs qui gèrent de 3 à 30 combattants et ne peuvent pas tout retenir de tête.

THYMOS (du grec *thymos*, « le cœur du guerrier ») est un SaaS web qui centralise le suivi des combattants : dossiers physiques et mentaux, historique de combats, planning d'entraînement et détection automatique des signaux faibles (mental en baisse, poids en retard).

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | HTML5 / CSS3 / JavaScript vanilla (ES6+) — **aucun framework, aucun build step** |
| Backend | [Supabase](https://supabase.com) — PostgreSQL 15+, Auth (email/mot de passe), RLS, fonctions RPC |
| Paiements | Stripe **Payment Links** (mode test) |
| Graphiques | [Chart.js](https://www.chartjs.org) 4.4.7 — progression sur la fiche combattant |
| Animations | [GSAP](https://gsap.com) 3.12.7 + ScrollTrigger — landing page uniquement |
| IA Coach | Ollama local (Llama 3.1 8B) — *expérimental, non déployé* |
| Polices | Google Fonts — Cinzel (titres) + Inter (corps) |
| Dépendances | Chargées via CDN jsDelivr (Supabase SDK pinné `@2.50.0`, GSAP, Chart.js) |
| Hébergement | Netlify (statique) aujourd'hui — **migration vers un hébergement local prévue** |

Tout le rendu est fait côté client : pas de serveur Node/Express, pas de SSR. Supabase gère l'authentification, la base de données et les permissions (RLS) ; Stripe gère les paiements via redirection externe.

---

## ✨ Fonctionnalités

### ✅ Disponibles

- **Authentification** — inscription, connexion, mot de passe oublié (Supabase Auth) ; création automatique du profil et de la salle à l'inscription.
- **Dashboard** — KPIs, table des combattants, panneaux alertes / combats / sparring, onboarding si la salle est vide.
- **Combattants (CRUD)** — ajout, édition, suppression, filtres (statut, catégorie, recherche), table triable.
- **Fiche combattant** — suivi physique, mental et historique de combats, scores visualisés (rings SVG + graphiques Chart.js), export PDF.
- **Planning** — calendrier mensuel, création de séances, export `.ics` (Apple Calendar / Google Calendar / Outlook).
- **Combats** — liste des combats à venir et passés, CRUD, compte à rebours J-X, enregistrement du résultat (met à jour le record du combattant).
- **Alertes automatiques** — générées quand les scores passent sous un seuil ; lecture et résolution.
- **Questionnaire hebdomadaire** — suivi régulier de l'état du combattant.
- **Paramètres** — profil de la salle, logo et image de fond, équipe, abonnement, notifications, sécurité.

### 🔜 À venir

- **IA Coach** — assistant conversationnel (migration d'Ollama local vers l'API Claude, repoussée).
- **Camps de préparation** — structuration et planification des camps.
- **Sparring intelligent** — matching automatique des partenaires d'entraînement.
- **Analyse vidéo** — analyse IA de sparrings et de techniques.
- **Notifications email / SMS** — actuellement seules les notifications in-app existent.
- **Authentification à deux facteurs (2FA)**.
- **Paiement en ligne** — webhook Stripe + activation automatique des plans payants (le parcours de paiement n'est pas encore branché de bout en bout).


---

## 📁 Structure du projet

```text
ares-platform/
├── index.html              # Landing page publique (pricing, features, FAQ)
├── connexion.html          # Authentification (login / register / mot de passe oublié)
├── dashboard.html          # Tableau de bord coach (protégé)
├── combattants.html        # Liste des combattants + CRUD (protégé)
├── combattant.html         # Fiche détail par ?id=… (protégé)
├── planning.html           # Calendrier + création de séances (protégé)
├── combats.html            # Historique & planning des combats (protégé)
├── alertes.html            # Alertes auto-générées (protégé)
├── sparring.html           # Suggestions de sparring (protégé)
├── parametres.html         # Réglages de la salle (protégé)
├── paiement.html           # Résumé du plan (neutralisée — voir AUDIT)
├── activation.html         # Activation post-paiement (protégé)
├── admin.html              # Panneau d'administration BDD (protégé + RPC admin)
├── mentions-legales.html   # Pages légales
├── cgu.html
├── confidentialite.html    # Politique de confidentialité (RGPD)
│
├── css/
│   ├── style.css           # Tokens, reset, composants globaux
│   ├── dashboard.css       # Layout sidebar / panneaux / KPIs / modals
│   ├── combattant.css      # Fiche combattant, rings SVG, onglets
│   ├── landing.css         # Hero, sections, pricing, responsive
│   ├── animations.css      # Keyframes, transitions
│   ├── ia-coach.css        # Styles du chat IA
│   └── enhancements.css    # Couche d'accessibilité / micro-interactions (chargée en dernier)
│
├── js/
│   ├── supabase-config.js  # Initialise le client Supabase (expose window.supabase)
│   ├── security.js         # escapeHtml, sanitizeUrl, isAdmin()
│   ├── auth.js             # UI login / register / mot de passe oublié
│   ├── auth-guard.js       # Protège les pages, expose thymosUser (figé via Object.freeze)
│   ├── api.js              # Couche CRUD Supabase (toutes les tables)
│   ├── plan-guard.js       # Restriction des fonctionnalités par plan
│   ├── toast.js            # Notifications toast + confirmModal
│   ├── main.js             # Navigation, menu burger, scroll reveals
│   ├── landing-animations.js # GSAP ScrollTrigger (landing)
│   ├── page-dashboard.js   # Rendu du dashboard + onboarding
│   ├── page-combattants.js # Liste + filtres combattants
│   ├── page-combattant.js  # Fiche détail + Chart.js
│   ├── modal-fighter.js    # Modal ajout / édition combattant
│   ├── modal-combat.js     # Modal ajout / édition combat
│   ├── ia-coach.js         # Chat IA (Ollama) + RAG
│   ├── sidebar-badges.js   # Compteurs combattants / alertes dans la sidebar
│   ├── settings-loader.js  # Charge les réglages de la salle (logo, nom, fond)
│   └── combattant.js       # Constantes & helpers combattants
│
├── supabase/               # Schémas et migrations SQL (à exécuter dans le SQL Editor)
│   ├── schema.sql          # Tables de base + RLS + triggers d'auth
│   ├── update-plans.sql    # Mise à jour de la contrainte sur les plans
│   ├── admin-check.sql     # Table admin_users + fonction is_admin()
│   ├── notifications.sql   # Table notifications
│   ├── plan-limits.sql     # Fonction check_plan_limit()
│   ├── activate-plan.sql   # Fonction activate_plan() (plan gratuit uniquement)
│   ├── verify-payment.sql  # Table stripe_payments + verify_and_activate_plan()
│   └── admin-functions.sql # Fonctions de lecture admin (protégées par is_admin())
│
├── ia/                     # IA Coach (expérimental, non déployé)
│   ├── Modelfile           # Configuration Ollama (Llama 3.1 8B)
│   ├── system-prompt.md    # Prompt expert MMA
│   ├── mma-knowledge.json  # Base de connaissances MMA
│   ├── knowledge/          # Sources RAG (techniques, combattants, préparation…)
│   ├── server.py           # Proxy d'analyse vidéo
│   └── video-analyzer.py   # Analyse vidéo IA (futur)
│
├── assets/                 # Ressources statiques (images, favicon…)
├── server.py               # Serveur de dev statique local (Python)
├── start-local.bat         # Lance server.py (Windows)
├── netlify.toml            # En-têtes CSP, stratégie de cache, redirections
├── robots.txt / sitemap.xml
│
```

> Les fichiers `*-backup.html`, `landing-v2-backup.css` et le design system v3 (`_system.html`, `tokens.css`, `components.css`, `landing-v3.css`) ne sont pas servis en production.

---

## 🚀 Démarrage local

### Prérequis

- **Python 3** (pour le serveur de développement statique).
- Un **projet Supabase** configuré (PostgreSQL + Auth).
- Un navigateur moderne.

### 1. Configurer Supabase

Renseignez vos identifiants dans `js/supabase-config.js` :

```js
const SUPABASE_URL = 'https://VOTRE-PROJET.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-anon-publique';
```

> Seule la clé **anon (publique)** doit figurer ici. Ne committez jamais de clé `service_role`.

### 2. Initialiser la base de données

Dans le **SQL Editor** de Supabase, exécutez les fichiers de `supabase/` dans cet ordre :

1. `schema.sql` — tables de base, RLS et triggers d'authentification
2. `update-plans.sql` — contrainte sur les noms de plans
3. `admin-check.sql` — `is_admin()` (requis par les fonctions admin)
4. `notifications.sql` — table des notifications
5. `plan-limits.sql` — `check_plan_limit()`
6. `activate-plan.sql` — `activate_plan()` (plan gratuit uniquement)
7. `verify-payment.sql` — `stripe_payments` + `verify_and_activate_plan()`
8. `admin-functions.sql` — fonctions de lecture admin (protégées par `is_admin()`)

> ⚠️ Si la confirmation d'email est activée dans Supabase, confirmez manuellement un nouveau compte
> (`UPDATE auth.users SET email_confirmed_at = now() WHERE email = '...';`) ou désactivez-la dans
> *Authentication → Providers → Email*.

### 3. Lancer le serveur statique

```bash
python server.py
```

ou, sous Windows, double-cliquez sur **`start-local.bat`**.

Le site est servi sur **http://localhost:8080** (le navigateur s'ouvre automatiquement). Le serveur applique des en-têtes de sécurité (CSP, X-Frame-Options…) et bloque l'accès aux fichiers internes (`.sql`, `.py`, `.bat`, `.md`, backups).

---

## 🗄️ Base de données

Les schémas et migrations sont versionnés dans **`supabase/*.sql`** et destinés à être exécutés dans le **SQL Editor** de Supabase (dans l'ordre indiqué ci-dessus). Le modèle couvre les profils, salles, membres, combattants, combats, alertes, questionnaires, suggestions de sparring, camps, séances et notifications, avec **RLS activée** (policies scopées par propriétaire) et plusieurs fonctions **RPC** (`is_admin`, `check_plan_limit`, `activate_plan`, `verify_and_activate_plan`).

---

## 📐 Conventions

- **Fichiers** : `kebab-case` (`page-dashboard.js`, `modal-fighter.js`, `admin-check.sql`).
- **CSS** : nommage *BEM-like* (`.pcard__header`, `.btn--primary`).
- **JavaScript** : pas de modules ES — tout est exposé via `window`, scope isolé par IIFE.
- **Pas de build step** : aucun bundler ; les dépendances externes sont chargées par CDN.
- **HTML** : une page = un fichier ; `auth-guard.js` est inclus sur toutes les pages protégées.
- **SQL** : un fichier = une migration, nommé par fonction.
- **Git** : la branche **`dev`** porte le travail courant.

---



---

*Projet privé — THYMOS.*
