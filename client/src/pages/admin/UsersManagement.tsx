import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Shield, ShieldAlert, Key, Copy, Check, X } from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpModal, setOtpModal] = useState<{
    userName: string;
    userEmail: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdjustQuota = async (userId: string, currentQuota: number) => {
    setActionError(null);
    const input = prompt('Enter new quota allowance for author:', String(currentQuota));
    if (input !== null) {
      const quota = parseInt(input, 10);
      if (!isNaN(quota)) {
        try {
          await api.patch(`/admin/users/${userId}`, { quotaRemaining: quota });
          fetchUsers();
        } catch (err: any) {
          setActionError(err.response?.data?.error || 'Failed to update quota');
        }
      }
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    setActionError(null);
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/admin/users/${userId}`, { status: newStatus });
      fetchUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string, userName: string) => {
    setActionError(null);
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmMessage = currentRole === 'ADMIN'
      ? `Are you sure you want to remove ADMIN privileges from "${userName}"? They will become a standard USER.`
      : `Are you sure you want to promote "${userName}" to ADMIN? They will have full administrative rights.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await api.patch(`/admin/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleGenerateOtp = async (userId: string, userName: string, userEmail: string) => {
    setActionError(null);
    if (!window.confirm(`Generate a temporary one-time password for "${userName}" (${userEmail})? This will immediately overwrite their current password.`)) {
      return;
    }

    try {
      const res = await api.post(`/admin/users/${userId}/generate-otp`);
      setOtpModal({
        userName,
        userEmail,
        tempPassword: res.data.tempPassword,
      });
      setCopied(false);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to generate one-time password');
    }
  };

  const handleCopyOtp = () => {
    if (otpModal?.tempPassword) {
      navigator.clipboard.writeText(otpModal.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-tmq-surface border border-tmq-border rounded-card p-6 shadow-sm">
        <h1 className="text-xl font-bold text-tmq-text-strong">Author Quota & Role Administration</h1>
        <p className="text-xs text-tmq-text-muted mt-1">Manage user access limits, credit allocations, admin promotions, and temporary passwords.</p>
      </div>

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-card text-xs flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* OTP Display Modal */}
      {otpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-tmq-surface border border-tmq-border rounded-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-tmq-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-tmq-brand-soft rounded-lg text-tmq-brand">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-tmq-text-strong">Temporary Password Created</h3>
              </div>
              <button
                onClick={() => setOtpModal(null)}
                className="text-tmq-text-muted hover:text-tmq-text-strong p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-tmq-text-soft">
              A one-time temporary password was generated for <span className="font-semibold text-tmq-text-strong">{otpModal.userName}</span> ({otpModal.userEmail}). Please copy and securely share this with the user so they can sign in.
            </p>

            <div className="flex items-center justify-between p-3.5 bg-tmq-surface-2 border border-tmq-border rounded-lg">
              <span className="font-mono text-lg font-bold text-tmq-brand tracking-wider select-all">
                {otpModal.tempPassword}
              </span>
              <button
                onClick={handleCopyOtp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-tmq-brand text-black text-xs font-semibold rounded-btn hover:opacity-90 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p className="text-[11px] text-tmq-text-muted italic">
              Note: The user should sign in with this temporary password and update their credentials right away.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setOtpModal(null)}
                className="w-full py-2 bg-tmq-surface-2 border border-tmq-border text-tmq-text-strong text-xs font-semibold rounded-btn hover:bg-tmq-surface transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-tmq-surface border border-tmq-border rounded-card shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-tmq-surface-2 border-b border-tmq-border text-tmq-text-strong">
            <tr>
              <th className="p-3">Author Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Remaining Quota</th>
              <th className="p-3">Total Submissions</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tmq-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-tmq-surface-2/60 transition-colors">
                <td className="p-3 font-semibold text-tmq-text-strong whitespace-nowrap">
                  {u.name}
                  <span className="block text-[10px] font-normal text-tmq-text-soft">{u.email}</span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    u.role === 'ADMIN'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-tmq-brand-soft text-tmq-brand border-tmq-border'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 font-mono font-bold text-tmq-brand">{u.quotaRemaining} checks</td>
                <td className="p-3 text-tmq-text font-medium">{u._count?.submissions || 0}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    u.status === 'ACTIVE' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleRole(u.id, u.role, u.name)}
                    className={`px-2.5 py-1 border rounded-btn transition text-[11px] font-medium inline-flex items-center gap-1 ${
                      u.role === 'ADMIN'
                        ? 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                        : 'border-tmq-border text-tmq-brand hover:bg-tmq-surface-2'
                    }`}
                    title={u.role === 'ADMIN' ? 'Demote to regular user' : 'Promote to administrator'}
                  >
                    <Shield className="w-3 h-3" />
                    {u.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                  </button>

                  <button
                    onClick={() => handleGenerateOtp(u.id, u.name, u.email)}
                    className="px-2.5 py-1 border border-tmq-border rounded-btn text-tmq-brand hover:bg-tmq-surface-2 transition text-[11px] font-medium inline-flex items-center gap-1"
                    title="Generate temporary password for user"
                  >
                    <Key className="w-3 h-3" />
                    Reset Pass / OTP
                  </button>

                  <button
                    onClick={() => handleAdjustQuota(u.id, u.quotaRemaining)}
                    className="px-2.5 py-1 border border-tmq-border rounded-btn text-tmq-text-soft hover:text-tmq-text-strong hover:bg-tmq-surface-2 transition text-[11px]"
                  >
                    Quota
                  </button>

                  <button
                    onClick={() => handleToggleStatus(u.id, u.status)}
                    className={`px-2.5 py-1 border rounded-btn transition text-[11px] ${
                      u.status === 'ACTIVE'
                        ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                        : 'border-tmq-border text-tmq-brand hover:bg-tmq-surface-2'
                    }`}
                  >
                    {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
