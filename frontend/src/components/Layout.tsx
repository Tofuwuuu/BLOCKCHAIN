import React from 'react';
import { Navbar, Nav, Container, Dropdown, Badge } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <header role="banner">
        <Navbar 
          bg="primary" 
          variant="dark" 
          expand="lg" 
          className="ph-header"
          aria-label="Main navigation"
        >
          <Container>
            <Navbar.Brand as={Link} to="/dashboard" className="d-flex align-items-center">
              <i className="bi bi-shield-check me-2"></i>
              <span>Philippine Procurement Solutions</span>
            </Navbar.Brand>
            
            <Navbar.Toggle aria-controls="main-nav" />
            
            <Navbar.Collapse id="main-nav">
              <Nav className="me-auto" role="navigation" aria-label="Primary navigation">
                {/* Dashboard - Available to all authenticated users */}
                <Nav.Link 
                  as={Link} 
                  to="/dashboard" 
                  active={isActive('/dashboard')}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-grid-1x2 me-2"></i>
                  Dashboard
                </Nav.Link>
                
                {/* Procurement-specific navigation - Only for procurement users */}
                {(user?.role === 'procurement' || user?.role === 'procurement0') && !user?.is_admin && (
                  <>
                    <Nav.Link 
                      as={Link} 
                      to="/item-proposal" 
                      active={isActive('/item-proposal')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Item Proposal
                    </Nav.Link>
                    
                    <Nav.Link 
                      as={Link} 
                      to="/pending-items" 
                      active={isActive('/pending-items')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-clock me-2"></i>
                      Pending Items
                    </Nav.Link>
                    
                    <Nav.Link 
                      as={Link} 
                      to="/purchase-requests" 
                      active={isActive('/purchase-requests')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-file-earmark-text me-2"></i>
                      Purchase Requests
                    </Nav.Link>
                    
                    <Nav.Link 
                      as={Link} 
                      to="/blockchain" 
                      active={isActive('/blockchain')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-link-45deg me-2"></i>
                      Blockchain Transactions
                    </Nav.Link>
                    
                    <Nav.Link 
                      as={Link} 
                      to="/suppliers" 
                      active={isActive('/suppliers')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-building me-2"></i>
                      Supplier List
                    </Nav.Link>
                  </>
                )}
                
                {/* ADMIN-ONLY Navigation Items */}
                {user?.is_admin && (
                  <>
                    {/* User Management - Admin Only */}
                    <Nav.Link 
                      as={Link} 
                      to="/users" 
                      active={isActive('/users')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-people me-2"></i>
                      User Management
                    </Nav.Link>
                    
                    {/* Item Management - Admin Only */}
                    <Nav.Link 
                      as={Link} 
                      to="/item-management" 
                      active={isActive('/item-management')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-box-seam me-2"></i>
                      Item Management
                    </Nav.Link>
                    
                    {/* Purchase Orders - Admin Only */}
                    <Nav.Link 
                      as={Link} 
                      to="/orders" 
                      active={isActive('/orders')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-cart me-2"></i>
                      Purchase Orders
                    </Nav.Link>
                    
                    {/* Suppliers - Admin Only */}
                    <Nav.Link 
                      as={Link} 
                      to="/suppliers" 
                      active={isActive('/suppliers')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-building me-2"></i>
                      Suppliers
                    </Nav.Link>
                    
                    {/* Inventory - Admin Only */}
                    <Nav.Link 
                      as={Link} 
                      to="/inventory" 
                      active={isActive('/inventory')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-box-seam me-2"></i>
                      Inventory
                    </Nav.Link>
                    
                    {/* Blockchain - Admin Only */}
                    <Nav.Link 
                      as={Link} 
                      to="/blockchain" 
                      active={isActive('/blockchain')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-link-45deg me-2"></i>
                      Blockchain
                    </Nav.Link>
                    
                    {/* Audit Logs - Admin Only */}
                    <Nav.Link 
                      as={Link} 
                      to="/audit-logs" 
                      active={isActive('/audit-logs')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-clock-history me-2"></i>
                      Audit Logs
                    </Nav.Link>
                  </>
                )}
                
                {/* Validator role - blockchain consensus operations */}
                {user?.role === 'validator' && !user?.is_admin && (
                  <Nav.Link 
                    as={Link} 
                    to="/blockchain" 
                    active={isActive('/blockchain')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-link-45deg me-2"></i>
                    Blockchain Consensus
                  </Nav.Link>
                )}
                
                {/* Auditor role - read-only access to reports and blockchain */}
                {user?.role === 'auditor' && !user?.is_admin && (
                  <>
                    <Nav.Link 
                      as={Link} 
                      to="/blockchain" 
                      active={isActive('/blockchain')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-link-45deg me-2"></i>
                      Blockchain Explorer
                    </Nav.Link>
                  </>
                )}
                
                {/* Finance role - financial operations and reports */}
                {user?.role === 'finance' && !user?.is_admin && (
                  <>
                    <Nav.Link 
                      as={Link} 
                      to="/orders" 
                      active={isActive('/orders')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-cart me-2"></i>
                      Purchase Orders
                    </Nav.Link>
                    
                    <Nav.Link 
                      as={Link} 
                      to="/blockchain" 
                      active={isActive('/blockchain')}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-link-45deg me-2"></i>
                      Financial Records
                    </Nav.Link>
                  </>
                )}
                
                {/* Reports dropdown - Admin gets full access, others get role-based access */}
                <Dropdown as={Nav.Item} className="d-flex align-items-center">
                  <Dropdown.Toggle 
                    as={Nav.Link} 
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-file-text me-2"></i>
                    Reports
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {/* Admin role - ALL REPORTS ACCESS */}
                    {user?.is_admin && (
                      <>
                        <Dropdown.Item as={Link} to="/reports/financial">
                          <i className="bi bi-cash-stack me-2"></i>
                          Financial Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/procurement">
                          <i className="bi bi-cart me-2"></i>
                          Procurement Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/blockchain">
                          <i className="bi bi-link-45deg me-2"></i>
                          Blockchain Transaction Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/audit">
                          <i className="bi bi-clock-history me-2"></i>
                          Audit Trail
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/bir">
                          <i className="bi bi-file-earmark-text me-2"></i>
                          BIR Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/inventory">
                          <i className="bi bi-box-seam me-2"></i>
                          Inventory Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/orders">
                          <i className="bi bi-cart me-2"></i>
                          Order Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/suppliers">
                          <i className="bi bi-building me-2"></i>
                          Supplier Reports
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item as={Link} to="/reports/system">
                          <i className="bi bi-gear me-2"></i>
                          System Reports
                        </Dropdown.Item>
                      </>
                    )}
                    
                    {/* Procurement role - procurement-focused reports (non-admin) */}
                    {(user?.role === 'procurement' || user?.role === 'procurement0') && !user?.is_admin && (
                      <>
                        <Dropdown.Item as={Link} to="/reports/item-proposals">
                          <i className="bi bi-plus-circle me-2"></i>
                          Item Proposal Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/pending-items">
                          <i className="bi bi-clock me-2"></i>
                          Pending Items Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/purchase-requests">
                          <i className="bi bi-file-earmark-text me-2"></i>
                          Purchase Request Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/suppliers">
                          <i className="bi bi-building me-2"></i>
                          Supplier Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/blockchain">
                          <i className="bi bi-link-45deg me-2"></i>
                          Blockchain Transaction Reports
                        </Dropdown.Item>
                      </>
                    )}
                    
                    {/* Finance role - financial reports (non-admin) */}
                    {user?.role === 'finance' && !user?.is_admin && (
                      <>
                        <Dropdown.Item as={Link} to="/reports/bir">
                          <i className="bi bi-file-earmark-text me-2"></i>
                          BIR Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/financial">
                          <i className="bi bi-cash-stack me-2"></i>
                          Financial Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/orders">
                          <i className="bi bi-cart me-2"></i>
                          Order Reports
                        </Dropdown.Item>
                      </>
                    )}
                    
                    {/* Auditor role - audit and compliance reports (non-admin) */}
                    {user?.role === 'auditor' && !user?.is_admin && (
                      <>
                        <Dropdown.Item as={Link} to="/reports/audit">
                          <i className="bi bi-clock-history me-2"></i>
                          Audit Trail
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/compliance">
                          <i className="bi bi-shield-check me-2"></i>
                          Compliance Reports
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/reports/blockchain">
                          <i className="bi bi-link-45deg me-2"></i>
                          Blockchain Reports
                        </Dropdown.Item>
                      </>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
              
              <Nav className="ms-auto" role="navigation" aria-label="User navigation">
                <Dropdown as={Nav.Item} className="d-flex align-items-center">
                  <Dropdown.Toggle 
                    as={Nav.Link} 
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    <span>{user?.username || 'User'}</span>
                    {user?.is_admin && (
                      <Badge bg="warning" className="ms-2">Admin</Badge>
                    )}
                    {(user?.role === 'procurement' || user?.role === 'procurement0') && !user?.is_admin && (
                      <Badge bg="primary" className="ms-2">Procurement</Badge>
                    )}
                    {user?.role === 'validator' && !user?.is_admin && (
                      <Badge bg="warning" className="ms-2">Validator</Badge>
                    )}
                    {user?.role === 'auditor' && !user?.is_admin && (
                      <Badge bg="secondary" className="ms-2">Auditor</Badge>
                    )}
                    {user?.role === 'finance' && !user?.is_admin && (
                      <Badge bg="success" className="ms-2">Finance</Badge>
                    )}
                    {user?.role === 'supplier' && !user?.is_admin && (
                      <Badge bg="info" className="ms-2">Supplier</Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/profile">
                      <i className="bi bi-person me-2"></i>
                      Profile
                    </Dropdown.Item>
                    
                    {/* Settings - Admin Only */}
                    {user?.is_admin && (
                      <Dropdown.Item as={Link} to="/settings">
                        <i className="bi bi-gear me-2"></i>
                        System Settings
                      </Dropdown.Item>
                    )}
                    
                    {/* Procurement Settings - Procurement users only (non-admin) */}
                    {(user?.role === 'procurement' || user?.role === 'procurement0') && !user?.is_admin && (
                      <Dropdown.Item as={Link} to="/procurement-settings">
                        <i className="bi bi-gear me-2"></i>
                        Procurement Settings
                      </Dropdown.Item>
                    )}
                    
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>

      {/* Main Content */}
      <main role="main" className="flex-grow-1">
        {children}
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="bg-light py-4 mt-auto">
        <Container>
          <div className="row">
            <div className="col-md-4">
              <h5>Philippine Procurement Solutions</h5>
              <p className="mb-0">123 Ayala Avenue, Makati City, Philippines</p>
              <p className="mb-0">BIR TIN: 123-456-789-000</p>
            </div>
            <div className="col-md-4">
              <h5>Legal Compliance</h5>
              <ul className="list-unstyled">
                <li><a href="#" className="text-decoration-none">Philippine Procurement Law</a></li>
                <li><a href="#" className="text-decoration-none">BIR Regulations</a></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5>Contact Us</h5>
              <p className="mb-0">Email: procurement@example.com</p>
              <p className="mb-0">Phone: +63 2 1234 5678</p>
            </div>
          </div>
          <hr />
          <p className="text-center mb-0">
            &copy; {new Date().getFullYear()} Philippine Procurement Solutions. All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  );
};

export default Layout;
