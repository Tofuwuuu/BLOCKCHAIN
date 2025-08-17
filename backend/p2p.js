import dgram from 'node:dgram';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { EventEmitter } from 'events';

export class P2PNetwork extends EventEmitter {
  constructor(port, host = '0.0.0.0', httpServer = null) {
    super();
    this.port = port;
    this.host = host;
    this.peers = new Map();
    this.udpSocket = null;
    this.io = null;
    this.httpServer = httpServer; // Allow external HTTP server
    this.multicastAddress = '224.0.0.1';
    this.multicastPort = 5000;
    this.bootstrapPeers = [];
    this.nodeId = this.generateNodeId();
  }

  generateNodeId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async start() {
    await this.startUDPMulticast();
    await this.startSocketIOServer();
    await this.startHTTPDiscovery();
    
    console.log(`P2P Network started on ${this.host}:${this.port}`);
    console.log(`Node ID: ${this.nodeId}`);
  }

  async startWithExistingServer() {
    await this.startUDPMulticast();
    await this.startSocketIOServer();
    // Skip discovery server for now to avoid port conflicts
    // await this.startHTTPDiscovery();
    
    console.log(`P2P Network attached to existing server on ${this.host}:${this.port}`);
    console.log(`Node ID: ${this.nodeId}`);
  }

  async startUDPMulticast() {
    this.udpSocket = dgram.createSocket('udp4');
    
    this.udpSocket.on('error', (err) => {
      console.error('UDP Socket error:', err);
    });

    this.udpSocket.on('message', (msg, rinfo) => {
      this.handleUDPMessage(msg, rinfo);
    });

    this.udpSocket.on('listening', () => {
      const address = this.udpSocket.address();
      console.log(`UDP listening on ${address.address}:${address.port}`);
      
      // Join multicast group
      this.udpSocket.addMembership(this.multicastAddress);
      
      // Broadcast our presence
      this.broadcastPresence();
    });

    this.udpSocket.bind(this.multicastPort);
  }

