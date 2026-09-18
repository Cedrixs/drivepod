# DrivePod

Lecteur audio PWA pour Google Drive. Lit vos MP3 depuis le dossier `Audio/` de votre Drive, avec archivage automatique, commandes Bluetooth, mode hors-ligne et reprise multi-device.

**URL de l'app :** https://Cedrixs.github.io/drivepod/

---

## Fonctionnalités

### Sources et navigation

- Onglets par sous-dossier de `Audio/` (Books, Articles, etc.), détectés dynamiquement
- Fichiers directement à la racine d'`Audio/` affichés dans un onglet dédié
- Actualisation manuelle de la liste
- Actualisation automatique au retour du focus sur l'app

### Lecture

- Streaming MP3 depuis Google Drive via proxy Service Worker (header `Authorization`)
- Reprise automatique à la position sauvegardée à l'ouverture d'un fichier
- Play / Pause
- Track précédent / suivant (queue = tous les fichiers du dossier courant)
- Saut avant / arrière configurable (15 s ou 30 s)
- Seek interactif (barre glissable)
- Vitesses : 0.75×, 1×, 1.25×, 1.5×, 1.75×, 2×
- Indicateur de buffering
- Retry automatique 3 s après une erreur réseau (si online)
- Lecture offline si le fichier est téléchargé en cache

### Interface player

- **Mini-barre** en bas : titre, barre de progression, play/pause, skip
- **Vue plein écran** : titre, seek bar avec timestamps, contrôles complets (prev / skip-back / play / skip-fwd / next), sélecteur de vitesse

### Commandes système (Media Session API)

- Contrôles depuis le panneau de notification Android
- Contrôles sur l'écran de verrouillage
- Boutons physiques des écouteurs/casques Bluetooth (play/pause, track prev/next, seek)
- Titre visible sur l'écran de verrouillage

### Archivage

