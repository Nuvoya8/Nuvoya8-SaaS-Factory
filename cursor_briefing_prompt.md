# 🎯 BRIEFING COMPLET - NUVOYA8 SAAS FACTORY

## 📋 CONTEXTE DU PROJET

Je crée une **FACTORY de SaaS** : un template Next.js réutilisable permettant de lancer rapidement des dizaines de SaaS différents en changeant juste quelques configs.

### Objectif Final
**1 codebase → 50 SaaS déployés** en changeant uniquement :
- Le nom du SaaS
- Le domaine
- Le logo
- Les configs (`.env`)

Le reste (auth, paiements, UI, multi-tenant, workflows) est **identique et industrialisé**.

---

## 🏗️ ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────┐
│              VPS (Dokploy)                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  Supabase    │  │     N8N      │             │
│  │  (Postgres)  │  │  Workflows   │             │
│  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                      │
│  ┌──────┴─────────────────┴──────────┐          │
│  │         Next.js Apps               │          │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ │          │
│  │  │ SaaS A │ │ SaaS B │ │ SaaS C │ │          │
│  │  └────────┘ └────────┘ └────────┘ │          │
│  └────────────────────────────────────┘          │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Stack Technique

**Frontend/Backend :**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Template de base : [Razikus/supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template)

**Base de Données :**
- Supabase self-hosted (Postgres)
- **1 seule DB pour TOUS les SaaS**
- Isolation multi-tenant via `appId`

**ORM :**
- Prisma avec middleware d'isolation automatique

**Workflows/Automations :**
- N8N self-hosted
- Appelé via webhooks depuis Next.js
- Sécurisé avec signature HMAC

**Paiements :**
- Lemon Squeezy (1 compte partagé pour tous les SaaS)

**Déploiement :**
- Dokploy (self-hosted sur VPS)
- 1 déploiement Next.js = 1 SaaS = 1 domaine

---

## 🔑 PRINCIPE MULTI-TENANT

### Isolation par `appId`

Chaque SaaS a un `appId` unique (ex: `"todo-master"`, `"fitness-pro"`).

**Toutes les données sont filtrées automatiquement** :

```typescript
// Via Prisma middleware - transparent pour le dev
const users = await prisma.user.findMany()
// SQL généré : SELECT * FROM users WHERE app_id = 'todo-master'
```

### Tables principales

```
apps (id, name, slug, domain, logo, colors, theme)
  ↓
users (id, app_id, email, role, ...)
  ↓
subscriptions (id, app_id, user_id, lemonsqueezy_id, status, ...)
tasks (id, app_id, user_id, title, status, ...)
files (id, app_id, user_id, path, ...)
audit_logs (id, app_id, user_id, action, ...)
```

### Sync Auth Supabase ↔ Prisma

- Supabase gère `auth.users` (auth native)
- Trigger Postgres sync automatique vers `public.users` (Prisma)
- `appId` injecté dans `user_metadata` à l'inscription

---

## 📁 FICHIERS DÉJÀ GÉNÉRÉS

### 1. Schema Prisma (`prisma/schema.prisma`)

Contient :
- Model `App` (les SaaS)
- Model `User` (avec `appId`)
- Model `Subscription` (Lemon Squeezy)
- Model `Task`, `File` (exemples de features)
- Model `AuditLog` (logs)

**Tous les models ont `appId` sauf `App`.**

### 2. Client Prisma (`src/lib/prisma.ts`)

- Singleton Prisma Client
- **Middleware magique** : filtre/injecte automatiquement `appId` dans toutes les queries
- Helpers : `getCurrentAppId()`, `bypassTenantFilter()`, `createAuditLog()`

### 3. Helpers Auth Supabase (`src/lib/supabase/auth-helpers.ts`)

- `signUpWithEmail()` : Injecte `appId` dans metadata
- `signInWithEmail()` : Vérifie que user appartient à l'app
- `signInWithOAuth()` : Passe `appId` en query param
- `getCurrentUser()` : Valide l'appId

