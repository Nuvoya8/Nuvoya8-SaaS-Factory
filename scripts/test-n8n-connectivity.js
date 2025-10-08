// Test simple de connectivité N8N
const url = 'https://n8n.infra-nuvoya8.com';

console.log(`\n🔍 Test de connectivité vers ${url}...\n`);

fetch(url, { method: 'GET' })
  .then(response => {
    console.log('✅ N8N est accessible !');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    process.exit(0);
  })
  .catch(error => {
    console.log('⚠️  Impossible d\'accéder à N8N');
    console.log(`   Erreur: ${error.message}`);
    console.log('\n💡 Vérifiez que N8N est démarré et accessible');
    process.exit(1);
  });

