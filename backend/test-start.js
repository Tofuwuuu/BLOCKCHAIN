import { BlockchainNode } from './node.js';

console.log('Starting test...');

try {
  const node = new BlockchainNode({ port: 3002, genesis: true });
  console.log('Node created successfully');
  
  node.start().then(() => {
    console.log('Node started successfully');
  }).catch(error => {
    console.error('Failed to start node:', error);
  });
} catch (error) {
  console.error('Failed to create node:', error);
}
