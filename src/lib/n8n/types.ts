/**
 * TYPES N8N - Nuvoya8 SaaS Factory
 * 
 * Types partagés entre Next.js et N8N
 */

// ============================================
// BASE TYPES
// ============================================

export interface N8nWebhookPayload<T = any> {
  data: T
  metadata: {
    appId: string
    userId?: string
    timestamp: string
    [key: string]: any
  }
}

export interface N8nWebhookHeaders {
  'X-App-Id': string
  'X-User-Id'?: string
  'X-Signature': string
  'X-Async': 'true' | 'false'
  'X-Request-Id': string
}

// ============================================
// WORKFLOW CATEGORIES
// ============================================

/**
 * Email workflows
 */
export namespace EmailWorkflows {
  export interface SendTransactionalEmail {
    to: string | string[]
    subject: string
    template: EmailTemplate
    variables?: Record<string, any>
    cc?: string[]
    bcc?: string[]
    replyTo?: string
    attachments?: EmailAttachment[]
  }

  export type EmailTemplate =
    | 'welcome'
    | 'password-reset'
    | 'email-verification'
    | 'subscription-confirmed'
    | 'subscription-cancelled'
    | 'task-reminder'
    | 'invoice'
    | 'report-ready'

  export interface EmailAttachment {
    filename: string
    url: string
    contentType?: string
  }

  export interface SendEmailResponse {
    messageId: string
    status: 'sent' | 'queued' | 'failed'
    sentAt?: string
  }
}

/**
 * AI/ML workflows
 */
export namespace AIWorkflows {
  export interface AnalyzeImage {
    imageUrl: string
    analysisType: ImageAnalysisType
    userId: string
    options?: {
      maxLabels?: number
      minConfidence?: number
    }
  }

  export type ImageAnalysisType =
    | 'meal-nutrition'
    | 'workout-form'
    | 'object-detection'
    | 'ocr'
    | 'face-detection'
    | 'general'

  export interface ImageAnalysisResponse {
    analysis: any
    confidence: number
    labels?: string[]
    processingTime: number
    model: string
  }

  export interface GenerateText {
    prompt: string
    model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3'
    maxTokens?: number
    temperature?: number
    userId: string
  }

  export interface TextGenerationResponse {
    text: string
    tokensUsed: number
    model: string
  }
}

/**
 * Scheduling workflows
 */
export namespace SchedulingWorkflows {
  export interface ScheduleTask {
    userId: string
    taskType: ScheduledTaskType
    entityId: string
    scheduledAt: string // ISO date
    payload: any
    retryPolicy?: RetryPolicy
  }

  export type ScheduledTaskType =
    | 'send-reminder'
    | 'generate-report'
    | 'cleanup-data'
    | 'send-notification'
    | 'sync-external'

  export interface RetryPolicy {
    maxRetries: number
    retryDelay: number // ms
    backoff: 'linear' | 'exponential'
  }

  export interface ScheduleResponse {
    scheduleId: string
    scheduledAt: string
    nextRunAt?: string
  }

  export interface CancelSchedule {
    scheduleId: string
    userId: string
  }
}

/**
 * Data processing workflows
 */
export namespace DataWorkflows {
  export interface GeneratePDF {
    templateId: string
    data: Record<string, any>
    userId: string
    options?: {
      format?: 'A4' | 'Letter'
      orientation?: 'portrait' | 'landscape'
      watermark?: string
    }
  }

  export interface PDFResponse {
    pdfUrl: string
    filename: string
    size: number // bytes
    expiresAt: string
  }

  export interface ExportData {
    format: 'csv' | 'xlsx' | 'json'
    data: any[]
    userId: string
    filename?: string
  }

  export interface ExportResponse {
    downloadUrl: string
    filename: string
    expiresAt: string
  }

  export interface ProcessCSV {
    fileUrl: string
    operation: 'validate' | 'transform' | 'import'
    schema?: Record<string, any>
    userId: string
  }

  export interface CSVProcessingResponse {
    rowsProcessed: number
    errors?: Array<{
      row: number
      error: string
    }>
    result: any
  }
}

/**
 * Integration workflows
 */
export namespace IntegrationWorkflows {
  export interface SyncToExternal {
    service: ExternalService
    action: 'create' | 'update' | 'delete' | 'sync'
    data: any
    userId: string
    credentials?: {
      apiKey?: string
      accessToken?: string
    }
  }

  export type ExternalService =
    | 'google-sheets'
    | 'notion'
    | 'airtable'
    | 'slack'
    | 'discord'
    | 'zapier'
    | 'make'

  export interface SyncResponse {
    externalId: string
    service: ExternalService
    syncedAt: string
    status: 'success' | 'partial' | 'failed'
  }

