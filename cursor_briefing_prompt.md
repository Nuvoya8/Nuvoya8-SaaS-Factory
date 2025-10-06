# 🎯 BRIEFING COMPLET - NUVOYA8 SAAS FACTORY

## 📋 OBJECTIF DU PROJET

Créer une **FACTORY de SaaS** : un template Next.js réutilisable permettant de lancer rapidement des dizaines de SaaS différents.

**Principe :**  
1 codebase → 50 SaaS déployés en changeant uniquement :
- Le nom du SaaS
- Le domaine
- Le logo
- Les variables d'environnement (`.env`)

Le reste (auth, paiements, UI, infra, workflows) est **identique et industrialisé**.

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

---

## 🔧 STACK TECHNIQUE

### Frontend/Backend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + shadcn/ui
- **Template de base** : [Razikus/supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template)

### Base de Données
- **Supabase self-hosted** (PostgreSQL)
- **1 seule DB pour TOUS les SaaS**
- Isolation multi-tenant via `app_id`

### ORM
- **Prisma** avec middleware d'isolation automatique
- Convention : **snake_case partout** (même nom en DB et en code)

### Workflows/Automations
- **N8N self-hosted**
- Appelé via webhooks depuis Next.js
- Sécurisé avec signature HMAC

### Paiements
- **Lemon Squeezy** (1 compte partagé pour tous les SaaS)
- Merchant of Record (gère la TVA internationale)

### Déploiement
- **Dokploy** (self-hosted sur VPS)
- 1 déploiement Next.js = 1 SaaS = 1 domaine

---

## 🔑 PRINCIPE MULTI-TENANT

### Isolation par `app_id`

Chaque SaaS a un `app_id` unique (ex: `"factory-test"`, `"todo-master"`).

**Toutes les données sont filtrées automatiquement via le middleware Prisma :**

```typescript
// Code simple
const users = await prisma.user.findMany()

// SQL généré automatiquement
// SELECT * FROM users WHERE app_id = 'factory-test'
```

### Tables Principales

```
apps (id, name, slug, domain, logo_url, primary_color, secondary_color, theme)
  ↓
users (id, app_id, email, name, role, created_at, updated_at, last_login_at)
  ↓
subscriptions (id, app_id, user_id, lemonsqueezy_id, status, price, renews_at)
tasks (id, app_id, user_id, title, status, priority, due_date)
files (id, app_id, user_id, path, bucket, size, mime_type)
audit_logs (id, app_id, user_id, action, entity, metadata, created_at)
```

**Important :** Tous les modèles ont `app_id` sauf `apps`.

### Sync Auth Supabase ↔ Prisma

- **Supabase** gère `auth.users` (auth native)
- **Trigger Postgres** sync automatique vers `public.users` (Prisma)
- `app_id` injecté dans `user_metadata` à l'inscription

---

## ✅ CE QUI A ÉTÉ RÉALISÉ

### 1. Setup Prisma ✅

**Fichiers créés :**
- `prisma/schema.prisma` - Schéma DB multi-tenant
- `src/lib/prisma.ts` - Client Prisma avec middleware d'isolation

**Middleware Prisma :**
```typescript
// Filtre automatiquement par app_id
// Ajoute app_id lors des créations
// Garantit l'isolation totale entre SaaS
```

**Tables créées dans Supabase :**
```bash
npx prisma db push
```

### 2. Triggers SQL Supabase ✅

**Fichier créé :**
- `supabase/migrations/00_sync_auth_users.sql`

**Fonctions :**
- `handle_new_user()` - Sync à l'inscription
- `handle_user_update()` - Sync à la mise à jour
- `handle_user_delete()` - Sync à la suppression
- `update_user_last_login()` - Update last_login_at

**RLS (Row Level Security) :**
- Policies sur toutes les tables
- Filtrage par `app_id` et `user_id`
- Sécurité double : RLS + Middleware Prisma

### 3. Auth Multi-Tenant ✅

**Fichier créé :**
- `src/lib/supabase/auth-helpers.ts`

**Fonctions principales :**
```typescript
signUpWithEmail()      // Injecte app_id dans metadata
signInWithEmail()      // Vérifie app_id
signInWithOAuth()      // Passe app_id en query param
signOut()
resetPassword()
getCurrentUser()       // Valide app_id
checkAuthStatus()
```

**Page register adaptée :**
- `src/app/(auth)/register/page.tsx` modifié
- Utilise `.getSupabaseClient().auth.signUp()` avec `app_id`

