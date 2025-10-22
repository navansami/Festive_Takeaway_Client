import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { UserRole } from '../types';
import api from '../services/api';
import { Edit2, Trash2, UserPlus } from 'lucide-react';
import './Users.css';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Changeme',
    role: UserRole.ORDER_TAKER as UserRole,
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers() as { users: User[] };
      setUsers(response.users || []);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: 'Changeme',
        role: UserRole.ORDER_TAKER as UserRole,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };

      // Only include password if it's provided
      if (formData.password) {
        data.password = formData.password;
      }

      if (editingUser) {
        await api.updateUser(editingUser._id, data);
      } else {
        // Password is required for new users
        if (!formData.password) {
          setError('Password is required for new users');
          return;
        }
        await api.createUser(data);
      }

      handleCloseModal();
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await api.deleteUser(id);
      await fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  if (currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="error-container">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Manage system users and permissions</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <UserPlus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <strong>{user.name}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role.replace(/-/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        user.isActive ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => handleOpenModal(user)}
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(user._id)}
                        disabled={user._id === currentUser._id}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message mb-md">{error}</div>}

                <div className="form-group">
                  <label>
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="user@fairmont.com"
                    required
                  />
                  <small>Must be a @fairmont.com email address</small>
                </div>

                <div className="form-group">
                  <label>
                    Password {editingUser ? '' : <span className="required">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
                    required={!editingUser}
                    minLength={6}
                  />
                  {editingUser && (
                    <small>Leave blank to keep the current password</small>
                  )}
                  {!editingUser && (
                    <small>Default password is "Changeme". Users must change it on first login.</small>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Role <span className="required">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as UserRole,
                      })
                    }
                    required
                  >
                    <option value={UserRole.ORDER_TAKER}>Order Taker</option>
                    <option value={UserRole.OPERATIONS}>Operations</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      style={{ width: 'auto', marginRight: '8px' }}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
