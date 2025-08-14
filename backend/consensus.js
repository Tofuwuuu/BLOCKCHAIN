import { EventEmitter } from 'events';

export class Consensus extends EventEmitter {
  constructor(blockchain, p2pNetwork) {
    super();
    this.blockchain = blockchain;
    this.p2pNetwork = p2pNetwork;
    this.isMining = false;
    this.miningAddress = null;
    this.syncInProgress = false;
    this.lastSyncTime = 0;
    this.syncInterval = 30000; // 30 seconds
    
    this.setupEventHandlers();
    this.startPeriodicSync();
  }

  setupEventHandlers() {
    // Handle new transactions from peers
    this.p2pNetwork.on('new_transaction', (transaction) => {
      this.handleNewTransaction(transaction);
    });

    // Handle new blocks from peers
    this.p2pNetwork.on('new_block', (block) => {
      this.handleNewBlock(block);
    });

    // Handle chain requests from peers
    this.p2pNetwork.on('chain_request', (socket) => {
      this.handleChainRequest(socket);
    });

    // Handle chain responses from peers
    this.p2pNetwork.on('chain_response', (chain) => {
      this.handleChainResponse(chain);
    });

    // Handle peer additions
    this.p2pNetwork.on('peer_added', (peer) => {
      this.handlePeerAdded(peer);
    });
  }

  handleNewTransaction(transaction) {
    try {
      // Validate transaction before adding
      if (this.validateTransaction(transaction)) {
        this.blockchain.addTransaction(transaction);
        console.log('New transaction added from peer:', transaction.hash);
        
        // Broadcast to other peers
        this.p2pNetwork.broadcastTransaction(transaction);
      } else {
        console.log('Invalid transaction received from peer:', transaction.hash);
      }
    } catch (error) {
      console.error('Error handling new transaction:', error);
    }
  }

  handleNewBlock(block) {
    try {
      // Validate the new block
      if (this.validateBlock(block)) {
        // Check if this block extends our current chain
        if (block.previousHash === this.blockchain.getLatestBlock().hash) {
          this.blockchain.chain.push(block);
          console.log('New block added to chain:', block.hash);
          
          // Clear pending transactions that are now in the block
          this.clearPendingTransactionsInBlock(block);
          
          // Broadcast to other peers
          this.p2pNetwork.broadcastBlock(block);
          
          // Emit block added event
          this.emit('block_added', block);
        } else {
          console.log('Block does not extend current chain, requesting full sync');
          this.requestFullChainSync();
        }
      } else {
        console.log('Invalid block received from peer:', block.hash);
      }
    } catch (error) {
      console.error('Error handling new block:', error);
    }
  }

  handleChainRequest(socket) {
    try {
      const chain = this.blockchain.chain;
      socket.emit('chain_response', chain);
      console.log('Chain requested by peer, sent', chain.length, 'blocks');
    } catch (error) {
      console.error('Error handling chain request:', error);
    }
  }

  handleChainResponse(chain) {
    try {
      if (this.syncInProgress) {
        console.log('Chain sync already in progress, skipping');
        return;
      }

      this.syncInProgress = true;
      console.log('Processing chain response:', chain.length, 'blocks');

      // Validate the received chain
      if (this.validateChain(chain)) {
        // Apply longest valid chain rule
        if (chain.length > this.blockchain.chain.length) {
          console.log('Received longer valid chain, replacing current chain');
          this.blockchain.replaceChain(chain);
          this.emit('chain_replaced', chain);
        } else {
          console.log('Received chain is not longer than current chain');
        }
      } else {
        console.log('Received invalid chain from peer');
      }

      this.syncInProgress = false;
      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('Error handling chain response:', error);
      this.syncInProgress = false;
    }
  }

  handlePeerAdded(peer) {
    // When a new peer connects, request their chain to sync
    if (peer.connected) {
      console.log('New peer connected, requesting chain sync');
      setTimeout(() => {
        this.requestChainFromPeer(peer);
      }, 1000); // Small delay to ensure connection is stable
    }
  }

  validateTransaction(transaction) {
    try {
      // Basic transaction validation
      if (!transaction.hash || !transaction.from || !transaction.to) {
        return false;
      }

      // Check if transaction already exists
      for (const block of this.blockchain.chain) {
        for (const tx of block.transactions) {
          if (tx.hash === transaction.hash) {
            return false; // Transaction already exists
          }
        }
      }

      // Check if transaction is in pending transactions
      for (const tx of this.blockchain.pendingTransactions) {
        if (tx.hash === transaction.hash) {
          return false; // Transaction already pending
        }
      }

      return transaction.isValid();
    } catch (error) {
      console.error('Transaction validation error:', error);
      return false;
    }
  }

