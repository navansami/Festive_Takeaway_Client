import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, User } from 'lucide-react';
import type { GuestDetails } from '../types';
import api from '../services/api';
import './GuestSearch.css';

interface GuestSearchProps {
  selectedGuest: GuestDetails | null;
  onSelectGuest: (guest: GuestDetails) => void;
  onAddNew: () => void;
}

const GuestSearch: React.FC<GuestSearchProps> = ({
  selectedGuest,
  onSelectGuest,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [guests, setGuests] = useState<GuestDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Real-time search with debounce
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = (await api.searchGuests(searchQuery)) as {
            guests: GuestDetails[];
          };
          setGuests(response.guests || []);
          setShowDropdown(true);
        } catch (error) {
          console.error('Error searching guests:', error);
          setGuests([]);
        } finally {
          setLoading(false);
        }
      }, 300); // 300ms debounce
    } else {
      setGuests([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const handleSelectGuest = (guest: GuestDetails) => {
    onSelectGuest(guest);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (selectedGuest) {
      onSelectGuest({
        name: '',
        email: '',
        phone: '',
        address: '',
      });
    }
  };

  return (
    <div className="guest-search">
      <label className="form-label">
        Search Guest <span className="required">*</span>
      </label>

      {selectedGuest && selectedGuest.name ? (
        <div className="selected-guest">
          <div className="guest-info">
            <div className="guest-icon">
              <User size={20} />
            </div>
            <div className="guest-details">
              <div className="guest-name">{selectedGuest.name}</div>
              <div className="guest-contact">
                {selectedGuest.phone} • {selectedGuest.email}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() =>
              onSelectGuest({
                name: '',
                email: '',
                phone: '',
                address: '',
              })
            }
          >
            Change
          </button>
        </div>
      ) : (
        <div className="guest-search-input" ref={dropdownRef}>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChange={handleInputChange}
              className="search-input"
              autoFocus
            />
            <button
              type="button"
              className="btn-icon"
              onClick={onAddNew}
              title="Add new guest"
            >
              <Plus size={20} />
            </button>
          </div>

          {showDropdown && (
            <div className="search-dropdown">
              {loading ? (
                <div className="dropdown-item loading">Searching...</div>
              ) : guests.length > 0 ? (
                guests.map((guest, index) => (
                  <button
                    key={index}
                    type="button"
                    className="dropdown-item"
                    onClick={() => handleSelectGuest(guest)}
                  >
                    <div className="guest-icon">
                      <User size={18} />
                    </div>
                    <div className="guest-details">
                      <div className="guest-name">{guest.name}</div>
                      <div className="guest-contact">
                        {guest.phone} • {guest.email}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="dropdown-item empty">
                  <p>No guests found</p>
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={onAddNew}
                  >
                    Add New Guest
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GuestSearch;
