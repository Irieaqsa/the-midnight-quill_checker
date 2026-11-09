import React, { useState } from 'react';
import api from '../services/api';
import { Lock, Check, AlertCircle, X, KeyRound } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccess(res.data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-tmq-surface border border-tmq-border rounded-card max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tmq-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-tmq-brand-soft rounded-lg text-tmq-brand">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-tmq-text-strong">Change Password</h3>
              <p className="text-[11px] text-tmq-text-muted">Update your account credentials</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-tmq-text-muted hover:text-tmq-text-strong p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-card text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-2.5 rounded-card text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-tmq-text-muted mb-1">
              Current Password
            </label>
            <div className="relative rounded-btn shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tmq-text-soft">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password or OTP"
                className="block w-full pl-9 pr-3 py-2 border border-tmq-border rounded-btn focus:outline-none focus:border-tmq-brand text-xs bg-tmq-surface-2 text-tmq-text-strong placeholder:text-tmq-text-soft"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-tmq-text-muted mb-1">
              New Password
            </label>
            <div className="relative rounded-btn shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tmq-text-soft">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="block w-full pl-9 pr-3 py-2 border border-tmq-border rounded-btn focus:outline-none focus:border-tmq-brand text-xs bg-tmq-surface-2 text-tmq-text-strong placeholder:text-tmq-text-soft"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-tmq-text-muted mb-1">
              Confirm New Password
            </label>
            <div className="relative rounded-btn shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tmq-text-soft">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="block w-full pl-9 pr-3 py-2 border border-tmq-border rounded-btn focus:outline-none focus:border-tmq-brand text-xs bg-tmq-surface-2 text-tmq-text-strong placeholder:text-tmq-text-soft"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-3.5 py-1.5 border border-tmq-border rounded-btn text-xs text-tmq-text-soft hover:bg-tmq-surface-2 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-tmq-brand text-tmq-on-brand text-xs font-semibold rounded-btn hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
