import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Download, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AllActivity: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="bg-white/70 backdrop-blur-sm border border-moss/20 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest">Universal Submission Ledger</h1>
          <p className="text-xs text-ink/70 mt-1">Full audit visibility across all author manuscripts submitted platform-wide.</p>
        </div>

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
                  <Link
                    to={`/report/${s.id}`}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 border border-moss/30 rounded text-forest hover:bg-forest hover:text-parchment transition"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
