import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Download, Search, Eye, Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AllActivity: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteFilter, setDeleteFilter] = useState<'all' | 'before_7_weeks' | 'before_30_days' | 'last_7_days' | 'last_24_hours'>('before_7_weeks');
  const [reDetectingId, setReDetectingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/submissions', { params: { search } });
      setSubmissions(res.data.submissions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClearHistory = async () => {
    try {
      setIsClearing(true);
      const params = deleteFilter === 'all' ? {} : { filter: deleteFilter };
      const res = await api.delete('/admin/submissions/clear-all', { params });
      setShowConfirmModal(false);
      alert(res.data?.message || 'History cleared successfully.');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to clear history.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleReDetect = async (id: string) => {
    try {
      setReDetectingId(id);
      await api.post(`/submissions/${id}/re-detect`);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to re-detect');
    } finally {
      setReDetectingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-tmq-surface border border-tmq-border rounded-card p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-tmq-text-strong">Universal Submission Ledger</h1>
          <p className="text-xs text-tmq-text-muted mt-1">Full audit visibility across all author manuscripts submitted platform-wide.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-600/90 text-white rounded-btn text-xs font-semibold shadow hover:bg-red-600 transition"
            title="Permanently purge all historical submissions from database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Overall History</span>
          </button>

          <a
            href={`https://tmq-authenticity-api.onrender.com/api/admin/export.csv?token=${encodeURIComponent(localStorage.getItem('tmq_token') || '')}`}
            download="tmq_submissions.csv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-tmq-brand-soft text-tmq-brand border border-tmq-border rounded-btn text-xs font-semibold shadow hover:bg-tmq-brand hover:text-tmq-on-brand transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Forensic CSV</span>
          </a>
        </div>
      </div>

      {/* Confirmation & Filter Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-tmq-surface rounded-card max-w-md w-full p-6 space-y-4 shadow-xl border border-red-500/40">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-tmq-text-strong">Purge Submission Ledger Records</h3>
            </div>
            
            <p className="text-xs text-tmq-text-muted leading-relaxed">
              Select which records to permanently purge from the platform database and audit trail:
            </p>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-tmq-text uppercase tracking-wider">
                Filter Option:
              </label>
              <select
                value={deleteFilter}
                onChange={(e) => setDeleteFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-tmq-border rounded-btn text-xs bg-tmq-surface-2 text-tmq-text-strong focus:outline-none focus:border-red-500"
              >
                <option value="before_7_weeks">Older than 7 weeks (Before 49 days)</option>
                <option value="before_30_days">Older than 30 days</option>
                <option value="last_7_days">From the last 7 days only</option>
                <option value="last_24_hours">From the last 24 hours only</option>
                <option value="all">Entire platform history (All submissions)</option>
              </select>
            </div>

            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-md text-[11px] text-red-300">
              ⚠️ This deletion is <strong>permanent</strong> and will remove manuscripts, multi-detector forensic evaluations, and delivery certificates.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-medium border border-tmq-border rounded-btn text-tmq-text hover:bg-tmq-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-btn hover:bg-red-700 flex items-center space-x-1.5"
              >
                {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-tmq-surface border border-tmq-border rounded-card shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-tmq-surface-2 border-b border-tmq-border text-tmq-text-strong">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Author</th>
              <th className="p-3">Excerpt</th>
              <th className="p-3">Words</th>
              <th className="p-3">Aggregate AI</th>
              <th className="p-3">Verdict</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tmq-border">
            {submissions.map((s) => (
              <tr key={s.id} className="hover:bg-tmq-surface-2/60 transition-colors">
                <td className="p-3 font-mono text-tmq-text-muted whitespace-nowrap">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 font-semibold text-tmq-text-strong whitespace-nowrap">
                  {s.user?.name}
                  <span className="block text-[10px] font-normal text-tmq-text-soft">{s.user?.email}</span>
                </td>
                <td className="p-3 max-w-xs truncate italic text-tmq-text">
                  "{s.text}"
                </td>
                <td className="p-3 font-semibold text-tmq-text-strong">{s.wordCount}</td>
                <td className="p-3 font-mono font-bold text-tmq-brand">
                  {s.report ? `${s.report.combinedScore}%` : 'PENDING'}
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-tmq-brand-soft text-tmq-brand border border-tmq-border">
                    {s.report?.verdict.replace('_', ' ') || s.status}
                  </span>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => handleReDetect(s.id)}
                      disabled={reDetectingId === s.id}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 border border-tmq-border rounded-btn text-tmq-brand hover:bg-tmq-surface-2 transition"
                      title="Re-run detector engines on this submission"
                    >
                      {reDetectingId === s.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3 h-3" />
                      )}
                      <span>Re-detect</span>
                    </button>
                    <Link
                      to={`/report/${s.id}`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 border border-tmq-border rounded-btn text-tmq-text-strong hover:bg-tmq-surface-2 transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