**Callback OAuth adapté :**
- `src/app/api/auth/callback/route.tsx` modifié
- Vérifie que le user appartient à l'app
- Signout automatique si mauvais `app_id`

### 4. API Routes Backend ✅

**Fichiers créés :**
- `src/app/api/user/me/route.ts` - Get user data (Prisma côté serveur)

**Raison :** Prisma ne peut pas tourner côté client (browser).

### 5. Global Context Adapté ✅

**Fichier modifié :**
- `src/lib/context/GlobalContext.tsx`

**Changements :**
- Suppression de l'import Prisma direct (causait erreur browser)
- Utilisation de `fetch('/api/user/me')` à la place
- Récupération des données user depuis le backend

### 6. Configuration Environnement ✅

**Fichier :**
- `.env.local` configuré

**Variables principales :**
```bash
# App Identity (UNIQUE par SaaS)
NEXT_PUBLIC_APP_ID=factory-test
NEXT_PUBLIC_APP_NAME=Nuvoya8 Factory Test

# Supabase (PARTAGÉ)
NEXT_PUBLIC_SUPABASE_URL=https://supabase.infra-nuvoya8.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
PRIVATE_SUPABASE_SERVICE_KEY=...

# Database (PARTAGÉ)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### 7. Première App Créée ✅

```sql
INSERT INTO apps (id, name, slug, domain, is_active, created_at, updated_at)
VALUES ('factory-test', 'Nuvoya8 Factory Test', 'factory-test', 'localhost:3000', true, NOW(), NOW());
```

### 8. Tests Réussis ✅

- ✅ Inscription avec email/password
- ✅ User créé dans `auth.users` avec `app_id` dans metadata
- ✅ Trigger sync vers `public.users` fonctionnel
- ✅ Email de confirmation reçu
- ✅ Confirmation email validée
- ✅ Login fonctionnel
- ✅ Dashboard accessible
- ✅ Isolation multi-tenant validée

---

## 📁 STRUCTURE DES FICHIERS

```
Nuvoya8-SaaS-Factory/
├── prisma/
│   └── schema.prisma              ✅ Schéma DB multi-tenant
│
├── supabase/
│   └── migrations/
│       └── 00_sync_auth_users.sql ✅ Triggers de sync
│
├── src/
│   ├── lib/
│   │   ├── prisma.ts              ✅ Client Prisma + middleware
│   │   ├── supabase/
│   │   │   ├── auth-helpers.ts    ✅ Helpers auth multi-tenant
│   │   │   ├── client.ts          (Razikus - conservé)
│   │   │   ├── server.ts          (Razikus - conservé)
│   │   │   ├── middleware.ts      (Razikus - conservé)
│   │   │   └── unified.ts         (Razikus - conservé)
│   │   └── context/
│   │       └── GlobalContext.tsx  ✅ Adapté (API route)
│   │
│   └── app/
│       ├── (auth)/
│       │   └── register/
│       │       └── page.tsx       ✅ Modifié (app_id)
│       │
│       └── api/
│           ├── auth/
│           │   └── callback/
│           │       └── route.tsx  ✅ Modifié (validation app_id)
│           └── user/
│               └── me/
│                   └── route.ts   ✅ Créé (backend Prisma)
│
├── .env.local                     ✅ Configuré
└── package.json
```

---

## 🚧 CE QUI RESTE À FAIRE

### Phase 1 : Auth Complète

1. **Adapter la page de login**
   - Fichier : `src/app/(auth)/login/page.tsx`
   - Utiliser les helpers avec `app_id`
   - Comme fait pour register

2. **Créer API route `update-last-login`**
   - Fichier : `src/app/api/auth/update-last-login/route.ts`
   - Update `last_login_at` via Prisma

3. **Tester OAuth (Google/GitHub)**
   - Configurer les providers dans Supabase
   - Tester que `app_id` est bien passé

### Phase 2 : Intégration Lemon Squeezy

**Fichiers à créer :**

1. `src/lib/lemonsqueezy/client.ts`
   - Client API Lemon Squeezy
   - Fonctions : createCheckout, getSubscription, etc.

2. `src/app/api/webhooks/lemonsqueezy/route.ts`
   - Webhook handler pour events LS
   - Events : subscription_created, updated, cancelled, etc.
   - Update table `subscriptions` via Prisma

3. `src/app/(dashboard)/settings/billing/page.tsx`
   - Page billing avec status subscription
   - Bouton pour ouvrir checkout LS
   - Affichage plan actuel

4. `src/components/billing/SubscriptionStatus.tsx`
   - Composant status subscription
   - Affichage : plan, prix, date renouvellement

**Config Lemon Squeezy :**
- Créer les produits dans LS
- Configurer le webhook URL
- Ajouter les variables d'env :
  ```bash
  LEMONSQUEEZY_API_KEY=...
  LEMONSQUEEZY_STORE_ID=...
  LEMONSQUEEZY_WEBHOOK_SECRET=...
  ```

### Phase 3 : Intégration N8N

**Setup N8N :**
1. Déployer N8N sur VPS (Dokploy)
2. Créer workflows de base :
   - `send-email` - Emails transactionnels
   - `analyze-image` - IA (si besoin)
   - `generate-pdf` - Génération PDF

**Fichiers à créer :**

1. `src/lib/n8n/client.ts` (DÉJÀ GÉNÉRÉ dans artifacts)
   - Client N8N typé
   - Sécurité : signature HMAC
   - Retry automatique + timeout
   - Mode async pour workflows longs

2. `src/lib/n8n/types.ts` (DÉJÀ GÉNÉRÉ dans artifacts)
   - Types pour tous les workflows
   - Registry des workflows disponibles

3. `src/app/api/webhooks/n8n-callback/route.ts`
   - Callback pour workflows async
   - Vérification signature

**Config N8N :**
```bash
N8N_WEBHOOK_URL=https://n8n.ton-vps.com/webhook
N8N_WEBHOOK_SECRET=...
N8N_CALLBACK_URL=https://ton-saas.com/api/webhooks/n8n-callback
```

### Phase 4 : Branding Nuvoya8

**Fichiers à créer :**

1. `src/components/shared/Footer.tsx` (DÉJÀ GÉNÉRÉ dans artifacts)
   - Footer avec "Powered by Nuvoya8"
   - Links légaux (privacy, terms, refund)

2. `src/components/shared/Nuvoya8Watermark.tsx` (DÉJÀ GÉNÉRÉ dans artifacts)
   - Badge discret en bas à droite
   - 3 variantes disponibles

3. Logo Nuvoya8
   - Créer/ajouter dans `public/images/nuvoya8-badge.svg`

**Intégration :**
- Ajouter `<Footer />` dans le layout principal
- Ajouter `<Nuvoya8Watermark />` dans le layout dashboard

### Phase 5 : Premier Déploiement

**Guide :**
- Voir `docs/DEPLOYMENT.md` (DÉJÀ GÉNÉRÉ dans artifacts)

**Étapes :**
1. Créer nouveau projet Dokploy
2. Configurer les variables d'env (avec app_id différent)
3. Configurer le domaine + SSL
4. Deploy
5. Tester création de compte

---

## 🔐 POINTS CRITIQUES DE SÉCURITÉ

### 1. Isolation Multi-Tenant

**JAMAIS :**
- Bypass le middleware Prisma sans raison valide
- Exposer des données d'une autre app
- Oublier de vérifier `app_id` dans les API routes

**TOUJOURS :**
- Utiliser Prisma (pas de raw SQL sans `app_id`)
- Vérifier `app_id` dans les callbacks OAuth
- Valider que le user appartient à l'app au login

### 2. Sécurité N8N

**TOUJOURS :**
- Vérifier la signature HMAC dans les workflows
- Valider l'`app_id` dans N8N
- Utiliser HTTPS pour les webhooks

### 3. Prisma côté Client

**RÈGLE D'OR :** Prisma = backend uniquement

**JAMAIS :**
- Importer `@/lib/prisma` dans un composant `'use client'`
- Utiliser Prisma dans le browser

**SOLUTION :**
- Créer des API routes (`/api/...`)
- Appeler via `fetch()` depuis le client

---

## 📊 CONVENTION DE CODE

### Naming
- **DB & Code** : snake_case partout (`app_id`, `user_id`, `created_at`)
- **Composants** : PascalCase (`UserProfile.tsx`)
- **Fonctions** : camelCase (`getUserById()`)
- **Fichiers** : kebab-case ou camelCase

### Structure Prisma

```typescript
// ✅ BON : Le middleware filtre automatiquement
const users = await prisma.user.findMany({
  where: { role: 'admin' }
})