  validateBlock(block) {
    try {
      // Basic block validation
      if (!block.hash || !block.previousHash || !block.transactions) {
        return false;
      }

      // Verify block hash
      const calculatedHash = block.calculateHash();
      if (block.hash !== calculatedHash) {
        console.log('Block hash mismatch');
        return false;
      }

      // Verify previous hash
      if (block.previousHash !== this.blockchain.getLatestBlock().hash) {
        console.log('Block previous hash mismatch');
        return false;
      }

      // Verify proof of work
      const target = '0'.repeat(this.blockchain.difficulty);
      if (block.hash.substring(0, this.blockchain.difficulty) !== target) {
        console.log('Block proof of work invalid');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Block validation error:', error);
      return false;
    }
  }

  validateChain(chain) {
    try {
      if (!Array.isArray(chain) || chain.length === 0) {
        return false;
      }

      // Validate genesis block
      if (chain[0].index !== 0 || chain[0].previousHash !== '0') {
        return false;
      }

      // Validate each block in the chain
      for (let i = 1; i < chain.length; i++) {
        const currentBlock = chain[i];
        const previousBlock = chain[i - 1];

        if (currentBlock.previousHash !== previousBlock.hash) {
          return false;
        }

        if (currentBlock.hash !== currentBlock.calculateHash()) {
          return false;
        }

        // Verify proof of work
        const target = '0'.repeat(this.blockchain.difficulty);
        if (currentBlock.hash.substring(0, this.blockchain.difficulty) !== target) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Chain validation error:', error);
      return false;
    }
  }

  clearPendingTransactionsInBlock(block) {
    const blockTransactionHashes = new Set(block.transactions.map(tx => tx.hash));
    
    this.blockchain.pendingTransactions = this.blockchain.pendingTransactions.filter(
      tx => !blockTransactionHashes.has(tx.hash)
    );
  }

  startMining(miningAddress) {
    if (this.isMining) {
      console.log('Mining already in progress');
      return;
    }

    this.miningAddress = miningAddress;
    this.isMining = true;
    console.log(`Started mining with address: ${miningAddress}`);

    this.mineNextBlock();
  }

  stopMining() {
    this.isMining = false;
    console.log('Mining stopped');
  }

  mineNextBlock() {
    if (!this.isMining || this.blockchain.pendingTransactions.length === 0) {
      if (this.isMining) {
        setTimeout(() => this.mineNextBlock(), 1000);
      }
      return;
    }

    try {
      console.log('Mining new block...');
      this.blockchain.minePendingTransactions(this.miningAddress);
      
      const latestBlock = this.blockchain.getLatestBlock();
      console.log('Block mined successfully:', latestBlock.hash);
      
      // Broadcast the new block to peers
      this.p2pNetwork.broadcastBlock(latestBlock);
      
      // Emit block mined event
      this.emit('block_mined', latestBlock);
      
      // Continue mining if still enabled
      if (this.isMining) {
        setTimeout(() => this.mineNextBlock(), 1000);
      }
    } catch (error) {
      console.error('Error mining block:', error);
      if (this.isMining) {
        setTimeout(() => this.mineNextBlock(), 5000); // Retry after 5 seconds
      }
    }
  }

  requestFullChainSync() {
    if (this.syncInProgress) {
      console.log('Chain sync already in progress');
      return;
    }

    console.log('Requesting full chain sync from peers');
    this.p2pNetwork.requestChainFromPeers();
  }

  requestChainFromPeer(peer) {
    if (peer.connected && peer.socket) {
      peer.socket.emit('chain_request');
    }
  }

  startPeriodicSync() {
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastSyncTime > this.syncInterval && !this.syncInProgress) {
        console.log('Performing periodic chain sync');
        this.requestFullChainSync();
      }
    }, this.syncInterval);
  }

  getConsensusInfo() {
    return {
      isMining: this.isMining,
      miningAddress: this.miningAddress,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      peerCount: this.p2pNetwork.getPeerCount(),
      chainLength: this.blockchain.chain.length,
      pendingTransactions: this.blockchain.pendingTransactions.length,
      difficulty: this.blockchain.difficulty
    };
  }

  async stop() {
    this.stopMining();
    this.syncInProgress = false;
    console.log('Consensus stopped');
  }
}
