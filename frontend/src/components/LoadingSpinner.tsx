import React from 'react';
import { Spinner } from 'react-bootstrap';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  text = 'Loading...'
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'lg':
        return undefined; // Default size
      default:
        return undefined;
    }
  };

  return (
    <div className={`d-flex justify-content-center align-items-center ${className}`}>
      <div className="text-center">
        <Spinner 
          animation="border" 
          size={getSpinnerSize()}
          className="mb-2"
        />
        {text && <div className="text-muted">{text}</div>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
