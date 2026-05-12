# DrivePod

Lecteur audio PWA pour Google Drive. Lit vos MP3 depuis le dossier `Audio/` de votre Drive, avec archivage automatique, commandes Bluetooth, mode hors-ligne et reprise multi-device.

**URL de l'app :** https://Cedrixs.github.io/drivepod/

---

## Architecture Drive

```
Audio/
├── Books/          ← onglet "Books"
│   ├── chapitre1.mp3
│   └── chapitre2.mp3
├── Articles/       ← onglet "Articles"
│   └── article1.mp3
└── Archive/        ← créé automatiquement
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
- **Drive API** : NetworkFirst avec cache 5 min pour les listes de fichiers
- **OAuth endpoints** : NetworkOnly (jamais mis en cache)
- **Navigation SPA** : fallback vers `index.html` précaché

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
```

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

**Cause :** l'ancien Service Worker est encore actif. Le nouveau SW avec le proxy audio n'est pas encore installé.

**Solution :**
1. DevTools → Application → Service Workers → **Unregister**
2. Rechargez la page (le nouveau SW s'installe et recharge automatiquement)

Ou plus simplement : attendez quelques minutes, l'app se rechargera automatiquement via `onNeedRefresh`.

### "Échange de token échoué : 400 client_secret is missing"

**Cause :** le secret OAuth n'est pas configuré dans GitHub Actions.

**Solution :** ajoutez `VITE_GOOGLE_CLIENT_SECRET` dans **GitHub → Settings → Secrets → Actions** (valeur dans Google Cloud Console → Credentials → votre client OAuth → Client Secret).

### "findOrCreateFolder list failed: 403"

**Cause :** l'API Google Drive n'est pas activée dans Google Cloud Console.

**Solution :** Google Cloud Console → APIs & Services → Library → cherchez "Google Drive API" → **Activer**.

### Token expiré / "Se connecter à Google Drive" réapparaît

**Causes possibles :**
1. Refresh token révoqué (max 6 mois d'inactivité pour les apps en mode test)
2. Permissions révoquées depuis [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
3. Stockage navigateur effacé

**Solution :** reconnectez-vous. Les positions de lecture sont sauvées sur Drive (`_drivepod_state.json`) et seront restaurées.

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