  async startSocketIOServer() {
    console.log('🔍 P2P: startSocketIOServer called');
    console.log('🔍 P2P: this.httpServer exists:', !!this.httpServer);
    console.log('🔍 P2P: this.httpServer.listening:', this.httpServer ? this.httpServer.listening : 'N/A');
    console.log('🔍 P2P: this.port:', this.port);
    console.log('🔍 P2P: this.host:', this.host);
    
    if (!this.httpServer) {
      console.log('🔍 P2P: Creating new HTTP server');
      this.httpServer = createServer();
    }
    
    this.io = new Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      this.handleSocketConnection(socket);
    });

    // If we have an external HTTP server, don't start listening
    // The external server should handle the listening
    if (this.httpServer && this.httpServer.listening) {
      console.log(`Socket.IO attached to existing HTTP server on ${this.host}:${this.port}`);
    } else if (this.httpServer && !this.httpServer.listening) {
      // Only start listening if we created the server and it's not already listening
      console.log('🔍 P2P: Starting HTTP server listening...');
      this.httpServer.listen(this.port, this.host, () => {
        console.log(`Socket.IO server listening on ${this.host}:${this.port}`);
      });
    } else {
      console.log(`Socket.IO server ready but not listening (external server will handle it)`);
    }
  }

  async startHTTPDiscovery() {
    // Start a simple HTTP server for peer discovery
    const discoveryServer = createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/peers') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(Array.from(this.peers.values())));
      } else if (req.method === 'POST' && req.url === '/add_peer') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const peerData = JSON.parse(body);
            this.addPeer(peerData.host, peerData.port, peerData.nodeId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid peer data' }));
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    discoveryServer.listen(this.port + 1000, this.host, () => {
      console.log(`Discovery server listening on ${this.host}:${this.port + 1000}`);
    });
  }

  handleUDPMessage(msg, rinfo) {
    try {
      const message = JSON.parse(msg.toString());
      
      if (message.type === 'presence' && message.nodeId !== this.nodeId) {
        console.log(`UDP: Peer discovered: ${message.host}:${message.port}`);
        this.addPeer(message.host, message.port, message.nodeId);
      }
    } catch (error) {
      console.error('Error parsing UDP message:', error);
    }
  }

  handleSocketConnection(socket) {
    console.log(`New peer connected: ${socket.id}`);
    
    socket.on('peer_info', (data) => {
      this.addPeer(data.host, data.port, data.nodeId, socket);
    });

    socket.on('new_transaction', (transaction) => {
      console.log('Received new transaction from peer:', transaction);
      this.emit('new_transaction', transaction);
    });

    socket.on('new_block', (block) => {
      console.log('Received new block from peer:', block);
      this.emit('new_block', block);
    });

    socket.on('chain_request', () => {
      this.emit('chain_request', socket);
    });

    socket.on('chain_response', (chain) => {
      console.log('Received chain from peer:', chain.length, 'blocks');
      this.emit('chain_response', chain);
    });

    socket.on('disconnect', () => {
      console.log(`Peer disconnected: ${socket.id}`);
      this.removePeerBySocketId(socket.id);
    });

    // Send our peer info
    socket.emit('peer_info', {
      host: this.host,
      port: this.port,
      nodeId: this.nodeId
    });
  }

  broadcastPresence() {
    const message = JSON.stringify({
      type: 'presence',
      host: this.host,
      port: this.port,
      nodeId: this.nodeId,
      timestamp: Date.now()
    });

    this.udpSocket.send(message, this.multicastPort, this.multicastAddress);
  }

  addPeer(host, port, nodeId, socket = null) {
    const peerKey = `${host}:${port}`;
    
    if (!this.peers.has(peerKey)) {
      const peer = {
        host,
        port,
        nodeId,
        socket,
        lastSeen: Date.now(),
        connected: !!socket
      };
      
      this.peers.set(peerKey, peer);
      console.log(`Peer added: ${peerKey}`);
      
      // Emit peer added event
      this.emit('peer_added', peer);
    } else {
      // Update existing peer
      const peer = this.peers.get(peerKey);
      peer.lastSeen = Date.now();
      peer.connected = !!socket;
      if (socket) peer.socket = socket;
    }
  }

  removePeerBySocketId(socketId) {
    for (const [key, peer] of this.peers.entries()) {
      if (peer.socket && peer.socket.id === socketId) {
        peer.connected = false;
        peer.socket = null;
        console.log(`Peer disconnected: ${key}`);
        break;
      }
    }
  }

  connectToPeer(host, port) {
    return new Promise((resolve, reject) => {
      const socket = this.io.connect(`http://${host}:${port}`);
      
      socket.on('connect', () => {
        console.log(`Connected to peer: ${host}:${port}`);
        this.addPeer(host, port, null, socket);
        resolve(socket);
      });
      
      socket.on('connect_error', (error) => {
        console.error(`Failed to connect to peer ${host}:${port}:`, error);
        reject(error);
      });
    });
  }

  broadcastTransaction(transaction) {
    console.log(`Broadcasting transaction to ${this.peers.size} peers`);
    
    for (const peer of this.peers.values()) {
      if (peer.connected && peer.socket) {
        peer.socket.emit('new_transaction', transaction);
      }
    }
  }

  broadcastBlock(block) {
    console.log(`Broadcasting block to ${this.peers.size} peers`);
    
    for (const peer of this.peers.values()) {
      if (peer.connected && peer.socket) {
        peer.socket.emit('new_block', block);
      }
    }
  }

  requestChainFromPeers() {
    console.log('Requesting chain from peers');
    
    for (const peer of this.peers.values()) {
      if (peer.connected && peer.socket) {
        peer.socket.emit('chain_request');
      }
    }
  }

  getConnectedPeers() {
    return Array.from(this.peers.values()).filter(peer => peer.connected);
  }

  getPeerCount() {
    return this.peers.size;
  }

  async stop() {
    if (this.udpSocket) {
      this.udpSocket.close();
    }
    
    if (this.httpServer) {
      this.httpServer.close();
    }
    
    if (this.io) {
      this.io.close();
    }
    
    console.log('P2P Network stopped');
  }
}
