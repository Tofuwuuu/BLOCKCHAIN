import express from 'express';
import cors from 'cors';
import { Blockchain, Transaction } from './blockchain.js';
import { P2PNetwork } from './p2p.js';
import { Consensus } from './consensus.js';
import { ContractValidator } from './contracts.js';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

export class BlockchainNode {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || '0.0.0.0';
    this.genesis = options.genesis || false;
    this.peerHost = options.peer || null;
    this.peerPort = options.peerPort || 3001;
    
    // Initialize components
    this.blockchain = new Blockchain();
    this.p2pNetwork = new P2PNetwork(this.port, this.host);
    this.contractValidator = new ContractValidator();
    this.consensus = new Consensus(this.blockchain, this.p2pNetwork);
    
    // Express app setup
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        node: {
          host: this.host,
          port: this.port,
          nodeId: this.p2pNetwork.nodeId
        }
      });
    });

    // Blockchain endpoints
    this.app.get('/chain', (req, res) => {
      res.json({
        chain: this.blockchain.chain,
        length: this.blockchain.chain.length,
        difficulty: this.blockchain.difficulty,
        lastBlock: this.blockchain.getLatestBlock()
      });
    });

    this.app.get('/chain/block/:index', (req, res) => {
      const index = parseInt(req.params.index);
      if (index >= 0 && index < this.blockchain.chain.length) {
        res.json(this.blockchain.chain[index]);
      } else {
        res.status(404).json({ error: 'Block not found' });
      }
    });

    this.app.post('/transactions/new', (req, res) => {
      try {
        const { from, to, amount, action, data } = req.body;
        
        if (!from || !to || !amount || !action) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create transaction
        const transaction = new Transaction(from, to, amount, action, data);
        
        // Validate transaction using smart contracts
        if (!this.contractValidator.validateTransaction(transaction)) {
          return res.status(400).json({ error: 'Transaction validation failed' });
        }

        // Add to pending transactions
        this.blockchain.addTransaction(transaction);
        
        // Broadcast to peers
        this.p2pNetwork.broadcastTransaction(transaction);
        
        res.json({
          message: 'Transaction added successfully',
          transaction: transaction,
          pendingTransactions: this.blockchain.pendingTransactions.length
        });
      } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/mine', (req, res) => {
      try {
        const miningAddress = req.query.address || 'miner-address';
        
        if (this.blockchain.pendingTransactions.length === 0) {
          return res.json({
            message: 'No pending transactions to mine',
            pendingTransactions: 0
          });
        }

        // Mine the block
        this.blockchain.minePendingTransactions(miningAddress);
        
        const latestBlock = this.blockchain.getLatestBlock();
        
        // Broadcast new block to peers
        this.p2pNetwork.broadcastBlock(latestBlock);
        
        res.json({
          message: 'New block mined!',
          block: latestBlock,
          pendingTransactions: this.blockchain.pendingTransactions.length
        });
      } catch (error) {
        console.error('Error mining block:', error);
        res.status(500).json({ error: error.message });
      }
      });

    // Peer management endpoints
    this.app.get('/peers', (req, res) => {
      const peers = Array.from(this.p2pNetwork.peers.values()).map(peer => ({
        host: peer.host,
        port: peer.port,
        nodeId: peer.nodeId,
        connected: peer.connected,
        lastSeen: peer.lastSeen
      }));
      
      res.json({
        peers: peers,
        count: peers.length,
        connected: peers.filter(p => p.connected).length
      });
    });

    this.app.post('/add_peer', (req, res) => {
      try {
        const { host, port, nodeId } = req.body;
        
        if (!host || !port) {
          return res.status(400).json({ error: 'Host and port are required' });
        }

        // Add peer to network
        this.p2pNetwork.addPeer(host, port, nodeId);
        
        // Try to connect to the peer
        this.p2pNetwork.connectToPeer(host, port).then(() => {
          console.log(`Successfully connected to peer ${host}:${port}`);
        }).catch(error => {
          console.log(`Failed to connect to peer ${host}:${port}:`, error.message);
        });

        res.json({
          message: 'Peer added successfully',
          peer: { host, port, nodeId }
        });
      } catch (error) {
        console.error('Error adding peer:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Contract information
    this.app.get('/contracts', (req, res) => {
      res.json(this.contractValidator.getContractInfo());
    });

    // Node status
    this.app.get('/status', (req, res) => {
      const consensusInfo = this.consensus.getConsensusInfo();
      
      res.json({
        node: {
          host: this.host,
          port: this.port,
          nodeId: this.p2pNetwork.nodeId
        },
        blockchain: {
          chainLength: this.blockchain.chain.length,
          pendingTransactions: this.blockchain.pendingTransactions.length,
          difficulty: this.blockchain.difficulty,
          isValid: this.blockchain.isChainValid()
        },
        consensus: consensusInfo,
        peers: {
          total: this.p2pNetwork.getPeerCount(),
          connected: this.p2pNetwork.getConnectedPeers().length
        },
        contracts: {
          registered: this.contractValidator.registeredActions.size
        }
      });
    });

    // Mining control
    this.app.post('/mining/start', (req, res) => {
      try {
        const { address } = req.body;
        
        if (!address) {
          return res.status(400).json({ error: 'Mining address is required' });
        }

        this.consensus.startMining(address);
        
        res.json({
          message: 'Mining started successfully',
          miningAddress: address
        });
      } catch (error) {
        console.error('Error starting mining:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/mining/stop', (req, res) => {
      try {
        this.consensus.stopMining();
        
        res.json({
          message: 'Mining stopped successfully'
        });
      } catch (error) {
        console.error('Error stopping mining:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Chain sync
    this.app.post('/sync', (req, res) => {
      try {
        this.consensus.requestFullChainSync();
        
        res.json({
          message: 'Chain sync requested',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error requesting chain sync:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('Express error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  setupEventHandlers() {
    // Blockchain events
    this.blockchain.on('block_mined', (block) => {
      console.log('Block mined event:', block.hash);
    });

    // Consensus events
    this.consensus.on('block_mined', (block) => {
      console.log('Consensus: Block mined:', block.hash);
    });

    this.consensus.on('block_added', (block) => {
      console.log('Consensus: Block added:', block.hash);
    });

    this.consensus.on('chain_replaced', (chain) => {
      console.log('Consensus: Chain replaced with', chain.length, 'blocks');
    });

    // P2P events
    this.p2pNetwork.on('peer_added', (peer) => {
      console.log('P2P: Peer added:', peer.host + ':' + peer.port);
    });

    this.p2pNetwork.on('new_transaction', (transaction) => {
      console.log('P2P: New transaction received:', transaction.hash);
    });

    this.p2pNetwork.on('new_block', (block) => {
      console.log('P2P: New block received:', block.hash);
    });
  }

  async start() {
    try {
      console.log('Starting Blockchain Node...');
      console.log(`Host: ${this.host}`);
      console.log(`Port: ${this.port}`);
      console.log(`Genesis: ${this.genesis}`);

      // Start P2P network
      await this.p2pNetwork.start();
      
      // Start HTTP server
      this.httpServer.listen(this.port, this.host, () => {
        console.log(`HTTP server listening on ${this.host}:${this.port}`);
      });

      // Connect to bootstrap peer if specified
      if (this.peerHost) {
        try {
          await this.p2pNetwork.connectToPeer(this.peerHost, this.peerPort);
          console.log(`Connected to bootstrap peer: ${this.peerHost}:${this.peerPort}`);
        } catch (error) {
          console.log(`Failed to connect to bootstrap peer: ${error.message}`);
        }
      }

      // Load blockchain from file if exists
      try {
        await this.blockchain.loadFromFile(`blockchain_${this.port}.json`);
      } catch (error) {
        console.log('No existing blockchain file found, starting fresh');
      }

      console.log('Blockchain Node started successfully!');
      console.log(`Node ID: ${this.p2pNetwork.nodeId}`);
      console.log(`Chain length: ${this.blockchain.chain.length}`);
      console.log(`Pending transactions: ${this.blockchain.pendingTransactions.length}`);

    } catch (error) {
      console.error('Error starting Blockchain Node:', error);
      throw error;
    }
  }

  async stop() {
    try {
      console.log('Stopping Blockchain Node...');
      
      // Save blockchain to file
      await this.blockchain.saveToFile(`blockchain_${this.port}.json`);
      
      // Stop consensus
      await this.consensus.stop();
      
      // Stop P2P network
      await this.p2pNetwork.stop();
      
      // Stop HTTP server
      this.httpServer.close();
      
      console.log('Blockchain Node stopped successfully');
    } catch (error) {
      console.error('Error stopping Blockchain Node:', error);
      throw error;
    }
  }

  // Utility methods
  getBlockchainInfo() {
    return {
      chain: this.blockchain.chain,
      length: this.blockchain.chain.length,
      pendingTransactions: this.blockchain.pendingTransactions.length,
      difficulty: this.blockchain.difficulty,
      isValid: this.blockchain.isChainValid()
    };
  }

  getNodeInfo() {
    return {
      host: this.host,
      port: this.port,
      nodeId: this.p2pNetwork.nodeId,
      peers: this.p2pNetwork.getPeerCount(),
      connectedPeers: this.p2pNetwork.getConnectedPeers().length
    };
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    port: 3000,
    host: '0.0.0.0',
    genesis: false,
    peer: null,
    peerPort: 3001
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
        options.port = parseInt(args[++i]) || 3000;
        break;
      case '--host':
        options.host = args[++i] || '0.0.0.0';
        break;
      case '--genesis':
        options.genesis = true;
        break;
      case '--peer':
        options.peer = args[++i] || null;
        break;
      case '--peer-port':
        options.peerPort = parseInt(args[++i]) || 3001;
        break;
      case '--help':
        console.log(`
Blockchain Node Usage:
  --port <number>      Port to listen on (default: 3000)
  --host <string>      Host to bind to (default: 0.0.0.0)
  --genesis           Start as genesis node
  --peer <host>       Connect to bootstrap peer
  --peer-port <port>  Bootstrap peer port (default: 3001)
  --help              Show this help message

Examples:
  node node.js --port 3000 --genesis
  node node.js --port 3001 --peer localhost --peer-port 3000
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  
  const node = new BlockchainNode(options);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await node.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await node.stop();
    process.exit(0);
  });

  // Start the node
  node.start().catch(error => {
    console.error('Failed to start node:', error);
    process.exit(1);
  });
}
