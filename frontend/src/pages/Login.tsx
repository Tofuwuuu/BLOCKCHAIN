import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="login-container">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={8} lg={7} xl={6}>
          <Card className="ph-login-card shadow-lg">
            {/* Enhanced Philippine Flag Strip */}
            <div className="ph-flag-strip">
              <div className="ph-flag-blue"></div>
              <div className="ph-flag-red"></div>
              <div className="ph-flag-yellow"></div>
            </div>
            
            <Card.Body className="p-4 p-md-5">
              {/* Enhanced Logo Area */}
              <div className="text-center mb-4">
                <div className="ph-logo-container mb-3">
                  <i className="bi bi-shield-check ph-logo-icon"></i>
                </div>
                <h4 className="company-title mb-2">Philippine Procurement Solutions</h4>
                <p className="text-muted mb-0 ph-subtitle">
                  Philippine-Compliant Procurement Management
                </p>
              </div>

              <h5 className="card-title text-center mb-4 fw-bold">Login to Your Account</h5>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="ph-alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} className="ph-form">
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="username" className="ph-form-label">
                    <i className="bi bi-person-fill me-2"></i>Username
                  </Form.Label>
                  <Form.Control
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    isInvalid={!!errors.username}
                    aria-describedby="usernameError"
                    disabled={loading}
                    className="ph-form-control"
                  />
                  <Form.Control.Feedback type="invalid" id="usernameError">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label htmlFor="password" className="ph-form-label">
                    <i className="bi bi-lock-fill me-2"></i>Password
                  </Form.Label>
                  <Form.Control
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    isInvalid={!!errors.password}
                    aria-describedby="passwordError"
                    disabled={loading}
                    className="ph-form-control"
                  />
                  <Form.Control.Feedback type="invalid" id="passwordError">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    type="submit" 
                    className="ph-btn-primary" 
                    disabled={loading}
                    aria-label="Sign in to account"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign in
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Enhanced Footer Info */}
          <div className="text-center mt-4 ph-footer-info">
            <div className="mb-2">
              <i className="bi bi-geo-alt-fill me-2"></i>
              <span>123 Ayala Avenue, Makati City, Philippines</span>
            </div>
            <div>
              <i className="bi bi-card-text me-2"></i>
              <span>BIR TIN: 123-456-789-000</span>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
