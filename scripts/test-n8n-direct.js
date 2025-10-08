// Test direct de l'appel N8N
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const n8nUrl = 'https://n8n.infra-nuvoya8.com/webhook/test-workflow';
const secret = 'bc2beb8c44ca42b06249aaaa950dfaf2ca94c0f4bad0d4c3c40a9c9afa6d3f33';

if (!secret) {
  console.error('❌ N8N_WEBHOOK_SECRET non trouvé dans .env.local');
  process.exit(1);
}

console.log('\n🧪 Test direct de N8N\n');
console.log('URL:', n8nUrl);
console.log('Secret:', secret.substring(0, 20) + '...\n');

const payload = {
  data: {
    message: 'Test direct depuis Node.js'
  },
  metadata: {
    appId: 'factory-test',
    userId: 'test-user'
  }
};

// Créer la signature HMAC
const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

console.log('📤 Payload:', JSON.stringify(payload, null, 2));
console.log('\n🔐 Signature HMAC:', signature.substring(0, 20) + '...\n');

// Faire l'appel
fetch(n8nUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-App-Id': 'factory-test',
    'X-User-Id': 'test-user',
    'X-Signature': signature,
    'X-Async': 'false',
    'X-Request-Id': `req_${Date.now()}`
  },
  body: JSON.stringify(payload)
})
  .then(async response => {
    console.log('📥 Status:', response.status, response.statusText);
    console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log('\n📋 Content-Type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('\n✅ Réponse JSON:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('\n⚠️  Réponse NON-JSON:');
      console.log(text.substring(0, 500)); // Premiers 500 caractères
    }
  })
  .catch(error => {
    console.error('\n❌ Erreur:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  });