  export interface WebhookIncoming {
    source: string
    event: string
    payload: any
    signature?: string
  }

  export interface WebhookResponse {
    processed: boolean
    actions: string[]
    errors?: string[]
  }
}

/**
 * Notification workflows
 */
export namespace NotificationWorkflows {
  export interface SendNotification {
    userId: string | string[]
    type: NotificationType
    title: string
    message: string
    data?: any
    channels?: NotificationChannel[]
    priority?: 'low' | 'normal' | 'high'
  }

  export type NotificationType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'reminder'

  export type NotificationChannel = 'email' | 'sms' | 'push' | 'in-app' | 'slack'

  export interface NotificationResponse {
    notificationId: string
    sentChannels: NotificationChannel[]
    failedChannels?: NotificationChannel[]
  }
}

/**
 * Analytics workflows
 */
export namespace AnalyticsWorkflows {
  export interface TrackEvent {
    userId?: string
    event: string
    properties?: Record<string, any>
    timestamp?: string
  }

  export interface GenerateReport {
    reportType: ReportType
    dateRange: {
      start: string
      end: string
    }
    filters?: Record<string, any>
    format?: 'json' | 'pdf' | 'csv'
    userId: string
  }

  export type ReportType =
    | 'user-activity'
    | 'revenue'
    | 'subscriptions'
    | 'custom'

  export interface ReportResponse {
    reportUrl?: string
    data?: any
    generatedAt: string
  }
}

// ============================================
// WORKFLOW REGISTRY
// ============================================

/**
 * Map de tous les workflows disponibles
 * Utilisé pour la validation et l'autocomplétion
 */
export const WorkflowRegistry = {
  // Email
  'send-email': {
    input: {} as EmailWorkflows.SendTransactionalEmail,
    output: {} as EmailWorkflows.SendEmailResponse,
  },

  // AI
  'analyze-image': {
    input: {} as AIWorkflows.AnalyzeImage,
    output: {} as AIWorkflows.ImageAnalysisResponse,
  },
  'generate-text': {
    input: {} as AIWorkflows.GenerateText,
    output: {} as AIWorkflows.TextGenerationResponse,
  },

  // Scheduling
  'schedule-task': {
    input: {} as SchedulingWorkflows.ScheduleTask,
    output: {} as SchedulingWorkflows.ScheduleResponse,
  },
  'cancel-schedule': {
    input: {} as SchedulingWorkflows.CancelSchedule,
    output: {} as { cancelled: boolean },
  },

  // Data
  'generate-pdf': {
    input: {} as DataWorkflows.GeneratePDF,
    output: {} as DataWorkflows.PDFResponse,
  },
  'export-data': {
    input: {} as DataWorkflows.ExportData,
    output: {} as DataWorkflows.ExportResponse,
  },
  'process-csv': {
    input: {} as DataWorkflows.ProcessCSV,
    output: {} as DataWorkflows.CSVProcessingResponse,
  },

  // Integration
  'sync-to-external': {
    input: {} as IntegrationWorkflows.SyncToExternal,
    output: {} as IntegrationWorkflows.SyncResponse,
  },
  'process-webhook': {
    input: {} as IntegrationWorkflows.WebhookIncoming,
    output: {} as IntegrationWorkflows.WebhookResponse,
  },

  // Notifications
  'send-notification': {
    input: {} as NotificationWorkflows.SendNotification,
    output: {} as NotificationWorkflows.NotificationResponse,
  },

  // Analytics
  'track-event': {
    input: {} as AnalyticsWorkflows.TrackEvent,
    output: {} as { tracked: boolean },
  },
  'generate-report': {
    input: {} as AnalyticsWorkflows.GenerateReport,
    output: {} as AnalyticsWorkflows.ReportResponse,
  },
} as const

export type WorkflowId = keyof typeof WorkflowRegistry
export type WorkflowInput<T extends WorkflowId> = typeof WorkflowRegistry[T]['input']
export type WorkflowOutput<T extends WorkflowId> = typeof WorkflowRegistry[T]['output']

// ============================================
// ERROR CODES
// ============================================

export enum N8nErrorCode {
  // Network errors
  TIMEOUT = 'TIMEOUT_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  
  // Auth errors
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Workflow errors
  WORKFLOW_NOT_FOUND = 'WORKFLOW_NOT_FOUND',
  WORKFLOW_FAILED = 'WORKFLOW_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Business logic errors
  INVALID_APP_ID = 'INVALID_APP_ID',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // External service errors
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Schemas Zod pour validation (optionnel)
 * Décommenter si tu utilises Zod
 */
/*
import { z } from 'zod'

export const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  template: z.enum([...]),
  variables: z.record(z.any()).optional(),
})
*/