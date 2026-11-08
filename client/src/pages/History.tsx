import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Submission } from '../types';
import { Search, Eye, Download, MessageCircle, RotateCcw, Loader2 } from 'lucide-react';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verdict, setVerdict] = useState('');
  const [reDetectingId, setReDetectingId] = useState<string | null>(null);

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

  const handleReDetect = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setReDetectingId(id);
      await api.post(`/submissions/${id}/re-detect`);
      navigate(`/report/${id}`);
    } catch (err: any) {
      console.error('Re-detection error:', err);
      alert(err.response?.data?.error || 'Failed to trigger re-detection');
      setReDetectingId(null);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Card per DESIGN.md */}
      <div className="tmq-card space-y-4">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-brand block">
            The Midnight Quill
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-tmq-text-strong tracking-[-0.015em] mt-0.5">
            Manuscript Inspection Ledger
          </h1>
          <p className="text-[14px] text-tmq-text-muted mt-1 leading-[1.5]">
            Historical archive of evaluations, forensic evidence scores, and review slips.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-tmq-text-soft absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search snippet text or keywords..."
              className="tmq-input pl-9 text-[13px]"
            />
          </form>

          <select
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            className="tmq-input sm:w-48 text-[13px] bg-tmq-surface-2 cursor-pointer"
          >
            <option value="">All Verdicts</option>
            <option value="LIKELY_HUMAN">Likely Human (&lt;25%)</option>
            <option value="MIXED">Uncertain / Mixed (25-60%)</option>
            <option value="LIKELY_AI">Likely AI (&gt;60%)</option>
          </select>
        </div>
      </div>

      {/* Ledger List */}
      <div className="tmq-card p-0 overflow-hidden space-y-0 divide-y divide-tmq-border-subtle">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-tmq-text-muted font-mono animate-pulse">
            Consulting manuscript archives...
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-tmq-text-muted">
            No inspection records found in ledger.
          </div>
        ) : (
          submissions.map((item) => {
            const v = item.report?.verdict;
            const score = item.report?.combinedScore ?? 0;
            const isHuman = score <= 45;
            const isLikelyAI = score > 75;

            const badgeBg = isHuman
              ? 'bg-tmq-brand-soft text-tmq-brand border-tmq-brand/30'
              : isLikelyAI
              ? 'bg-tmq-danger/15 text-tmq-danger border-tmq-danger/30'
              : 'bg-tmq-warning/15 text-tmq-warning border-tmq-warning/30';

            const pdfFullUrl = `https://tmq-authenticity-api.onrender.com/uploads/reports/report_${item.id}.pdf`;

            return (
              <div
                key={item.id}
                className="p-5 hover:bg-tmq-surface-2/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-tmq-text-soft">
                      {new Date(item.createdAt).toLocaleDateString()} &bull; {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] font-mono text-tmq-text-muted">
                      {item.wordCount} words
                    </span>
                    {item.report && (
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-pill border ${badgeBg}`}>
                        {item.report.combinedScore}% &bull; {item.report.verdict.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* High contrast, legible body text per DESIGN.md */}
                  <p className="text-[15px] leading-[1.55] text-tmq-text line-clamp-2 font-sans selection:bg-tmq-brand-soft">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => handleReDetect(item.id, e)}
                    disabled={reDetectingId === item.id}
                    className="btn-secondary text-[12px] px-2.5 py-1.5 flex items-center space-x-1 text-tmq-text-muted hover:text-tmq-brand"
                    title="Re-run Multi-Detector and TMQ Special on this manuscript"
                  >
                    {reDetectingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-tmq-brand" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-tmq-brand" />
                    )}
                    <span className="hidden sm:inline">Re-detect</span>
                  </button>

                  <Link
                    to={`/report/${item.id}`}
                    className="btn-secondary text-[12px] px-3 py-1.5 flex items-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-tmq-brand" />
                    <span>Review Slip</span>
                  </Link>

                  {item.report && (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `*TMQ Authenticity Desk Report*\nRef: ${item.id}\nScore: ${item.report.combinedScore}%\nPDF: ${pdfFullUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-[12px] p-2 text-[#25D366]"
                      title="Share to WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {item.report?.pdfUrl && (
                    <a
                      href={pdfFullUrl}
                      download={`TMQ_Report_${item.id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-[12px] p-2 text-tmq-text-muted hover:text-tmq-text"
                      title="Download Certificate PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
