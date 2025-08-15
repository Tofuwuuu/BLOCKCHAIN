import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, User, CreateUserData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

interface UserFormData {
  username: string;
  password: string;
  full_name: string;
  position: string;
  department: string;
  role: string;
}

const Users: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'danger';
      case 'procurement': return 'primary';
      case 'validator': return 'warning';
      case 'supplier': return 'info';
      case 'auditor': return 'secondary';
      case 'finance': return 'success';
      default: return 'secondary';
    }
  };
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [roleDescriptions, setRoleDescriptions] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    full_name: '',
    position: '',
    department: '',
    role: 'procurement' // Default role
  });

  // Check if user is admin
  useEffect(() => {
    if (user && !user.is_admin) {
      setToast({
        show: true,
        message: 'Access denied. Admin privileges required.',
        type: 'error'
      });
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, [user, navigate]);

  // Load users and roles
  useEffect(() => {
    if (user?.is_admin) {
      loadUsers();
      loadRoles();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      setUsers(response);
    } catch (error) {
      console.error('Failed to load users:', error);
      setToast({
        show: true,
        message: 'Failed to load users',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiService.getRoles();
      setRoles(response.roles);
      setRoleDescriptions(response.descriptions);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      full_name: '',
      position: '',
      department: '',
      role: 'procurement' // Default role
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData: CreateUserData = {
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        position: formData.position,
        department: formData.department,
        role: formData.role
      };

      await apiService.createUser(userData);
      setToast({
        show: true,
        message: 'User created successfully',
        type: 'success'
      });
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setToast({
        show: true,
        message: error.response?.data?.error || 'Failed to create user',
        type: 'error'
      });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      const userData = {
        full_name: formData.full_name,
        position: formData.position,
        department: formData.department,
        role: formData.role
      };

      await apiService.updateUser(editingUser.id, userData);
      setToast({
        show: true,
        message: 'User updated successfully',
        type: 'success'
      });
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setToast({
        show: true,
        message: error.response?.data?.error || 'Failed to update user',
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      setToast({
        show: true,
        message: 'User deleted successfully',
        type: 'success'
      });
      loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setToast({
        show: true,
        message: error.response?.data?.error || 'Failed to delete user',
        type: 'error'
      });
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name,
      position: user.position,
      department: user.department,
      role: user.role
    });
    setShowCreateForm(true);
  };

  if (!user?.is_admin) {
    return <LoadingSpinner />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">User Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add User
        </button>
      </div>

      {/* Create/Edit User Form */}
      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={editingUser ? handleEditUser : handleCreateUser}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current' : ''}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Position *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Department *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                  {roleDescriptions[formData.role] && (
                    <small className="form-text text-muted">
                      {roleDescriptions[formData.role]}
                    </small>
                  )}
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Users ({users.length})</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Admin</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.full_name}</td>
                    <td>{user.position}</td>
                    <td>{user.department}</td>
                    <td>
                      <span className={`badge bg-${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.is_admin ? (
                        <span className="badge bg-success">Yes</span>
                      ) : (
                        <span className="badge bg-secondary">No</span>
                      )}
                    </td>
                    <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => startEditUser(user)}
                          title="Edit User"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {user.id !== 1 && ( // Prevent deleting the main admin
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete User"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default Users;
