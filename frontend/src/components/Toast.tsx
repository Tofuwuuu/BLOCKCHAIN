import React, { useState, useEffect } from 'react';
import { Toast as BootstrapToast, ToastContainer } from 'react-bootstrap';

interface ToastProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  delay?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  show, 
  message, 
  type = 'info', 
  onClose, 
  delay = 5000 
}) => {
  const [showToast, setShowToast] = useState(show);

  useEffect(() => {
    setShowToast(show);
  }, [show]);

  const handleClose = () => {
    setShowToast(false);
    onClose();
  };

  const getToastVariant = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'bi-check-circle';
      case 'error':
        return 'bi-exclamation-triangle';
      case 'warning':
        return 'bi-exclamation-circle';
      default:
        return 'bi-info-circle';
    }
  };

  return (
    <ToastContainer position="top-end" className="p-3">
      <BootstrapToast
        show={showToast}
        onClose={handleClose}
        delay={delay}
        autohide
        bg={getToastVariant()}
      >
        <BootstrapToast.Header>
          <i className={`bi ${getIcon()} me-2`}></i>
          <strong className="me-auto">
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </strong>
        </BootstrapToast.Header>
        <BootstrapToast.Body className={type === 'error' ? 'text-white' : ''}>
          {message}
        </BootstrapToast.Body>
      </BootstrapToast>
    </ToastContainer>
  );
};

export default Toast;
