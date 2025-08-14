import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import { apiService } from '../services/api';

// Mock the API service
jest.mock('../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Mock the toast component
jest.mock('../components/Toast', () => {
  return function MockToast({ show, message, onClose }: any) {
    if (!show) return null;
    return (
      <div data-testid="toast" onClick={onClose}>
        {message}
      </div>
    );
  };
});

// Mock the loading spinner component
jest.mock('../components/LoadingSpinner', () => {
  return function MockLoadingSpinner({ text }: any) {
    return <div data-testid="loading-spinner">{text}</div>;
  };
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDashboardStats = {
    pending_orders: 5,
    approved_orders: 12,
    low_inventory: 3,
    recent_orders: [
      {
        id: 1,
        po_number: 'PO-20250101-001',
        supplier: { name: 'TechDistributors Inc' },
        date_created: '2025-01-01T10:30:00Z',
        status: 'Draft',
        total_amount: 60000.00
      },
      {
        id: 2,
        po_number: 'PO-20250101-002',
        supplier: { name: 'ABC Supplies' },
        date_created: '2025-01-02T14:15:00Z',
        status: 'Pending',
        total_amount: 45000.00
      }
    ]
  };

  describe('Loading State', () => {
    it('should show loading spinner when fetching data', async () => {
      mockedApiService.getDashboardStats.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<Dashboard />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should display dashboard statistics correctly', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Pending orders
        expect(screen.getByText('12')).toBeInTheDocument(); // Approved orders
        expect(screen.getByText('3')).toBeInTheDocument(); // Low inventory
      });
    });

    it('should display recent orders table', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Purchase Orders')).toBeInTheDocument();
        expect(screen.getByText('PO-20250101-001')).toBeInTheDocument();
        expect(screen.getByText('TechDistributors Inc')).toBeInTheDocument();
        expect(screen.getByText('ABC Supplies')).toBeInTheDocument();
      });
    });

    it('should format currency correctly', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('₱60,000.00')).toBeInTheDocument();
        expect(screen.getByText('₱45,000.00')).toBeInTheDocument();
      });
    });

    it('should format dates correctly', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
        expect(screen.getByText('Jan 2, 2025')).toBeInTheDocument();
      });
    });

    it('should display correct status badges', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', async () => {
      mockedApiService.getDashboardStats.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    it('should show try again button when error occurs', async () => {
      mockedApiService.getDashboardStats.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const tryAgainButton = screen.getByText('Try Again');
        expect(tryAgainButton).toBeInTheDocument();
      });
    });

    it('should retry API call when try again button is clicked', async () => {
      mockedApiService.getDashboardStats
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when refresh button is clicked', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(mockedApiService.getDashboardStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('Empty State', () => {
    it('should handle empty recent orders', async () => {
      const emptyStats = {
        ...mockDashboardStats,
        recent_orders: []
      };
      mockedApiService.getDashboardStats.mockResolvedValue(emptyStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('No recent orders found')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should have proper heading structure', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      });
    });
  });

  describe('User Context', () => {
    it('should display user name in welcome message', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Juan Dela Cruz!/)).toBeInTheDocument();
      });
    });
  });

  describe('Toast Notifications', () => {
    it('should show toast when using demo data', async () => {
      mockedApiService.getDashboardStats.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('toast')).toBeInTheDocument();
        expect(screen.getByText('Using demo data - backend not available')).toBeInTheDocument();
      });
    });

    it('should close toast when clicked', async () => {
      mockedApiService.getDashboardStats.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const toast = screen.getByTestId('toast');
        fireEvent.click(toast);
        expect(toast).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on different screen sizes', async () => {
      mockedApiService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const container = screen.getByText('Dashboard').closest('.container');
        expect(container).toHaveClass('py-4');
      });
    });
  });
});

// Additional test suggestions for other components:

/*
## Test Suggestions for Other Components:

### 1. CardStat Component Tests:
- Test different variants (primary, success, warning, danger)
- Test icon display
- Test number formatting
- Test hover effects
- Test accessibility attributes

### 2. LoadingSpinner Component Tests:
- Test different sizes (sm, md, lg)
- Test text display
- Test accessibility attributes

### 3. Toast Component Tests:
- Test different types (success, error, warning, info)
- Test auto-dismiss functionality
- Test manual close functionality
- Test accessibility attributes

### 4. Layout Component Tests:
- Test navigation menu items
- Test role-based access control
- Test responsive navigation
- Test user dropdown functionality
- Test logout functionality

### 5. Blockchain Component Tests:
- Test blockchain data display
- Test mining functionality (admin only)
- Test peer management
- Test transaction display
- Test error handling

### 6. Suppliers Component Tests:
- Test CRUD operations
- Test form validation
- Test search functionality
- Test role-based access control
- Test error handling

### 7. Orders Component Tests:
- Test order creation
- Test order approval
- Test form validation
- Test item management
- Test role-based access control

### 8. Inventory Component Tests:
- Test inventory display
- Test stock adjustments
- Test low stock warnings
- Test search functionality
- Test print functionality

### 9. Login Component Tests:
- Test form validation
- Test authentication flow
- Test error handling
- Test accessibility
- Test responsive design

### 10. API Service Tests:
- Test all API endpoints
- Test error handling
- Test authentication headers
- Test response formatting
- Test timeout handling

### 11. AuthContext Tests:
- Test login/logout functionality
- Test token management
- Test user state management
- Test authentication checks
- Test error handling

### 12. Integration Tests:
- Test complete user workflows
- Test data flow between components
- Test state management
- Test error recovery
- Test performance under load
*/
