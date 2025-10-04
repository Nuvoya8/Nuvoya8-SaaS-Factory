/**
 * N8N CLIENT - Nuvoya8 SaaS Factory
 * 
 * Client typé pour appeler des workflows N8N self-hosted
 * Avec sécurité (signature HMAC), retry, timeout, et isolation multi-tenant
 */

import { createHmac } from 'crypto'
import { getCurrentAppId } from '@/lib/prisma'

// ============================================
// CONFIGURATION
// ============================================

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.ton-vps.com/webhook'
const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET

if (!N8N_SECRET) {
  throw new Error('N8N_WEBHOOK_SECRET must be defined in environment variables')
}

// ============================================
// TYPES
// ============================================

export interface N8nResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface N8nCallOptions {
  timeout?: number // ms (default: 30000)
  retries?: number // default: 0
  async?: boolean // Si true, N8N répond immédiatement et callback plus tard
  userId?: string // Pour les logs et rate limiting
  metadata?: Record<string, any> // Metadata additionnelle
}

export class N8nError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'N8nError'
  }
}

// ============================================
// CLIENT N8N
// ============================================

export class N8nClient {
  private baseUrl: string
  private secret: string

  constructor(baseUrl?: string, secret?: string) {
    this.baseUrl = baseUrl || N8N_BASE_URL
    this.secret = secret || N8N_SECRET
  }

  /**
   * Appeler un workflow N8N
   */
  async call<T = any>(
    workflowId: string,
    data: any,
    options: N8nCallOptions = {}
  ): Promise<N8nResponse<T>> {
    const {
      timeout = 30000,
      retries = 0,
      async = false,
      userId,
      metadata = {},
    } = options

    // Préparer le payload
    const payload = {
      data,
      metadata: {
        ...metadata,
        appId: getCurrentAppId(),
        userId,
        timestamp: new Date().toISOString(),
      },
    }

    // Créer la signature HMAC
    const signature = this.createSignature(payload)

    // Retry logic
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${this.baseUrl}/${workflowId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-App-Id': getCurrentAppId(),
            'X-User-Id': userId || '',
            'X-Signature': signature,
            'X-Async': async ? 'true' : 'false',
            'X-Request-Id': this.generateRequestId(),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Parser la réponse
        const result = await response.json()

        // Si erreur HTTP
        if (!response.ok) {
          throw new N8nError(
            result.error?.message || 'N8N workflow failed',
            result.error?.code || 'WORKFLOW_ERROR',
            result.error?.details
          )
        }

        // Retourner le résultat
        return result as N8nResponse<T>
      } catch (error: any) {
        lastError = error

        // Si c'est un timeout
        if (error.name === 'AbortError') {
          lastError = new N8nError(
            `Workflow timeout after ${timeout}ms`,
            'TIMEOUT_ERROR'
          )
        }

        // Si c'est le dernier retry, throw
        if (attempt === retries) {
          throw lastError
        }

        // Attendre avant de retry (exponential backoff)
        await this.sleep(Math.pow(2, attempt) * 1000)
      }
    }

    // Ne devrait jamais arriver ici
    throw lastError || new Error('Unknown error')
  }

  /**
   * Créer une signature HMAC SHA-256
   */
  private createSignature(payload: any): string {
    return createHmac('sha256', this.secret)
      .update(JSON.stringify(payload))
      .digest('hex')
  }

  /**
   * Générer un request ID unique
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
const n8nClient = new N8nClient()

// ============================================
// WORKFLOWS TYPÉS
// ============================================

/**
 * Interface pour chaque workflow
 * Permet l'autocomplétion et la validation TypeScript
 */

// Workflow: Send Email
export interface SendEmailParams {
  to: string | string[]
  subject: string
  template: string
  variables?: Record<string, any>
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    url: string
  }>
}

export interface SendEmailResponse {
  messageId: string
  status: 'sent' | 'queued'
}

// Workflow: Analyze Image (IA)
export interface AnalyzeImageParams {
  imageUrl: string
  analysisType: 'meal' | 'workout' | 'object-detection' | 'ocr'
  userId: string
}

export interface AnalyzeImageResponse {
  analysis: any
  confidence: number
  processingTime: number
}

// Workflow: Schedule Reminder
export interface ScheduleReminderParams {
  userId: string
  type: 'task' | 'event' | 'subscription'
  entityId: string
  scheduledAt: string // ISO date
  message: string
}

export interface ScheduleReminderResponse {
  reminderId: string
  scheduledAt: string
}

// Workflow: Generate PDF Report
export interface GeneratePDFParams {
  templateId: string
  data: Record<string, any>
  userId: string
}

export interface GeneratePDFResponse {
  pdfUrl: string
  expiresAt: string
}

