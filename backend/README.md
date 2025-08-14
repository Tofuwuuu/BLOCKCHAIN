# 🚀 Permissioned Blockchain Node

A robust, local permissioned blockchain implementation in Node.js with Proof-of-Work consensus, P2P networking, and smart contract validation.

## ✨ Features

- **🔗 Proof-of-Work Chain**: SHA-256 hashing with configurable difficulty
- **🌐 P2P Networking**: UDP multicast discovery + Socket.IO peer messaging
- **🤝 Consensus**: Longest valid chain rule with automatic synchronization
- **📜 Smart Contracts**: Business rule validation for orders, shipments, payments
- **💾 Persistence**: In-memory chain with optional file-based storage
- **🔌 REST API**: Complete HTTP endpoints for blockchain operations
- **⚡ Real-time**: WebSocket support for live updates

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Blockchain    │    │   Consensus     │    │   P2P Network   │
│                 │    │                 │    │                 │
│ • Blocks        │◄──►│ • Mining        │◄──►│ • Peer Discovery│
│ • Transactions  │    │ • Chain Sync    │    │ • Messaging     │
│ • Validation    │    │ • Validation    │    │ • UDP Multicast │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Contracts     │    │   HTTP API      │    │   Storage       │
│                 │    │                 │    │                 │
│ • Business Rules│    │ • REST Endpoints│    │ • File Persist  │
│ • Validation    │    │ • WebSocket     │    │ • LevelDB (opt) │
│ • Custom Rules  │    │ • CORS Support  │    │ • Chain Export  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd backend

# Install dependencies
npm install

# Start genesis node
npm run start:genesis
```

### Running Multiple Nodes

```bash
# Terminal 1: Start genesis node
npm run start:genesis

# Terminal 2: Start peer node
npm run start:peer

# Terminal 3: Start another peer
node node.js --port 3002 --peer localhost --peer-port 3000
```

## 📖 Usage

### Command Line Options

```bash
node node.js [options]

Options:
  --port <number>      Port to listen on (default: 3000)
  --host <string>      Host to bind to (default: 0.0.0.0)
  --genesis           Start as genesis node
  --peer <host>       Connect to bootstrap peer
  --peer-port <port>  Bootstrap peer port (default: 3001)
  --help              Show help message
```

### Examples

```bash
# Start genesis node on port 3000
node node.js --port 3000 --genesis

# Start peer node on port 3001, connect to localhost:3000
node node.js --port 3001 --peer localhost --peer-port 3000

# Start node on custom host
node node.js --host 192.168.1.100 --port 3000
```

## 🔌 API Endpoints

### Health & Status

```http
GET /health                    # Node health check
GET /status                    # Comprehensive node status
GET /contracts                 # Available smart contracts
```

### Blockchain Operations

```http
GET /chain                     # Get full blockchain
GET /chain/block/:index        # Get specific block
POST /transactions/new         # Create new transaction
GET /mine                      # Mine pending transactions
```

### Peer Management

```http
GET /peers                     # List connected peers
POST /add_peer                 # Add new peer
```

### Mining Control

```http
POST /mining/start             # Start mining
POST /mining/stop              # Stop mining
POST /sync                     # Request chain sync
```

## 📝 Smart Contracts

### Built-in Contract Types

- **Order Management**: `order_created`, `order_approved`
- **Shipment Tracking**: `shipment_created`, `shipment_delivered`
- **Payment Processing**: `payment_processed`
- **Inventory Control**: `inventory_adjusted`
- **Supplier Management**: `supplier_registered`
- **Basic Operations**: `transfer`, `mining_reward`

### Transaction Example

```json
{
  "from": "user123",
  "to": "supplier456",
  "amount": 1000,
  "action": "order_created",
  "data": {
    "order_id": "PO-2024-001",
    "supplier_id": 456,
    "total_amount": 1000,
    "items": [
      {
        "product_id": 1,
        "quantity": 10,
        "unit_price": 100
      }
    ]
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Optional: Set custom API base URL
REACT_APP_API_URL=http://localhost:5000
```

### Network Settings

- **UDP Multicast**: `224.0.0.1:5000`
- **Socket.IO**: Configurable port (default: 3000)
- **Discovery**: HTTP endpoint on port + 1000

## 🧪 Testing

```bash
# Run tests
npm test

# Development mode with auto-restart
npm run dev

# Clean blockchain files
npm run clean
```

## 📊 Monitoring

### Node Status

```bash
curl http://localhost:3000/status
```

Response includes:
- Node information (host, port, nodeId)
- Blockchain stats (chain length, pending transactions)
- Consensus status (mining, sync status)
- Peer information (total, connected)
- Contract registry

### Real-time Updates

The node provides WebSocket events for:
- New transactions
- New blocks
- Peer connections/disconnections
- Chain synchronization

## 🔒 Security Features

- **Transaction Validation**: Smart contract enforcement
- **Chain Integrity**: SHA-256 hash verification
- **Peer Authentication**: Node ID validation
- **Input Sanitization**: Request validation and sanitization

## 🚧 Development

### Project Structure

```
backend/
├── blockchain.js      # Core blockchain implementation
├── p2p.js            # P2P networking layer
├── consensus.js      # Consensus mechanism
├── contracts.js      # Smart contract validation
├── node.js           # Main node application
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

### Adding Custom Contracts

```javascript
import { ContractValidator } from './contracts.js';

const validator = new ContractValidator();

// Add custom business rule
validator.addCustomRule('order_created', 'budget_check', (transaction) => {
  const { data } = transaction;
  return data.total_amount <= 10000; // Max order amount
});
```

### Extending the Node

```javascript
import { BlockchainNode } from './node.js';

class CustomNode extends BlockchainNode {
  constructor(options) {
    super(options);
    // Add custom functionality
  }
  
  // Override methods or add new ones
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Node.js, Express, and Socket.IO
- Inspired by blockchain principles and distributed systems
- Designed for educational and development purposes

## 📞 Support

For questions and support:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

---

**Happy Blockchaining! 🚀**
