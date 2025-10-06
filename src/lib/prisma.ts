/**
 * Prisma Client Instance
 * Singleton pattern to avoid multiple instances in development
 * Avec middleware d'isolation multi-tenant automatique
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Récupère l'app_id depuis les variables d'environnement
 */
export function getCurrentAppId(): string {
  const appId = process.env.NEXT_PUBLIC_APP_ID
  if (!appId) {
    throw new Error('NEXT_PUBLIC_APP_ID must be defined in environment variables')
  }
  return appId
}

/**
 * Client Prisma avec middleware d'isolation multi-tenant
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model }: any) {
          // Ignorer le modèle 'App' (pas de app_id)
          if (model === 'App') {
            return query(args)
          }

          const appId = getCurrentAppId()
          const operation = query.name || ''

          // Pour les opérations de lecture (findMany, findFirst, findUnique, etc.)
          if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation)) {
            if (args.where) {
              args.where = {
                ...args.where,
                app_id: appId,
              }
            } else {
              args.where = { app_id: appId }
            }
          }

          // Pour les opérations de création
          if (operation === 'create') {
            if (args.data) {
              args.data = {
                ...args.data,
                app_id: appId,
              }
            }
          }

          // Pour les créations multiples
          if (operation === 'createMany') {
            if (args.data && Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({
                ...item,
                app_id: appId,
              }))
            }
          }

          // Pour les mises à jour
          if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
            if (args.where) {
              args.where = {
                ...args.where,
                app_id: appId,
              }
            } else {
              args.where = { app_id: appId }
            }
          }

          return query(args)
        },
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma as any
}

