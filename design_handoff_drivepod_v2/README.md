# Brief de refonte visuelle — DrivePod (V2 · Sans artwork)

> **Pour Claude Code CLI.** Tu vas appliquer ce design à un codebase **PWA déjà fonctionnel** (HTML/CSS/JS vanilla + Service Worker). **Ne réécris pas la logique métier.** Tu remplaces uniquement la couche visuelle : tokens (couleurs, typographies, espacements, rayons), structure HTML des écrans, classes CSS des composants. Les fonctionnalités existantes (lecture audio, sync Drive, file d'écoute, captures, hors-ligne, etc.) restent identiques — seul leur habillage change.

---

## 1. À propos des fichiers de référence

Les fichiers dans `reference/` sont des **maquettes haute-fidélité écrites en React JSX**. Elles servent uniquement de **référence visuelle** — ne les copie pas, ne les importe pas dans le projet PWA.

**Ta mission :** recréer ces maquettes dans le stack vanilla existant (HTML/CSS/JS, Service Worker). Tu réutilises les structures DOM, hooks d'événements et IDs déjà en place dans le code de l'utilisateur ; tu changes seulement les classes CSS, le markup décoratif, les variables de couleurs/typo, et l'agencement.

**Fidélité :** Hi-fi. Les couleurs, typographies, espacements, rayons sont définitifs. Reproduis-les au pixel près.

**Variante retenue :** **V2 — Sans artwork.** L'application lit des MP3 issus de PDF / articles convertis en voix (TTS). Aucun de ces fichiers n'a d'image associée. Le player ne montre donc **jamais d'artwork carré**. À la place : titre typographique généreux, source en pill ambre, métriques de lecture (Mots / Pages / Captures), et une carte "passage en cours" optionnelle avec surlignage karaoké du mot lu (si la donnée TTS le permet — sinon, masquer cette carte ; le reste du player tient sans elle).

---

## 2. Identité visuelle

| Token        | Valeur                                                    | Usage                                |
|--------------|-----------------------------------------------------------|--------------------------------------|
| **Nom**      | DrivePod                                                  | Header, splash, install prompt       |
| **Logo**     | Placeholder carré arrondi 88×88, texte mono "LOGO"        | À remplacer par fichier utilisateur  |
| **Ambiance** | Outil de lecture studieuse (Pocket Casts/Overcast genre)  | Pas de gradients, pas de saturation  |
| **Thème**    | Dark par défaut, light disponible                         | `[data-theme="light"]` sur `<html>`  |
| **Typo**     | IBM Plex Sans (UI) + IBM Plex Mono (timestamps, méta)     | Google Fonts, weights 400/500/600/700|
| **Accent**   | Ambre warm — une seule couleur d'accent dans toute l'app | CTA, progression, badges actifs      |

### Palette `oklch()` — copier depuis `tokens.css`

**Dark (par défaut sur `:root`)**

```
--bg:           oklch(0.16 0.006 60)    fond app, warm neutral, jamais pure black
--surface-1:    oklch(0.20 0.006 60)    cartes, header sidebar
--surface-2:    oklch(0.24 0.006 60)    hover, chips inactives
--surface-3:    oklch(0.28 0.006 60)    inputs, séparateurs élevés

--text-1:       oklch(0.96 0.005 75)    primaire — titres, valeurs
--text-2:       oklch(0.78 0.008 75)    secondaire — corps texte
--text-3:       oklch(0.58 0.010 75)    tertiaire — meta, labels CAPS
--text-4:       oklch(0.42 0.010 75)    disabled

--border-1:     oklch(0.30 0.008 60)    séparateurs liste
--border-2:     oklch(0.36 0.008 60)    bordures inputs

--accent:       oklch(0.78 0.09 75)     CTA, progression, currently-playing
--accent-soft:  oklch(0.78 0.09 75 / 0.16)  background highlight, badges
--accent-press: oklch(0.72 0.10 70)     :active state
--accent-text:  oklch(0.18 0.010 60)    texte sur bouton ambre

--success:      oklch(0.72 0.09 155)    OFF (téléchargé), terminé
--danger:       oklch(0.68 0.13 25)     "Vider cache", erreurs
```

**Light (sur `[data-theme="light"]`)** — voir `tokens.css`.

### Typographie

```
Plex Sans 600  32/1.15 -0.02em   Display (rare)
Plex Sans 600  26/1.20 -0.025em  Titre player V2 (sans artwork)
Plex Sans 600  24/1.10 -0.02em   Titre écran desktop
Plex Sans 600  22/1.25 -0.015em  Titre écran mobile
Plex Sans 500  19/1.30 -0.01em   Titre fichier (liste mobile)
Plex Sans 400  16/1.45  0        Body
Plex Sans 500  15/1.35 -0.005em  Titre fichier (liste row)
Plex Sans 500  14/1.30  0        Label
Plex Sans 500  13/1.30  0        Mini-player title
Plex Mono  500  13/1.30  0       Timestamps, durées, méta
Plex Mono  500  11/1.25 +0.06em  Section CAPS labels (ex: "EN LECTURE")
Plex Mono  500  10/1.25 +0.08em  Micro CAPS, badges (ex: "OFF")
```

**Règles** :
- **Tous** les timestamps, durées, compteurs : `font-family: var(--font-mono)` + `font-variant-numeric: tabular-nums`
- **CAPS labels** : `letter-spacing: 0.06em` minimum, mono, color `--text-3`
- **Titres ≥ 20px** : `letter-spacing: -0.02em` ; titres 14-19px : `-0.005em`
- `text-wrap: pretty` sur tous les paragraphes ; `text-wrap: balance` sur les titres multi-lignes

### Espacement & rayons

Échelle 4px : `--s-1: 4` → `--s-10: 72`. Rayons : `--r-xs:4 --r-sm:6 --r-md:10 --r-lg:14 --r-xl:20 --r-pill:9999`.

### Cibles tactiles

**Minimum 44×44 px** sur mobile pour tous éléments interactifs. Variable disponible : `--hit: 44px`.

---

## 3. Écrans à implémenter

Tous les écrans sont visibles dans `reference/DrivePod.html` (canvas pan/zoom). Section "V2 · Sans artwork" pour les écrans choisis. Pour chaque écran ci-dessous, le fichier JSX cité montre l'agencement exact, les classes utilitaires, et la copie.

### 3.1 Splash / Loader — `reference/screens/onboarding.jsx`

- Plein écran, dark, centré vertical.
- Logo placeholder 88×88, gap 28, puis nom "DrivePod" (Plex Sans 26/600/-0.02em).
- Sous le nom : kicker mono `VOIX · LECTURE · DRIVE` (10px, color `--text-3`, letter-spacing 0.04em).
- Barre de progression 100×2px à 40px en dessous : bg `--surface-2`, bar `--accent` largeur 40px qui slide gauche→droite en boucle (1.4s, ease).
- `prefers-reduced-motion` : barre statique à 0%.

### 3.2 Login — `reference/screens/onboarding.jsx`

- Logo 72×72 en haut + nom (gap 16) — marge top 32.
- Centre vertical : titre `Vos lectures, à la voix.` (19/500/-0.01em, color `--text-1`).
- Sous-texte 2 lignes (14/400/1.55, color `--text-2`), avec pill mono `Drive / Audio` inline (color `--text-1`, bg `--surface-2`, padding 2px 6px, radius 4).
- Bas : bouton primaire pleine largeur, 52px, gap 8, icône Google + texte "Se connecter avec Google".
- Sous le bouton : note legale 11/400/1.5, color `--text-3`, centrée.

### 3.3 Main list (écran principal) — `reference/screens/main-list.jsx`

C'est l'écran le plus critique. Mémo de toute l'anatomie :

**Header (h: 48 + 12 padding-bottom)**
- Gauche : Logo 32×32 (radius 8, mini-label "LOGO" en mono 9px) + gap 10 + "DrivePod" (18/600/-0.02em).
- Droite : icon-buttons 44×44 search + settings. Badge ambre 8×8 (border 2px `--bg`) en absolute top:8/right:8 sur l'icône settings si actions en attente.

**Bandeau hors-ligne** (conditionnel, `if(navigator.onLine === false)`)
- Margin 0/16/8, padding 8/12, bg `--surface-2`, radius 8.
- Icône `wifi-off` 16px + texte 12/500 "Hors-ligne — lecture des fichiers téléchargés".

**Tabs (sous-dossiers Audio/)** — scroll horizontal masqué scrollbar
- Container border-bottom 1px `--border-1`, padding 0 16.
- Chaque tab : padding 12/4/14, gap 24 entre tabs.
- Active : titre 16/600/-0.01em color `--text-1`, count 12/500 mono color `--text-2`, sub-label `4h 23 restantes` mono 11/400 color `--accent` letter-spacing 0.02em, underline 2px `--accent` absolute bottom.
- Inactive : 16/500 color `--text-3`, count mono color `--text-3`.

**Sort + filtres** — padding 12/16/10/16
- Chip "Date" avec icône sort + chevDown (height 30, radius pill, bg `--surface-2`).
- Séparateur vertical 1×18 `--border-1` margin 0/4.
- Chips filtres scrollables : `À reprendre` (active = `--accent-soft` + color `--accent`) puis `Non commencés`, `Presque finis`.

**File row** — chaque ligne :
- Grid `28px 1fr auto` gap 12, padding 14/20, border-bottom 1px `--border-1`.
- Currently-playing : bg row = `--accent-soft`, barre verticale 3px `--accent` absolute left:0 top:8 bottom:8 radius 0/2/2/0.
- **Colonne 1** (numéro) : `01`, `02`, …, mono 12/500 color `--text-3` (ou `--accent` si current, ou `--text-1` si non lu), `font-variant-numeric: tabular-nums`, letter-spacing 0.04em.
- **Colonne 2** : titre 15/500/-0.005em, max 2 lignes (`-webkit-line-clamp: 2`), `text-wrap: pretty` ; couleur dépend de l'état (lu = text-2, non lu = text-1, current = text-1).
- Sous le titre, si `progress > 0 && < 1` : barre 2px height, bg `--surface-3`, fill width `progress*100%` bg `--accent` (ou `--text-3` si pas current).
- Ligne meta sous le titre : flex gap 8, mono 11/400 color `--text-3`. Format : `15 mai · 29:14 / 47:12`. Si terminé (`prog === 1`) : `· terminé` color `--success`. Si offline : badge à droite avec `margin-left:auto` — icône check verte 11×11 + texte sans 10/500 "OFF" letter-spacing 0.02em color `--success`.
- **Colonne 3** : kebab dotsV 36×36 (radius 6) color `--text-3`, hover bg `--surface-2`.

**Mini-player sticky** (cf. 3.5 — variante V2).

**Spec d'interaction**
- Long-press / tap kebab → menu contextuel (sheet bottom mobile) : "Ajouter à la file", "Télécharger", "Archiver".
- Tap sur row (zone hors-kebab) → navigation vers le player plein écran.

### 3.4 Recherche — `reference/screens/player.jsx` (composant `SearchScreen`)

- Header collapsed : champ recherche pleine largeur (height 44, radius 22, bg `--surface-2`, padding 0/14, gap 10). Icône search 18 color `--text-3` à gauche. Input transparent border 0, font 15/400, caret `--accent`. Croix de clear 18×18 (radius 9, bg `--surface-3`) à droite. Bouton texte "Annuler" 14/500 color `--text-2` margin-left 8.
- Méta résultats : mono 11/500 color `--text-3` letter-spacing 0.04em, padding 0/20/8 → "4 RÉSULTATS · 4 DOSSIERS".
- Chaque résultat : padding 14/20, border-bottom 1px `--border-1`, flex column gap 6.
  - Top : pill source (mono 10/500 color `--accent`, bg `--accent-soft`, padding 3/6, radius 4, letter-spacing 0.04em) + chevRight 12 color `--text-3`.
  - Titre 15/500/1.35 avec `<mark>` ambre sur les matches : bg `--accent-soft`, color `--accent`, padding 0/2, radius 2.
  - Si occurrences supplémentaires : ligne de chips mono 11/400 (chaque chip bg `--surface-2`, padding 2/6, radius 4) + texte `… 6 occurrences`.

### 3.5 Player plein écran — V2 SANS ARTWORK — `reference/screens/player-v2.jsx`

**C'est la variante choisie.** Structure verticale :

1. **Top bar** (padding 6/12) : icon-btn chevDown (close) gauche · label mono `EN LECTURE` centre (11/500 color `--text-3` letter-spacing 0.06em) · icon-btn dotsV droite.

2. **Source pill** centrée (margin-bottom 18) — `display: inline-flex`, gap 8, padding 5/11/5/8, radius 9999, bg `--accent-soft`, color `--accent`. Icône doc 12 + mono 11/500 `ARTICLES · IL Y A 3 JOURS`.

3. **Titre** (margin-bottom 16) — `font: 600 26px/1.20`, letter-spacing -0.025em, `text-wrap: balance`, centré, max 2 lignes.

4. **Stats de lecture** (background `oklch(from var(--surface-1) calc(l - 0.01) c h / 0.6)`, radius 12, padding 14/8). Flex stretch, 4 colonnes équipartagées séparées par `width:1px background:--border-1` :
   - Mots · valeur en mono 18/500 + unit `k` en mono 11/500 color `--text-3` · label mono 9/500 letter-spacing 0.08em CAPS color `--text-3`
   - Pages · même format
   - Densité · même format (ex: `9.4/10`)
   - Captures · même format

5. **Carte "Passage en cours"** (optionnelle — afficher seulement si le TTS expose la phrase courante)
   - Bg `--surface-1`, border 1px `--border-1`, radius 14, padding 18/18/16.
   - Header : icône doc 12 + mono 10/500 CAPS `PASSAGE EN COURS · § 4` (color `--text-3`) à gauche, `p. 12 / 22` mono à droite.
   - Texte 15/400/1.55 color `--text-3`, avec **surlignage karaoké** : phrase complète en `--text-3`, la portion "déjà lue dans la phrase courante" en `--text-1`, le **mot en cours** en bg `--accent` color `--accent-text` padding 1/3 radius 3 weight 500 + box-shadow 0 0 0 1px `--accent`.
   - Si la donnée karaoké n'existe pas : afficher seulement le paragraphe courant en color `--text-2`, sans highlight.

6. **CTA résumé IA** (border-dashed `--border-1`, radius 10, padding 10/12) — icône ai 14 color `--accent` + texte "Résumé · 3 idées principales" (12/500 color `--text-2`) + chevDown. Tap → expand.

7. **Seek bar** (`flex: 1` au-dessus pour pousser ce bloc en bas)
   - Track : height 4, bg `--surface-2`, radius 2. Fill : width `currentTime / duration * 100%`, bg `--accent`, radius 2. Thumb : 14×14 radius 7 bg `--accent`, box-shadow `0 0 0 4px oklch(from var(--accent) l c h / .20)`.
   - Ligne timestamps sous la bar (margin-top 6) : `29:14` (`--text-2`) à gauche, `−17:58` (`--text-3`) à droite — mono 11/500, `tabular-nums`.

8. **Contrôles principaux** (margin-top 18, justify-between)
   - prev (24, color `--text-2`) · skip-back (52×52 avec glyphe `−15`) · **play 72×72 radius 36 bg `--accent`** (28px pause/play icon, box-shadow `0 4px 20px oklch(from var(--accent) l c h / .35)`) · skip-fwd 52×52 · next 24.

9. **Contrôles secondaires** (margin-top 16, justify-between)
   - Chip vitesse `1.25×` (mono 600, icône speed 14)
   - Chip Boost **active** (`--accent-soft` + color `--accent`, icône bolt remplie)
   - Chip Capture (icône bookmark-plus 14)
   - Chip File (icône queue 14)

**Toast "Passage sauvegardé"** (apparaît sur tap capture) :
- Position absolute, bottom 110, centre horizontal.
- Bg `oklch(from var(--surface-2) calc(l + 0.04) c h / 0.95)`, backdrop-filter `blur(20px) saturate(180%)`, padding 10/14, radius 24, border 1px `--border-1`, shadow `--shadow-2`.
- Icône check ronde 22×22 bg `--success` color `--bg` + texte 13/500 "Passage sauvegardé · 29:14".
- Animation : `dp-pop 250ms ease-out` — opacity 0→1, translateY 6→0, scale 0.96→1. Persiste 1.8s puis fade-out 200ms. Vibration courte (10ms) sur mobile (`navigator.vibrate(10)`).

### 3.6 Mini-player V2 — `reference/screens/player-v2.jsx` (composant `MiniPlayerV2`)

- Position absolute left:8 right:8 bottom:8 sticky au-dessus de la home indicator.
- Bg `oklch(from var(--surface-1) l c h / 0.92)`, backdrop-filter `blur(20px) saturate(160%)`, radius 14, border 1px `--border-1`, shadow `--shadow-2`, padding 10/12/10/14, flex gap 12.
- **Pas d'artwork.** À la place : "côte de bibliothèque" verticale (flex column gap 2) — mono 9/500 `ART.` (color `--accent`, letter-spacing 0.06em) au-dessus, mono 11/500 `29:14` (color `--text-3`, tabular-nums) en dessous. (Le code source est l'abréviation du dossier : `ART.` pour Articles, `BOO.` pour Books, etc.)
- Séparateur 1px alignSelf:stretch `--border-1`.
- Titre 13/500 single-line ellipsis + progress 2px (bg `--surface-3`, fill `--accent`).
- Bouton play/pause 40×40 radius 20, bg `--accent`, color `--accent-text`.