- **Auto à 95 %** de progression → déplace le fichier vers `Archive/<AAAA-SNN>/<source>/` sur Drive (dossiers hebdo ISO, ex `2026-S28` ; les anciens dossiers mensuels `2026-05` restent lisibles)
- **Manuel** depuis la liste ou le player plein écran
- **Groupé depuis l'onglet Synthèses** : un bouton archive tous les audio antérieurs à la synthèse affichée (tous les onglets sauf Synthèses, Révision et Books), vers le dossier de la semaine de la synthèse
- Passage automatique au fichier suivant après archivage
- **File d'attente offline** : si hors-ligne, l'opération est enqueued et exécutée au retour online (la semaine de destination est mémorisée dans l'action)

### Onglet Synthèses (lecture écrite)

Quand le dossier `Audio/Synthèses` existe, son onglet affiche en tête la **synthèse hebdo en version écrite** (lue depuis `PDF/Textes IA` sur Drive) : navigation ‹ › entre les semaines, texte repliable, et bouton d'archivage groupé avec récapitulatif par dossier avant confirmation.

### Onglet Archive

Liste les audio archivés **groupés par semaine** (accordéon, chargement à la demande), avec lecture directe et bouton « Désarchiver » qui remet le fichier dans son dossier d'origine.

### Mode hors-ligne

- Téléchargement manuel d'un fichier (bouton dans la liste, visible si online)
- Téléchargement automatique des N plus anciens fichiers au démarrage (réglable, 5 par défaut)
- Indicateur ✓ sur les fichiers mis en cache
- Stats du cache (nombre de fichiers + taille totale) dans les réglages
- Vidage du cache depuis les réglages
- Bannière hors-ligne et badge du nombre d'actions en attente

### Synchronisation multi-device

- Sauvegarde de position en IndexedDB toutes les 5 s pendant la lecture
- Sauvegarde immédiate à la pause, à la fermeture, au changement de visibilité
- Flush vers `_drivepod_state.json` sur Drive 30 s après la dernière modification (debounce)
- **Merge au démarrage** : compare timestamps local vs Drive, garde le plus récent par fichier
- Resynchronisation manuelle depuis les réglages

### Affichage de la liste

Pour chaque fichier : numéro d'ordre, titre, date de création, position / durée si déjà écouté, barre de progression, indicateur de cache, mise en surbrillance si en cours de lecture.

### Réglages

- Vitesse de lecture par défaut (0.75× à 2×)
- Durée des sauts avant/arrière (15 s ou 30 s)
- Téléchargement automatique on/off
- Vider le cache hors-ligne
- Resynchroniser depuis Drive
- Se déconnecter

---

## Architecture Drive

```
Audio/
├── fichier-racine.mp3  ← onglet "Audio"
├── Books/              ← onglet "Books"
│   ├── chapitre1.mp3
│   └── chapitre2.mp3
├── Articles/           ← onglet "Articles"
│   └── article1.mp3
└── Archive/            ← créé automatiquement
    └── 2026-05/
        ├── Books/
        └── Articles/
```

**Ajouter une nouvelle source :** créez simplement un sous-dossier dans `Audio/` sur Google Drive. DrivePod le détectera au prochain refresh.

---

## Configuration Google Cloud

### 1. Créer le projet OAuth (à faire une fois)

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créez un nouveau projet (ex: `DrivePod`)
3. **APIs & Services → Enable APIs** → cherchez "Google Drive API" → Activer
4. **APIs & Services → Credentials → Create credentials → OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `DrivePod Web`
   - Authorized JavaScript origins: `https://Cedrixs.github.io`
   - Authorized redirect URIs: `https://Cedrixs.github.io/drivepod/`
5. Copiez le **Client ID** et le **Client Secret** (visibles dans les détails du credential)
6. **OAuth consent screen** → configurez votre app (nom, email, scopes: `../auth/drive`)
7. **OAuth consent screen → Publishing status → PUBLISH APP** (passer "In production")

> **⚠️ Publication obligatoire pour éviter les reconnexions**
> En statut "Testing", Google fait expirer les refresh tokens au bout de **7 jours** :
> vous devez alors vous reconnecter chaque semaine. En "In production", le refresh
> token est permanent (tant que l'app n'est pas révoquée et utilisée au moins une
> fois tous les 6 mois). L'app n'étant pas vérifiée par Google, un écran
> "Google n'a pas validé cette application" apparaîtra à la connexion : cliquez
> **Paramètres avancés → Accéder à DrivePod**. C'est normal pour un usage personnel.

> **Pourquoi un Client Secret ?**  
> Les clients OAuth de type "Web application" dans Google Cloud **requièrent** le `client_secret` lors de l'échange du code d'autorisation. Le PKCE seul ne suffit pas pour ce type de client. Le secret n'est pas dans le code source — il transite uniquement via les secrets GitHub Actions au moment du build.

### 2. Variables et secrets GitHub

Dans **GitHub → Settings → Secrets and variables → Actions** :

**Variables** (non sensibles) :
```
VITE_GOOGLE_CLIENT_ID = votre-client-id.apps.googleusercontent.com
```

**Secrets** (sensibles) :
```
VITE_GOOGLE_CLIENT_SECRET = votre-client-secret
```

---

## Déploiement

### Pré-requis
- Node.js 22+
- Repo GitHub avec GitHub Pages activé en mode "GitHub Actions"

### Déploiement automatique
Tout push sur `main` déclenche le déploiement via GitHub Actions.

### Déploiement manuel (local)
```bash
npm install
node scripts/generate-icons.mjs
npm run build
# Le build se trouve dans dist/
```

### Commandes utiles
```bash
npm run dev        # Serveur de développement
npm run build      # Build de production
npm run test       # Tests unitaires
npm run lint       # Linting ESLint
npx tsc --noEmit   # Vérification TypeScript stricte
```

---

## Architecture technique

### Streaming audio — proxy Service Worker

La lecture audio utilise un proxy dans le Service Worker pour contourner la limitation des balises `<audio>` (impossibilité de définir des en-têtes HTTP) :

```
<audio src="/drivepod/stream/:fileId">
       ↓
  Service Worker intercepts /drivepod/stream/:id
       ↓
  fetch googleapis.com/drive/v3/files/:id?alt=media
       + Authorization: Bearer TOKEN
       + Range: bytes=... (forwarded for seeking)
       ↓
  Google Drive → réponse streamée
```

Le token OAuth est stocké dans le Cache API (`dp-sw-tokens`) par le code de la page à chaque acquisition ou renouvellement. Le SW lit ce cache — il n'a pas accès à l'IndexedDB encrypté.

### Service Worker (injectManifest)

Le SW est un fichier TypeScript custom (`src/sw.ts`) compilé via vite-plugin-pwa en mode `injectManifest`. Il gère :
- **Précache Workbox** : tous les assets JS/CSS/HTML sont mis en cache à l'installation
- **Proxy audio** : `/drivepod/stream/:id` → Drive API authentifié
- **Drive API** : NetworkFirst avec cache 5 min pour les listes de fichiers (les contenus `alt=media` sont exclus : MP3, fichiers d'état)
- **OAuth endpoints** : NetworkOnly (jamais mis en cache)
- **Navigation SPA** : fallback vers `index.html` précaché

### Mise à jour de l'app

vite-plugin-pwa est en mode `prompt` : le nouveau SW est téléchargé mais attend. `src/main.tsx` l'active
(`SKIP_WAITING`) dès qu'aucune lecture n'est en cours (au démarrage, à la pause, ou quand l'app passe en
arrière-plan), puis la page se recharge sur la nouvelle version. Une écoute n'est jamais coupée par une mise à jour.

### Structure du code

```
src/
├── auth/        OAuth PKCE, tokens (auth.ts)
├── drive/       client.ts (fetch authentifié + retry), api.ts (fichiers/dossiers), archive.ts (Archive/<semaine>/<source>)
├── offline/     cache.ts (MP3 hors-ligne), queue.ts (actions différées)
├── state/       db.ts (IndexedDB typé), driveState.ts (sync positions), captures.ts, listeningStats.ts, archiveRules.ts
├── player/      player.ts (<audio> + Web Audio + Media Session)
├── hooks/       useApp (sources, archivage), usePlayer (état du lecteur), useOnline, useTheme
├── lib/         format.ts, markdown.ts, fuzzy.ts (fonctions pures, testées)
└── ui/          composants ; primitives.tsx = spinner, états vides, boutons d'icône, panneaux plein écran
```

### Authentification (PKCE + client_secret)

```
startLogin()
  → génère code_verifier + code_challenge (PKCE S256)
  → stocke verifier dans localStorage (TTL 10 min)
    (sessionStorage effacé par Android lors du redirect OAuth)
  → redirect vers accounts.google.com

handleOAuthCallback()
  → vérifie state + code_verifier
  → POST /token avec code + code_verifier + client_secret
  → stocke access_token (plain) + refresh_token (AES-256-GCM) en IndexedDB
  → écrit access_token dans Cache API pour le SW

getAccessToken()  (appelé avant chaque requête Drive)
  → access_token valide → le retourne
  → expiré → POST /token grant_type=refresh_token + client_secret (requis
    pour les clients "Web application" — sans lui : 401 à chaque refresh)
  → refresh single-flight (les appels concurrents partagent la même requête)
  → invalid_grant (token révoqué) → efface UNIQUEMENT les credentials,
    les positions et le cache audio survivent à la reconnexion
  → erreur réseau / 5xx → REFRESH_TRANSIENT, session conservée, mode dégradé
    sur les fichiers téléchargés
```

**Renouvellement pendant le streaming :** si le token du Service Worker expire en
pleine écoute (session > 1 h), le SW répond au 401 de Drive en demandant à la page
(`postMessage DP_TOKEN_EXPIRED`) de rafraîchir le token, puis réessaie une fois.

---

## Tests manuels sur Android (cas 4, 5)

### TC-4 : Commandes Bluetooth (écouteurs)

**Prérequis :** Android avec écouteurs Bluetooth appairés.

1. Ouvrez `https://Cedrixs.github.io/drivepod/` dans Chrome
2. Connectez-vous et lancez une lecture
3. Appuyez sur le bouton "home" → la lecture continue en arrière-plan
4. Vérifiez les contrôles depuis le panneau de notification Android :
   - Play/Pause doit fonctionner
   - Track précédent/suivant doit fonctionner
5. Verrouillez l'écran → les mêmes contrôles doivent apparaître sur l'écran de verrouillage
6. Testez les boutons physiques de vos écouteurs Bluetooth

**Résultat attendu :** titre visible sur l'écran de verrouillage, contrôles fonctionnels.

### TC-5 : Reprise multi-device

**Prérequis :** deux appareils connectés au même compte Google.

1. **Sur l'appareil A** : lancez un fichier, écoutez ~2 minutes
2. **Sur l'appareil A** : mettez en pause → attendez 35 secondes (flush vers Drive)
3. **Sur l'appareil B** : ouvrez l'app, cliquez sur le même fichier

**Résultat attendu :** la lecture reprend à ±10 secondes de l'endroit où vous vous étiez arrêté.

---

## Troubleshooting

### L'audio ne se lance pas après mise à jour du SW

**Symptôme :** lecture bloquée à 0:00 après une mise à jour de l'app.

**Cause :** l'ancien Service Worker est encore actif. Le nouveau SW attend qu'aucune lecture ne soit en cours pour s'activer.

**Solution :** mettez en pause ou passez l'app en arrière-plan quelques secondes, la page se recharge sur la nouvelle version.
Si le problème persiste : DevTools → Application → Service Workers → **Unregister**, puis rechargez.

### "Échange de token échoué : 400 client_secret is missing"

**Cause :** le secret OAuth n'est pas configuré dans GitHub Actions.

**Solution :** ajoutez `VITE_GOOGLE_CLIENT_SECRET` dans **GitHub → Settings → Secrets → Actions** (valeur dans Google Cloud Console → Credentials → votre client OAuth → Client Secret).

### "findOrCreateFolder list failed: 403"

**Cause :** l'API Google Drive n'est pas activée dans Google Cloud Console.

**Solution :** Google Cloud Console → APIs & Services → Library → cherchez "Google Drive API" → **Activer**.

### Token expiré / "Se connecter à Google Drive" réapparaît

**Causes possibles :**
1. **OAuth consent screen en statut "Testing"** → les refresh tokens expirent après **7 jours**. Passez l'app "In production" (voir Configuration Google Cloud, étape 7). C'est la cause la plus fréquente de reconnexions répétées.
2. Permissions révoquées depuis [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
3. Stockage navigateur effacé (mode navigation privée, nettoyage Chrome)
4. Inactivité > 6 mois

**Solution :** reconnectez-vous. Les positions de lecture (Drive `_drivepod_state.json`), le cache audio et la file offline sont conservés localement lors d'une déconnexion automatique — seuls les credentials sont effacés.

### Un fichier ne s'archive pas

**Causes :**
1. **Hors-ligne :** l'archivage est mis en queue et s'exécutera au retour online
2. **Quota Drive atteint :** vérifiez sur [drive.google.com/settings/storage](https://drive.google.com/settings/storage)
3. **Déjà archivé** depuis un autre appareil → le 404 est traité comme un succès

### La lecture s'arrête en arrière-plan sur Android

**Solution :**
1. Installez DrivePod comme PWA (bouton "Ajouter à l'écran d'accueil")
2. **Paramètres Android → Applications → Chrome → Batterie** → "Non restreint"
3. Sur Xiaomi/Huawei : désactivez le nettoyage automatique pour Chrome

---

## Tests automatisés

```bash
npm test
```

**Couverture :**
- TC-2 : Archivage auto à ≥95%
- TC-3 : Skip-track ne déclenche pas l'archivage
- TC-5 : Merge des états (local vs Drive)
- TC-6 : Queue offline
- TC-7 : Archive manuelle → passe au suivant
- TC-8 : Expiration de token
- Règles d'archivage (semaine ISO, sélection groupée, libellés)
- Client Drive (retry réseau, renouvellement sur 401, échappement des requêtes)
- Résolution des dossiers d'archive (mémoïsation par lot, reprise après échec)
- Helpers d'affichage, extraction Markdown, recherche floue

**Tests manuels requis (nécessitent hardware) :**
- TC-1 : Connexion OAuth from scratch
- TC-4 : Commandes Bluetooth

---

## Sécurité

- **OAuth 2.0 PKCE** : le `code_verifier` n'est jamais envoyé sans correspondance `state`
- **Client secret** : injecté au build, jamais dans le repo (GitHub Secret)
- **Refresh token chiffré** (AES-256-GCM via Web Crypto API) en IndexedDB
- **Token SW** : access token en clair dans le Cache API (même origine, accès limité au SW)
- **Aucune donnée** envoyée à des serveurs tiers (lecture directe depuis Drive)

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | React 18 + TypeScript strict |
| Build | Vite 5 |
| Style | Tailwind CSS 3 |
| Auth | OAuth 2.0 PKCE + client_secret (Web Application) |
| Drive API | REST v3 (fetch natif) |
| Stockage local | IndexedDB via `idb` |
| PWA / SW | `vite-plugin-pwa` (injectManifest) + Workbox 7 |
| Audio streaming | SW auth proxy → Drive API |
| Player | `<audio>` HTML5 + Media Session API |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Licence

Usage personnel. Aucune garantie fournie.
