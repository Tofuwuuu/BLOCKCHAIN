import { BlockchainNode } from './node.js';

async function startBackend() {
  try {
    console.log('Starting backend test...');
    
    const options = {
      port: 3002,
      host: '0.0.0.0',
      genesis: false
    };
    
    const node = new BlockchainNode(options);
    
    console.log('Node created, starting...');
    await node.start();
    
    console.log('Backend started successfully!');
    console.log('Press Ctrl+C to stop');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await node.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

startBackend();
