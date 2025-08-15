import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { apiService, DashboardStats, RecentOrder } from '../services/api';
import { mockDashboardStats } from '../services/mockData';
import CardStat from '../components/CardStat';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try /api/stats first, fallback to /chain, then mock data
      let data: DashboardStats;
      try {
        data = await apiService.getDashboardStats();
      } catch (statsError) {
        console.log('Stats endpoint not available, trying chain endpoint...');
        try {
          data = await apiService.getChain();
        } catch (chainError) {
          console.log('Chain endpoint not available, using mock data...');
          data = mockDashboardStats;
        }
      }
      
      setStats(data);
    } catch (err) {
      console.log('All API endpoints failed, using mock data...');
      setStats(mockDashboardStats);
      // No toast notification needed
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Draft': { variant: 'secondary', text: 'Draft' },
      'Pending': { variant: 'warning', text: 'Pending' },
      'Approved': { variant: 'success', text: 'Approved' },
      'Completed': { variant: 'primary', text: 'Completed' },
      'Cancelled': { variant: 'danger', text: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: 'secondary', 
      text: status 
    };

    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleToastClose = () => {
    setShowToast(false);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <LoadingSpinner size="lg" text="Loading dashboard data..." />
      </Container>
    );
  }

  if (error && !stats) {
    return (
      <Container className="py-4">
        <Card className="text-center">
          <Card.Body>
            <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3">Error Loading Dashboard</h4>
            <p className="text-muted">{error}</p>
            <Button variant="primary" onClick={handleRefresh}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Try Again
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Dashboard</h2>
              <p className="text-muted mb-0">
                Welcome back, {user?.role === 'procurement' || user?.role === 'procurement0' ? 'procurement' : user?.full_name || 'User'}!
              </p>
            </div>
            <Button variant="outline-primary" onClick={handleRefresh}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <CardStat
            title="Pending Orders"
            value={stats?.pending_orders || 0}
            icon="bi-hourglass-split"
            variant="warning"
          />
        </Col>
        <Col md={4}>
          <CardStat
            title="Approved Orders"
            value={stats?.approved_orders || 0}
            icon="bi-check-circle"
            variant="success"
          />
        </Col>
        <Col md={4}>
          <CardStat
            title="Low Inventory"
            value={stats?.low_inventory || 0}
            icon="bi-exclamation-triangle"
            variant="danger"
          />
        </Col>
      </Row>

      {/* Recent Orders Table */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Purchase Orders</h5>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => navigate('/orders')}
          >
            <i className="bi bi-plus me-2"></i>
            New Order
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="table-striped mb-0">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Date Created</th>
                  <th>Status</th>
                  <th>Total Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                  stats.recent_orders.map((order: RecentOrder) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.po_number}</strong>
                      </td>
                      <td>{order.supplier.name}</td>
                      <td>{formatDate(order.date_created)}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>
                        <strong>{formatCurrency(order.total_amount)}</strong>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      <i className="bi bi-inbox" style={{ fontSize: '2rem' }}></i>
                      <div className="mt-2">No recent orders found</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={handleToastClose}
      />
    </Container>
  );
};

export default Dashboard;
