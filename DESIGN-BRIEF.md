# THYMOS Platform — Brief Design Complet

## Le projet

THYMOS est une plateforme SaaS B2B pour les coachs et salles de MMA en France. C'est l'outil de gestion et de suivi des combattants : physique, mental, preparation combat, planning, alertes automatiques, et IA Coach.

Le nom vient du grec "Thymos" (le coeur du guerrier). Le positionnement : premium, sobre, guerrier mais professionnel. Pas du flashy UFC, mais du prestige dark — comme un outil de coach serieux avec une ame de combattant.

Marche cible : coachs MMA / boxe / sports de combat en France qui gerent entre 3 et 30 combattants.

## Branding actuel

- **Nom** : THYMOS
- **Baseline** : "L'outil qui manque aux coachs MMA"
- **Favicon** : TM rouge sur fond noir
- **Easter egg** : "MOLON LABE" cache dans le footer (reference spartiate)

### Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#080808` / `#141414` | Fond principal |
| Surface | `#1c1c1c` | Cards, panels |
| Surface 2 | `#242424` | Headers de tables, zones secondaires |
| Surface 3 | `#2c2c2c` | Boutons secondaires |
| Border | `#363636` | Bordures |
| Rouge sang | `#C1121F` | CTA, accents, alertes, identite forte |
| Rouge dim | `rgba(193,18,31,0.12)` | Backgrounds d'accentuation |
| Or | `#B8960C` | Plan Elite, details premium |
| Or clair | `#D4AF37` | Variations dorées |
| Blanc chaud | `#F0EDE8` | Texte principal (pas blanc pur) |
| Muted | `#A0A0A0` | Texte secondaire |
| Subtle | `#606060` | Texte tertiaire, placeholders |

### Typographie

| Usage | Font | Poids |
|-------|------|-------|
| Titres, nav, labels | Cinzel (serif display) | 400, 600, 700, 900 |
| Corps, boutons, donnees | Inter (sans-serif) | 300, 400, 500, 600, 700 |

### Icones

SVG sprite inline (pas de librairie externe). Style stroke, 1.5px, rounded caps. Tailles : sm (14px), md (18px), lg (22px), xl (28px).

### Border radius

- `4px` (petits elements)
- `6px` (boutons)
- `8px` (cards, panels)
- `12px` / `16px` / `20px` (landing page, gros blocs)

### Animations