**Tap sur la zone hors-bouton → ouvre le player plein écran** (cf. interactions §5).

### 3.7 File d'écoute — `reference/screens/player.jsx` (composant `QueueScreen`)

- Header : chevDown · "File d'écoute" 16/600 centré · dotsV.
- Méta : mono 11/500 `4 FICHIERS · 2h 55 au total` (padding 4/20/12).
- Chaque item : flex gap 12, padding 12/16/12/8, border-bottom 1px `--border-1`. Currently-playing : bg `--accent-soft` + barre 3px `--accent`.
  - Handle drag (icône 6-dots, 36×36, cursor: grab, color `--text-3`)
  - Numéro mono ou `▶` si current (16px min-width)
  - Titre 14/500/1.3 max 2 lignes + ligne meta `Articles · 38:45` (mono 11/400 color `--text-3`)
  - Croix de retrait (36×36, dp-icon-btn-sm)
- Swipe gauche sur item → retirer. Drag handle pour réordonner (lib `Sortable.js` ou `<dnd-list>`).

### 3.8 Tableau de bord — `reference/screens/dashboard-settings.jsx`

- Header : chevLeft · "Tableau de bord" 16/600 · settings.
- **Carte hero "Aujourd'hui"** (padding 20, bg `--surface-1`, border 1px `--border-1`, radius 14) :
  - Mono 11/500 CAPS `AUJOURD'HUI` + icône clock 13
  - Valeur principale `1h 23` (Plex Sans 44/600/-0.03em, tabular-nums) + "minutes écoutées" mono 13/500 color `--text-3`
  - Barres 7 jours (height 56, gap 6) : chaque barre `flex:1` + label de jour mono 9/400 dessous. Dernière barre (aujourd'hui) = `--accent`, autres = `--surface-3`. min-height 4px.
- **Grille 2×2 de métriques** (gap 12) :
  - Cette semaine `6h 47` (Plex Sans 28/600/-0.02em)
  - Série `12 jours` avec icône flame en accent
  - Terminés `18 ce mois`
  - File `4 à venir`
- **Carte donut** (padding 18) :
  - Header mono CAPS `RÉPARTITION PAR SOURCE` + icône filter 13
  - Donut SVG 100×100 — 4 segments (Articles 38%, Books 28%, Papers 22%, Notes 12%) — variations sur `--accent` :
    - Articles : `--accent`
    - Books : `oklch(from var(--accent) calc(l - 0.10) c calc(h + 30))`
    - Papers : `oklch(from var(--accent) calc(l - 0.20) c calc(h + 60))`
    - Notes : `--surface-3`
  - Centre du donut : `11h` (Plex Sans 16/600) + mono 9/500 CAPS `CE MOIS`
  - Légende à droite : carrés 8×8 + label + valeur mono.

### 3.9 Paramètres — `reference/screens/dashboard-settings.jsx`

Header : chevLeft · "Paramètres" centré.

Sections (mono 11/500 CAPS color `--text-3` letter-spacing 0.08em, padding 0/20/6) suivies d'un bloc bg `--surface-1` avec border-top/bottom 1px `--border-1`. Chaque row :
- Flex gap 12, padding 14/16, min-height 56, border-bottom 1px `--border-1` (sauf dernier).
- Icône 28×28 radius 7 bg `--surface-2` color `--text-2` (icône 15px).
- Titre 15/500/1.3 color `--text-1`.
- Valeur mono 13/500 color `--text-3` à droite, OU `<Toggle>`, OU chevRight 16 color `--text-3`.

**Sections** :
1. **Lecture** — Vitesse par défaut (`1.25×`), Saut avant/arrière (`15 s`), Auto-rewind (`3 s`), Boost de voix (toggle).
2. **Hors-ligne** — Téléchargement auto (toggle), Limite (`20`), Cache (`412 MB`), bouton secondaire "Vider le cache" (color `--danger`).
3. **Synchronisation** — Resynchroniser maintenant (`il y a 2 min`), Sync Wi-Fi uniquement (toggle).
4. **Compte** — Carte utilisateur (avatar 40 rond bg `--accent-soft` color `--accent` + icône user 20 ; nom + email mono 12), puis "Se déconnecter".
5. **À propos** — Version (`1.4.0`), Documentation (chevRight).

Footer mono 11/400 color `--text-4` centré : `DrivePod · build 240515`.

**Toggle** : 36×22 radius 11, padding 2. Bg `--accent` si on, `--surface-3` si off. Knob 18×18 radius 9 bg `--accent-text` (on) ou `--text-1` (off), shadow `0 1px 2px rgba(0,0,0,.3)`, transition `--d-fast`.

---

## 4. Layout desktop (≥1024px) — `reference/screens/desktop.jsx`

**Grille 3 colonnes** : sidebar 248px · main 1fr · player panel 380px.

### Sidebar (248×100%, bg `--surface-1`, border-right 1px `--border-1`, padding 20/14/16)
- Logo 32×32 + nom (padding 0/6/18).
- Bloc top (border-bottom 1px `--border-1`) :
  - Row "Rechercher" 36px avec icône search 16 + texte 14/500 + raccourci `⌘K` mono 11 dans pill `--surface-2`.
  - Row "File d'écoute" 36px avec icône queue + compteur `4` à droite.
- Section "Dossiers" (mono 11/500 CAPS color `--text-3`) puis liste tabs (height 36) :
  - Active : bg `--accent-soft`, color `--accent`, font weight 600, barre 3px `--accent` à gauche absolute (top:6 bottom:6 radius 0/2/2/0).
  - Inactive : color `--text-2`, font weight 500.
  - Compteur mono à droite, color `--accent` si active sinon `--text-3`.
- Encart "Restant aujourd'hui" : padding 10/12, bg `--surface-2`, radius 8 — label mono `RESTANT AUJOURD'HUI` + valeur `4h 23` Plex Sans 18/600 color `--accent`.
- En bas (`margin-top:auto`) : Tableau de bord, Paramètres (mêmes rows), puis avatar utilisateur 28 + nom 12 + email mono 11.

### Main (flex 1, min-width 0)
- Top bar (padding 20/28/16, border-bottom 1px `--border-1`) : H1 "Aujourd'hui" 24/600/-0.02em + meta mono 13/500 color `--text-3` "7 fichiers · 4h 23 restantes" à gauche. Tri + filtres chips à droite.
- Headers de colonnes (grid `32px 1fr 80px 130px 60px 40px` gap 16, padding 10/20) : mono 11/500 CAPS color `--text-3` letter-spacing 0.04em — `# / TITRE / DATE / PROGRESSION / OFF / ⋯`.
- Liste : chaque row même grid. Hover : bg `--surface-2`. Currently-playing : bg `--accent-soft` + barre `--accent` left.

### Player panel droit (380×100%, bg `--surface-1`, border-left 1px `--border-1`, padding 24/22/18)

**V2 desktop** — mêmes principes que mobile V2 :
1. Top : label mono CAPS `EN LECTURE` à gauche, dotsV à droite.
2. Source pill ambre.
3. Titre 24/600/-0.025em `text-wrap: balance`.
4. Stats de lecture (3 colonnes : Mots / Pages / Captures).
5. Carte "Passage en cours" (taille `sm`).
6. Spacer flex.
7. Seek bar, contrôles principaux 56×56 play (au lieu de 72×72), grille 2×2 de chips secondaires.
8. **Raccourcis clavier** en footer (border-top 1px `--border-1`, padding-top 12) — mono 11/400 color `--text-3` :
   - `<kbd>Espace</kbd> play`
   - `<kbd>←</kbd><kbd>→</kbd> ±15s`
   - `<kbd>↑</kbd><kbd>↓</kbd> vitesse`
   - `<kbd>B</kbd> capture`
   - Style `<kbd>` : inline-block padding 2/5, bg `--surface-2`, border 1px `--border-1`, radius 4, font-size 10, color `--text-2`.

### Breakpoint
- `≥ 1024px` : layout 3 colonnes ci-dessus.
- `< 1024px` : layout mobile single-column, sidebar transformée en sheet (icône hamburger ou onglet bottom-nav).

---

## 5. Micro-interactions

| Interaction | Spec |
|---|---|
| **Capture passage** | Tap chip `Capture` → toast (cf. §3.5). Animation `dp-pop` 250ms ease-out. `navigator.vibrate(10)` si dispo. Toast auto-dismiss après 1800ms. |
| **Mini → plein écran** | Tap mini-player (hors bouton play) → expansion sheet 320ms cubic-bezier(.2,.7,.3,1). Le mini-player fade-out à 60% de l'expansion. |
| **Sticky mini-player au scroll** | Sur mobile, hide-on-scroll-down + show-on-scroll-up. translateY(0 ↔ 100%) en 240ms ease. |
| **Loader** | Barre 40px qui glisse left→right, 1.4s, infinite. Pas de spinner circulaire — cohérent avec les progress bars de la liste. |
| **Tap states (mobile)** | `transform: scale(0.98)` sur `:active` 80ms. Pas de hover persistant sur tactile (filtre `@media (hover: hover)`). |
| **Reduced motion** | Toutes transitions/animations désactivées via `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { transition: none !important; animation: none !important; } }` |
| **Currently-playing row** | Background `--accent-soft` + barre verticale 3px gauche `--accent`. Numéro et titre passent en color accent. Le mini-player et le panneau player desktop reflètent la même piste. |
| **Tab change (mobile)** | Le sub-label "4h 23 restantes" anime entre tabs (fade 140ms). |
| **Drag queue** | Pendant drag, item soulevé : `transform: scale(1.02)` + `box-shadow: --shadow-2` + opacity 0.95 sur le reste. Réorganisation live. |
| **Toggle settings** | Knob translate avec `transition: background --d-fast --ease`. |

---

## 6. Iconographie

Set d'icônes maison — 24×24 viewBox, `currentColor`, stroke 1.75, line-cap round, line-join round. Voir `reference/components/icons.jsx` pour tous les paths SVG prêts à copier.

**Icônes nécessaires** : search, settings, play, pause, prev, next, skipBack (avec `15` au centre), skipFwd, close, chevDown, chevUp, chevRight, chevLeft, check, download, dots (h), dotsV, queue, bookmark, bookmarkPlus, bolt, boltO, archive, doc, google, speed, wifi, wifiOff, flame, sort, filter, rotate, logout, user, back, add, trash, bell, drag, expand, collapse, info, ai, cloud, trending, clock.

Pour intégration vanilla, deux options :
- **Inline SVG** dans le HTML pour les icônes statiques (préféré pour SEO/accessibilité).
- **Sprite SVG** avec `<use href="#icon-search">` pour réutilisation.

---

## 7. État & accessibilité

- **Contrastes** : WCAG AA validé sur `--text-1`/`--bg` et `--text-2`/`--bg` dans les deux thèmes.
- **Focus visible** : ring 2px `--focus` offset 2px sur tous éléments interactifs (`:focus-visible`).
- **Cibles tactiles** : minimum 44×44 px.
- **Reduced motion** : géré globalement via la media query (cf. `tokens.css`).
- **Lecture extérieure** : le light theme est conçu pour la lumière forte (transports).
- **Densité d'information** : modérée — scan possible à une main, d'un coup d'œil.
- **Mode hors-ligne** : bandeau visible, badges OFF sur les fichiers téléchargés, badge ambre sur l'icône settings si actions en attente.
- **Raccourcis clavier (desktop)** : Espace, ←/→, ↑/↓, B (cf. §4 player panel).

---

## 8. Plan d'implémentation suggéré

1. **Drop `tokens.css`** dans le projet, importer en premier dans le CSS principal.
2. **Mettre à jour le `<body>`** : `font-family: var(--font-sans)`, color/bg via tokens, ajouter `data-theme` switch.
3. **Implémenter le toggle thème** (préférence système + override manuel persisté en `localStorage`).
4. **Refondre composant par composant**, dans cet ordre — chaque étape est testable de bout en bout :
   - a. Header app (logo + actions)
   - b. Mini-player V2 (sticky)
   - c. File row (liste principale)
   - d. Tabs + sort/filtres
   - e. Player plein écran V2 (sans artwork)
   - f. Search overlay
   - g. Queue
   - h. Settings
   - i. Dashboard
   - j. Splash + Login
   - k. Layout desktop (sidebar + player panel)
5. **Charger les fonts** Google Fonts (preconnect + font-display: swap déjà dans `tokens.css` via `@import`).
6. **Remplacer le logo placeholder** par le fichier final dès qu'il est livré (4 emplacements : splash, login, header mobile, sidebar desktop).
7. **Vérifications finales** :
   - Contraste sur les deux thèmes
   - Navigation clavier complète sur desktop
   - `prefers-reduced-motion`
   - PWA manifest icon mis à jour avec le nouveau logo

---

## 9. Fichiers de référence (dans `reference/`)

| Fichier | Contient |
|---|---|
| `DrivePod.html` | Canvas pan/zoom — ouvre-le pour voir TOUS les écrans côte à côte |
| `design-system.css` | Tokens dans leur version scopée `.dp` (utilisée par la maquette) |
| `components/icons.jsx` | **Paths SVG de toutes les icônes** — à copier-coller |
| `screens/onboarding.jsx` | Splash + Login |
| `screens/main-list.jsx` | Liste principale + file row + tabs + mini-player V1 |
| `screens/player.jsx` | Player V1 (avec artwork — NE PAS utiliser) + Search + Queue |
| `screens/player-v2.jsx` | **Player V2 sans artwork — RÉFÉRENCE PRINCIPALE** |
| `screens/dashboard-settings.jsx` | Dashboard + Settings |
| `screens/desktop.jsx` | Layout 3 colonnes desktop (V1 — adapter avec V2 player panel) |
| `screens/design-system.jsx` | Page de référence design system (tokens, composants, états) |

**Fichier à utiliser directement** : `tokens.css` (racine du handoff) — c'est la version `:root` / `[data-theme="light"]` prête pour le projet vanilla.

---

## 10. Ce qu'il NE faut PAS faire

- ❌ Importer React, Babel, ou les fichiers JSX dans le projet PWA.
- ❌ Réécrire la logique de lecture audio, sync Drive, Service Worker, cache.
- ❌ Ajouter des artworks/images aux fichiers audio (V2 = sans artwork, intentionnel).
- ❌ Inventer de nouvelles couleurs — l'app utilise **une seule** couleur d'accent (ambre).
- ❌ Utiliser Inter, Roboto, ou system-ui en font principale. C'est IBM Plex Sans + Mono.
- ❌ Saturer le design — c'est un outil studieux, pas Spotify.
- ❌ Ajouter des emojis (sauf si demandé par l'utilisateur plus tard).
- ❌ Mettre du pure black (`#000`) en background — utiliser `--bg` qui est warm-neutral.
