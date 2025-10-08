#!/usr/bin/env ts-node

/**
 * Script de Vérification - Nuvoya8 SaaS Factory
 * 
 * Vérifie que toute la configuration est correcte avant de démarrer l'application
 * 
 * Usage: npm run verify
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

// Codes couleur ANSI pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

const symbols = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
}

// Compteurs
let successCount = 0
let warningCount = 0
let errorCount = 0

function log(type: 'success' | 'error' | 'warning' | 'info', message: string) {
  const colorMap = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.cyan,
  }
  const symbolMap = {
    success: symbols.success,
    error: symbols.error,
    warning: symbols.warning,
    info: symbols.info,
  }
  
  console.log(`${colorMap[type]}${symbolMap[type]} ${message}${colors.reset}`)
  
  if (type === 'success') successCount++
  if (type === 'warning') warningCount++
  if (type === 'error') errorCount++
}

function section(title: string) {
  console.log(`\n${colors.bold}${colors.blue}${title}${colors.reset}`)
}

function divider() {
  console.log('\n' + '━'.repeat(60) + '\n')
}

async function verifyEnvironmentVariables() {
  section('📝 Variables d\'environnement')
  
  const requiredVars = [
    { name: 'NEXT_PUBLIC_APP_ID', description: 'Identifiant de l\'app' },
    { name: 'NEXT_PUBLIC_APP_NAME', description: 'Nom de l\'app' },
    { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'URL Supabase' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Clé anonyme Supabase' },
    { name: 'DATABASE_URL', description: 'URL de connexion PostgreSQL' },
  ]
  
  const optionalVars = [
    { name: 'N8N_WEBHOOK_URL', description: 'URL des webhooks N8N' },
    { name: 'N8N_WEBHOOK_SECRET', description: 'Secret HMAC pour N8N' },
    { name: 'PRIVATE_SUPABASE_SERVICE_KEY', description: 'Clé service Supabase (admin)' },
  ]
  
  for (const { name, description } of requiredVars) {
    if (process.env[name]) {
      const value = name.includes('SECRET') || name.includes('KEY') || name.includes('PASSWORD')
        ? '[DÉFINI]'
        : process.env[name]
      log('success', `${name} = ${value}`)
    } else {
      log('error', `${name} MANQUANT (${description})`)
    }
  }
  
  for (const { name, description } of optionalVars) {
    if (process.env[name]) {
      log('success', `${name} = [DÉFINI] (optionnel)`)
    } else {
      log('warning', `${name} non défini (${description})`)
    }
  }
}

async function verifySupabaseConnection() {
  section('🗄️  Connexion Supabase')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log('error', 'Impossible de tester Supabase (variables manquantes)')
    return
  }
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // Test de connexion simple
    const { data, error } = await supabase.from('apps').select('id').limit(1)
    
    if (error) {
      log('error', `Erreur Supabase: ${error.message}`)
    } else {
      log('success', 'Supabase accessible')
      log('success', 'Table "apps" existe')
    }
  } catch (error: any) {
    log('error', `Impossible de se connecter à Supabase: ${error.message}`)
  }
}

async function verifyDatabase() {
  section('💾 Base de données (Prisma)')
  
  if (!process.env.DATABASE_URL) {
    log('error', 'DATABASE_URL non défini, impossible de vérifier Prisma')
    return
  }
  
  try {
    const prisma = new PrismaClient()
    
    // Vérifier la connexion
    await prisma.$connect()
    log('success', 'Connexion PostgreSQL établie')
    
    // Vérifier que l'app existe
    const appId = process.env.NEXT_PUBLIC_APP_ID
    if (appId) {
      const app = await prisma.app.findUnique({
        where: { id: appId }
      })
      
      if (app) {
        log('success', `App "${appId}" trouvée dans la DB`)
        log('info', `   Nom: ${app.name}`)
        log('info', `   Domaine: ${app.domain || 'Non défini'}`)
        log('info', `   Active: ${app.is_active ? 'Oui' : 'Non'}`)
      } else {
        log('error', `App "${appId}" introuvable dans la DB`)
        console.log(`\n   ${colors.yellow}💡 Pour créer l'app, exécutez cette SQL:${colors.reset}`)
        console.log(`   ${colors.cyan}INSERT INTO apps (id, name, slug, domain, is_active, created_at, updated_at)`)
        console.log(`   VALUES ('${appId}', '${process.env.NEXT_PUBLIC_APP_NAME || appId}', '${appId}', 'localhost:3000', true, NOW(), NOW());${colors.reset}\n`)
      }
    }
    
    // Vérifier les tables principales
    const tables = ['users', 'subscriptions', 'tasks', 'files', 'audit_logs']
    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`)
        log('success', `Table "${table}" existe`)
      } catch (e) {
        log('warning', `Table "${table}" n'existe peut-être pas encore`)
      }
    }
    
    await prisma.$disconnect()
  } catch (error: any) {
    log('error', `Erreur Prisma: ${error.message}`)
    if (error.message.includes('does not exist')) {
      console.log(`\n   ${colors.yellow}💡 Les tables n'existent pas encore. Exécutez:${colors.reset}`)
      console.log(`   ${colors.cyan}npx prisma db push${colors.reset}\n`)
    }
  }
}

async function verifyN8nConnection() {
  section('⚡ Connexion N8N')
  
  const n8nUrl = process.env.N8N_WEBHOOK_URL
  const n8nSecret = process.env.N8N_WEBHOOK_SECRET
  
  if (!n8nUrl || !n8nSecret) {
    log('warning', 'N8N non configuré (optionnel)')
    console.log(`   ${colors.cyan}Pour activer N8N, ajoutez dans .env.local:${colors.reset}`)
    console.log(`   N8N_WEBHOOK_URL=https://votre-n8n.com/webhook`)
    console.log(`   N8N_WEBHOOK_SECRET=votre-secret`)
    return
  }
  
  try {
    // Test simple de connectivité
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(n8nUrl.replace('/webhook', '/healthz') || n8nUrl, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    log('success', 'N8N accessible')
    log('info', `   URL: ${n8nUrl}`)
  } catch (error: any) {
    if (error.name === 'AbortError') {
      log('warning', 'N8N timeout (5s) - Vérifiez qu\'il est démarré')
    } else {
      log('warning', `N8N non accessible: ${error.message}`)
    }
    console.log(`   ${colors.cyan}Les tests N8N échoueront tant que N8N n'est pas accessible${colors.reset}`)
  }
}

async function verifyFiles() {
  section('📁 Fichiers et Structure')
  
  const requiredFiles = [
    'package.json',
    'prisma/schema.prisma',
    'src/lib/prisma.ts',
    'src/lib/n8n/client.ts',
    'src/lib/supabase/client.ts',
    'src/app/auth/login/page.tsx',
    'src/app/app/page.tsx',
    'src/app/app/n8n-test/page.tsx',
  ]
  
  for (const file of requiredFiles) {
    if (existsSync(join(process.cwd(), file))) {
      log('success', file)
    } else {
      log('error', `${file} MANQUANT`)
    }
  }
  
  // Vérifier node_modules
  if (existsSync(join(process.cwd(), 'node_modules'))) {
    log('success', 'node_modules installés')
  } else {
    log('error', 'node_modules manquant - Exécutez: npm install')
  }
}

async function printSummary() {
  divider()
  console.log(`${colors.bold}📋 RÉSUMÉ${colors.reset}`)
  divider()
  
  console.log(`${colors.green}${symbols.success} ${successCount} vérifications réussies${colors.reset}`)
  
  if (warningCount > 0) {
    console.log(`${colors.yellow}${symbols.warning} ${warningCount} avertissements${colors.reset}`)
  }
  
  if (errorCount > 0) {
    console.log(`${colors.red}${symbols.error} ${errorCount} erreurs${colors.reset}`)
  }
  
  console.log('')
  
  if (errorCount === 0) {
    if (warningCount === 0) {
      console.log(`${colors.green}${colors.bold}✨ Configuration parfaite ! Vous pouvez démarrer l'app.${colors.reset}`)
    } else {
      console.log(`${colors.yellow}💡 Configuration OK avec quelques avertissements.${colors.reset}`)
      console.log(`${colors.yellow}   L'app fonctionnera mais certaines fonctionnalités peuvent être limitées.${colors.reset}`)
    }
    console.log(`\n${colors.cyan}🚀 Commande: ${colors.bold}npm run dev${colors.reset}`)
  } else {
    console.log(`${colors.red}❌ Erreurs critiques détectées. Corrigez-les avant de démarrer.${colors.reset}`)
    process.exit(1)
  }
  
  console.log('')
}

async function main() {
  console.log(`${colors.bold}${colors.cyan}`)
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║   🔍 VÉRIFICATION - Nuvoya8 SaaS Factory              ║')
  console.log('╚════════════════════════════════════════════════════════╝')
  console.log(colors.reset)
  
  try {
    await verifyEnvironmentVariables()
    await verifyFiles()
    await verifySupabaseConnection()
    await verifyDatabase()
    await verifyN8nConnection()
    await printSummary()
  } catch (error: any) {
    console.error(`\n${colors.red}Erreur inattendue: ${error.message}${colors.reset}`)
    process.exit(1)
  }
}

main()

