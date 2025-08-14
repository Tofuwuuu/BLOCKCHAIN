import { BlockchainNode } from './node.js';

// Example: Create and interact with a blockchain node
async function runExample() {
  console.log('🚀 Starting Blockchain Node Example...\n');

  // Create a new node instance
  const node = new BlockchainNode({
    port: 3000,
    host: '0.0.0.0',
    genesis: true
  });

  try {
    // Start the node
    await node.start();
    
    console.log('\n✅ Node started successfully!');
    console.log(`📍 Node ID: ${node.p2pNetwork.nodeId}`);
    console.log(`🌐 Listening on: ${node.host}:${node.port}`);
    console.log(`🔗 Chain length: ${node.blockchain.chain.length}`);
    
    // Wait a moment for the node to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Example: Create a transaction
    console.log('\n📝 Creating example transaction...');
    
    const transactionData = {
      from: 'user123',
      to: 'supplier456',
      amount: 1000,
      action: 'order_created',
      data: {
        order_id: 'PO-2024-001',
        supplier_id: 456,
        total_amount: 1000,
        items: [
          {
            product_id: 1,
            quantity: 10,
            unit_price: 100
          }
        ]
      }
    };
    
    // Add transaction to the blockchain
    node.blockchain.addTransaction(transactionData);
    console.log('✅ Transaction added to pending transactions');
    console.log(`📊 Pending transactions: ${node.blockchain.pendingTransactions.length}`);
    
    // Example: Mine a block
    console.log('\n⛏️ Mining block...');
    const miningAddress = 'miner-address';
    node.blockchain.minePendingTransactions(miningAddress);
    
    console.log('✅ Block mined successfully!');
    console.log(`🔗 Chain length: ${node.blockchain.chain.length}`);
    console.log(`📊 Pending transactions: ${node.blockchain.pendingTransactions.length}`);
    
    // Example: Get blockchain info
    console.log('\n📊 Blockchain Information:');
    const info = node.getBlockchainInfo();
    console.log(`- Chain length: ${info.length}`);
    console.log(`- Pending transactions: ${info.pendingTransactions}`);
    console.log(`- Difficulty: ${info.difficulty}`);
    console.log(`- Chain valid: ${info.isValid}`);
    
    // Example: Get node info
    console.log('\n🖥️ Node Information:');
    const nodeInfo = node.getNodeInfo();
    console.log(`- Host: ${nodeInfo.host}`);
    console.log(`- Port: ${nodeInfo.port}`);
    console.log(`- Node ID: ${nodeInfo.nodeId}`);
    console.log(`- Peers: ${nodeInfo.peers}`);
    console.log(`- Connected peers: ${nodeInfo.connectedPeers}`);
    
    // Example: Start mining
    console.log('\n⛏️ Starting continuous mining...');
    node.consensus.startMining('miner-address');
    
    // Let it mine for a few seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Stop mining
    console.log('\n⏹️ Stopping mining...');
    node.consensus.stopMining();
    
    console.log('\n✅ Example completed successfully!');
    console.log('\n🌐 You can now interact with the node via:');
    console.log(`   - HTTP API: http://localhost:${node.port}`);
    console.log(`   - Health check: http://localhost:${node.port}/health`);
    console.log(`   - Blockchain: http://localhost:${node.port}/chain`);
    console.log(`   - Status: http://localhost:${node.port}/status`);
    console.log(`   - Peers: http://localhost:${node.port}/peers`);
    
    console.log('\n📝 To create transactions, POST to:');
    console.log(`   http://localhost:${node.port}/transactions/new`);
    
    console.log('\n⛏️ To mine blocks:');
    console.log(`   http://localhost:${node.port}/mine`);
    
    console.log('\n🔄 To start another node as a peer:');
    console.log(`   node node.js --port 3001 --peer localhost --peer-port 3000`);
    
    // Keep the node running
    console.log('\n⏳ Node is running. Press Ctrl+C to stop...');
    
  } catch (error) {
    console.error('❌ Error running example:', error);
  }
}

// Example: Create multiple nodes for testing
async function runMultiNodeExample() {
  console.log('\n🌐 Starting Multi-Node Example...\n');
  
  // Create first node (genesis)
  const node1 = new BlockchainNode({
    port: 3000,
    host: '0.0.0.0',
    genesis: true
  });
  
  // Create second node (peer)
  const node2 = new BlockchainNode({
    port: 3001,
    host: '0.0.0.0',
    peer: 'localhost',
    peerPort: 3000
  });
  
  try {
    // Start both nodes
    await node1.start();
    console.log('✅ Node 1 started on port 3000');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await node2.start();
    console.log('✅ Node 2 started on port 3001');
    
    // Wait for peer discovery
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📊 Node 1 peers:', node1.p2pNetwork.getPeerCount());
    console.log('📊 Node 2 peers:', node2.p2pNetwork.getPeerCount());
    
    console.log('\n🌐 Multi-node setup complete!');
    console.log('   - Node 1: http://localhost:3000');
    console.log('   - Node 2: http://localhost:3001');
    
  } catch (error) {
    console.error('❌ Error in multi-node example:', error);
  }
}

// Run examples based on command line arguments
const args = process.argv.slice(2);

if (args.includes('--multi')) {
  runMultiNodeExample();
} else {
  runExample();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down example...');
  process.exit(0);
});
