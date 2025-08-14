import React from 'react';
import { Card } from 'react-bootstrap';

interface CardStatProps {
  title: string;
  value: number;
  icon: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const CardStat: React.FC<CardStatProps> = ({ 
  title, 
  value, 
  icon, 
  variant = 'primary',
  className = ''
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'text-bg-success';
      case 'warning':
        return 'text-bg-warning';
      case 'danger':
        return 'text-bg-danger';
      case 'info':
        return 'text-bg-info';
      default:
        return 'text-bg-primary';
    }
  };

  return (
    <Card className={`${getVariantClasses()} ${className}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="fs-5 fw-medium">{title}</div>
            <div className="display-6 fw-bold">{value.toLocaleString()}</div>
          </div>
          <div className="opacity-50" style={{ fontSize: '2rem' }}>
            <i className={`bi ${icon}`}></i>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CardStat;
