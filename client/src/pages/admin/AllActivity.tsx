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

  const handleClearAllHistory = async () => {
    try {
      setIsClearing(true);
      await api.delete('/admin/submissions/clear-all');
      setShowConfirmModal(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to clear overall history.');
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
      <div className="bg-white/70 backdrop-blur-sm border border-moss/20 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest">Universal Submission Ledger</h1>
          <p className="text-xs text-ink/70 mt-1">Full audit visibility across all author manuscripts submitted platform-wide.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-red-700 transition"
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
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-moss text-parchment rounded-lg text-xs font-semibold shadow hover:bg-moss/90 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Forensic CSV</span>
          </a>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-red-200">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-serif text-lg font-bold">Clear Overall Submission History?</h3>
            </div>
            <p className="text-xs text-ink/70 leading-relaxed">
              This action is <strong className="text-red-600">irreversible</strong>. It will permanently purge all manuscript submissions, evaluation reports, and multi-detector records across all authors.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-medium border border-moss/30 rounded-lg text-ink/70 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllHistory}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-1.5"
              >
                {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/90 border border-moss/20 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-moss/10 border-b border-moss/20 font-serif text-forest">
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
          <tbody className="divide-y divide-moss/10 font-sans">
            {submissions.map((s) => (
              <tr key={s.id} className="hover:bg-parchment/30">
                <td className="p-3 font-mono text-ink/60 whitespace-nowrap">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 font-semibold text-ink whitespace-nowrap">
                  {s.user?.name}
                  <span className="block text-[10px] font-normal text-ink/50">{s.user?.email}</span>
                </td>
                <td className="p-3 max-w-xs truncate italic font-serif text-ink/80">
                  "{s.text}"
                </td>
                <td className="p-3 font-semibold">{s.wordCount}</td>
                <td className="p-3 font-mono font-bold text-forest">
                  {s.report ? `${s.report.combinedScore}%` : 'PENDING'}
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-moss/10 text-moss border border-moss/20">
                    {s.report?.verdict.replace('_', ' ') || s.status}
                  </span>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => handleReDetect(s.id)}
                      disabled={reDetectingId === s.id}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 border border-moss/30 rounded text-moss hover:bg-moss/10 transition"
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
                      className="inline-flex items-center space-x-1 px-2.5 py-1 border border-moss/30 rounded text-forest hover:bg-forest hover:text-parchment transition"
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
