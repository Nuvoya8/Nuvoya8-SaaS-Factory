# 📦 Guide : Importer le Workflow dans N8N

## 🎯 Objectif

Importer le fichier `n8n-test-workflow.json` dans votre instance N8N pour permettre la communication avec Next.js.

---

## 📋 Étapes d'Import

### 1️⃣ Ouvrir N8N

URL : **https://n8n.infra-nuvoya8.com**

Connectez-vous à votre compte N8N.

---

### 2️⃣ Importer le Workflow

#### Option A : Via l'interface

1. Dans le menu principal, cliquer sur **"Workflows"** (ou aller directement sur la page d'accueil)

2. Cliquer sur le bouton **"Import from file"** ou **"Add Workflow"** → **"Import from file"**

3. Sélectionner le fichier : `n8n-test-workflow.json` 
   - Emplacement : Racine du projet Nuvoya8-SaaS-Factory

4. Le workflow s'ouvre automatiquement

#### Option B : Par glisser-déposer

1. Ouvrir l'interface N8N

2. Glisser-déposer directement le fichier `n8n-test-workflow.json` sur la page

---

### 3️⃣ Vérifier le Workflow

Une fois importé, vous devriez voir **4 nœuds** :

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Webhook   │ --> │ Vérifier HMAC    │ --> │ Traiter Requête │ --> │ Respond Webhook  │
│   (POST)    │     │  Signature       │     │                 │     │                  │
└─────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘
```

#### Détail des nœuds :

1. **Webhook**
   - Type : Webhook Trigger
   - Path : `test-workflow`
   - Méthode : POST

2. **Vérifier Signature HMAC**
   - Type : Function
   - Vérifie la signature HMAC pour sécuriser les appels
   - Vérifie l'app_id

3. **Traiter la Requête**
   - Type : Function
   - Traite le message reçu
   - Retourne une réponse JSON

4. **Respond to Webhook**
   - Type : Respond to Webhook
   - Envoie la réponse au client

---

### 4️⃣ ACTIVER le Workflow ⚠️ IMPORTANT

**Cette étape est CRITIQUE !**

1. En haut à droite du workflow, vous verrez un **toggle** (interrupteur)

2. Cliquer dessus pour **ACTIVER** le workflow
   - Inactif (gris) → Actif (vert/bleu)

3. Vérifier qu'il est bien actif : le toggle doit être en position **ON**

**Sans cette activation, les appels depuis Next.js échoueront !**

---

### 5️⃣ Récupérer l'URL du Webhook (Optionnel)

1. Cliquer sur le nœud **"Webhook"** (le premier)

2. Dans le panneau de droite, vous verrez l'URL du webhook :
   ```
   https://n8n.infra-nuvoya8.com/webhook/test-workflow
   ```

3. Cette URL est déjà configurée dans votre `.env.local` 
   ```
   N8N_WEBHOOK_URL=https://n8n.infra-nuvoya8.com/webhook
   ```

---

## ✅ Vérification

Pour vérifier que tout fonctionne :

### Test manuel dans N8N

1. Dans le workflow, cliquer sur le nœud **"Webhook"**

2. Cliquer sur **"Listen for test event"**

3. Dans un terminal, exécuter :
   ```bash
   curl -X POST https://n8n.infra-nuvoya8.com/webhook/test-workflow \
     -H "Content-Type: application/json" \
     -d '{"data":{"message":"Test"},"metadata":{"appId":"factory-test"}}'
   ```

4. Vous devriez voir les données arriver dans N8N

**OU** (plus simple) :

### Test depuis Next.js

1. Démarrer l'app :
   ```bash
   npm run dev
   ```

2. Ouvrir : http://localhost:3000/app/n8n-test

3. Cliquer sur "Tester N8N"

4. Si tout fonctionne, vous verrez une réponse JSON avec :
   ```json
   {
     "success": true,
     "data": {
       "message": "🎉 Workflow N8N exécuté avec succès !",
       ...
     }
   }
   ```

---

## 🐛 Dépannage

### Erreur : "Workflow not found"

→ Le workflow n'est pas activé. Vérifiez le toggle en haut à droite.

### Erreur : "Invalid signature"

→ Le secret HMAC ne correspond pas. Vérifiez que :
1. Le secret dans le nœud "Vérifier HMAC" est correct
2. Le secret dans `.env.local` est le même

### Erreur : "Timeout"

→ N8N ne répond pas. Vérifiez :
1. Que N8N est bien démarré
2. Que le workflow est activé
3. Que l'URL dans `.env.local` est correcte

---

## 📊 Logs N8N

Pour voir les logs d'exécution :

1. Dans N8N, aller dans **"Executions"** (menu de gauche)

2. Vous verrez toutes les exécutions du workflow

3. Cliquer sur une exécution pour voir les détails :
   - Données reçues
   - Résultats de chaque nœud
   - Erreurs éventuelles

---

## 🎉 Workflow Importé avec Succès !

Une fois le workflow activé, vous pouvez :

1. **Tester depuis Next.js** → http://localhost:3000/app/n8n-test

2. **Créer d'autres workflows** basés sur ce template

3. **Personnaliser la logique** dans les nœuds Function

---

## 🔐 Sécurité

Le workflow vérifie automatiquement :
- ✅ Signature HMAC (empêche les appels non autorisés)
- ✅ App ID (isolation multi-tenant)
- ✅ Structure des données

**Ne désactivez JAMAIS la vérification HMAC en production !**

---

**Prêt pour le test ! 🚀**

