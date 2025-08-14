import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginErrors {
  username?: string;
  password?: string;
  general?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  // Clear errors when form data changes
  useEffect(() => {
    if (errors.username && formData.username) {
      setErrors(prev => ({ ...prev, username: undefined }));
    }
    if (errors.password && formData.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  }, [formData, errors]);

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Call the login function from AuthContext
      await login(formData.username.trim(), formData.password);
      
      // If remember me is checked, we could implement additional logic here
      if (rememberMe) {
        // Could set a longer token expiration or additional storage
        console.log('Remember me enabled');
      }

      // Navigation will be handled by the useEffect above
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        setErrors({ general: 'Invalid username or password. Please check your credentials.' });
      } else if (error.response?.status === 400) {
        setErrors({ general: error.response.data?.error || 'Invalid request. Please check your input.' });
      } else if (error.response?.status >= 500) {
        setErrors({ general: 'Server error. Please try again later.' });
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setErrors({ general: 'Network error. Please check your connection and try again.' });
      } else {
        setErrors({ general: 'Login failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <Container className="login-container">
        <Row className="justify-content-center align-items-center">
          <Col xs={12} sm={8} md={6} lg={5} xl={4}>
            <div className="text-center">
              <LoadingSpinner size="lg" text="Checking authentication..." />
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="login-container">
      <Row className="justify-content-center align-items-center">
        <Col xs={12} sm={8} md={6} lg={5} xl={4}>
          <div className="ph-login-wrapper">
            <Card className="ph-login-card shadow-lg">
              {/* Philippine Flag Strip */}
              <div className="ph-flag-strip">
                <div className="ph-flag-blue"></div>
                <div className="ph-flag-red"></div>
                <div className="ph-flag-yellow"></div>
              </div>
              
              <Card.Body className="p-4 p-md-5">
                {/* Logo and Branding */}
                <div className="text-center mb-4">
                  <div className="ph-logo-container mb-3">
                    <i className="bi bi-shield-check ph-logo-icon" aria-hidden="true"></i>
                  </div>
                  <h1 className="company-title mb-2">Philippine Procurement Solutions</h1>
                  <p className="text-muted mb-0 ph-subtitle">
                    Philippine-Compliant Procurement Management
                  </p>
                </div>

                <h2 className="card-title text-center mb-4 fw-bold">Login to Your Account</h2>

                {/* Error Alert */}
                {errors.general && (
                  <Alert 
                    variant="danger" 
                    dismissible 
                    onClose={() => setErrors(prev => ({ ...prev, general: undefined }))} 
                    className="ph-alert"
                    role="alert"
                  >
                    <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
                    {errors.general}
                  </Alert>
                )}

                {/* Login Form */}
                <Form onSubmit={handleSubmit} className="ph-form" noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="username" className="ph-form-label">
                      <i className="bi bi-person-fill me-2" aria-hidden="true"></i>
                      Username
                    </Form.Label>
                    <Form.Control
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.username}
                      aria-describedby={errors.username ? "usernameError" : undefined}
                      disabled={loading}
                      autoComplete="username"
                      className="ph-form-control"
                      aria-required="true"
                    />
                    <Form.Control.Feedback type="invalid" id="usernameError">
                      <i className="bi bi-exclamation-circle me-1" aria-hidden="true"></i>
                      {errors.username}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="password" className="ph-form-label">
                      <i className="bi bi-lock-fill me-2" aria-hidden="true"></i>
                      Password
                    </Form.Label>
                    <InputGroup className="ph-input-group">
                      <Form.Control
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        onKeyPress={handleKeyPress}
                        isInvalid={!!errors.password}
                        aria-describedby={errors.password ? "passwordError" : undefined}
                        disabled={loading}
                        autoComplete="current-password"
                        className="ph-form-control"
                        aria-required="true"
                      />
                      <Button
                        type="button"
                        variant="outline-secondary"
                        className="ph-password-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        disabled={loading}
                        tabIndex={-1}
                      >
                        <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true"></i>
                      </Button>
                    </InputGroup>
                    <Form.Control.Feedback type="invalid" id="passwordError">
                      <i className="bi bi-exclamation-circle me-1" aria-hidden="true"></i>
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Remember Me and Forgot Password */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                      type="checkbox"
                      id="remember"
                      label="Remember me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                      className="ph-checkbox"
                    />
                    <Button 
                      variant="link" 
                      className="p-0 text-decoration-none ph-link" 
                      disabled={loading}
                      onClick={() => {
                        // TODO: Implement forgot password functionality
                        alert('Forgot password functionality will be implemented soon.');
                      }}
                    >
                      Forgot password?
                    </Button>
                  </div>

                  {/* Submit Button */}
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
                          <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
                          Sign in
                        </>
                      )}
                    </Button>
                  </div>
                </Form>

                {/* Demo Credentials Info */}
                <div className="text-center mt-4">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                    Demo credentials: <code>admin</code> / <code>admin</code>
                  </small>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Footer Information */}
          <div className="text-center mt-4 ph-footer-info">
            <div className="mb-2">
              <i className="bi bi-geo-alt-fill me-2" aria-hidden="true"></i>
              <span>123 Ayala Avenue, Makati City, Philippines</span>
            </div>
            <div>
              <i className="bi bi-card-text me-2" aria-hidden="true"></i>
              <span>BIR TIN: 123-456-789-000</span>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
