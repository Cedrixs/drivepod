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
5. Copiez le **Client ID** (format: `xxxxx.apps.googleusercontent.com`)
6. **OAuth consent screen** → configurez votre app (nom, email, scopes: `../auth/drive`)

### 2. Mettre à jour le Client ID

**Option A — Variable d'environnement (recommandée) :**
```bash
# Dans GitHub → Settings → Variables → New repository variable
Name:  VITE_GOOGLE_CLIENT_ID
Value: votre-client-id.apps.googleusercontent.com
```

**Option B — Directement dans le code :**
Éditez `src/auth/auth.ts`, ligne avec `CLIENT_ID`:
```typescript
const CLIENT_ID = 'VOTRE_NOUVEAU_CLIENT_ID.apps.googleusercontent.com';
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

# Lighthouse PWA score (après déploiement)
npx lighthouse https://Cedrixs.github.io/drivepod/ --only-categories=pwa --output=html
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
6. Testez les boutons physiques de vos écouteurs Bluetooth :
   - Double-tap → play/pause
   - Triple-tap → piste suivante (selon le modèle)

**Résultat attendu :** titre visible sur l'écran de verrouillage, contrôles fonctionnels.

### TC-5 : Reprise multi-device

**Prérequis :** deux appareils (ex: PC + téléphone Android) connectés au même compte Google.

1. **Sur l'appareil A** : ouvrez l'app, lancez un fichier, écoutez pendant ~2 minutes
2. **Sur l'appareil A** : mettez en pause → attendez 35 secondes (flush vers Drive)
3. **Sur l'appareil B** : ouvrez l'app, connectez-vous avec le même compte Google
4. **Sur l'appareil B** : cliquez sur le même fichier

**Résultat attendu :** la lecture reprend à ±10 secondes de l'endroit où vous vous étiez arrêté sur A.

*Note : le sync vers Drive est debouncé à 30s. Si vous passez à l'appareil B moins de 30s après avoir mis en pause sur A, utilisez le bouton "Resynchroniser depuis Drive" dans Réglages.*

---

## Troubleshooting

### Token expiré / "Se connecter à Google Drive" réapparaît

**Symptôme :** vous êtes renvoyé à l'écran de connexion sans raison.

**Causes possibles :**
1. Refresh token révoqué (durée maximale 6 mois d'inactivité pour les apps en mode test)
2. Vous avez révoqué les permissions depuis [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
3. Le stockage du navigateur a été effacé

**Solution :** reconnectez-vous normalement. Toutes vos positions sont sauvées sur Drive (`_drivepod_state.json`) et seront restaurées.

**Forcer la reconnexion propre :**
```
Réglages → Se déconnecter → reconnectez-vous
```

### Un fichier ne s'archive pas

**Symptôme :** le fichier reste dans la liste après 95% ou après "Archiver".

**Causes :**
1. **Hors-ligne :** l'archivage est mis en queue et s'exécutera au retour online. Le bandeau "Mode hors-ligne — N actions en attente" l'indique.
2. **Quota Drive atteint :** vérifiez votre quota sur [drive.google.com/settings/storage](https://drive.google.com/settings/storage)
3. **Permissions insuffisantes :** revérifiez que le scope `drive` est accordé dans [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
4. **Le fichier est déjà archivé** depuis un autre appareil → l'app traite le 404 comme un succès et retire l'entrée.

**Solution rapide :** ouvrez les DevTools → Application → IndexedDB → `drivepod` → `offlineQueue` pour voir les actions en attente.

### La lecture s'arrête en arrière-plan / écran éteint

**Symptôme :** audio coupe quand l'écran s'éteint sur Android.

**Solution :**
1. Assurez-vous que DrivePod est installé comme PWA (bouton "Ajouter à l'écran d'accueil" dans Chrome)
2. Ouvrez **Paramètres Android → Applications → Chrome → Batterie** → sélectionnez "Non restreint"
3. Désactivez l'optimisation de batterie pour Chrome
4. Sur certains Android (Xiaomi, Huawei) : désactivez le nettoyage automatique pour Chrome dans les paramètres système

### Quota Drive atteint (erreur 403)

**Symptôme :** impossible de lire ou d'archiver, erreur dans la console.

**Solutions :**
1. Videz le dossier `Audio/Archive/` des fichiers anciens
2. Ou libérez de l'espace Drive depuis [drive.google.com](https://drive.google.com)
3. L'app gère automatiquement le backoff exponentiel sur les rate limits (1000 req/100s/user)

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

**Tests manuels requis (nécessitent hardware Android) :**
- TC-1 : Connexion OAuth from scratch → voir section "Tests manuels"
- TC-4 : Commandes Bluetooth → voir section "Tests manuels"

---

## Sécurité

- **OAuth 2.0 PKCE** : aucun secret client dans le code
- **Refresh token chiffré** (AES-256-GCM via Web Crypto API) en IndexedDB
- **CSP stricte** : `connect-src` limité aux domaines Google
- **Aucune donnée** envoyée à des serveurs tiers (lecture directe depuis Drive)

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | React 18 + TypeScript strict |
| Build | Vite 5 |
| Style | Tailwind CSS 3 |
| Auth | OAuth 2.0 PKCE (manuel, sans SDK) |
| Drive API | REST v3 (fetch natif) |
| Stockage local | IndexedDB via `idb` |
| PWA / SW | `vite-plugin-pwa` + Workbox |
| Player | `<audio>` HTML5 + Media Session API |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Licence

Usage personnel. Aucune garantie fournie.
