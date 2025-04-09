console.log('==================================================');
console.log('       SYSTEM INTEGRATION & ARCHITECTURE 2');
console.log('==================================================');
console.log('\nProponents:');
console.log('- Dobli, Ferdinand John F.');
console.log('- Espinosa, Eriel John Q.');
console.log('- Operario, Raphael Miguel D.');
console.log('\n==================================================');

const { spawn } = require('child_process');

// Spawn server process
const server = spawn('npm', ['run', 'server'], { stdio: 'inherit' });

// Spawn client process
const client = spawn('npm', ['run', 'client'], { stdio: 'inherit' });

// Handle process exits
process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});