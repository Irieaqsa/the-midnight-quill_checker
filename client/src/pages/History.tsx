import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Submission } from '../types';
import { Search, Eye, Download, FileText, ChevronRight } from 'lucide-react';

export const History: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verdict, setVerdict] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.query = search;
      if (verdict) params.verdict = verdict;

      const res = await api.get('/submissions', { params });
      setSubmissions(res.data.submissions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [verdict]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border border-moss/20 rounded-xl p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-forest">Manuscript Inspection Ledger</h1>
        <p className="text-xs text-ink/70 mt-1">
          Historical record of every submission, forensic algorithm score, and certificate download.
        </p>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-ink/40 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search snippet text or keywords..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-moss/30 rounded-lg bg-parchment/30 focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </form>

          <select
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            className="text-xs px-3 py-2 border border-moss/30 rounded-lg bg-white/80 focus:ring-1 focus:ring-forest"
          >
            <option value="">All Verdicts</option>
            <option value="LIKELY_HUMAN">Likely Human (&lt;20%)</option>
            <option value="MIXED">Mixed / Uncertain (20-60%)</option>
            <option value="LIKELY_AI">Likely AI (&gt;60%)</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white/90 backdrop-blur-sm border border-moss/20 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-moss font-serif animate-pulse">
            Consulting archives...
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink/60 font-serif">
            No inspection records found in ledger.
          </div>
        ) : (
          <div className="divide-y divide-moss/10">
            {submissions.map((item) => {
              const v = item.report?.verdict;
              const badgeClass =
                v === 'LIKELY_HUMAN'
                  ? 'bg-moss/10 text-moss border-moss/30'
                  : v === 'MIXED'
                  ? 'bg-amber/10 text-amber border-amber/30'
                  : 'bg-red-50 text-red-700 border-red-200';

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-parchment/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-[11px] font-mono text-ink/50">
                        {new Date(item.createdAt).toLocaleDateString()} &bull; {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[11px] font-semibold text-forest">
                        {item.wordCount} words
                      </span>
                      {item.report && (
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                          {item.report.combinedScore}% &bull; {item.report.verdict.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-serif text-ink line-clamp-2 leading-relaxed">
                      "{item.text}"
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                    <Link
                      to={`/report/${item.id}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 border border-forest/30 rounded text-xs font-medium text-forest hover:bg-forest hover:text-parchment transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Slip</span>
                    </Link>

                    {item.report?.pdfUrl && (
                      <a
                        href={`${((import.meta as any).env?.VITE_API_BASE_URL) || 'https://tmq-authenticity-api.onrender.com/api'}/submissions/${item.id}/report.pdf`}
                        download
                        className="p-1.5 border border-moss/30 rounded text-moss hover:bg-moss/10 transition"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
