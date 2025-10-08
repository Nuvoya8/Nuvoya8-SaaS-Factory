# 🔐 Configuration N8N - Activer le Module Crypto

## 🎯 Problème

Par défaut, N8N n'autorise pas l'utilisation de modules Node.js natifs comme `crypto` dans les nœuds Code pour des raisons de sécurité.

## ✅ Solution

Ajouter la variable d'environnement `NODE_FUNCTION_ALLOW_BUILTIN` dans la configuration Docker de N8N.

---

## 📋 Instructions (Dokploy)

Si vous utilisez **Dokploy** :

### 1. Ouvrir Dokploy

https://dokploy.votredomaine.com

### 2. Sélectionner le Service N8N

- Menu → Applications/Services
- Cliquez sur votre instance N8N

### 3. Modifier les Variables d'Environnement

Aller dans **Environment Variables** et ajouter :

```
NODE_FUNCTION_ALLOW_BUILTIN=crypto
```

### 4. Redéployer

Cliquez sur **Deploy** ou **Restart** pour appliquer les changements.

---

## 📋 Instructions (Docker Compose Classique)

Si vous gérez N8N avec `docker-compose.yml` :

### 1. Éditer docker-compose.yml

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      # Activer le module crypto
      - NODE_FUNCTION_ALLOW_BUILTIN=crypto
      
      # Autres variables existantes
      - N8N_HOST=n8n.votredomaine.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.votredomaine.com/
      # ... etc
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

### 2. Redémarrer N8N

```bash
docker-compose down
docker-compose up -d
```

### 3. Vérifier les Logs

```bash
docker-compose logs -f n8n
```

---

## ✅ Vérification

Une fois N8N redémarré :

1. Ouvrez votre workflow dans N8N
2. Dans un nœud Code, ajoutez :
   ```javascript
   const crypto = require('crypto');
   return { json: { cryptoAvailable: true } };
   ```
3. Testez l'exécution
4. Si aucune erreur → crypto est activé ! ✅

---

## 🔐 Sécurité

### ⚠️ Important

L'activation du module `crypto` est **sûre** car :
- `crypto` est un module natif de Node.js
- Il est utilisé uniquement pour la cryptographie (HMAC, hashing, etc.)
- Pas de risque d'exécution de code malveillant

### 🛡️ Modules Autorisés

Vous pouvez aussi autoriser d'autres modules natifs :

```
NODE_FUNCTION_ALLOW_BUILTIN=crypto,fs,path
```

**Attention** : N'autorisez que les modules dont vous avez **vraiment besoin** !

---

## 🚀 Après Configuration

Une fois `crypto` activé, vous pouvez :

1. **Importer le workflow sécurisé** : `n8n-workflow-hmac-secure.json`
2. **Vérifier la signature HMAC** dans tous vos workflows
3. **Sécuriser l'architecture complète** Next.js ↔ N8N

---

## 📚 Documentation Officielle

- [N8N Security](https://docs.n8n.io/hosting/configuration/security/)
- [N8N Environment Variables](https://docs.n8n.io/hosting/configuration/environment-variables/)

---

## ✅ Checklist

- [ ] Variable `NODE_FUNCTION_ALLOW_BUILTIN=crypto` ajoutée
- [ ] N8N redémarré
- [ ] Workflow avec `require('crypto')` testé
- [ ] Pas d'erreur "Cannot find module 'crypto'"
- [ ] Vérification HMAC fonctionnelle

**Une fois cette checklist complète, votre architecture est SÉCURISÉE ! 🔐**

