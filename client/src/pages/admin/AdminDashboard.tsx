import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, FileText, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-moss font-serif">Aggregating platform intelligence...</div>;
  }

  const { stats, recentSubmissions } = data || {};

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-tmq-surface border border-tmq-border rounded-card p-6 shadow-sm">
        <h1 className="text-xl font-bold text-tmq-text-strong">Founder Command Center</h1>
        <p className="text-xs text-tmq-text-muted mt-1">
          High-level telemetry across all active literary submissions, quotas, and detector algorithms.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-tmq-surface p-5 rounded-card border border-tmq-border shadow-sm">
          <div className="flex justify-between items-center text-xs text-tmq-text-muted uppercase font-semibold">
            <span>Total Submissions</span>
            <FileText className="w-4 h-4 text-tmq-brand" />
          </div>
          <div className="text-2xl font-bold font-mono text-tmq-text-strong mt-2">
            {stats?.totalSubmissions || 0}
          </div>
        </div>

        <div className="bg-tmq-surface p-5 rounded-card border border-tmq-border shadow-sm">
          <div className="flex justify-between items-center text-xs text-tmq-text-muted uppercase font-semibold">
            <span>Registered Authors</span>
            <Users className="w-4 h-4 text-tmq-brand" />
          </div>
          <div className="text-2xl font-bold font-mono text-tmq-text-strong mt-2">
            {stats?.totalUsers || 0}
          </div>
        </div>

        <div className="bg-tmq-surface p-5 rounded-card border border-tmq-border shadow-sm">
          <div className="flex justify-between items-center text-xs text-tmq-text-muted uppercase font-semibold">
            <span>Average AI Likelihood</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-2">
            {stats?.avgScore || 0}%
          </div>
        </div>

        <div className="bg-tmq-surface p-5 rounded-card border border-tmq-border shadow-sm">
          <div className="flex justify-between items-center text-xs text-tmq-text-muted uppercase font-semibold">
            <span>Human Authenticity Rate</span>
            <CheckCircle className="w-4 h-4 text-tmq-brand" />
          </div>
          <div className="text-2xl font-bold font-mono text-tmq-brand mt-2">
            {stats?.totalSubmissions
              ? Math.round((stats.verdictDistribution.human / stats.totalSubmissions) * 100)
              : 100}%
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-tmq-surface border border-tmq-border rounded-card p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-sm text-tmq-text-strong">Recent Platform Inflow</h2>
          <Link to="/admin/activity" className="text-xs text-tmq-brand hover:underline flex items-center space-x-1 font-semibold">
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-tmq-border">
          {recentSubmissions?.map((s: any) => (
            <div key={s.id} className="py-3 flex items-center justify-between text-xs">
              <div className="max-w-[70%]">
                <span className="font-bold text-tmq-text-strong mr-2">{s.user?.name}</span>
                <span className="text-tmq-text-muted italic line-clamp-1">"{s.text.slice(0, 80)}..."</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-mono text-tmq-brand font-semibold">
                  {s.report ? `${s.report.combinedScore}%` : 'PENDING'}
                </span>
                <Link
                  to={`/report/${s.id}`}
                  className="px-2.5 py-1 border border-tmq-border rounded-btn text-[11px] text-tmq-text hover:bg-tmq-surface-2 transition"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
