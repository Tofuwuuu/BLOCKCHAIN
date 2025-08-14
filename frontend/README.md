# Philippine Procurement Management System - React Frontend

A modern, accessible React TypeScript SPA for Philippine procurement management with blockchain integration, built with Bootstrap 5 and comprehensive form validation.

## 🚀 Features

### Core Functionality
- **📊 Dashboard**: Real-time statistics and recent orders overview
- **🔗 Blockchain Integration**: View chain, mine blocks, manage peers
- **🏢 Supplier Management**: Complete CRUD operations with Philippine compliance
- **📋 Purchase Orders**: Create, approve, and track procurement orders
- **📦 Inventory Management**: Stock tracking and adjustments
- **🔐 Authentication**: Role-based access control with JWT tokens

### Technical Features
- **⚡ TypeScript**: Full type safety and better development experience
- **🎨 Bootstrap 5**: Modern, responsive UI with Philippine theme
- **♿ Accessibility**: WCAG compliant with proper ARIA attributes
- **📱 Responsive Design**: Mobile-first approach
- **🔍 Form Validation**: Inline validation with server error handling
- **🔄 Real-time Updates**: Live data with fallback to mock data
- **🧪 Testing Ready**: Jest + React Testing Library setup

## 🛠️ Technology Stack

- **React 18.2.0** - UI Framework
- **TypeScript 4.9.0** - Type Safety
- **Bootstrap 5.3.0** - UI Components
- **Axios 1.6.0** - HTTP Client
- **React Router DOM 6.20.0** - Routing
- **Bootstrap Icons 1.11.0** - Icon Library

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://localhost:3000` (optional)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
```

### 3. Start Development Server

```bash
# Start the development server
npm start
```

The application will open at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CardStat.tsx    # Statistics cards
│   ├── LoadingSpinner.tsx
│   ├── Toast.tsx       # Notifications
│   └── Layout.tsx      # Main layout with navigation
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Blockchain.tsx  # Blockchain explorer
│   ├── Suppliers.tsx   # Supplier management
│   ├── Orders.tsx      # Purchase orders
│   ├── Inventory.tsx   # Inventory management
│   └── Login.tsx       # Authentication
├── services/           # API and data services
│   ├── api.ts         # Axios configuration
│   └── mockData.ts    # Mock data for testing
├── tests/              # Unit tests
│   └── Dashboard.test.tsx
├── App.tsx            # Main app component
├── App.css            # Global styles
└── index.tsx          # Entry point
```

## 🔧 Available Scripts

```bash
# Development
npm start              # Start development server
npm run build          # Build for production
npm run test           # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
npm run eject          # Eject from Create React App

# Linting
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors
```

## 🔌 API Integration

The app integrates with the following backend endpoints:

### Blockchain Endpoints
- `GET /chain` - Get blockchain data
- `GET /chain/block/<index>` - Get specific block
- `POST /transactions/new` - Create new transaction
- `GET /mine` - Mine new block
- `GET /peers` - Get network peers
- `POST /add_peer` - Add new peer

### Procurement Endpoints
- `GET /api/stats` - Dashboard statistics
- `GET /api/suppliers` - Supplier CRUD
- `GET /api/orders` - Purchase order CRUD
- `GET /api/inventory` - Inventory management
- `GET /api/products` - Product management

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

## 🎨 Philippine Theme

The application features a custom Philippine theme with:

- **Colors**: Philippine flag colors (blue, red, yellow)
- **Typography**: Noto Sans font family
- **Icons**: Bootstrap Icons with Philippine context
- **Compliance**: BIR TIN display and Philippine address formats

## ♿ Accessibility Features

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Clear focus indicators
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user motion preferences
- **Semantic HTML**: Proper heading structure and landmarks

## 🔐 Role-Based Access Control

### Admin Features
- Delete suppliers and orders
- Mine blockchain blocks
- Access admin-only reports
- Full CRUD operations

### Regular User Features
- View and create orders
- View inventory
- View blockchain data
- Limited CRUD operations

## 📱 Responsive Design

The application is fully responsive with:

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Responsive layouts for tablets
- **Desktop Enhancement**: Enhanced features for larger screens
- **Touch Friendly**: Optimized for touch interactions

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Component-level testing
- **Integration Tests**: API integration testing
- **Accessibility Tests**: ARIA and keyboard navigation
- **Responsive Tests**: Mobile and desktop layouts

## 🚀 Deployment

### Production Build

```bash
# Create production build
npm run build

# The build folder contains optimized files
```

### Environment Variables

```env
# Production
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_ENVIRONMENT=production

# Development
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
```

## 🔧 Development Guidelines

### Code Style

- Use TypeScript for all components
- Follow React functional component patterns
- Use Bootstrap classes for styling
- Implement proper error handling
- Add accessibility attributes

### Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

interface ComponentProps {
  // Define props interface
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // State management
  const [state, setState] = useState();

  // Effects
  useEffect(() => {
    // Side effects
  }, []);

  // Event handlers
  const handleEvent = () => {
    // Event logic
  };

  // Render
  return (
    <Container>
      {/* JSX content */}
    </Container>
  );
};

export default Component;
```

### Form Validation

```typescript
const validateForm = (): boolean => {
  const errors: Partial<FormData> = {};
  
  if (!formData.field) {
    errors.field = 'Field is required';
  }
  
  setErrors(errors);
  return Object.keys(errors).length === 0;
};
```

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend is running on correct port
   - Verify environment variables
   - Check network connectivity

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all dependencies are installed

3. **Styling Issues**
   - Ensure Bootstrap CSS is imported
   - Check custom CSS variables
   - Verify responsive breakpoints

### Development Tips

- Use React Developer Tools for debugging
- Check browser console for errors
- Use Network tab to debug API calls
- Test on different screen sizes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For support and questions:

- **Email**: procurement@example.com
- **Phone**: +63 2 1234 5678
- **Address**: 123 Ayala Avenue, Makati City, Philippines

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added blockchain integration
- **v1.2.0** - Enhanced accessibility features
- **v1.3.0** - Added comprehensive testing

---

**Philippine Procurement Solutions** - Building the future of procurement management with blockchain technology.