### 4. Client N8N (`src/lib/n8n/client.ts`)

- Client typé pour appeler les workflows N8N
- Sécurité : signature HMAC sur chaque call
- Retry automatique + timeout configurable
- Mode async pour workflows longs
- API fluide : `n8n.sendEmail()`, `n8n.analyzeImage()`, etc.

### 5. Types N8N (`src/lib/n8n/types.ts`)

- Types pour tous les workflows (Email, AI, Data, Integrations, etc.)
- Registry des workflows disponibles
- Error codes

### 6. Migrations SQL Supabase (`supabase/migrations/sync_auth_users.sql`)

- Triggers pour sync `auth.users` → `public.users`
- Fonction `handle_new_user()`, `handle_user_update()`, `handle_user_delete()`
- RLS policies
- Indexes

### 7. Configuration Environnement (`.env.template`)

Variables pour :
- App identity (`NEXT_PUBLIC_APP_ID`, `NEXT_PUBLIC_APP_NAME`, etc.)
- Supabase (partagé entre tous les SaaS)
- Database (Prisma)
- Lemon Squeezy (partagé)
- N8N (partagé)

### 8. Components Branding

- `components/shared/Footer.tsx` : Footer avec "Powered by Nuvoya8"
- `components/shared/Nuvoya8Watermark.tsx` : Badge discret en bas à droite

### 9. Documentation

- `docs/DEPLOYMENT.md` : Guide complet de déploiement
- `docs/N8N_INTEGRATION.md` : Setup N8N + création de workflows
- `STRUCTURE.md` : Architecture du template

---
## CE qUI EST DEJA FAIT
### Phase 1 : Intégration Prisma dans le template Razikus

1. **Adapter les imports Supabase** :
   - Le template Razikus utilise ses propres helpers Supabase
   - On doit coexister : Supabase (auth) + Prisma (data)

2. **Créer les tables via Prisma** :
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Remplacer les queries Supabase par Prisma** :
   - Exemple : `supabase.from('users').select()` → `prisma.user.findMany()`

4. **Créer la première app** :
   ```sql
   INSERT INTO apps (id, name, slug, domain)
   VALUES ('', 'Nuvoya8 Factory Test', 'factory-test', 'localhost:3000');
   ```


## 🎯 CE QU'IL RESTE À FAIRE



### Phase 2 : Intégration Lemon Squeezy

1. Créer `src/lib/lemonsqueezy/client.ts`
2. Créer `app/api/webhooks/lemonsqueezy/route.ts`
3. Gérer les events : `subscription_created`, `subscription_updated`, etc.
4. Update `subscriptions` table via Prisma

### Phase 3 : Intégration N8N

1. Déployer N8N sur le VPS (Dokploy)
2. Créer les workflows de base :
   - `send-email`
   - `analyze-image` (si besoin IA)
   - `generate-pdf`
3. Configurer les webhooks avec signatures
4. Tester les appels depuis Next.js

### Phase 4 : Adapter le template Razikus

1. **Pages à modifier** :
   - Auth pages (signup/login) : utiliser nos helpers avec `appId`
   - Dashboard : remplacer queries Supabase par Prisma
   - Settings : ajouter billing avec Lemon Squeezy

2. **Ajouter les composants** :
   - Footer Nuvoya8
   - Watermark
   - Billing status

3. **Supprimer les features non nécessaires** :
   - Garder : Auth, User management
   - Optionnel : Tasks, Files (comme exemples)

### Phase 5 : Premier déploiement test

1. Déployer sur Dokploy
2. Configurer le domaine
3. Tester création de compte
4. Valider l'isolation multi-tenant

---

## ⚙️ CONFIGURATION ACTUELLE

### Supabase Self-Hosted
```
URL: https://supabase.infra-nuvoya8.com
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DB: postgresql://supabase_admin.jyhfme:***@62.72.36.2:5432/postgres
```