- GPU-accelerated (`transform3d`, `will-change`)
- Easing spring : `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Easing out expo : `cubic-bezier(0.16, 1, 0.3, 1)`
- Scroll reveal stagger (60ms entre siblings)
- Compteurs KPI animes
- Transitions de page (fade + translateY)
- `prefers-reduced-motion` respecte

## Stack technique

- **Frontend** : HTML/CSS/JS statique (pas de framework)
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Paiements** : Stripe Payment Links
- **Fonts** : Google Fonts (Cinzel + Inter)
- **CSS** : Vanilla, 3 fichiers (style.css, dashboard.css, landing.css, animations.css)
- **Pas de** : React, Tailwind, SCSS, composants reutilisables

## Pages existantes (15 pages)

### Landing page (`index.html`)
Page publique de vente. Sections :
- Hero avec mockup interactif du dashboard (typewriter IA)
- "Le probleme" — 3 scenarios concrets de coach (cards)
- "C'est pour vous si" — checklist de reconnaissance
- "Fonctionnalites" — grille 7 features (bento-style, une card hero + 6 normales)
- "Avant/Apres" — comparaison 2 colonnes
- "Comment ca marche" — 3 etapes connectees
- "Tarifs" — 3 cards (Decouverte 0EUR / Pro 59EUR / Elite 129EUR) avec toggle mensuel/annuel
- FAQ — 8 questions/reponses
- CTA final
- Footer compact + MOLON LABE
- Sticky CTA mobile en bas

### Connexion (`connexion.html`)
3 cards switchables : Login / Register / Mot de passe oublie. Indicateur de force du mot de passe. Eye toggle. Gestion des redirections post-paiement.

### Dashboard (`dashboard.html`)
Layout sidebar + contenu principal.
- Sidebar : logo, nom salle, avatar, navigation groupee (Ma salle / Gestion / Outils), cadenas sur features lockees par plan, footer deconnexion
- Contenu : 4 KPIs animes, table combattants (8 max), panel alertes, panel combats a venir, mini chat IA, panel sparring
- Topbar mobile avec burger

### Liste combattants (`combattants.html`)
Table complete avec :
- 4 KPIs (camp, entrainement, blesses, mental moyen)
- Filtres (statut, categorie, recherche)
- Colonnes : avatar+nom, poids, style, statut (badge couleur), score physique (mini bar), score mental (mini bar), prochain combat, record V/D
- Boutons : voir fiche, modifier, supprimer
- Modal ajout/modification combattant

### Fiche combattant (`combattant.html`)
Page dynamique par `?id=`. Structure :
- Header : gros avatar, nom, record, statut, details (age, style, poids, ville)
- 4 rings SVG animes (physique, mental, preparation, poids)
- 5 onglets :
  - **Physique** : 6 barres de score + panel poids/nutrition
  - **Mental** : 6 barres de score + alerte si bas + analyse IA
  - **Combats** : historique avec cards V/D/N
  - **Camp** : preparation combat (verrouille si plan insuffisant)
  - **IA Coach** : chat avec l'IA (verrouille si plan insuffisant)
- Bouton modifier les scores (modal avec sliders range)

### Planning (`planning.html`)
Calendrier style Apple Calendar. Vue mensuelle. Clic sur un jour = popup creation seance. Types : frappe, grappling, cardio, muscu, sparring, physio, autre. Selection participants. Export .ics.

### Combats (`combats.html`)
Liste des combats programmes et passes. Cards avec countdown J-X, infos adversaire, barre de readiness.

### Alertes (`alertes.html`)
Alertes auto generees quand scores < seuil. Niveaux : critical (rouge), warning (orange), info. Bouton resoudre.

### Sparring (`sparring.html`)
Suggestions de paires de sparring (future feature IA).

### Parametres (`parametres.html`)
- Profil salle (nom, adresse, contact, reseaux sociaux)
- Upload logo + image de fond (avec slider opacite)
- Equipe (inviter des coachs)
- Abonnement (plan actuel, boutons upgrade, resilier)
- Notifications
- Securite (changer mot de passe)

### Paiement (`paiement.html`)
Resume du plan choisi + redirection Stripe.

### Activation (`activation.html`)
Page post-paiement pour activer le plan via Stripe.

### Admin (`admin.html`)
Panel admin reserve. KPIs globaux, tables BDD (salles, users, fighters, sessions, notifs), SQL libre (SELECT only), actions rapides (export JSON, confirmer emails, supprimer), liens externes (Supabase, Stripe, Netlify).

### Pages legales
- Mentions legales (`mentions-legales.html`)
- CGU 12 articles (`cgu.html`)
- Politique de confidentialite RGPD (`confidentialite.html`)

## Design system actuel — points forts

- **Dark mode premium** qui se demarque des SaaS classiques blanc/bleu
- **Animations soignees** (scroll reveal, stagger, GPU-accelerated)
- **Responsive mobile** sur toutes les pages
- **Sidebar avec feature gating** visuel (cadenas)
- **Mockup interactif** dans le hero (pas une image statique)
- **Coherence** du branding guerrier sans tomber dans le kitsch

## Design system actuel — points a ameliorer potentiels

- Les tables de donnees sont fonctionnelles mais basiques
- Pas de dark/light mode toggle
- Pas de micro-animations sur les interactions (hover states, focus)
- Le design est 100% code CSS vanilla — pas de design system componentise
- Les modals pourraient etre plus riches visuellement
- Le planning est fonctionnel mais n'a pas le polish d'un vrai calendrier
- Pas de graphiques/charts (Chart.js prevu mais pas implemente)
- Le hero mockup est en HTML/CSS, pas une vraie capture d'ecran
- Les pages legales sont du texte brut sans mise en forme speciale
- Mobile : la sidebar en overlay est OK mais pourrait etre plus fluide

## Structure des fichiers CSS

```
css/
  style.css       — Reset, tokens, composants globaux (boutons, badges, nav, footer)
  dashboard.css   — Layout sidebar/main, panels, tables, KPIs, scores
  landing.css     — Hero, sections landing, pricing cards, FAQ, bento grid
  animations.css  — Keyframes, scroll reveal, transitions, reduced motion
  combattant.css  — Fiche combattant (header, rings, onglets, scores)
```

## Ce que je cherche

Des recommandations et ameliorations concretes sur le design UI/UX du site, en respectant :
- L'identite "Dark Prestige / Guerrier Grec" (ne pas partir sur du blanc/bleu corporate)
- La stack actuelle (HTML/CSS/JS vanilla, pas de framework)
- Le mobile-first
- La cible : des coachs MMA qui ne sont pas des geeks — l'interface doit etre ultra simple et intuitive

Le site est visible en local sur http://localhost:8080 (15 pages fonctionnelles).
