console.log('🔍 node.js file is being loaded...');

import express from 'express';
import cors from 'cors';
import { Blockchain, Transaction } from './blockchain.js';
import { P2PNetwork } from './p2p.js';
import { Consensus } from './consensus.js';
import { ContractValidator } from './contracts.js';
import { seedDemoData } from './demo-data.js';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import Database from './database.js';
import jwt from 'jsonwebtoken';

export class BlockchainNode {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || '0.0.0.0';
    this.genesis = options.genesis || false;
    this.peerHost = options.peer || null;
    this.peerPort = options.peerPort || 3001;
    
    // Initialize components
    this.blockchain = new Blockchain();
    
    // Express app setup - create HTTP server first
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Now create P2P network with the HTTP server
    this.p2pNetwork = new P2PNetwork(this.port, this.host, this.httpServer);
    this.contractValidator = new ContractValidator();
    this.consensus = new Consensus(this.blockchain, this.p2pNetwork);
    this.database = new Database();
    
    // JWT secret
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
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

    // ===== PROCUREMENT API ENDPOINTS =====
    
    // Dashboard statistics
    this.app.get('/api/stats', (req, res) => {
      try {
        const stats = {
          pending_orders: this.blockchain.pendingTransactions.filter(tx => 
            tx.action === 'order_created' || tx.action === 'order_approved'
          ).length,
          approved_orders: this.blockchain.chain.reduce((count, block) => {
            return count + block.transactions.filter(tx => 
              tx.action === 'order_approved'
            ).length;
          }, 0),
          low_inventory: this.blockchain.chain.reduce((count, block) => {
            return count + block.transactions.filter(tx => 
              tx.action === 'inventory_adjusted' && tx.data?.adjustment < 0
            ).length;
          }, 0),
          recent_orders: this.blockchain.chain.slice(-5).flatMap(block => 
            block.transactions.filter(tx => 
              tx.action === 'order_created' || tx.action === 'order_approved'
            ).map(tx => ({
              id: tx.hash.substring(0, 8),
              po_number: tx.data?.order_id || `PO-${tx.hash.substring(0, 8)}`,
              supplier: { name: tx.to || 'Unknown Supplier' },
              date_created: new Date(tx.timestamp).toISOString(),
              status: tx.action === 'order_approved' ? 'Approved' : 'Pending',
              total_amount: tx.amount || 0
            }))
          ).slice(0, 5)
        };
        
        res.json(stats);
      } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Authentication endpoints
    this.app.post('/api/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        
        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password are required' });
        }

        // Authenticate user with database
        const user = await this.database.authenticateUser(username, password);
        
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          this.jwtSecret,
          { expiresIn: '24h' }
        );

        // Create session in database
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await this.database.createSession(user.id, token, expiresAt);
        
        res.json({
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            position: user.position,
            department: user.department,
            role: user.role,
            is_admin: user.is_admin
          },
          token,
          message: 'Login successful'
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
      }
    });

    this.app.post('/api/auth/logout', async (req, res) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
          await this.database.deleteSession(token);
        }
        
        res.json({ message: 'Logout successful' });
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
      }
    });

    this.app.get('/api/auth/me', async (req, res) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const session = await this.database.getSession(token);
        if (!session) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const user = await this.database.getUserById(session.user_id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          position: user.position,
          department: user.department,
          role: user.role,
          is_admin: user.is_admin
        });
      } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
      }
    });

    // Suppliers endpoints
    this.app.get('/api/suppliers', async (req, res) => {
      try {
        const suppliers = await this.database.getAllSuppliers();
        res.json(suppliers);
      } catch (error) {
        console.error('Error getting suppliers:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/suppliers', async (req, res) => {
      try {
        const supplierData = req.body;
        const newSupplier = await this.database.createSupplier(supplierData);
        
        // Create blockchain transaction for audit trail
        const transaction = new Transaction(
          'system',
          newSupplier.id.toString(),
          0,
          'supplier_registered',
          newSupplier
        );
        this.blockchain.addTransaction(transaction);
        
        res.status(201).json(newSupplier);
      } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/suppliers/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const supplier = await this.database.getSupplierById(id);
        
        if (!supplier) {
          return res.status(404).json({ error: 'Supplier not found' });
        }
        
        res.json(supplier);
      } catch (error) {
        console.error('Error getting supplier:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.put('/api/suppliers/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const supplierData = req.body;
        const updatedSupplier = await this.database.updateSupplier(id, supplierData);
        
        res.json(updatedSupplier);
      } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/suppliers/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        await this.database.deleteSupplier(id);
        
        res.json({ message: 'Supplier deleted successfully' });
      } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Orders endpoints
    this.app.get('/api/orders', async (req, res) => {
      try {
        const orders = await this.database.getAllOrders();
        res.json(orders);
      } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/orders', async (req, res) => {
      try {
        const orderData = req.body;
        const newOrder = await this.database.createOrder(orderData);
        
        // Create blockchain transaction for audit trail
        const transaction = new Transaction(
          'system',
          newOrder.id.toString(),
          0,
          'order_created',
          newOrder
        );
        this.blockchain.addTransaction(transaction);
        
        res.status(201).json(newOrder);
      } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/orders/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const order = await this.database.getOrderById(id);
        
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
      } catch (error) {
        console.error('Error getting order:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.put('/api/orders/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const orderData = req.body;
        const updatedOrder = await this.database.updateOrder(id, orderData);
        
        res.json(updatedOrder);
      } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/orders/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        await this.database.deleteOrder(id);
        
        res.json({ message: 'Order deleted successfully' });
      } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Inventory endpoints
    this.app.get('/api/inventory', async (req, res) => {
      try {
        const inventory = await this.database.getAllInventory();
        res.json(inventory);
      } catch (error) {
        console.error('Error getting inventory:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/inventory', async (req, res) => {
      try {
        const inventoryData = req.body;
        const newInventory = await this.database.createInventory(inventoryData);
        
        res.status(201).json(newInventory);
      } catch (error) {
        console.error('Error creating inventory:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.put('/api/inventory/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const inventoryData = req.body;
        const updatedInventory = await this.database.updateInventory(id, inventoryData);
        
        res.json(updatedInventory);
      } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/inventory/:id/adjust', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { adjustment, reason } = req.body;
        
        const updatedInventory = await this.database.adjustInventory(id, adjustment, reason);
        
        // Create blockchain transaction for audit trail
        const transaction = new Transaction(
          'system',
          id.toString(),
          0,
          'inventory_adjusted',
          { adjustment, reason, inventory_id: id }
        );
        this.blockchain.addTransaction(transaction);
        
        res.json(updatedInventory);
      } catch (error) {
        console.error('Error adjusting inventory:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Products endpoints
    this.app.get('/api/products', async (req, res) => {
      try {
        const products = await this.database.getAllProducts();
        res.json(products);
      } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/products', async (req, res) => {
      try {
        const productData = req.body;
        const newProduct = await this.database.createProduct(productData);
        
        // Create blockchain transaction for audit trail
        const transaction = new Transaction(
          'system',
          newProduct.id.toString(),
          0,
          'order_created',
          {
            product_id: newProduct.id,
            name: newProduct.name,
            description: newProduct.description,
            unit: newProduct.unit,
            unit_price: newProduct.unit_price,
            category: newProduct.category
          }
        );

        this.blockchain.addTransaction(transaction);
        
        res.json(newProduct);
      } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Audit logs endpoint
    this.app.get('/api/audit-logs', async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        // Get filters from query parameters
        const filters = {
          action: req.query.action || '',
          table_name: req.query.table_name || '',
          username: req.query.username || '',
          date_from: req.query.date_from || '',
          date_to: req.query.date_to || ''
        };

        // Get audit logs from database
        const auditLogs = await this.database.getAuditLogs(filters, limit, offset);
        const totalCount = await this.database.getAuditLogsCount(filters);

        res.json({
          logs: auditLogs,
          total: totalCount,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalCount / limit)
        });
      } catch (error) {
        console.error('Error getting audit logs:', error);
        res.status(500).json({ error: error.message });
      }
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

      // Initialize database
      console.log('🔄 Initializing database...');
      await this.database.init();
      console.log('✅ Database initialized');

      // Start HTTP server first
      console.log('🔄 Starting HTTP server...');
      await new Promise((resolve, reject) => {
        this.httpServer.listen(this.port, this.host, () => {
          console.log(`HTTP server listening on ${this.host}:${this.port}`);
          resolve();
        });
        
        this.httpServer.on('error', (error) => {
          console.error('❌ HTTP server error:', error);
          reject(error);
        });
      });
      
      // Start P2P network with existing server
      console.log('🔄 Starting P2P network...');
      await this.p2pNetwork.startWithExistingServer();
      console.log('✅ P2P network started');

      // Connect to bootstrap peer if specified
      if (this.peerHost) {
        try {
          console.log(`🔄 Connecting to bootstrap peer: ${this.peerHost}:${this.peerPort}`);
          await this.p2pNetwork.connectToPeer(this.peerHost, this.peerPort);
          console.log(`Connected to bootstrap peer: ${this.peerHost}:${this.peerPort}`);
        } catch (error) {
          console.log(`Failed to connect to bootstrap peer: ${error.message}`);
        }
      }

      // Load blockchain from file if exists
      try {
        console.log('🔄 Loading blockchain from file...');
        await this.blockchain.loadFromFile(`blockchain_${this.port}.json`);
        console.log('✅ Blockchain loaded from file');
      } catch (error) {
        console.log('No existing blockchain file found, starting fresh');
      }

      // Seed demo data if this is a genesis node and chain is empty
      if (this.genesis && this.blockchain.chain.length === 1) {
        console.log('🌱 Seeding demo data for genesis node...');
        try {
          seedDemoData(this.blockchain);
          console.log('✅ Demo data seeded');
        } catch (error) {
          console.log('⚠️ Demo data seeding failed, continuing without demo data:', error.message);
        }
      }

      console.log('Blockchain Node started successfully!');
      console.log(`Node ID: ${this.p2pNetwork.nodeId}`);
      console.log(`Chain length: ${this.blockchain.chain.length}`);
      console.log(`Pending transactions: ${this.blockchain.pendingTransactions.length}`);

    } catch (error) {
      console.error('❌ Error starting Blockchain Node:', error);
      console.error('Stack trace:', error.stack);
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
      
      // Close database connection
      await this.database.close();
      
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
try {
  console.log('🔍 About to check import.meta.url...');
  console.log('🔍 import.meta.url:', import.meta.url);
  console.log('🔍 process.argv[1]:', process.argv[1]);
  
  // Normalize paths for comparison
  const importPath = import.meta.url.replace('file://', '').replace(/\//g, '\\').replace(/^\\+/, '');
  const argvPath = process.argv[1];
  
  console.log('🔍 Normalized importPath:', importPath);
  console.log('🔍 Normalized argvPath:', argvPath);
  
  if (importPath === argvPath) {
    console.log('✅ Paths match, executing main logic');
    
    const options = parseArgs();
    
    console.log('🚀 Starting Blockchain Node with options:', options);
    
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
    console.log('🔄 Calling node.start()...');
    node.start().catch(error => {
      console.error('❌ Failed to start node:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
  } else {
    console.log('❌ Paths do not match');
    console.log('🔍 This file is being imported as a module, not executed directly');
  }
} catch (error) {
  console.error('❌ Error in main execution:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