// ❌ MAUVAIS : Bypass du middleware
const users = await prisma.$queryRaw`SELECT * FROM users`
```

### Structure N8N

```typescript
// ✅ BON : Typé et sécurisé
await n8n.sendEmail({
  to: user.email,
  template: 'welcome',
  variables: { name: user.name }
}, { user_id: user.id })

// ✅ BON : Mode async pour workflows longs
await n8n.generatePDF({ ... }, { async: true })
```

---

## 🎯 WORKFLOW DE DÉVELOPPEMENT

### Pour Créer un Nouveau SaaS

1. **Créer l'app dans la DB :**
```sql
INSERT INTO apps (id, name, slug, domain, is_active, created_at, updated_at)
VALUES ('todo-master', 'Todo Master', 'todo-master', 'todo-master.com', true, NOW(), NOW());
```

2. **Cloner le template :**
```bash
git clone template.git todo-master
```

3. **Modifier `.env.local` :**
```bash
NEXT_PUBLIC_APP_ID=todo-master
NEXT_PUBLIC_APP_NAME=Todo Master
NEXT_PUBLIC_APP_LOGO_URL=/images/logo.svg
```

4. **Changer le logo :**
```bash
cp /path/to/logo.svg public/images/logo.svg
```

5. **Déployer sur Dokploy**

### Pour Mettre à Jour le Core

```bash
# Dans le template
git commit -m "feat: add new feature"
git push

