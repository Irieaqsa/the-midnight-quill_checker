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
      <div className="bg-white/70 backdrop-blur-sm border border-moss/20 rounded-xl p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-forest">Author Quota & Role Administration</h1>
        <p className="text-xs text-ink/70 mt-1">Manage user access limits, credit allocations, and suspension states.</p>
      </div>

      <div className="bg-white/90 border border-moss/20 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-moss/10 border-b border-moss/20 font-serif text-forest">
            <tr>
              <th className="p-3">Author Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Remaining Quota</th>
              <th className="p-3">Total Submissions</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-moss/10">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-parchment/30">
                <td className="p-3 font-semibold text-ink">
                  {u.name}
                  <span className="block text-[10px] font-normal text-ink/50">{u.email}</span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage/30 text-forest">
                    {u.role}
                  </span>
                </td>
                <td className="p-3 font-mono font-bold text-forest">{u.quotaRemaining} checks</td>
                <td className="p-3">{u._count?.submissions || 0}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.status === 'ACTIVE' ? 'bg-moss/20 text-moss' : 'bg-red-100 text-red-700'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => handleAdjustQuota(u.id, u.quotaRemaining)}
                    className="px-2.5 py-1 border border-moss/30 rounded text-moss hover:bg-moss/10 transition"
                  >
                    Adjust Quota
                  </button>
                  <button
                    onClick={() => handleToggleStatus(u.id, u.status)}
                    className={`px-2.5 py-1 border rounded transition ${
                      u.status === 'ACTIVE'
                        ? 'border-red-300 text-red-700 hover:bg-red-50'
                        : 'border-moss text-moss hover:bg-moss/10'
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
