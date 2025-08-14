import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Badge, 
  Accordion, Form, Modal, Alert, Spinner 
} from 'react-bootstrap';
import { apiService, Block, Transaction, Peer } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

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

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      const [chainData, peersData] = await Promise.all([
        apiService.getBlockchain(),
        apiService.getPeers()
      ]);
      setBlocks(chainData.chain);
      setPeers(peersData);
    } catch (error) {
      console.error('Failed to fetch blockchain data:', error);
      setToastMessage('Failed to load blockchain data');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMine = async () => {
    try {
      setMining(true);
      const newBlock = await apiService.mineBlock();
      setToastMessage(`Block ${newBlock.index} mined successfully!`);
      setToastType('success');
      setShowToast(true);
      fetchBlockchainData(); // Refresh data
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
      await apiService.addPeer(newPeerUrl);
      setToastMessage('Peer added successfully');
      setToastType('success');
      setShowToast(true);
      setShowAddPeer(false);
      setNewPeerUrl('');
      fetchBlockchainData(); // Refresh peers
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
      'po_create': { variant: 'primary', text: 'PO Created' },
      'po_approve': { variant: 'success', text: 'PO Approved' },
      'inventory_adjust': { variant: 'warning', text: 'Inventory Adjusted' },
      'supplier_add': { variant: 'info', text: 'Supplier Added' },
      'default': { variant: 'secondary', text: action }
    };
    return types[action as keyof typeof types] || types.default;
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
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.transactions.map((tx, txIndex) => {
                          const txType = getTransactionType(tx.action);
                          return (
                            <tr key={txIndex}>
                              <td>{tx.sender}</td>
                              <td>{tx.recipient}</td>
                              <td>
                                <Badge bg={txType.variant}>{txType.text}</Badge>
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
                    <td>{peer.id}</td>
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
