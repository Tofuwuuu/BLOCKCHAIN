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
          role TEXT NOT NULL DEFAULT 'procurement',
          is_admin BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add role column if it doesn't exist (for existing databases)
      try {
        await this.db.run('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "procurement"');
        console.log('✅ Role column added to users table');
      } catch (error) {
        // Column already exists, ignore error
      }

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

      // Create system settings table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_name TEXT NOT NULL DEFAULT 'Philippine Procurement Solutions',
          company_address TEXT NOT NULL DEFAULT '123 Ayala Avenue, Makati City, Philippines',
          company_phone TEXT NOT NULL DEFAULT '+63 2 1234 5678',
          company_email TEXT NOT NULL DEFAULT 'procurement@example.com',
          bir_tin TEXT NOT NULL DEFAULT '123-456-789-000',
          system_language TEXT NOT NULL DEFAULT 'en',
          timezone TEXT NOT NULL DEFAULT 'Asia/Manila',
          currency TEXT NOT NULL DEFAULT 'PHP',
          date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
          notifications_enabled BOOLEAN DEFAULT 1,
          email_notifications BOOLEAN DEFAULT 1,
          audit_logging BOOLEAN DEFAULT 1,
          maintenance_mode BOOLEAN DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_by INTEGER,
          FOREIGN KEY (updated_by) REFERENCES users (id)
        )
      `);

      // Create user preferences table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          language TEXT NOT NULL DEFAULT 'en',
          theme TEXT NOT NULL DEFAULT 'light',
          email_notifications BOOLEAN DEFAULT 1,
          order_updates BOOLEAN DEFAULT 1,
          system_alerts BOOLEAN DEFAULT 1,
          dashboard_layout TEXT NOT NULL DEFAULT 'default',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create roles table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          permissions TEXT,
          is_system BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create role_permissions table for many-to-many relationship
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role_id INTEGER NOT NULL,
          permission_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (role_id) REFERENCES roles (id),
          FOREIGN KEY (permission_id) REFERENCES permissions (id)
        )
      `);

      // Create permissions table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create products table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          unit TEXT NOT NULL DEFAULT 'pcs',
          unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          category TEXT NOT NULL DEFAULT 'General',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create inventory table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          total_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `);

      // Create inventory_adjustments table for audit trail
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS inventory_adjustments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          adjustment INTEGER NOT NULL,
          reason TEXT NOT NULL,
          adjusted_by INTEGER NOT NULL,
          previous_quantity INTEGER NOT NULL,
          new_quantity INTEGER NOT NULL,
          date_adjusted DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id),
          FOREIGN KEY (adjusted_by) REFERENCES users (id)
        )
      `);

              // Check if admin user exists, if not create it
        await this.createDefaultAdmin();
        
        // Create default permissions and roles
        await this.createDefaultPermissions();
        await this.createDefaultRoles();
        
        // Seed with sample inventory data
        await this.seedInventoryData();
        
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
          INSERT INTO users (username, password_hash, full_name, position, department, role, is_admin)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, ['admin', passwordHash, 'System Administrator', 'Admin', 'IT', 'admin', 1]);
        
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
        SELECT s.*, u.id, u.username, u.full_name, u.position, u.department, u.role, u.is_admin
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
        INSERT INTO users (username, password_hash, full_name, position, department, role, is_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.username,
        passwordHash,
        userData.full_name,
        userData.position,
        userData.department,
        userData.role || 'procurement',
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
        'SELECT id, username, full_name, position, department, role, is_admin FROM users WHERE id = ?',
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
        'SELECT id, username, full_name, position, department, role, is_admin, created_at FROM users ORDER BY created_at DESC'
      );
      return users;
    } catch (error) {
      console.error('❌ Failed to get users:', error);
      return [];
    }
  }

  async updateUser(userId, userData) {
    try {
      const result = await this.db.run(`
        UPDATE users 
        SET full_name = ?, position = ?, department = ?, role = ?, is_admin = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        userData.full_name,
        userData.position,
        userData.department,
        userData.role,
        userData.is_admin || 0,
        userId
      ]);

      return result.changes > 0;
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      throw error;
    }
  }

  async updateUserPassword(userId, newPassword) {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      const result = await this.db.run(`
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [passwordHash, userId]);

      return result.changes > 0;
    } catch (error) {
      console.error('❌ Failed to update password:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const result = await this.db.run('DELETE FROM users WHERE id = ?', [userId]);
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
      throw error;
    }
  }

  async checkUsernameExists(username, excludeUserId = null) {
    try {
      let query = 'SELECT id FROM users WHERE username = ?';
      let params = [username];
      
      if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
      }
      
      const user = await this.db.get(query, params);
      return !!user;
    } catch (error) {
      console.error('❌ Failed to check username:', error);
      return false;
    }
  }

  // ===== SETTINGS METHODS =====
  async getSystemSettings() {
    try {
      let settings = await this.db.get('SELECT * FROM system_settings ORDER BY id DESC LIMIT 1');
      
      if (!settings) {
        // Create default settings if none exist
        await this.db.run(`
          INSERT INTO system_settings (company_name, company_address, company_phone, company_email, bir_tin, system_language, timezone, currency, date_format)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'Philippine Procurement Solutions',
          '123 Ayala Avenue, Makati City, Philippines',
          '+63 2 1234 5678',
          'procurement@example.com',
          '123-456-789-000',
          'en',
          'Asia/Manila',
          'PHP',
          'MM/DD/YYYY'
        ]);
        
        settings = await this.db.get('SELECT * FROM system_settings ORDER BY id DESC LIMIT 1');
      }
      
      return settings;
    } catch (error) {
      console.error('❌ Failed to get system settings:', error);
      return null;
    }
  }

  async updateSystemSettings(settingsData, userId) {
    try {
      const result = await this.db.run(`
        UPDATE system_settings 
        SET company_name = ?, company_address = ?, company_phone = ?, company_email = ?, 
            bir_tin = ?, system_language = ?, timezone = ?, currency = ?, date_format = ?,
            notifications_enabled = ?, email_notifications = ?, audit_logging = ?, maintenance_mode = ?,
            updated_at = CURRENT_TIMESTAMP, updated_by = ?
        WHERE id = (SELECT id FROM system_settings ORDER BY id DESC LIMIT 1)
      `, [
        settingsData.company_name,
        settingsData.company_address,
        settingsData.company_phone,
        settingsData.company_email,
        settingsData.bir_tin,
        settingsData.system_language,
        settingsData.timezone,
        settingsData.currency,
        settingsData.date_format,
        settingsData.notifications_enabled ? 1 : 0,
        settingsData.email_notifications ? 1 : 0,
        settingsData.audit_logging ? 1 : 0,
        settingsData.maintenance_mode ? 1 : 0,
        userId
      ]);

      return result.changes > 0;
    } catch (error) {
      console.error('❌ Failed to update system settings:', error);
      throw error;
    }
  }

  async getUserPreferences(userId) {
    try {
      let preferences = await this.db.get('SELECT * FROM user_preferences WHERE user_id = ?', [userId]);
      
      if (!preferences) {
        // Create default preferences if none exist
        await this.db.run(`
          INSERT INTO user_preferences (user_id, language, theme, email_notifications, order_updates, system_alerts, dashboard_layout)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, 'en', 'light', 1, 1, 1, 'default']);
        
        preferences = await this.db.get('SELECT * FROM user_preferences WHERE user_id = ?', [userId]);
      }
      
      return preferences;
    } catch (error) {
      console.error('❌ Failed to get user preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(userId, preferencesData) {
    try {
      const result = await this.db.run(`
        UPDATE user_preferences 
        SET language = ?, theme = ?, email_notifications = ?, order_updates = ?, 
            system_alerts = ?, dashboard_layout = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        preferencesData.language,
        preferencesData.theme,
        preferencesData.email_notifications ? 1 : 0,
        preferencesData.order_updates ? 1 : 0,
        preferencesData.system_alerts ? 1 : 0,
        preferencesData.dashboard_layout,
        userId
      ]);

      return result.changes > 0;
    } catch (error) {
      console.error('❌ Failed to update user preferences:', error);
      throw error;
    }
  }

  // ===== ROLE MANAGEMENT METHODS =====
  async getRoles() {
    try {
      const roles = await this.db.all(`
        SELECT r.*, 
               COUNT(DISTINCT rp.permission_id) as permissions_count,
               COUNT(DISTINCT u.id) as user_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN users u ON u.role = r.name
        GROUP BY r.id
        ORDER BY r.is_system DESC, r.name ASC
      `);
      
      // Get permissions for each role
      for (let role of roles) {
        const permissions = await this.db.all(`
          SELECT p.* FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = ?
        `, [role.id]);
        role.permissions = permissions.map(p => p.name);
      }
      
      return roles;
    } catch (error) {
      console.error('❌ Failed to get roles:', error);
      return [];
    }
  }

  async createRole(roleData) {
    try {
      const result = await this.db.run(`
        INSERT INTO roles (name, description, is_system)
        VALUES (?, ?, 0)
      `, [roleData.name, roleData.description]);

      const roleId = result.lastID;
      
      // Add permissions
      for (let permissionName of roleData.permissions) {
        const permission = await this.db.get('SELECT id FROM permissions WHERE name = ?', [permissionName]);
        if (permission) {
          await this.db.run(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
          `, [roleId, permission.id]);
        }
      }

      return await this.getRoleById(roleId);
    } catch (error) {
      console.error('❌ Failed to create role:', error);
      throw error;
    }
  }

  async getRoleById(roleId) {
    try {
      const role = await this.db.get('SELECT * FROM roles WHERE id = ?', [roleId]);
      if (role) {
        const permissions = await this.db.all(`
          SELECT p.* FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = ?
        `, [roleId]);
        role.permissions = permissions.map(p => p.name);
      }
      return role;
    } catch (error) {
      console.error('❌ Failed to get role:', error);
      return null;
    }
  }

  async updateRole(roleId, roleData) {
    try {
      const result = await this.db.run(`
        UPDATE roles 
        SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_system = 0
      `, [roleData.name, roleData.description, roleId]);

      if (result.changes > 0) {
        // Update permissions
        await this.db.run('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
        
        for (let permissionName of roleData.permissions) {
          const permission = await this.db.get('SELECT id FROM permissions WHERE name = ?', [permissionName]);
          if (permission) {
            await this.db.run(`
              INSERT INTO role_permissions (role_id, permission_id)
              VALUES (?, ?)
            `, [roleId, permission.id]);
          }
        }
      }

      return result.changes > 0;
    } catch (error) {
      console.error('❌ Failed to update role:', error);
      throw error;
    }
  }

  async deleteRole(roleId) {
    try {
      // Check if role is in use
      const userCount = await this.db.get(`
        SELECT COUNT(*) as count FROM users u
        JOIN roles r ON u.role = r.name
        WHERE r.id = ?
      `, [roleId]);

      if (userCount.count > 0) {
        throw new Error('Cannot delete role that is assigned to users');
      }

      // Delete role permissions first
      await this.db.run('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
      
      // Delete role
      const result = await this.db.run('DELETE FROM roles WHERE id = ? AND is_system = 0', [roleId]);
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Failed to delete role:', error);
      throw error;
    }
  }

  async getPermissions() {
    try {
      const permissions = await this.db.all('SELECT * FROM permissions ORDER BY category, name');
      return permissions;
    } catch (error) {
      console.error('❌ Failed to get permissions:', error);
      return [];
    }
  }

  async createDefaultPermissions() {
    try {
      const defaultPermissions = [
        // User Management
        { name: 'user.view', description: 'View users', category: 'User Management' },
        { name: 'user.create', description: 'Create users', category: 'User Management' },
        { name: 'user.edit', description: 'Edit users', category: 'User Management' },
        { name: 'user.delete', description: 'Delete users', category: 'User Management' },
        
        // Supplier Management
        { name: 'supplier.view', description: 'View suppliers', category: 'Supplier Management' },
        { name: 'supplier.create', description: 'Create suppliers', category: 'Supplier Management' },
        { name: 'supplier.edit', description: 'Edit suppliers', category: 'Supplier Management' },
        { name: 'supplier.delete', description: 'Delete suppliers', category: 'Supplier Management' },
        
        // Order Management
        { name: 'order.view', description: 'View orders', category: 'Order Management' },
        { name: 'order.create', description: 'Create orders', category: 'Order Management' },
        { name: 'order.edit', description: 'Edit orders', category: 'Order Management' },
        { name: 'order.approve', description: 'Approve orders', category: 'Order Management' },
        { name: 'order.delete', description: 'Delete orders', category: 'Order Management' },
        
        // Inventory Management
        { name: 'inventory.view', description: 'View inventory', category: 'Inventory Management' },
        { name: 'inventory.adjust', description: 'Adjust inventory', category: 'Inventory Management' },
        { name: 'inventory.report', description: 'Generate inventory reports', category: 'Inventory Management' },
        
        // System Settings
        { name: 'settings.view', description: 'View system settings', category: 'System Settings' },
        { name: 'settings.edit', description: 'Edit system settings', category: 'System Settings' },
        { name: 'role.manage', description: 'Manage roles and permissions', category: 'System Settings' },
        
        // Reports
        { name: 'report.view', description: 'View reports', category: 'Reports' },
        { name: 'report.generate', description: 'Generate reports', category: 'Reports' },
        { name: 'report.export', description: 'Export reports', category: 'Reports' },
        
        // Finance
        { name: 'finance.payment.approve', description: 'Approve payments', category: 'Finance' },
        { name: 'finance.report.view', description: 'View financial reports', category: 'Finance' },
        { name: 'finance.bir.export', description: 'Download BIR exports', category: 'Finance' },
        
        // Blockchain/Validator
        { name: 'blockchain.consensus', description: 'Participate in consensus', category: 'Blockchain' },
        { name: 'blockchain.node.manage', description: 'Manage node identities', category: 'Blockchain' },
        
        // Audit
        { name: 'audit.trail.view', description: 'View audit trail', category: 'Audit' },
        { name: 'audit.explorer.view', description: 'View blockchain explorer', category: 'Audit' }
      ];

      for (let perm of defaultPermissions) {
        try {
          await this.db.run(`
            INSERT INTO permissions (name, description, category)
            VALUES (?, ?, ?)
          `, [perm.name, perm.description, perm.category]);
        } catch (error) {
          // Permission already exists, ignore
        }
      }

      console.log('✅ Default permissions created');
    } catch (error) {
      console.error('❌ Failed to create default permissions:', error);
    }
  }

  async createDefaultRoles() {
    try {
      // Create admin role
      const adminRole = await this.db.run(`
        INSERT INTO roles (name, description, is_system)
        VALUES ('admin', 'Full system access and user management', 1)
      `);

      // Create procurement role
      const procurementRole = await this.db.run(`
        INSERT INTO roles (name, description, is_system)
        VALUES ('procurement', 'Procurement staff. Create/approve POs, propose and approve items, receive goods, adjust inventory, view reports.', 1)
      `);

      // Create validator role
      const validatorRole = await this.db.run(`
        INSERT INTO roles (name, description, is_system)
        VALUES ('validator', 'Node-level role that participates in consensus. Usually not a normal web-login role; administered by Admin and mapped to a node identity/key.', 1)
      `);

      // Create supplier role
      const supplierRole = await this.db.run(`
        INSERT INTO roles (name, description, is_system)
        VALUES ('supplier', 'Supplier portal account. Propose items, view their own orders/status, submit documents (submissions go to Pending Approval).', 1)
      `);

      // Create auditor role
      const auditorRole = await this.db.run(`
        INSERT INTO roles (name, description, is_system)
        VALUES ('auditor', 'Read-only access to explorers, audit trail and reports (no write actions).', 1)
      `);

      // Create finance role
      const financeRole = await this.db.run(`
        INSERT INTO roles (name, description, is_system)
        VALUES ('finance', 'Finance department: approve payments, view financial reports, download BIR exports.', 1)
      `);

      console.log('✅ Default roles created');
    } catch (error) {
      console.error('❌ Failed to create default roles:', error);
    }
  }

  // ===== PRODUCT MANAGEMENT =====
  
  async getAllProducts() {
    try {
      return await this.db.all('SELECT * FROM products WHERE is_active = 1 ORDER BY name');
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  async getProduct(id) {
    try {
      return await this.db.get('SELECT * FROM products WHERE id = ? AND is_active = 1', [id]);
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  async createProduct(productData) {
    try {
      const result = await this.db.run(`
        INSERT INTO products (name, description, unit, unit_price, category)
        VALUES (?, ?, ?, ?, ?)
      `, [productData.name, productData.description, productData.unit, productData.unit_price, productData.category]);
      
      return { id: result.lastID, ...productData };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id, productData) {
    try {
      await this.db.run(`
        UPDATE products 
        SET name = ?, description = ?, unit = ?, unit_price = ?, category = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [productData.name, productData.description, productData.unit, productData.unit_price, productData.category, id]);
      
      return await this.getProduct(id);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      await this.db.run('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // ===== INVENTORY MANAGEMENT =====

  async getAllInventory() {
    try {
      return await this.db.all(`
        SELECT 
          i.id,
          i.product_id,
          i.quantity,
          i.unit_price,
          i.total_value,
          i.last_updated,
          p.name as product_name,
          p.description as product_description,
          p.unit as product_unit,
          p.category as product_category
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE p.is_active = 1
        ORDER BY p.name
      `);
    } catch (error) {
      console.error('Error getting inventory:', error);
      throw error;
    }
  }

  async getInventoryItem(productId) {
    try {
      return await this.db.get(`
        SELECT 
          i.id,
          i.product_id,
          i.quantity,
          i.unit_price,
          i.total_value,
          i.last_updated,
          p.name as product_name,
          p.description as product_description,
          p.unit as product_unit,
          p.category as product_category
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.product_id = ? AND p.is_active = 1
      `, [productId]);
    } catch (error) {
      console.error('Error getting inventory item:', error);
      throw error;
    }
  }

  async adjustInventory(productId, adjustment, reason, adjustedBy) {
    try {
      // Get current inventory
      const currentInventory = await this.getInventoryItem(productId);
      if (!currentInventory) {
        throw new Error('Product not found in inventory');
      }

      const previousQuantity = currentInventory.quantity;
      const newQuantity = previousQuantity + adjustment;
      
      if (newQuantity < 0) {
        throw new Error('Insufficient stock for this adjustment');
      }

      // Update inventory
      const newTotalValue = newQuantity * currentInventory.unit_price;
      await this.db.run(`
        UPDATE inventory 
        SET quantity = ?, total_value = ?, last_updated = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `, [newQuantity, newTotalValue, productId]);

      // Record adjustment in audit trail
      await this.db.run(`
        INSERT INTO inventory_adjustments (product_id, adjustment, reason, adjusted_by, previous_quantity, new_quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [productId, adjustment, reason, adjustedBy, previousQuantity, newQuantity]);

      return await this.getInventoryItem(productId);
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      throw error;
    }
  }

  async addProductToInventory(productId, initialQuantity = 0) {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const totalValue = initialQuantity * product.unit_price;
      
      await this.db.run(`
        INSERT INTO inventory (product_id, quantity, unit_price, total_value)
        VALUES (?, ?, ?, ?)
      `, [productId, initialQuantity, product.unit_price, totalValue]);

      return await this.getInventoryItem(productId);
    } catch (error) {
      console.error('Error adding product to inventory:', error);
      throw error;
    }
  }

  async getInventoryStats() {
    try {
      const stats = await this.db.get(`
        SELECT 
          COUNT(*) as total_items,
          SUM(CASE WHEN quantity > 50 THEN 1 ELSE 0 END) as in_stock,
          SUM(CASE WHEN quantity <= 10 AND quantity > 0 THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE p.is_active = 1
      `);
      
      return stats;
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      throw error;
    }
  }

  async seedInventoryData() {
    try {
      // Check if products already exist
      const existingProducts = await this.db.get('SELECT COUNT(*) as count FROM products');
      if (existingProducts.count > 0) {
        console.log('📦 Products already exist, skipping seed data');
        return;
      }

      const sampleProducts = [
        {
          name: 'Office Chairs - Ergonomic',
          description: 'High-quality ergonomic office chairs with adjustable features',
          unit: 'pieces',
          unit_price: 8500.00,
          category: 'Office Furniture'
        },
        {
          name: 'Laptop Stands',
          description: 'Adjustable laptop stands for better ergonomics',
          unit: 'pieces',
          unit_price: 1200.00,
          category: 'Office Accessories'
        },
        {
          name: 'Wireless Keyboards',
          description: 'Bluetooth wireless keyboards with backlit keys',
          unit: 'pieces',
          unit_price: 2500.00,
          category: 'Computer Peripherals'
        },
        {
          name: 'Desk Organizers',
          description: 'Multi-compartment desk organizers for office supplies',
          unit: 'pieces',
          unit_price: 800.00,
          category: 'Office Accessories'
        },
        {
          name: 'LED Desk Lamps',
          description: 'Adjustable LED desk lamps with USB charging ports',
          unit: 'pieces',
          unit_price: 1500.00,
          category: 'Office Accessories'
        },
        {
          name: 'Filing Cabinets',
          description: '4-drawer metal filing cabinets with lock',
          unit: 'pieces',
          unit_price: 12000.00,
          category: 'Office Furniture'
        },
        {
          name: 'Whiteboards',
          description: 'Large magnetic whiteboards for conference rooms',
          unit: 'pieces',
          unit_price: 3500.00,
          category: 'Office Equipment'
        },
        {
          name: 'Projector Screens',
          description: 'Retractable projector screens for presentations',
          unit: 'pieces',
          unit_price: 8000.00,
          category: 'Office Equipment'
        },
        {
          name: 'Coffee Makers',
          description: 'Commercial coffee makers for office use',
          unit: 'pieces',
          unit_price: 15000.00,
          category: 'Office Equipment'
        },
        {
          name: 'Air Purifiers',
          description: 'HEPA air purifiers for office air quality',
          unit: 'pieces',
          unit_price: 12000.00,
          category: 'Office Equipment'
        }
      ];

      // Insert products
      for (const product of sampleProducts) {
        const result = await this.db.run(`
          INSERT INTO products (name, description, unit, unit_price, category)
          VALUES (?, ?, ?, ?, ?)
        `, [product.name, product.description, product.unit, product.unit_price, product.category]);
        
        const productId = result.lastID;
        
        // Add to inventory with realistic quantities
        const quantities = [75, 45, 120, 200, 60, 25, 15, 8, 12, 18]; // Different quantities for variety
        const quantity = quantities[sampleProducts.indexOf(product)];
        const totalValue = quantity * product.unit_price;
        
        await this.db.run(`
          INSERT INTO inventory (product_id, quantity, unit_price, total_value)
          VALUES (?, ?, ?, ?)
        `, [productId, quantity, product.unit_price, totalValue]);
      }

      console.log('📦 Sample inventory data seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed inventory data:', error);
    }
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

export default Database;
