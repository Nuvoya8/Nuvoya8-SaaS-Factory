# 🧪 Guide de Test Complet - Login → Dashboard → N8N

## ✅ Ce qui a été implémenté

### 1. **Correction de l'erreur Prisma** ✅
- Ajout de la fonction `getCurrentAppId()` dans `src/lib/prisma.ts`
- Middleware Prisma d'isolation multi-tenant fonctionnel
- Client N8N sans erreurs TypeScript

### 2. **Sécurisation du Login** ✅
- La méthode `loginEmail()` vérifie maintenant l'`app_id`
- Si un utilisateur essaie de se connecter avec un compte d'une autre app, il est rejeté
- Message d'erreur clair : "This account does not belong to this application"

### 3. **API Route N8N** ✅
- Fichier : `src/app/api/n8n/test/route.ts`
- Vérifie l'authentification
- Appelle un workflow N8N personnalisé
- Retourne le résultat en JSON

### 4. **Page de Test N8N** ✅
- Fichier : `src/app/app/n8n-test/page.tsx`
- Interface utilisateur pour tester N8N
- Affiche les résultats en temps réel
- Guide d'instructions intégré

---

## 🚀 Comment Tester le Flow Complet

### Étape 1 : Configurer les Variables d'Environnement

Dans votre fichier `.env.local`, ajoutez :

```bash
# Variables existantes (déjà configurées)
NEXT_PUBLIC_APP_ID=factory-test
NEXT_PUBLIC_APP_NAME=Nuvoya8 Factory Test
NEXT_PUBLIC_SUPABASE_URL=https://supabase.infra-nuvoya8.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=postgresql://...

# Nouvelles variables N8N (À AJOUTER)
N8N_WEBHOOK_URL=https://votre-n8n.com/webhook
N8N_WEBHOOK_SECRET=votre-secret-hmac-tres-securise
```

### Étape 2 : Créer un Workflow de Test dans N8N

1. **Connectez-vous à votre N8N** : `https://votre-n8n.com`

2. **Créez un nouveau workflow** avec :
   - **Nom** : `test-workflow`
   - **Trigger** : Webhook (POST)
   - **URL** : `/webhook/test-workflow`

3. **Configuration du Webhook N8N** :

```
┌─────────────────────────────────────────┐
│  1. Webhook Node (Trigger)              │
│  - Method: POST                         │
│  - Path: test-workflow                  │
│  - Authentication: None                 │
│  - Response: JSON                       │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  2. Function Node (Vérifier Signature)  │
│  - Code pour vérifier HMAC              │
│  - Vérifier app_id                      │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  3. Code Node (Traiter la Requête)     │
│  - Récupérer les données                │
│  - Traiter le message                   │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  4. Respond to Webhook                  │
│  - Retourner la réponse JSON            │
└─────────────────────────────────────────┘
```

4. **Code pour le Function Node (Vérification HMAC)** :

```javascript
const crypto = require('crypto');

// Récupérer les données
const body = $input.item.json;
const headers = $input.item.headers;
const signature = headers['x-signature'];

// Secret partagé (même que dans .env)
const secret = 'votre-secret-hmac-tres-securise';

// Calculer la signature attendue
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(body))
  .digest('hex');

// Vérifier
if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}

// Vérifier app_id
const appId = body.metadata?.appId;
if (!appId) {
  throw new Error('Missing app_id');
}

return $input.item;
```

5. **Code pour le Code Node (Traitement)** :

```javascript
const data = $input.item.json.data;
const metadata = $input.item.json.metadata;

return {
  success: true,
  data: {
    message: 'Workflow executed successfully! 🎉',
    receivedMessage: data.message,
    timestamp: data.timestamp,
    appId: metadata.appId,
    userId: metadata.userId,
    processedAt: new Date().toISOString(),
  }
};
```

6. **Activer le workflow** et copier l'URL du webhook.

### Étape 3 : Démarrer l'Application Next.js

```bash
npm run dev
```

L'app sera disponible sur : `http://localhost:3000`

### Étape 4 : Tester le Flow Complet

#### A. **Test de Login**

1. Ouvrir : `http://localhost:3000/auth/login`

2. Se connecter avec un compte existant :
   - Email : `votre-email@example.com`
   - Password : `votre-password`

3. **✅ Résultat attendu** :
   - Redirection vers `/app` (dashboard)
   - Pas d'erreur
   - User connecté

4. **❌ Test de sécurité** :
   - Essayer de se connecter avec un compte d'une autre app (différent `app_id`)
   - **Résultat attendu** : Erreur "This account does not belong to this application"

#### B. **Test du Dashboard**