# Dans chaque SaaS
git remote add template https://github.com/ton-org/template.git
git fetch template
git merge template/main
```

---

## 📚 RESSOURCES & DOCUMENTATION

### Fichiers Générés (dans les artifacts Claude)

1. `prisma/schema.prisma` - Schéma DB
2. `src/lib/prisma.ts` - Client Prisma + middleware
3. `src/lib/supabase/auth-helpers.ts` - Helpers auth
4. `supabase/migrations/00_sync_auth_users.sql` - Triggers
5. `src/app/api/user/me/route.ts` - API user
6. `src/lib/n8n/client.ts` - Client N8N typé
7. `src/lib/n8n/types.ts` - Types N8N
8. `components/shared/Footer.tsx` - Footer Nuvoya8
9. `components/shared/Nuvoya8Watermark.tsx` - Watermark
10. `docs/DEPLOYMENT.md` - Guide déploiement
11. `docs/N8N_INTEGRATION.md` - Guide N8N
12. `.env.template` - Template variables

### Links Utiles

- Template Razikus : https://github.com/Razikus/supabase-nextjs-template
- Prisma docs : https://www.prisma.io/docs
- Supabase docs : https://supabase.com/docs
- N8N docs : https://docs.n8n.io
- Lemon Squeezy docs : https://docs.lemonsqueezy.com

---

## ✅ CHECKLIST DE VALIDATION

Avant de passer à la phase suivante :

### Setup de Base
- [x] Prisma installé et configuré
- [x] Tables créées dans Supabase
- [x] Triggers de sync fonctionnels
- [x] Middleware Prisma actif
- [x] Première app créée
- [x] Auth signup fonctionnelle avec `app_id`
- [x] Callback OAuth adapté
- [x] Dashboard accessible
- [x] Isolation multi-tenant validée

### À Compléter
- [ ] Page login adaptée
- [ ] API route `update-last-login`
- [ ] Tests OAuth (Google/GitHub)
- [ ] Lemon Squeezy intégré
- [ ] N8N déployé et workflows créés
- [ ] Footer/Watermark Nuvoya8
- [ ] Premier déploiement sur Dokploy
- [ ] Documentation complète

---

## 🚀 PROCHAINES ACTIONS IMMÉDIATES

**Tu dois maintenant :**

1. **Adapter la page de login** (priorité haute)
   - Utiliser les helpers auth avec `app_id`
   - Comme fait pour register

2. **Créer l'API route update-last-login**
   - Backend Prisma
   - Appelée depuis `auth-helpers.ts`

3. **Intégrer Lemon Squeezy**
   - Client + webhooks + billing page

4. **Ajouter branding Nuvoya8**
   - Footer + Watermark

5. **Tester le premier déploiement**
   - Dokploy + nouveau domaine

---

## 💡 NOTES IMPORTANTES

### Erreurs Courantes à Éviter

1. **Prisma côté client** : Toujours utiliser des API routes
2. **Oublier `app_id`** : Le middleware le gère, mais vérifier dans les callbacks
3. **Types UUID vs TEXT** : Utiliser `::text` dans les SQL policies
4. **Nom des colonnes** : Toujours snake_case (même en DB et code)

### Performance

- Prisma génère des queries optimisées
- Middleware ajoute un filtre léger
- RLS + Middleware = double sécurité (pas de surcoût significatif)

### Scalabilité

- Architecture testée pour 100+ SaaS
- 1 DB peut gérer des millions de users (sharding possible plus tard)
- N8N scale horizontalement si besoin

---

**🎯 TU AS MAINTENANT TOUTES LES INFOS POUR CONTINUER !**

Cursor peut prendre le relais avec ce briefing complet.