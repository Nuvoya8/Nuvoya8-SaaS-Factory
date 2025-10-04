/**
 * NUVOYA8 SAAS FACTORY - Prisma Client with Multi-Tenant Middleware
 * 
 * Ce fichier configure Prisma avec un middleware qui :
 * - Filtre automatiquement toutes les queries par app_id
 * - Ajoute app_id automatiquement lors des créations
 * - Garantit l'isolation totale entre SaaS
 * 
 * SIMPLE: Mêmes noms de colonnes partout (snake_case)
 */

import { PrismaClient } from '@prisma/client'

// Récupérer l'APP_ID depuis l'environnement
const APP_ID = process.env.NEXT_PUBLIC_APP_ID

if (!APP_ID) {
  throw new Error('NEXT_PUBLIC_APP_ID must be defined in environment variables')
}

// ============================================
// SINGLETON PRISMA CLIENT
// ============================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ============================================
// MIDDLEWARE MULTI-TENANT
// ============================================

/**
 * Modèles qui nécessitent l'isolation par app_id
 */
const TENANT_MODELS = [
  'user',
  'subscription',
  'task',
  'file',
  'auditlog',
]

/**
 * Actions de lecture
 */
const READ_ACTIONS = [
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]

/**
 * Actions de création
 */
const CREATE_ACTIONS = ['create', 'createMany', 'upsert']

/**
 * Actions de modification
 */
const UPDATE_ACTIONS = ['update', 'updateMany', 'upsert']

/**
 * Actions de suppression
 */
const DELETE_ACTIONS = ['delete', 'deleteMany']

// Appliquer le middleware
prisma.$use(async (params, next) => {
  const model = params.model?.toLowerCase()
  
  // Si le modèle n'est pas dans TENANT_MODELS, pas de filtrage
  if (!model || !TENANT_MODELS.includes(model)) {
    return next(params)
  }

  // ============================================
  // LECTURE : Filtrer par app_id
  // ============================================
  if (READ_ACTIONS.includes(params.action)) {
    if (!params.args) {
      params.args = {}
    }
    if (!params.args.where) {
      params.args.where = {}
    }

    // Ajouter le filtre app_id
    if (!params.args.where._bypassTenantFilter) {
      params.args.where.app_id = APP_ID
    } else {
      delete params.args.where._bypassTenantFilter
    }
  }

  // ============================================
  // CRÉATION : Ajouter app_id automatiquement
  // ============================================
  if (CREATE_ACTIONS.includes(params.action)) {
    if (!params.args) {
      params.args = {}
    }

    if (params.action === 'create') {
      if (!params.args.data) {
        params.args.data = {}
      }
      if (!params.args.data.app_id && !params.args.data._bypassTenantFilter) {
        params.args.data.app_id = APP_ID
      } else if (params.args.data._bypassTenantFilter) {
        delete params.args.data._bypassTenantFilter
      }
    }

    if (params.action === 'createMany') {
      if (Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((item: any) => {
          if (!item.app_id && !item._bypassTenantFilter) {
            return { ...item, app_id: APP_ID }
          }
          if (item._bypassTenantFilter) {
            const { _bypassTenantFilter, ...rest } = item
            return rest
          }
          return item
        })
      }
    }

    if (params.action === 'upsert') {
      if (!params.args.create.app_id && !params.args.create._bypassTenantFilter) {
        params.args.create.app_id = APP_ID
      }
      if (!params.args.where._bypassTenantFilter) {
        params.args.where.app_id = APP_ID
      }
    }
  }

  // ============================================
  // MODIFICATION : Filtrer par app_id
  // ============================================
  if (UPDATE_ACTIONS.includes(params.action)) {
    if (!params.args) {
      params.args = {}
    }
    if (!params.args.where) {
      params.args.where = {}
    }

    if (!params.args.where._bypassTenantFilter) {
      params.args.where.app_id = APP_ID
    } else {
      delete params.args.where._bypassTenantFilter
    }
  }

  // ============================================
  // SUPPRESSION : Filtrer par app_id
  // ============================================
  if (DELETE_ACTIONS.includes(params.action)) {
    if (!params.args) {
      params.args = {}
    }
    if (!params.args.where) {
      params.args.where = {}
    }

    if (!params.args.where._bypassTenantFilter) {
      params.args.where.app_id = APP_ID
    } else {
      delete params.args.where._bypassTenantFilter
    }
  }

  return next(params)
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Exécuter une query en bypassant le filtre tenant
 * ATTENTION : À utiliser uniquement pour l'admin/système
 */
export function bypassTenantFilter<T>(query: T): T & { _bypassTenantFilter: true } {
  return {
    ...query,
    _bypassTenantFilter: true,
  } as T & { _bypassTenantFilter: true }
}

/**
 * Récupérer l'APP_ID courant
 */
export function getCurrentAppId(): string {
  return APP_ID
}

/**
 * Vérifier si un user appartient à l'app courante
 */
export async function verifyUserBelongsToApp(user_id: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: user_id },
  })
  return user?.app_id === APP_ID
}

// ============================================
// AUDIT LOG HELPER
// ============================================

/**
 * Créer un audit log
 */
export async function createAuditLog(params: {
  user_id?: string
  action: string
  entity: string
  entity_id?: string
  metadata?: any
  ip_address?: string
  user_agent?: string
}) {
  await prisma.auditLog.create({
    data: {
      app_id: APP_ID,
      user_id: params.user_id,
      action: params.action,
      entity: params.entity,
      entity_id: params.entity_id,
      metadata: params.metadata,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
    },
  })
}

// ============================================
// EXPORTS
// ============================================

export default prisma

/**
 * USAGE EXAMPLES:
 * 
 * // ✅ Lecture (filtrée automatiquement par app_id)
 * const users = await prisma.user.findMany()
 * 
 * // ✅ Création (app_id ajouté automatiquement)
 * const user = await prisma.user.create({
 *   data: { email: 'user@example.com' }
 * })
 * 
 * // ✅ Modification (filtrée automatiquement)
 * await prisma.user.update({
 *   where: { id: user_id },
 *   data: { name: 'New Name' }
 * })
 * 
 * // ⚠️ Bypass du filtre (admin uniquement)
 * const allApps = await prisma.app.findMany({
 *   where: bypassTenantFilter({})
 * })
 */