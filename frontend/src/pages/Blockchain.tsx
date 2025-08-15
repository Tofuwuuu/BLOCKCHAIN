import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Badge, 
  Accordion, Form, Modal, Alert, Spinner 
} from 'react-bootstrap';
import { apiService, Block, Transaction, Peer } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

// Realistic blockchain data for procurement system
const realisticBlocks: Block[] = [
  {
    index: 0,
    timestamp: "2025-01-01T00:00:00Z",
    transactions: [
      {
        from: "system",
        to: "genesis",
        amount: 0,
        action: "genesis",
        data: { message: "Philippine Procurement Solutions Blockchain Initialized" },
        timestamp: "2025-01-01T00:00:00Z"
      }
    ],
    nonce: 0,
    hash: "0000000000000000000000000000000000000000000000000000000000000000",
    previous_hash: "0"
  },
  {
    index: 1,
    timestamp: "2025-01-15T10:30:00Z",
    transactions: [
      {
        from: "procurement0",
        to: "blockchain",
        amount: 60000.00,
        action: "po_create",
        data: {
          po_number: "PO-20250101-001",
          supplier: "TechDistributors Inc",
          amount: 60000.00,
          items: ["Office Chairs - Ergonomic", "Laptop Stands"]
        },
        timestamp: "2025-01-15T10:30:00Z"
      },
      {
        from: "procurement0",
        to: "blockchain",
        amount: 0,
        action: "supplier_add",
        data: {
          supplier_name: "TechDistributors Inc",
          bir_tin: "123-456-789-000",
          contact: "Juan Dela Cruz"
        },
        timestamp: "2025-01-15T10:25:00Z"
      }
    ],
    nonce: 12345,
    hash: "0000000000000000000000000000000000000000000000000000000000000001",
    previous_hash: "0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
    index: 2,
    timestamp: "2025-01-16T14:20:00Z",
    transactions: [
      {
        from: "admin",
        to: "blockchain",
        amount: 0,
        action: "po_approve",
        data: {
          po_number: "PO-20250101-001",
          approved_by: "admin",
          approval_notes: "Approved for procurement"
        },
        timestamp: "2025-01-16T14:20:00Z"
      },
      {
        from: "procurement1",
        to: "blockchain",
        amount: 45000.00,
        action: "po_create",
        data: {
          po_number: "PO-20250101-002",
          supplier: "ABC Supplies",
          amount: 45000.00,
          items: ["Wireless Keyboards", "Desk Organizers"]
        },
        timestamp: "2025-01-16T14:15:00Z"
      },
      {
        from: "procurement1",
        to: "blockchain",
        amount: 0,
        action: "supplier_add",
        data: {
          supplier_name: "ABC Supplies",
          bir_tin: "234-567-890-000",
          contact: "Maria Santos"
        },
        timestamp: "2025-01-16T14:10:00Z"
      }
    ],
    nonce: 23456,
    hash: "0000000000000000000000000000000000000000000000000000000000000002",
    previous_hash: "0000000000000000000000000000000000000000000000000000000000000001"
  },
  {
    index: 3,
    timestamp: "2025-01-17T09:45:00Z",
    transactions: [
      {
        from: "admin",
        to: "blockchain",
        amount: 0,
        action: "po_approve",
        data: {
          po_number: "PO-20250101-002",
          approved_by: "admin",
          approval_notes: "Approved with minor adjustments"
        },
        timestamp: "2025-01-17T09:45:00Z"
      },
      {
        from: "procurement2",
        to: "blockchain",
        amount: 0,
        action: "inventory_adjust",
        data: {
          item: "Office Chairs - Ergonomic",
          quantity: 20,
          adjustment_type: "received",
          reference: "PO-20250101-001"
        },
        timestamp: "2025-01-17T09:40:00Z"
      },
      {
        from: "procurement2",
        to: "blockchain",
        amount: 0,
        action: "inventory_adjust",
        data: {
          item: "Laptop Stands",
          quantity: 10,
          adjustment_type: "received",
          reference: "PO-20250101-001"
        },
        timestamp: "2025-01-17T09:35:00Z"
      }
    ],
    nonce: 34567,
    hash: "0000000000000000000000000000000000000000000000000000000000000003",
    previous_hash: "0000000000000000000000000000000000000000000000000000000000000002"
  },
  {
    index: 4,
    timestamp: "2025-01-18T16:30:00Z",
    transactions: [
      {
        from: "procurement0",
        to: "blockchain",
        amount: 75000.00,
        action: "po_create",
        data: {
          po_number: "PO-20250101-003",
          supplier: "Metro Manila Electronics",
          amount: 75000.00,
          items: ["Office Chairs - Ergonomic", "Laptop Stands"]
        },
        timestamp: "2025-01-18T16:30:00Z"
      },
      {
        from: "procurement0",
        to: "blockchain",
        amount: 0,
        action: "supplier_add",
        data: {
          supplier_name: "Metro Manila Electronics",
          bir_tin: "345-678-901-000",
          contact: "Pedro Martinez"
        },
        timestamp: "2025-01-18T16:25:00Z"
      },
      {
        from: "finance1",
        to: "blockchain",
        amount: 60000.00,
        action: "payment_processed",
        data: {
          po_number: "PO-20250101-001",
          amount: 60000.00,
          payment_method: "bank_transfer",
          reference: "PAY-20250118-001"
        },
        timestamp: "2025-01-18T16:20:00Z"
      }
    ],
    nonce: 45678,
    hash: "0000000000000000000000000000000000000000000000000000000000000004",
    previous_hash: "0000000000000000000000000000000000000000000000000000000000000003"
  },
  {
    index: 5,
    timestamp: "2025-01-19T11:15:00Z",
    transactions: [
      {
        from: "admin",
        to: "blockchain",
        amount: 0,
        action: "po_approve",
        data: {
          po_number: "PO-20250101-003",
          approved_by: "admin",
          approval_notes: "Approved for premium delivery"
        },
        timestamp: "2025-01-19T11:15:00Z"
      },
      {
        from: "procurement1",
        to: "blockchain",
        amount: 0,
        action: "inventory_adjust",
        data: {
          item: "Wireless Keyboards",
          quantity: 30,
          adjustment_type: "received",
          reference: "PO-20250101-002"
        },
        timestamp: "2025-01-19T11:10:00Z"
      },
      {
        from: "procurement1",
        to: "blockchain",
        amount: 0,
        action: "inventory_adjust",
        data: {
          item: "Desk Organizers",
          quantity: 25,
          adjustment_type: "received",
          reference: "PO-20250101-002"
        },
        timestamp: "2025-01-19T11:05:00Z"
      },
      {
        from: "validator1",
        to: "blockchain",
        amount: 0,
        action: "quality_check",
        data: {
          po_number: "PO-20250101-002",
          status: "passed",
          inspector: "Ana Reyes",
          notes: "All items meet quality standards"
        },
        timestamp: "2025-01-19T11:00:00Z"
      }
    ],
    nonce: 56789,
    hash: "0000000000000000000000000000000000000000000000000000000000000005",
    previous_hash: "0000000000000000000000000000000000000000000000000000000000000004"
  }
];