### App Test Locale
```
APP_ID: factory-test
APP_NAME: Nuvoya8 Factory Test
URL: http://localhost:3000
```

---

## 🚨 POINTS CRITIQUES À RESPECTER

### 1. **JAMAIS bypass l'isolation multi-tenant**
- Toujours passer par Prisma (pas de raw SQL sans `appId`)
- Ne jamais exposer de données d'une autre app

### 2. **Sécurité N8N**
- TOUJOURS vérifier la signature HMAC dans les workflows
- TOUJOURS valider l'`appId` dans N8N

### 3. **Auth Supabase**
- TOUJOURS injecter `appId` dans `user_metadata` à l'inscription
- TOUJOURS vérifier que le user appartient à l'app au login

### 4. **Lemon Squeezy**
- 1 compte partagé pour tous les SaaS
- Webhooks doivent identifier l'app via metadata

### 5. **Pas de localStorage**
- Interdits dans les artifacts Claude.ai
- Utiliser React state uniquement

---

## 🎨 CONVENTIONS DE CODE

### Naming
- Composants : PascalCase (`UserProfile.tsx`)
- Fonctions : camelCase (`getUserById()`)
- Fichiers : kebab-case (`user-profile.tsx`) ou camelCase
- Types : PascalCase (`UserType`)

### Structure Prisma queries
```typescript
// ✅ BON : Le middleware filtre automatiquement
const users = await prisma.user.findMany({
  where: { role: 'admin' }
})

// ❌ MAUVAIS : Bypass du middleware (sauf cas spécial admin)
const users = await prisma.$queryRaw`SELECT * FROM users`
```

### Structure N8N calls
```typescript
// ✅ BON : Typé et sécurisé
await n8n.sendEmail({
  to: user.email,
  template: 'welcome',
  variables: { name: user.name }
}, { userId: user.id })

// ✅ BON : Mode async pour workflows longs
await n8n.generatePDF({ ... }, { async: true })

// ❌ MAUVAIS : Pas de gestion d'erreur
await n8n.sendEmail({ ... }) // Peut throw sans catch
```

---

## 📝 PROCHAINES ACTIONS IMMÉDIATES

**Tu dois m'aider à :**

1. **Analyser le code Razikus** :
   - Comment ils gèrent Supabase (client, server, middleware)
   - Structure des pages (auth, dashboard)
   - Où sont les queries Supabase à remplacer

2. **Intégrer Prisma** :
   - Coexistence avec Supabase auth
   - Migration progressive des queries
   - Setup des migrations

3. **Adapter l'auth** :
   - Modifier les pages signup/login
   - Injecter `appId`
   - Utiliser nos helpers

4. **Tester en local** :
   - Créer un compte
   - Vérifier l'isolation
   - Valider le flow complet

---

## 🤝 TON RÔLE

Tu es mon co-développeur expert. Tu dois :

- ✅ **Analyser le code existant** avant de proposer des modifs
- ✅ **Respecter l'architecture multi-tenant** (ne jamais bypass `appId`)
- ✅ **Proposer du code production-ready** (avec error handling)
- ✅ **Être pragmatique** : réutiliser ce qui marche dans Razikus
- ✅ **M'expliquer tes choix** quand tu proposes quelque chose
- ❌ **Ne pas tout réécrire** : adapter, pas remplacer
- ❌ **Ne pas inventer** : si tu ne sais pas, demande

---

## 📚 RESSOURCES

- Template Razikus : https://github.com/Razikus/supabase-nextjs-template
- Prisma docs : https://www.prisma.io/docs
- Supabase docs : https://supabase.com/docs
- N8N docs : https://docs.n8n.io

---

## ✅ VALIDATION

Avant de commencer, confirme que tu as compris :

1. L'objectif (SaaS Factory multi-tenant)
2. L'architecture (Supabase + Prisma + N8N)
3. Le principe d'isolation par `appId`
4. Les fichiers déjà générés
5. Ce qu'il reste à faire

**Dis "READY" si tu as tout compris et qu'on peut commencer !**
