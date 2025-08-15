import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication status...');
        const token = localStorage.getItem('authToken');
        console.log('🔑 Token in localStorage:', token ? 'Present' : 'None');
        
        if (token) {
          try {
            console.log('📡 Calling getCurrentUser API...');
            // Try to get current user from API
            const userData = await apiService.getCurrentUser();
            console.log('✅ getCurrentUser API response:', userData);
            setUser(userData);
            console.log('👤 User state set from API');
          } catch (error) {
            console.log('❌ Auth API failed, clearing token...', error);
            localStorage.removeItem('authToken');
            setUser(null);
          }
        } else {
          // No token, user is not authenticated
          console.log('🚫 No token found, user not authenticated');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        console.log('🏁 Authentication check completed');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', username);
      
      // Call the backend login endpoint
      const response = await apiService.login({ username, password });
      console.log('✅ Login API response:', response);
      
      // Store the token
      localStorage.setItem('authToken', response.token);
      console.log('💾 Token stored in localStorage');
      
      // Set the user data
      setUser(response.user);
      console.log('👤 User state updated:', response.user);
      
      console.log('🎉 Login successful:', response.user.username);
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error; // Re-throw to let the component handle the error
    }
  };

  const logout = async () => {
    try {
      // Call the backend logout endpoint
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Always clear local storage and user state
      localStorage.removeItem('authToken');
      setUser(null);
      console.log('Logout completed');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
