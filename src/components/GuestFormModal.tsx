import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Guest } from '../types';
import api from '../services/api';
import './GuestFormModal.css';

interface GuestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  guest?: Guest | null;
}

const GuestFormModal: React.FC<GuestFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  guest
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    dietaryRequirements: '',
    preferredContactMethod: 'email' as 'email' | 'phone'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name || '',
        email: guest.email || '',
        phone: guest.phone || '',
        address: guest.address || '',
        notes: guest.notes || '',
        dietaryRequirements: guest.dietaryRequirements || '',
        preferredContactMethod: guest.preferredContactMethod || 'email'
      });
    } else {
      // Reset form for new guest
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        dietaryRequirements: '',
        preferredContactMethod: 'email'
      });
    }
    setError('');
  }, [guest, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (guest) {
        await api.updateGuest(guest._id, formData);
      } else {
        await api.createGuest(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save guest');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content guest-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{guest ? 'Edit Guest Profile' : 'New Guest Profile'}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter guest's full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="guest@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+971 XX XXX XXXX"
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferredContactMethod">
                Preferred Contact Method
              </label>
              <select
                id="preferredContactMethod"
                name="preferredContactMethod"
                value={formData.preferredContactMethod}
                onChange={handleChange}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">
              Address <span className="required">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Enter full address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dietaryRequirements">
              Dietary Requirements
            </label>
            <input
              type="text"
              id="dietaryRequirements"
              name="dietaryRequirements"
              value={formData.dietaryRequirements}
              onChange={handleChange}
              placeholder="e.g., Vegetarian, Halal, No nuts"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about the guest"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : guest ? 'Update Guest' : 'Create Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestFormModal;
