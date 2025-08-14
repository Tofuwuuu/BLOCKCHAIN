import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    try {
      this.db = await open({
        filename: path.join(__dirname, 'procurement.db'),
        driver: sqlite3.Database
      });

      // Create users table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          position TEXT NOT NULL,
          department TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create sessions table for token management
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Check if admin user exists, if not create it
      await this.createDefaultAdmin();
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async createDefaultAdmin() {
    try {
      const adminExists = await this.db.get(
        'SELECT id FROM users WHERE username = ?',
        ['admin']
      );

      if (!adminExists) {
        const passwordHash = await bcrypt.hash('admin', 10);
        await this.db.run(`
          INSERT INTO users (username, password_hash, full_name, position, department, is_admin)
          VALUES (?, ?, ?, ?, ?, ?)
        `, ['admin', passwordHash, 'System Administrator', 'Admin', 'IT', 1]);
        
        console.log('👤 Default admin user created (username: admin, password: admin)');
      }
    } catch (error) {
      console.error('❌ Failed to create default admin:', error);
    }
  }

  async authenticateUser(username, password) {
    try {
      const user = await this.db.get(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (!user) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return null;
      }

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return null;
    }
  }

  async createSession(userId, token, expiresAt) {
    try {
      await this.db.run(`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `, [userId, token, expiresAt]);
      return true;
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      return false;
    }
  }

  async validateSession(token) {
    try {
      const session = await this.db.get(`
        SELECT s.*, u.id, u.username, u.full_name, u.position, u.department, u.is_admin
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `, [token]);

      if (!session) {
        return null;
      }

      // Return user data without sensitive fields
      const { token: sessionToken, expires_at, created_at, ...userData } = session;
      return userData;
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return null;
    }
  }

  async deleteSession(token) {
    try {
      await this.db.run('DELETE FROM sessions WHERE token = ?', [token]);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete session:', error);
      return false;
    }
  }

  async createUser(userData) {
    try {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const result = await this.db.run(`
        INSERT INTO users (username, password_hash, full_name, position, department, is_admin)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        userData.username,
        passwordHash,
        userData.full_name,
        userData.position,
        userData.department,
        userData.is_admin || 0
      ]);

      return result.lastID;
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await this.db.get(
        'SELECT id, username, full_name, position, department, is_admin FROM users WHERE id = ?',
        [userId]
      );
      return user;
    } catch (error) {
      console.error('❌ Failed to get user:', error);
      return null;
    }
  }

  async getAllUsers() {
    try {
      const users = await this.db.all(
        'SELECT id, username, full_name, position, department, is_admin, created_at FROM users ORDER BY created_at DESC'
      );
      return users;
    } catch (error) {
      console.error('❌ Failed to get users:', error);
      return [];
    }
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

export default Database;