1. Une fois connecté, vous devriez voir :
   - Votre nom
   - Nombre de jours depuis l'inscription
   - 3 cartes : User Settings, Example Page, **Test N8N** ⚡

#### C. **Test de l'Intégration N8N**

1. Cliquer sur **"Test N8N"** dans le dashboard

2. Vous verrez :
   - Votre `App ID`
   - Votre `Email`
   - Un champ de texte avec "Hello from Nuvoya8 Factory!"

3. Cliquer sur **"Tester N8N"**

4. **✅ Résultat attendu (Si tout fonctionne)** :
   ```json
   {
     "success": true,
     "data": {
       "message": "Workflow executed successfully! 🎉",
       "receivedMessage": "Hello from Nuvoya8 Factory!",
       "timestamp": "2025-10-06T...",
       "appId": "factory-test",
       "userId": "...",
       "processedAt": "2025-10-06T..."
     },
     "appId": "factory-test",
     "userId": "..."
   }
   ```

5. **❌ Résultat en cas d'erreur** :
   - Message d'erreur clair
   - Liste de vérifications à faire

---

## 🔍 Débogage

### Erreur : "N8N_WEBHOOK_SECRET must be defined"

**Solution** : Ajouter la variable dans `.env.local` et redémarrer l'app

```bash
N8N_WEBHOOK_SECRET=votre-secret
```

### Erreur : "N8N call failed" ou Timeout

**Vérifications** :

1. N8N est-il accessible ?
   ```bash
   curl https://votre-n8n.com/webhook/test-workflow
   ```

2. Le workflow est-il activé dans N8N ?

3. L'URL est-elle correcte dans `.env.local` ?
   ```bash
   N8N_WEBHOOK_URL=https://votre-n8n.com/webhook
   ```

### Erreur : "Invalid signature" dans N8N

**Cause** : Le secret HMAC ne correspond pas

**Solution** : Vérifier que le secret dans `.env.local` est identique au secret dans le workflow N8N

### Erreur : "This account does not belong to this application"

**C'est normal !** Cette erreur signifie que la sécurité multi-tenant fonctionne.

Le compte que vous essayez d'utiliser a un `app_id` différent de celui configuré dans `.env.local`

**Solution** : Créer un nouveau compte avec l'app actuelle via `/auth/register`

---

## 📊 Workflow de Test Recommandé

```
1. Créer un compte sur l'app factory-test
   → /auth/register
   → Vérifier email
   → Confirmer

2. Se connecter
   → /auth/login
   → Email + Password
   → ✅ Redirection vers /app

3. Tester N8N
   → Cliquer sur "Test N8N"
   → Entrer un message
   → Cliquer "Tester N8N"
   → ✅ Voir la réponse

4. Tester la sécurité multi-tenant
   → Créer une 2ème app dans la DB
   → Changer NEXT_PUBLIC_APP_ID dans .env
   → Redémarrer l'app
   → Essayer de se connecter avec le 1er compte
   → ❌ Devrait être rejeté
```

---

## 🎯 Prochaines Étapes

Une fois que le test N8N fonctionne :

1. **Créer d'autres workflows N8N** :
   - Email transactionnel
   - Agent IA (analyse de texte/image)
   - Génération PDF
   - Intégrations tierces (Notion, Google Sheets, etc.)

2. **Ajouter des pages métier** :
   - Dashboard avec données réelles
   - Pages qui utilisent les workflows N8N
   - Formulaires avec traitement IA

3. **Intégrer Lemon Squeezy** :
   - Paiements
   - Gestion des abonnements
   - Webhooks LS

4. **Préparer le déploiement** :
   - Script d'automatisation
   - Variables d'env pour production
   - Tests de charge

---

## 📝 Checklist de Validation

- [ ] Variables d'environnement configurées
- [ ] N8N accessible et workflow créé
- [ ] Next.js démarre sans erreur
- [ ] Login fonctionne avec app_id correct
- [ ] Login rejette les comptes d'autres apps
- [ ] Dashboard affiche les infos user
- [ ] Page Test N8N est accessible
- [ ] Appel N8N réussit et retourne une réponse
- [ ] Appel N8N vérifie la signature HMAC
- [ ] Appel N8N filtre par app_id

---

**Bon test ! 🚀**

Si tout fonctionne, vous avez validé :
- ✅ Auth multi-tenant sécurisée
- ✅ Isolation par app_id (Prisma + Login)
- ✅ Intégration N8N avec signature HMAC
- ✅ Flow complet Next.js ↔ N8N ↔ Supabase

Vous êtes prêt à créer votre premier SaaS réel ! 💪

