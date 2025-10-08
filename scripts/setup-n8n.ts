#!/usr/bin/env ts-node

/**
 * Script de Configuration N8N
 * Guide interactif pour configurer N8N
 */

import * as readline from 'readline'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHmac, randomBytes } from 'crypto'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
}

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function testN8nConnectivity(url: string): Promise<boolean> {
  try {
    log(`\n🔍 Test de connectivité vers ${url}...`, colors.cyan)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(url, {
      signal: controller.signal,
      method: 'GET',
    })
    
    clearTimeout(timeoutId)
    
    log('✓ N8N accessible !', colors.green)
    return true
  } catch (error: any) {
    if (error.name === 'AbortError') {
      log('✗ Timeout (5s) - N8N ne répond pas', colors.yellow)
    } else {
      log(`✗ Erreur: ${error.message}`, colors.yellow)
    }
    return false
  }
}

function generateSecret(): string {
  return randomBytes(32).toString('hex')
}

async function main() {
  console.clear()
  log('╔════════════════════════════════════════════════════════╗', colors.cyan)
  log('║   ⚡ CONFIGURATION N8N - Nuvoya8 SaaS Factory         ║', colors.cyan)
  log('╚════════════════════════════════════════════════════════╝', colors.cyan)
  
  // 1. URL N8N
  log('\n📍 Étape 1/4 : URL de votre N8N', colors.bold)
  log('Exemple: https://n8n.infra-nuvoya8.com ou http://localhost:5678\n')
  
  let n8nUrl = await question('URL de N8N (sans /webhook): ')
  n8nUrl = n8nUrl.trim().replace(/\/$/, '') // Enlever le / final
  
  if (!n8nUrl.startsWith('http')) {
    n8nUrl = 'https://' + n8nUrl
  }
  
  // Test de connectivité
  const isAccessible = await testN8nConnectivity(n8nUrl)
  
  if (!isAccessible) {
    log('\n⚠️  N8N n\'est pas accessible pour le moment.', colors.yellow)
    const continueAnyway = await question('Continuer quand même ? (o/n): ')
    if (continueAnyway.toLowerCase() !== 'o') {
      log('\nConfiguration annulée.', colors.yellow)
      rl.close()
      return
    }
  }
  
  // 2. Secret HMAC
  log('\n🔐 Étape 2/4 : Secret HMAC', colors.bold)
  log('Ce secret sécurise les communications entre Next.js et N8N\n')
  
  const generateNew = await question('Générer automatiquement un secret sécurisé ? (o/n): ')
  
  let secret: string
  if (generateNew.toLowerCase() === 'o') {
    secret = generateSecret()
    log(`\n✓ Secret généré: ${secret.substring(0, 20)}...`, colors.green)
  } else {
    secret = await question('Entrez votre secret HMAC: ')
    secret = secret.trim()
  }
  
  // 3. Nom de l'app
  log('\n📝 Étape 3/4 : Nom de l\'application', colors.bold)
  const defaultName = 'Nuvoya8 Factory Test'
  const appName = (await question(`Nom de l'app (défaut: ${defaultName}): `)).trim() || defaultName
  
  // 4. Vérification
  log('\n📋 Étape 4/4 : Récapitulatif', colors.bold)
  log('\nConfiguration qui sera enregistrée:')
  log(`  N8N_WEBHOOK_URL=${n8nUrl}/webhook`, colors.cyan)
  log(`  N8N_WEBHOOK_SECRET=${secret.substring(0, 20)}...`, colors.cyan)
  log(`  NEXT_PUBLIC_APP_NAME=${appName}`, colors.cyan)
  
  const confirm = await question('\nConfirmer et enregistrer ? (o/n): ')
  
  if (confirm.toLowerCase() !== 'o') {
    log('\nConfiguration annulée.', colors.yellow)
    rl.close()
    return
  }
  
  // 5. Enregistrer dans .env.local
  const envPath = join(process.cwd(), '.env.local')
  let envContent = ''
  
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf-8')
  }
  
  // Supprimer les anciennes valeurs si elles existent
  envContent = envContent
    .split('\n')
    .filter(line => 
      !line.startsWith('N8N_WEBHOOK_URL=') && 
      !line.startsWith('N8N_WEBHOOK_SECRET=') &&
      !line.startsWith('NEXT_PUBLIC_APP_NAME=')
    )
    .join('\n')
  
  // Ajouter les nouvelles valeurs
  envContent += `\n\n# N8N Configuration (ajouté par setup-n8n.ts)\n`
  envContent += `N8N_WEBHOOK_URL=${n8nUrl}/webhook\n`
  envContent += `N8N_WEBHOOK_SECRET=${secret}\n`
  envContent += `NEXT_PUBLIC_APP_NAME=${appName}\n`
  
  writeFileSync(envPath, envContent)
  
  log('\n✓ Configuration enregistrée dans .env.local', colors.green)
  
  // 6. Générer l'export du workflow N8N
  log('\n📦 Génération du workflow N8N...', colors.cyan)
  
  const workflow = {
    name: 'test-workflow',
    nodes: [
      {
        parameters: {
          httpMethod: 'POST',
          path: 'test-workflow',
          responseMode: 'responseNode',
          options: {}
        },
        id: '1',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1.1,
        position: [250, 300],
        webhookId: crypto.randomUUID(),
      },
      {
        parameters: {
          functionCode: `const crypto = require('crypto');

// Récupérer les données
const body = $input.item.json;
const headers = $input.item.headers;
const signature = headers['x-signature'];

// Secret partagé
const secret = '${secret}';

// Calculer la signature attendue
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(body))
  .digest('hex');

// Vérifier
if (signature !== expectedSignature) {
  throw new Error('Invalid signature - Unauthorized');
}

// Vérifier app_id
const appId = body.metadata?.appId;
if (!appId) {
  throw new Error('Missing app_id');
}

// Tout est OK, passer les données
return $input.item;`
        },
        id: '2',
        name: 'Vérifier Signature HMAC',
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        position: [450, 300],
      },
      {
        parameters: {
          functionCode: `const data = $input.item.json.data;
const metadata = $input.item.json.metadata;

return {
  json: {
    success: true,
    data: {
      message: '🎉 Workflow exécuté avec succès!',
      receivedMessage: data.message,
      timestamp: data.timestamp,
      appId: metadata.appId,
      userId: metadata.userId,
      processedAt: new Date().toISOString(),
      n8nVersion: 'test-workflow-v1'
    }
  }
};`
        },
        id: '3',
        name: 'Traiter la Requête',
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        position: [650, 300],
      },
      {
        parameters: {
          respondWith: 'json',
          responseBody: '={{ $json }}',
        },
        id: '4',
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1,
        position: [850, 300],
      }
    ],
    connections: {
      'Webhook': {
        main: [[{ node: 'Vérifier Signature HMAC', type: 'main', index: 0 }]]
      },
      'Vérifier Signature HMAC': {
        main: [[{ node: 'Traiter la Requête', type: 'main', index: 0 }]]
      },
      'Traiter la Requête': {
        main: [[{ node: 'Respond to Webhook', type: 'main', index: 0 }]]
      }
    },
    active: false,
    settings: {
      executionOrder: 'v1'
    },
    versionId: crypto.randomUUID(),
    id: crypto.randomUUID(),
    meta: {
      instanceId: crypto.randomUUID()
    },
    tags: [{ name: 'Nuvoya8', id: crypto.randomUUID() }]
  }
  
  const workflowPath = join(process.cwd(), 'n8n-test-workflow.json')
  writeFileSync(workflowPath, JSON.stringify(workflow, null, 2))
  
  log(`✓ Workflow exporté: ${workflowPath}`, colors.green)
  
  // 7. Instructions finales
  log('\n' + '═'.repeat(60), colors.cyan)
  log('🎯 PROCHAINES ÉTAPES', colors.bold)
  log('═'.repeat(60), colors.cyan)
  
  log('\n1. Importer le workflow dans N8N:', colors.bold)
  log(`   - Ouvrir N8N: ${n8nUrl}`, colors.cyan)
  log(`   - Cliquer sur "Import from file"`)
  log(`   - Sélectionner: n8n-test-workflow.json`)
  log(`   - Activer le workflow (toggle en haut à droite)`)
  
  log('\n2. Vérifier la configuration:', colors.bold)
  log('   npm run verify', colors.cyan)
  
  log('\n3. Démarrer l\'application:', colors.bold)
  log('   npm run dev', colors.cyan)
  
  log('\n4. Tester le workflow:', colors.bold)
  log('   http://localhost:3000/app/n8n-test', colors.cyan)
  
  log('\n✨ Configuration terminée avec succès!\n', colors.green)
  
  rl.close()
}

main()

