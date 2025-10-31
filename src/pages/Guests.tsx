import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Guest, PaginationInfo } from '../types';
import api from '../services/api';
import { Plus, Search, Eye, Users, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import GuestFormModal from '../components/GuestFormModal';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import './Guests.css';

interface GuestsResponse {
  success: boolean;
  guests: Guest[];
  pagination: PaginationInfo;
}

const Guests: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchGuests(pagination.page);
  }, []);

  const fetchGuests = async (page: number = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '20'
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await api.getGuests(params) as GuestsResponse;
      setGuests(response.guests || []);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchGuests(1); // Reset to first page on search
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchGuests(newPage);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
  };

  const handleDelete = async (guest: Guest) => {
    const confirmMessage = `Are you sure you want to delete ${guest.name}?\n\nEmail: ${guest.email}\nTotal Orders: ${guest.totalOrders}\nTotal Spent: AED ${guest.totalSpent.toFixed(2)}\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await api.deleteGuest(guest._id);
      setGuests(guests.filter(g => g._id !== guest._id));
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete guest');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading guests...</p>
      </div>
    );
  }

  return (
    <div className="guests-page">
      <div className="page-header">
        <div>
          <h1>Guest Profiles</h1>
          <p>Manage guest profiles and view their order history</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} />
          <span>New Guest</span>
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="filters">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="search-input"
            />
          </div>
          <button className="btn-secondary" onClick={handleSearch}>
            Search
          </button>
        </div>

        {guests.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <p>No guest profiles found</p>
            <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} />
              <span>Create First Guest Profile</span>
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                    <th>Last Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest._id}>
                      <td>
                        <div className="guest-name">
                          <strong>{guest.name}</strong>
                          {guest.dietaryRequirements && (
                            <span className="dietary-badge">
                              {guest.dietaryRequirements}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <span>{guest.email}</span>
                          <span>{guest.phone}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="order-count">{guest.totalOrders}</span>
                      </td>
                      <td className="amount">
                        AED {guest.totalSpent.toFixed(2)}
                      </td>
                      <td>{formatDate(guest.lastOrderDate)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-icon-primary"
                            onClick={() => navigate(`/dashboard/guests/${guest._id}`)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon-secondary"
                            onClick={() => handleEdit(guest)}
                            title="Edit Guest"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDelete(guest)}
                            title="Delete Guest"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} guests
              </div>
              <div className="pagination-controls">
                <button
                  className="btn-icon"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  title="Previous Page"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="page-indicator">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="btn-icon"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  title="Next Page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <GuestFormModal
        isOpen={isCreateModalOpen || editingGuest !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingGuest(null);
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setEditingGuest(null);
          fetchGuests(pagination.page);
        }}
        guest={editingGuest}
      />
    </div>
  );
};

export default Guests;
