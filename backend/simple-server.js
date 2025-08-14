import express from 'express';
import cors from 'cors';
import Database from './database.js';
import jwt from 'jsonwebtoken';

const app = express();
const port = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const database = new Database();
const jwtSecret = 'your-secret-key-change-in-production';

// Initialize database on startup
database.init().then(() => {
  console.log('✅ Database initialized');
}).catch(error => {
  console.error('❌ Database initialization failed:', error);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Authenticate user with database
    const user = await database.authenticateUser(username, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Create session in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await database.createSession(user.id, token, expiresAt);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        position: user.position,
        department: user.department,
        is_admin: user.is_admin
      },
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await database.deleteSession(token);
    }
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Validate session and get user data
    const user = await database.validateSession(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      position: user.position,
      department: user.department,
      is_admin: user.is_admin
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Simple server running on http://localhost:${port}`);
  console.log('👤 Default admin user: admin/admin');
});
