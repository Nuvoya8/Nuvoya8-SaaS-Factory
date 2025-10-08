// Configuration automatique de N8N
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

console.log('\n⚡ Configuration automatique de N8N...\n');

// 1. Générer un secret HMAC sécurisé
const secret = crypto.randomBytes(32).toString('hex');
console.log('✓ Secret HMAC généré');

// 2. Configuration
const n8nUrl = 'https://n8n.infra-nuvoya8.com';
const appName = 'Nuvoya8 Factory Test';

console.log(`✓ URL N8N: ${n8nUrl}`);
console.log(`✓ Nom de l'app: ${appName}`);

// 3. Lire .env.local existant
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
  console.log('✓ .env.local trouvé');
} else {
  console.log('⚠️  .env.local n\'existe pas, création...');
}

// 4. Supprimer les anciennes valeurs N8N si elles existent
const lines = envContent.split('\n').filter(line => 
  !line.startsWith('N8N_WEBHOOK_URL=') && 
  !line.startsWith('N8N_WEBHOOK_SECRET=') &&
  !line.startsWith('NEXT_PUBLIC_APP_NAME=') &&
  !line.trim().startsWith('# N8N Configuration')
);

envContent = lines.join('\n');

// 5. Ajouter les nouvelles valeurs
envContent += '\n\n# N8N Configuration (ajouté automatiquement)\n';
envContent += `N8N_WEBHOOK_URL=${n8nUrl}/webhook\n`;
envContent += `N8N_WEBHOOK_SECRET=${secret}\n`;
envContent += `NEXT_PUBLIC_APP_NAME=${appName}\n`;

// 6. Enregistrer
fs.writeFileSync(envPath, envContent);
console.log('✓ Variables ajoutées dans .env.local');

// 7. Créer le workflow N8N
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
      id: crypto.randomUUID(),
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

// Secret partagé (IMPORTANT: Même valeur que dans .env.local)
const secret = '${secret}';

// Calculer la signature attendue
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(body))
  .digest('hex');

// Vérifier la signature
if (signature !== expectedSignature) {
  throw new Error('❌ Invalid HMAC signature - Unauthorized');
}

// Vérifier app_id
const appId = body.metadata?.appId;
if (!appId) {
  throw new Error('❌ Missing app_id in metadata');
}

console.log('✅ Signature HMAC valide');
console.log('✅ App ID:', appId);

// Tout est OK, passer les données au nœud suivant
return $input.item;`
      },
      id: crypto.randomUUID(),
      name: 'Vérifier Signature HMAC',
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      position: [450, 300],
    },
    {
      parameters: {
        functionCode: `const data = $input.item.json.data;
const metadata = $input.item.json.metadata;

console.log('📥 Message reçu:', data.message);
console.log('👤 User ID:', metadata.userId);

return {
  json: {
    success: true,
    data: {
      message: '🎉 Workflow N8N exécuté avec succès !',
      receivedMessage: data.message,
      timestamp: data.timestamp,
      appId: metadata.appId,
      userId: metadata.userId,
      processedAt: new Date().toISOString(),
      workflowVersion: 'v1.0.0',
      serverInfo: {
        n8n: 'Nuvoya8 Factory',
        environment: 'production'
      }
    }
  }
};`
      },
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
  tags: []
};

const workflowPath = path.join(process.cwd(), 'n8n-test-workflow.json');
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log(`✓ Workflow exporté: n8n-test-workflow.json`);

// 8. Récapitulatif
console.log('\n' + '═'.repeat(60));
console.log('✅ CONFIGURATION TERMINÉE !');
console.log('═'.repeat(60));

console.log('\n📋 Variables configurées:');
console.log(`   N8N_WEBHOOK_URL=${n8nUrl}/webhook`);
console.log(`   N8N_WEBHOOK_SECRET=${secret.substring(0, 20)}...`);
console.log(`   NEXT_PUBLIC_APP_NAME=${appName}`);

console.log('\n🎯 PROCHAINES ÉTAPES:\n');
console.log('1️⃣  Importer le workflow dans N8N:');
console.log(`    → Ouvrir: ${n8n.infra-nuvoya8.com}`);
console.log('    → Menu: Workflows → Import from file');
console.log('    → Sélectionner: n8n-test-workflow.json');
console.log('    → ACTIVER le workflow (toggle en haut à droite)');

console.log('\n2️⃣  Vérifier la configuration:');
console.log('    npm run verify');

console.log('\n3️⃣  Démarrer l\'application:');
console.log('    npm run dev');

console.log('\n4️⃣  Tester le workflow:');
console.log('    http://localhost:3000/app/n8n-test');

console.log('\n✨ Tout est prêt pour le test !\n');

