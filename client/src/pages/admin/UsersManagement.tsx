import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Shield, Plus, Edit2 } from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const input = prompt('Enter new quota allowance for author:', String(currentQuota));
    if (input !== null) {
      const quota = parseInt(input, 10);
      if (!isNaN(quota)) {
        await api.patch(`/admin/users/${userId}`, { quotaRemaining: quota });
        fetchUsers();
      }
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await api.patch(`/admin/users/${userId}`, { status: newStatus });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="bg-tmq-surface border border-tmq-border rounded-card p-6 shadow-sm">
        <h1 className="text-xl font-bold text-tmq-text-strong">Author Quota & Role Administration</h1>
        <p className="text-xs text-tmq-text-muted mt-1">Manage user access limits, credit allocations, and suspension states.</p>
      </div>

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
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tmq-brand-soft text-tmq-brand border border-tmq-border">
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
                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => handleAdjustQuota(u.id, u.quotaRemaining)}
                    className="px-2.5 py-1 border border-tmq-border rounded-btn text-tmq-brand hover:bg-tmq-surface-2 transition"
                  >
                    Adjust Quota
                  </button>
                  <button
                    onClick={() => handleToggleStatus(u.id, u.status)}
                    className={`px-2.5 py-1 border rounded-btn transition ${
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
