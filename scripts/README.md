# 🔍 Script de Vérification - Guide d'Utilisation

## 📋 Description

Le script `verify-setup.ts` vérifie automatiquement que toute la configuration de votre SaaS est correcte avant de démarrer l'application.

## 🚀 Utilisation

### Installation des dépendances

```bash
npm install
```

### Exécuter le script

```bash
npm run verify
```

## ✅ Ce qui est vérifié

### 1. Variables d'environnement
- ✓ `NEXT_PUBLIC_APP_ID` - Identifiant unique de l'app
- ✓ `NEXT_PUBLIC_APP_NAME` - Nom de l'app
- ✓ `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase
- ✓ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase
- ✓ `DATABASE_URL` - Connexion PostgreSQL
- ⚠️ `N8N_WEBHOOK_URL` - URL webhooks N8N (optionnel)
- ⚠️ `N8N_WEBHOOK_SECRET` - Secret HMAC N8N (optionnel)
- ⚠️ `PRIVATE_SUPABASE_SERVICE_KEY` - Clé admin Supabase (optionnel)

### 2. Connexion Supabase
- Teste la connexion à Supabase
- Vérifie que la table `apps` est accessible

### 3. Base de données (Prisma)
- Connexion PostgreSQL
- Vérification de l'existence de l'app dans la table `apps`
- Vérification des tables principales (users, subscriptions, tasks, etc.)

### 4. Connexion N8N (optionnel)
- Teste si N8N est accessible
- Timeout de 5 secondes

### 5. Fichiers et Structure
- Vérifie l'existence des fichiers principaux
- Vérifie que `node_modules` est installé

## 📊 Exemple de Sortie

```
╔════════════════════════════════════════════════════════╗
║   🔍 VÉRIFICATION - Nuvoya8 SaaS Factory              ║
╚════════════════════════════════════════════════════════╝

📝 Variables d'environnement
✓ NEXT_PUBLIC_APP_ID = factory-test
✓ NEXT_PUBLIC_SUPABASE_URL = https://supabase.infra-nuvoya8.com
✓ DATABASE_URL = [DÉFINI]
⚠ N8N_WEBHOOK_URL non défini (URL des webhooks N8N)

🗄️  Connexion Supabase
✓ Supabase accessible
✓ Table "apps" existe

💾 Base de données (Prisma)
✓ Connexion PostgreSQL établie
✓ App "factory-test" trouvée dans la DB
   ℹ Nom: Nuvoya8 Factory Test
   ℹ Domaine: localhost:3000
   ℹ Active: Oui

⚡ Connexion N8N
⚠ N8N non configuré (optionnel)

📁 Fichiers et Structure
✓ package.json
✓ prisma/schema.prisma
✓ src/lib/prisma.ts
✓ node_modules installés

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 RÉSUMÉ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ 18 vérifications réussies
⚠ 2 avertissements

💡 Configuration OK avec quelques avertissements.
   L'app fonctionnera mais certaines fonctionnalités peuvent être limitées.

🚀 Commande: npm run dev
```

## ❌ En cas d'Erreur

### Erreur : "App introuvable dans la DB"

Le script affichera automatiquement la commande SQL à exécuter :

```sql
INSERT INTO apps (id, name, slug, domain, is_active, created_at, updated_at)
VALUES ('factory-test', 'Nuvoya8 Factory Test', 'factory-test', 'localhost:3000', true, NOW(), NOW());
```

### Erreur : "Les tables n'existent pas"

Exécutez :
```bash
npx prisma db push
```

### Erreur : "node_modules manquant"

Exécutez :
```bash
npm install
```

### Erreur : "Variables manquantes"

Copiez `.env.example` vers `.env.local` et remplissez les valeurs.

## 🔄 Workflow Recommandé

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer .env.local
cp .env.example .env.local
# Puis éditer .env.local avec vos valeurs

# 3. Créer les tables Prisma
npx prisma db push

# 4. Vérifier la configuration
npm run verify

# 5. Si tout est OK, démarrer l'app
npm run dev
```

## 🛠️ Personnalisation

Vous pouvez modifier `scripts/verify-setup.ts` pour ajouter vos propres vérifications.

Exemple :
```typescript
async function verifyCustomCheck() {
  section('🔧 Ma Vérification Custom')
  
  // Votre logique ici
  if (condition) {
    log('success', 'Tout va bien')
  } else {
    log('error', 'Problème détecté')
  }
}

// Ajouter dans main()
await verifyCustomCheck()
```

## 📚 Aide

Si vous rencontrez des problèmes :
1. Vérifiez que toutes les variables d'environnement sont définies
2. Assurez-vous que Supabase est accessible
3. Vérifiez que les tables Prisma existent
4. Consultez `GUIDE_TEST_N8N.md` pour la configuration N8N

