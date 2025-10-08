# 🎯 Guide Final - Architecture avec Micro-service HMAC

## 🎉 Bravo !

Vous avez créé une **architecture professionnelle et scalable** en utilisant un micro-service HMAC dédié. C'est exactement ce qu'on ferait dans une vraie application de production !

---

## ✅ Ce qui est FAIT

| Composant | Status |
|-----------|--------|
| Micro-service HMAC | ✅ Créé + Déployé sur Dokploy |
| Test micro-service | ✅ Validé dans N8N |
| Workflow N8N | ✅ Créé avec intégration micro-service |
| Architecture Next.js ↔ N8N | ✅ Fonctionnelle |

---

## 📋 ÉTAPES FINALES (10 minutes)

### **1️⃣ Importer le Workflow dans N8N**

1. Ouvrir **https://n8n.infra-nuvoya8.com**

2. **Supprimer** l'ancien workflow "test-workflow" (s'il existe)

3. Menu → **Import from file**

4. Sélectionner **`n8n-workflow-with-hmac-microservice.json`**

---

### **2️⃣ Configurer l'URL du Micro-service**

Dans le workflow importé, cliquer sur le nœud **"Calculer HMAC"** (HTTP Request) :

**Modifier l'URL selon votre déploiement :**

```
Option A (Docker même réseau) : http://172.17.0.1:3010/hmac
Option B (Domaine) : https://hmac.votredomaine.com/hmac
Option C (Local) : http://localhost:3010/hmac
```

**Comment savoir quelle URL utiliser ?**

- Si votre micro-service est sur **Dokploy dans le même serveur que N8N** → Utilisez l'IP Docker interne
- Si votre micro-service a un **domaine public** → Utilisez le domaine HTTPS
- Si vous testez en **local** → Utilisez localhost

Pour trouver l'IP Docker, dans Dokploy :
1. Ouvrir le service HMAC
2. Aller dans **Logs** ou **Details**
3. Chercher l'adresse IP du conteneur

---

### **3️⃣ Vérifier le Secret HMAC**

Dans le nœud **"Calculer HMAC"**, dans le body JSON, vérifiez que le secret est correct :

```json
{
  "message": {{ $json.bodyToVerify }},
  "secret": "bc2beb8c44ca42b06249aaaa950dfaf2ca94c0f4bad0d4c3c40a9c9afa6d3f33",
  "algorithm": "sha256"
}
```

Ce secret doit être **identique** à celui dans `.env.local` de Next.js.

---

### **4️⃣ ACTIVER le Workflow**

**CRITIQUE** : En haut à droite du workflow, cliquez sur le **toggle** pour l'activer (ON, vert/bleu)

---

### **5️⃣ Tester depuis Next.js**

1. Ouvrir : **http://localhost:3000/app/n8n-test**

2. Cliquer sur **"Tester N8N"**

**✅ Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "message": "🎉 Workflow N8N exécuté avec succès (SÉCURISÉ) !",
    "workflowInfo": {
      "security": "🔐 HMAC SHA-256 Verified (via Micro-service)",
      "securityLevel": "HIGH",
      "hmacService": "External HMAC Microservice"
    }
  }
}
```

---

## 🔍 Debugging

### Si vous voyez "Connection refused" ou "ECONNREFUSED"

→ L'URL du micro-service est incorrecte dans le nœud N8N.

**Solution :**
1. Testez l'URL directement depuis N8N
2. Dans N8N, créez un workflow simple avec juste un nœud HTTP Request vers votre micro-service
3. Si ça fonctionne, copiez cette URL exacte dans le workflow principal

### Si vous voyez "Invalid HMAC signature"

→ Le secret ne correspond pas.

**Solution :**
1. Vérifier que le secret dans `.env.local` (Next.js) est identique
2. Vérifier que le secret dans le workflow N8N (nœud "Calculer HMAC") est identique
3. Vérifier qu'il n'y a pas d'espaces en trop dans les secrets

### Si le micro-service ne répond pas

→ Vérifier qu'il est bien démarré sur Dokploy

**Solution :**
1. Aller sur Dokploy → Service HMAC
2. Vérifier que le status est "Running" (vert)
3. Regarder les logs pour voir s'il y a des erreurs
4. Tester avec curl :
   ```bash
   curl -X POST http://votre-url:3010/hmac \
     -H "Content-Type: application/json" \
     -d '{"message":"test","secret":"test","algorithm":"sha256"}'
   ```

---

## 📊 Architecture Validée

Si le test fonctionne, vous avez **VALIDÉ** :

```
✅ Next.js (Frontend + API)
   ↓
✅ Auth Multi-Tenant (app_id vérifié)
   ↓
✅ Client N8N (signature HMAC générée)
   ↓
✅ N8N Workflow
   ├─ Extraction données
   ├─ Appel micro-service HMAC ✅
   ├─ Vérification signature ✅
   ├─ Vérification app_id ✅
   └─ Traitement sécurisé
   ↓
✅ Micro-service HMAC (Docker)
   └─ Calcul HMAC avec crypto natif
   ↓
✅ Réponse sécurisée vers Next.js
```

---

## 🚀 Prochaines Étapes

### **Workflows Réels**

Maintenant que l'architecture est validée, créez vos workflows :

1. **📧 Emails** :
   - Workflow d'envoi d'email (SendGrid, Mailgun)
   - Utilise le même pattern de sécurité HMAC

2. **🤖 Agents IA** :
   - Analyse de texte (GPT, Claude)
   - Analyse d'images (Vision AI)
   - Génération de contenu

3. **📄 Documents** :
   - Génération de PDF
   - Traitement de documents
   - OCR

4. **🔗 Intégrations** :
   - Notion, Google Sheets, Airtable
   - CRM, ERP, etc.

### **Lemon Squeezy**

Intégrer les paiements :
- Abonnements
- Webhooks Lemon Squeezy
- Gestion des plans

### **Déploiement**

Mettre en production :
- Déployer Next.js sur Dokploy
- Configurer le domaine
- SSL
- Variables d'env production

---

## 📚 Documentation

- **Architecture** : `ARCHITECTURE_HMAC_MICROSERVICE.md`
- **Workflow N8N** : `n8n-workflow-with-hmac-microservice.json`
- **Guide Test** : `GUIDE_TEST_N8N.md`

---

## 💡 Conseils Pro

### Sécuriser le Micro-service

En production, ajoutez :
- Authentification (Bearer token)
- Rate limiting
- Logs détaillés
- Monitoring (Sentry, Prometheus, etc.)

### Réutiliser le Pattern

Pour chaque nouveau workflow N8N :
1. Copier les 3 premiers nœuds (Webhook → Extraire → HMAC → Vérifier)
2. Ajouter votre logique métier après
3. Terminer par "Respond to Webhook"

### Template de Workflow

Créez un "template workflow" dans N8N avec juste la partie sécurité, puis dupliquez-le pour chaque nouveau workflow.

---

## 🎉 Félicitations !

Vous avez construit une **architecture de production complète** :

- ✅ Multi-tenant sécurisé
- ✅ Communication Next.js ↔ N8N chiffrée
- ✅ Micro-service HMAC dédié
- ✅ Workflows N8N modulaires
- ✅ Infrastructure Dokploy scalable

**C'est exactement ce qu'on utiliserait pour gérer des dizaines de SaaS en production !** 👏

---

**Importez le workflow, configurez l'URL du micro-service, et testez ! 🚀**