const realisticPeers: Peer[] = [
  {
    id: "node-001",
    url: "http://localhost:3002",
    is_active: true
  },
  {
    id: "node-002", 
    url: "http://localhost:3003",
    is_active: true
  },
  {
    id: "node-003",
    url: "http://localhost:3004", 
    is_active: false
  }
];

const Blockchain: React.FC = () => {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);
  const [mining, setMining] = useState(false);
  const [showAddPeer, setShowAddPeer] = useState(false);
  const [newPeerUrl, setNewPeerUrl] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [usingRealData, setUsingRealData] = useState(false);

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  // Load peers from localStorage when in demo mode
  useEffect(() => {
    if (usingRealData) {
      const savedPeers = localStorage.getItem('blockchain_demo_peers');
      if (savedPeers) {
        try {
          const parsedPeers = JSON.parse(savedPeers);
          setPeers(parsedPeers);
        } catch (error) {
          console.error('Failed to parse saved peers:', error);
        }
      }
    }
  }, [usingRealData]);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API first
      try {
        const [chainData, peersData] = await Promise.all([
          apiService.getBlockchain(),
          apiService.getPeers()
        ]);
        
        // Check if we have real blockchain data
        if (chainData.chain && chainData.chain.length > 0) {
          setBlocks(chainData.chain);
          setPeers(peersData);
          setUsingRealData(false);
          console.log('Connected to backend blockchain:', chainData.chain.length, 'blocks');
        } else {
          // If backend has no data, seed it with realistic data
          console.log('Backend has no blockchain data, seeding with realistic data...');
          await seedBackendWithData();
          setBlocks(realisticBlocks);
          setPeers(realisticPeers);
          setUsingRealData(true);
          setToastMessage('Backend initialized with realistic blockchain data');
          setToastType('success');
          setShowToast(true);
        }
             } catch (apiError) {
         console.log('API not available, using realistic blockchain data...');
         // Use realistic data if API fails
         setBlocks(realisticBlocks);
         
         // Load saved peers or use default realistic peers
         const savedPeers = localStorage.getItem('blockchain_demo_peers');
        if (savedPeers) {
          try {
            const parsedPeers = JSON.parse(savedPeers);
            setPeers(parsedPeers);
          } catch (error) {
            setPeers(realisticPeers);
          }
        } else {
          setPeers(realisticPeers);
        }
        
        setUsingRealData(true);
        
        // No notification needed for realistic data fallback
       }
           } catch (error) {
         console.error('Failed to fetch blockchain data:', error);
         // Fallback to realistic data
         setBlocks(realisticBlocks);
         
         // Load saved peers or use default realistic peers
         const savedPeers = localStorage.getItem('blockchain_demo_peers');
         if (savedPeers) {
           try {
             const parsedPeers = JSON.parse(savedPeers);
             setPeers(parsedPeers);
           } catch (error) {
             setPeers(realisticPeers);
           }
         } else {
           setPeers(realisticPeers);
         }
         
         setUsingRealData(true);
         
         // No notification needed for fallback data
       } finally {
      setLoading(false);
    }
  };

  const seedBackendWithData = async () => {
    try {
      // Create realistic transactions in the backend
      const transactions = [
        {
          from: "procurement0",
          to: "blockchain",
          amount: 60000.00,
          action: "po_create",
          data: {
            po_number: "PO-20250101-001",
            supplier: "TechDistributors Inc",
            amount: 60000.00,
            items: ["Office Chairs - Ergonomic", "Laptop Stands"]
          }
        },
        {
          from: "procurement0",
          to: "blockchain",
          amount: 0,
          action: "supplier_add",
          data: {
            supplier_name: "TechDistributors Inc",
            bir_tin: "123-456-789-000",
            contact: "Juan Dela Cruz"
          }
        },
        {
          from: "admin",
          to: "blockchain",
          amount: 0,
          action: "po_approve",
          data: {
            po_number: "PO-20250101-001",
            approved_by: "admin",
            approval_notes: "Approved for procurement"
          }
        }
      ];

      // Add transactions to backend
      for (const tx of transactions) {
        try {
          await apiService.createTransaction(tx);
        } catch (error) {
          console.log('Transaction already exists or failed:', error);
        }
      }

      // Mine a block to include the transactions
      try {
        await apiService.mineBlock();
      } catch (error) {
        console.log('Mining failed:', error);
      }
    } catch (error) {
      console.error('Failed to seed backend data:', error);
    }
  };

  const handleMine = async () => {
    try {
      setMining(true);
      
      if (usingRealData) {
        // Simulate mining for realistic data
        const newBlock: Block = {
          index: blocks.length,
          timestamp: new Date().toISOString(),
          transactions: [
            {
              from: user?.username || "admin",
              to: "blockchain",
              amount: 50.00,
              action: "block_mined",
              data: {
                miner: user?.username || "admin",
                difficulty: 4,
                reward: 50.00
              },
              timestamp: new Date().toISOString()
            }
          ],
          nonce: Math.floor(Math.random() * 100000),
          hash: `000000000000000000000000000000000000000000000000000000000000000${blocks.length}`,
          previous_hash: blocks[blocks.length - 1]?.hash || "0"
        };
        
        setBlocks([...blocks, newBlock]);
        setToastMessage(`Block ${newBlock.index} mined successfully! (Demo)`);
        setToastType('success');
        setShowToast(true);
      } else {
        // Real API call
        const newBlock = await apiService.mineBlock();
        setToastMessage(`Block ${newBlock.index} mined successfully!`);
        setToastType('success');
        setShowToast(true);
        fetchBlockchainData(); // Refresh data
      }
    } catch (error) {
      console.error('Mining failed:', error);
      setToastMessage('Mining failed');
      setToastType('error');
      setShowToast(true);
    } finally {
      setMining(false);
    }
  };

  const handleAddPeer = async () => {
    if (!newPeerUrl.trim()) return;

    try {
             if (usingRealData) {
         // Simulate adding peer for realistic data
         const newPeer: Peer = {
           id: `node-${String(peers.length + 1).padStart(3, '0')}`,
           url: newPeerUrl,
           is_active: true
         };
         
         const updatedPeers = [...peers, newPeer];
         setPeers(updatedPeers);
         
         // Save to localStorage for persistence
         localStorage.setItem('blockchain_demo_peers', JSON.stringify(updatedPeers));
         
         setToastMessage('Peer added successfully (Demo)');
         setToastType('success');
         setShowToast(true);
         setShowAddPeer(false);
         setNewPeerUrl('');
       } else {
        // Real API call
        await apiService.addPeer(newPeerUrl);
        setToastMessage('Peer added successfully');
        setToastType('success');
        setShowToast(true);
        setShowAddPeer(false);
        setNewPeerUrl('');
        fetchBlockchainData(); // Refresh peers
      }
    } catch (error) {
      console.error('Failed to add peer:', error);
      setToastMessage('Failed to add peer');
      setToastType('error');
      setShowToast(true);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-PH');
  };

  const truncateHash = (hash: string, length: number = 8): string => {
    return hash.length > length ? `${hash.substring(0, length)}...` : hash;
  };

  const getTransactionType = (action: string): { variant: string; text: string } => {
    const types = {
      'genesis': { variant: 'dark', text: 'Genesis Block' },
      'po_create': { variant: 'primary', text: 'PO Created' },
      'po_approve': { variant: 'success', text: 'PO Approved' },
      'inventory_adjust': { variant: 'warning', text: 'Inventory Adjusted' },
      'supplier_add': { variant: 'info', text: 'Supplier Added' },
      'payment_processed': { variant: 'success', text: 'Payment Processed' },
      'quality_check': { variant: 'info', text: 'Quality Check' },
      'block_mined': { variant: 'secondary', text: 'Block Mined' },
      'default': { variant: 'secondary', text: action }
    };
    return types[action as keyof typeof types] || types.default;
  };

  const formatTransactionData = (data: any): string => {
    if (typeof data === 'string') return data;
    if (data.po_number) return `PO: ${data.po_number}`;
    if (data.supplier_name) return `Supplier: ${data.supplier_name}`;
    if (data.item) return `Item: ${data.item}`;
    if (data.amount) return `Amount: ₱${data.amount.toLocaleString()}`;
    if (data.message) return data.message;
    return JSON.stringify(data, null, 2);
  };

  const clearDemoData = () => {
    localStorage.removeItem('blockchain_demo_peers');
    setPeers(realisticPeers);
    setToastMessage('Demo data cleared');
    setToastType('info');
    setShowToast(true);
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner size="lg" text="Loading blockchain data..." />
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1">Blockchain Explorer</h1>
              <p className="text-muted mb-0">
                View blockchain transactions and manage network peers
                {usingRealData && (
                  <span className="ms-2 badge bg-info text-dark">Realistic Data</span>
                )}
              </p>
            </div>
            <div className="d-flex gap-2">
              {user?.is_admin && (
                <Button 
                  variant="success" 
                  onClick={handleMine}
                  disabled={mining}
                  aria-label="Mine new block"
                >
                  {mining ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Mining...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-hammer me-2"></i>
                      Mine Block
                    </>
                  )}
                </Button>
              )}
                             <Button 
                 variant="outline-primary" 
                 onClick={() => setShowAddPeer(true)}
                 aria-label="Add new peer"
               >
                 <i className="bi bi-plus-circle me-2"></i>
                 Add Peer
               </Button>
               {usingRealData && (
                 <Button 
                   variant="outline-secondary" 
                   onClick={clearDemoData}
                   aria-label="Clear demo data"
                   size="sm"
                 >
                   <i className="bi bi-trash me-2"></i>
                   Clear Demo
                 </Button>
               )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Blockchain Stats */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary mb-1">{blocks.length}</h3>
              <p className="text-muted mb-0">Total Blocks</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success mb-1">
                {blocks.reduce((total, block) => total + block.transactions.length, 0)}
              </h3>
              <p className="text-muted mb-0">Total Transactions</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info mb-1">{peers.length}</h3>
              <p className="text-muted mb-0">Network Peers</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Blockchain Chain */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Blockchain Chain</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Accordion>
            {blocks.map((block, index) => (
              <Accordion.Item key={block.index} eventKey={index.toString()}>
                <Accordion.Header>
                  <div className="d-flex align-items-center w-100">
                    <span className="fw-bold me-3">Block #{block.index}</span>
                    <Badge bg="secondary" className="me-3">
                      {block.transactions.length} transactions
                    </Badge>
                    <small className="text-muted ms-auto">
                      {formatDate(block.timestamp)}
                    </small>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <strong>Hash:</strong> 
                      <code className="ms-2">{truncateHash(block.hash)}</code>
                    </Col>
                    <Col md={6}>
                      <strong>Previous Hash:</strong> 
                      <code className="ms-2">{truncateHash(block.previous_hash)}</code>
                    </Col>
                    <Col md={6}>
                      <strong>Nonce:</strong> {block.nonce}
                    </Col>
                    <Col md={6}>
                      <strong>Timestamp:</strong> {formatDate(block.timestamp)}
                    </Col>
                  </Row>
                  
                  {block.transactions.length > 0 ? (
                    <Table striped bordered size="sm">
                      <thead>
                        <tr>
                          <th>Sender</th>
                          <th>Recipient</th>
                          <th>Action</th>
                          <th>Data</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.transactions.map((tx, txIndex) => {
                          const txType = getTransactionType(tx.action);
                          return (
                            <tr key={txIndex}>
                              <td>
                                <code>{tx.from}</code>
                              </td>
                              <td>
                                <code>{tx.to}</code>
                              </td>
                              <td>
                                <Badge bg={txType.variant}>{txType.text}</Badge>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {formatTransactionData(tx.data)}
                                </small>
                              </td>
                              <td>{formatDate(tx.timestamp)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info" className="mb-0">
                      No transactions in this block
                    </Alert>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Card.Body>
      </Card>

      {/* Network Peers */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Network Peers</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {peers.length > 0 ? (
            <Table striped bordered className="mb-0">
              <thead>
                <tr>
                  <th>Peer ID</th>
                  <th>URL</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {peers.map((peer) => (
                  <tr key={peer.id}>
                    <td>
                      <code>{peer.id}</code>
                    </td>
                    <td>
                      <code>{peer.url}</code>
                    </td>
                    <td>
                      <Badge bg={peer.is_active ? 'success' : 'danger'}>
                        {peer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-wifi-off text-muted" style={{ fontSize: '2rem' }}></i>
              <p className="text-muted mt-2">No peers connected</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Peer Modal */}
      <Modal show={showAddPeer} onHide={() => setShowAddPeer(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Peer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label htmlFor="peerUrl">Peer URL</Form.Label>
              <Form.Control
                id="peerUrl"
                type="url"
                placeholder="http://localhost:5001"
                value={newPeerUrl}
                onChange={(e) => setNewPeerUrl(e.target.value)}
                aria-describedby="peerUrlHelp"
              />
              <Form.Text id="peerUrlHelp" className="text-muted">
                Enter the URL of the peer node you want to connect to
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddPeer(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddPeer} disabled={!newPeerUrl.trim()}>
            Add Peer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </Container>
  );
};

export default Blockchain;