// Workflow: Sync to External API
export interface SyncDataParams {
  service: 'google-sheets' | 'notion' | 'airtable'
  action: 'create' | 'update' | 'delete'
  data: any
  userId: string
}

export interface SyncDataResponse {
  externalId: string
  syncedAt: string
}

// Workflow: Process Webhook (générique)
export interface ProcessWebhookParams {
  source: string
  event: string
  payload: any
}

export interface ProcessWebhookResponse {
  processed: boolean
  actions: string[]
}

// ============================================
// API TYPÉE POUR LES WORKFLOWS
// ============================================

/**
 * API high-level pour appeler les workflows
 * Type-safe avec autocomplétion
 */
export const n8n = {
  /**
   * Envoyer un email transactionnel
   */
  sendEmail: (
    params: SendEmailParams,
    options?: N8nCallOptions
  ): Promise<N8nResponse<SendEmailResponse>> => {
    return n8nClient.call<SendEmailResponse>('send-email', params, options)
  },

  /**
   * Analyser une image avec IA
   */
  analyzeImage: (
    params: AnalyzeImageParams,
    options?: N8nCallOptions
  ): Promise<N8nResponse<AnalyzeImageResponse>> => {
    return n8nClient.call<AnalyzeImageResponse>('analyze-image', params, {
      ...options,
      timeout: 60000, // 60s pour l'IA
    })
  },

  /**
   * Scheduler un reminder
   */
  scheduleReminder: (
    params: ScheduleReminderParams,
    options?: N8nCallOptions
  ): Promise<N8nResponse<ScheduleReminderResponse>> => {
    return n8nClient.call<ScheduleReminderResponse>(
      'schedule-reminder',
      params,
      options
    )
  },

  /**
   * Générer un PDF
   */
  generatePDF: (
    params: GeneratePDFParams,
    options?: N8nCallOptions
  ): Promise<N8nResponse<GeneratePDFResponse>> => {
    return n8nClient.call<GeneratePDFResponse>('generate-pdf', params, {
      ...options,
      timeout: 45000, // 45s pour générer le PDF
      async: true, // Async par défaut pour les PDFs
    })
  },

  /**
   * Sync des données vers un service externe
   */
  syncData: (
    params: SyncDataParams,
    options?: N8nCallOptions
  ): Promise<N8nResponse<SyncDataResponse>> => {
    return n8nClient.call<SyncDataResponse>('sync-data', params, options)
  },

  /**
   * Traiter un webhook entrant
   */
  processWebhook: (
    params: ProcessWebhookParams,
    options?: N8nCallOptions
  ): Promise<N8nResponse<ProcessWebhookResponse>> => {
    return n8nClient.call<ProcessWebhookResponse>(
      'process-webhook',
      params,
      options
    )
  },

  /**
   * Appeler un workflow custom (non typé)
   */
  custom: <T = any>(
    workflowId: string,
    data: any,
    options?: N8nCallOptions
  ): Promise<N8nResponse<T>> => {
    return n8nClient.call<T>(workflowId, data, options)
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Vérifier si N8N est accessible
 */
export async function checkN8nHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${N8N_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Wrapper avec error handling pour usage dans les composants
 */
export async function safeN8nCall<T>(
  fn: () => Promise<N8nResponse<T>>,
  fallback?: T
): Promise<T | null> {
  try {
    const result = await fn()
    
    if (!result.success) {
      console.error('N8N workflow failed:', result.error)
      return fallback || null
    }
    
    return result.data || null
  } catch (error) {
    console.error('N8N call error:', error)
    return fallback || null
  }
}

// ============================================
// EXPORTS
// ============================================

export default n8nClient

/**
 * USAGE EXAMPLES:
 * 
 * // 1. Envoyer un email
 * const result = await n8n.sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   template: 'welcome',
 *   variables: { name: 'John' }
 * }, { userId: user.id })
 * 
 * if (result.success) {
 *   console.log('Email sent:', result.data?.messageId)
 * }
 * 
 * // 2. Analyser une image (async)
 * const analysis = await n8n.analyzeImage({
 *   imageUrl: 'https://...',
 *   analysisType: 'meal',
 *   userId: user.id
 * }, { async: true })
 * 
 * // 3. Safe call avec fallback
 * const pdf = await safeN8nCall(
 *   () => n8n.generatePDF({ templateId: 'invoice', data: {...} }),
 *   { pdfUrl: '/fallback.pdf' }
 * )
 * 
 * // 4. Custom workflow
 * const custom = await n8n.custom<MyType>('my-workflow', { foo: 'bar' })
 * 
 * // 5. Avec retry
 * const result = await n8n.sendEmail({...}, { 
 *   retries: 3,
 *   timeout: 10000
 * })
 */