import React, { useState } from 'react';
import './ChangePasswordModal.css';

interface ChangePasswordModalProps {
  onPasswordChanged: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onPasswordChanged }) => {
  const [currentPassword] = useState('Changeme');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword === 'Changeme') {
      setError('Please choose a different password than the default');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      onPasswordChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal password-change-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Change Your Password</h3>
        </div>
        <div className="modal-body">
          <div className="password-change-notice">
            <p>
              <strong>You are using the default password.</strong>
            </p>
            <p>
              For security reasons, you must change your password before continuing.
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                disabled
                style={{ backgroundColor: 'var(--color-grey-100)' }}
              />
            </div>

            <div className="form-group">
              <label>
                New Password <span className="required">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                autoFocus
              />
              <small>Minimum 6 characters</small>
            </div>

            <div className="form-group">
              <label>
                Confirm New Password <span className="required">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <div className="modal-footer">
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
