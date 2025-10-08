# 🚀 Guide de Démarrage Rapide - Nuvoya8 SaaS Factory

## 📋 Prérequis

- Node.js 18+ installé
- Compte Supabase configuré (self-hosted ou cloud)
- PostgreSQL accessible

## ⚡ Démarrage en 5 Étapes

### 1️⃣ Installer les dépendances

```bash
npm install
```

### 2️⃣ Configurer les variables d'environnement

```bash
# Copier le template
cp env.template .env.local

# Éditer avec vos valeurs
nano .env.local  # ou votre éditeur préféré
```

**Variables minimales requises :**
- `NEXT_PUBLIC_APP_ID` - Identifiant unique (ex: `factory-test`)
- `NEXT_PUBLIC_APP_NAME` - Nom de votre SaaS
- `NEXT_PUBLIC_SUPABASE_URL` - URL de votre Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase
- `DATABASE_URL` - URL PostgreSQL

### 3️⃣ Créer les tables dans la base de données

```bash
# Créer/mettre à jour les tables Prisma
npx prisma db push

# Ou appliquer les migrations Supabase
# psql -U postgres -d votre_db -f supabase/migrations/00_sync_auth_users.sql
```

### 4️⃣ Créer votre première app dans la DB

Connectez-vous à votre PostgreSQL et exécutez :

```sql
INSERT INTO apps (id, name, slug, domain, is_active, created_at, updated_at)
VALUES (
  'factory-test',              -- Même valeur que NEXT_PUBLIC_APP_ID
  'Nuvoya8 Factory Test',      -- Nom de votre app
  'factory-test',              -- Slug pour l'URL
  'localhost:3000',            -- Domaine
  true,                        -- Active
  NOW(),
  NOW()
);
```

### 5️⃣ Vérifier la configuration

```bash
# Lancer le script de vérification
npm run verify
```

Si tout est ✅ vert, vous pouvez démarrer :

```bash
npm run dev
```

L'app sera disponible sur **http://localhost:3000**

---

## 🔧 Configuration N8N (Optionnel)

Si vous voulez utiliser les workflows N8N :

### 1. Ajouter les variables N8N dans `.env.local`

```bash
N8N_WEBHOOK_URL=https://votre-n8n.com/webhook
N8N_WEBHOOK_SECRET=votre-secret-hmac-tres-long-et-securise
```

### 2. Créer un workflow de test dans N8N

Consultez `GUIDE_TEST_N8N.md` pour les instructions complètes.

---

## 📚 Structure du Projet

```
Nuvoya8-SaaS-Factory/
├── scripts/
│   ├── verify-setup.ts       ← Script de vérification
│   └── README.md             ← Documentation du script
│
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/        ← Page de connexion
│   │   │   └── register/     ← Page d'inscription
│   │   │
│   │   ├── app/
│   │   │   ├── page.tsx      ← Dashboard principal
│   │   │   └── n8n-test/     ← Page de test N8N
│   │   │
│   │   └── api/
│   │       ├── user/me/      ← API utilisateur
│   │       └── n8n/test/     ← API test N8N
│   │
│   ├── lib/
│   │   ├── prisma.ts         ← Client Prisma + middleware
│   │   ├── n8n/
│   │   │   ├── client.ts     ← Client N8N typé
│   │   │   └── types.ts      ← Types N8N
│   │   └── supabase/
│   │       ├── client.ts     ← Client Supabase
│   │       └── unified.ts    ← SassClient avec auth
│   │
│   └── components/
│       └── shared/
│           └── Footer.tsx    ← Footer Nuvoya8
│
├── prisma/
│   └── schema.prisma         ← Schéma de la DB
│
├── supabase/
│   └── migrations/
│       └── 00_sync_auth_users.sql  ← Triggers de sync
│
├── env.template              ← Template de config
├── GUIDE_TEST_N8N.md         ← Guide de test N8N
└── QUICKSTART.md             ← Ce fichier
```

---

## 🎯 Workflow de Test Recommandé

### 1. Créer un compte

```
http://localhost:3000/auth/register
```

- Entrer email + password
- Accepter les CGU
- Vérifier l'email de confirmation
- Cliquer sur le lien de confirmation

### 2. Se connecter

```
http://localhost:3000/auth/login
```

- Email + Password
- Redirection automatique vers `/app`

### 3. Tester le dashboard

Vous devriez voir :
- Votre nom
- Nombre de jours depuis l'inscription
- Liens vers différentes pages

### 4. Tester N8N (si configuré)

```
http://localhost:3000/app/n8n-test
```

- Entrer un message
- Cliquer "Tester N8N"
- Voir la réponse du workflow

---

## 🐛 Dépannage

### Erreur : "App ID must be defined"

→ Vérifiez que `NEXT_PUBLIC_APP_ID` est bien défini dans `.env.local`

### Erreur : "This account does not belong to this application"

→ C'est normal ! Cela signifie que le compte appartient à une autre app.
→ Créez un nouveau compte via `/auth/register`

### Erreur : "Table 'apps' does not exist"

→ Exécutez `npx prisma db push`

### Erreur : "N8N timeout"

→ Vérifiez que N8N est démarré et accessible
→ Ou ignorez cette erreur si vous n'utilisez pas N8N pour l'instant

### Erreur : Build TypeScript

→ Exécutez `npm run verify` pour voir les erreurs
→ Vérifiez que tous les fichiers sont présents

---

## 📖 Documentation Complète

- `scripts/README.md` - Documentation du script de vérification
- `GUIDE_TEST_N8N.md` - Guide complet pour tester N8N
- `cursor_briefing_prompt.md` - Briefing complet du projet

---

## 🆘 Aide

Si vous rencontrez des problèmes :

1. **Exécutez le script de vérification** :
   ```bash
   npm run verify
   ```

2. **Vérifiez les logs** :
   ```bash
   # Console du navigateur (F12)
   # Terminal où tourne `npm run dev`
   ```

3. **Consultez les fichiers de documentation** mentionnés ci-dessus

---

## 🎉 Prochaines Étapes

Une fois que l'app fonctionne :

1. **Intégrer Lemon Squeezy** pour les paiements
2. **Ajouter le branding Nuvoya8** (Footer + Watermark)
3. **Créer vos workflows N8N** personnalisés
4. **Développer vos pages métier**
5. **Déployer sur Dokploy**

---

**Bon développement ! 🚀**

