import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Submission } from '../types';
import { VerdictStamp } from '../components/VerdictStamp';
import { Download, ArrowLeft, Mail, Phone, ShieldCheck, AlertTriangle } from 'lucide-react';

export const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/submissions/${id}`);
        setSubmission(res.data.submission);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white/70 p-12 text-center rounded-xl font-serif text-forest animate-pulse">
        Retrieving editorial report slip...
      </div>
    );
  }

  if (!submission || !submission.report) {
    return (
      <div className="bg-white/70 p-8 text-center rounded-xl font-serif">
        Report pending or unavailable.
      </div>
    );
  }

  const report = submission.report;
  const providerResults = submission.providerResults || [];
  const user = submission.user;

  return (
    <div className="space-y-6">
      {/* Top back action */}
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-moss hover:text-forest"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ledger</span>
        </Link>

        {report.pdfUrl && (
          <a
            href={`https://tmq-authenticity-api.onrender.com${report.pdfUrl.startsWith('/') ? '' : '/'}${report.pdfUrl}`}
            download={`TMQ_Report_${submission.id}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-forest text-parchment rounded-lg text-xs font-bold shadow hover:bg-forest/90 transition font-serif"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Forensic Certificate (PDF)</span>
          </a>
        )}
      </div>

      {/* Manuscript Review Slip Container */}
      <div className="bg-[#FAF7EE] border-2 border-forest/30 rounded-xl p-6 sm:p-10 shadow-md relative overflow-hidden font-serif">
        {/* Top Watermark / Header */}
        <div className="border-b-2 border-forest/20 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[11px] font-sans font-bold tracking-widest text-moss uppercase block">
              Official Manuscript Review Slip
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-forest tracking-tight">
              THE MIDNIGHT QUILL
            </h1>
            <p className="text-xs text-ink/70 font-sans mt-0.5">
              Ref: {submission.id} &bull; Author: {user?.name} &bull; Words: {submission.wordCount}
            </p>
          </div>

          <div className="self-center md:self-auto">
            <VerdictStamp
              verdict={report.verdict}
              combinedScore={Math.round(report.combinedScore)}
              size="md"
            />
          </div>
        </div>

        {/* Agreement summary */}
        <div className="mb-8 p-4 bg-white/70 border border-moss/20 rounded-lg flex items-center justify-between font-sans text-xs">
          <div>
            <span className="text-ink/60">Detector Agreement Level: </span>
            <span className="font-bold text-forest uppercase">{report.agreement}</span>
          </div>
          <div className="text-[11px] text-ink/50">
            Evaluated on {new Date(report.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Detector Breakdown Grid */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-forest uppercase tracking-wider mb-3">
            Algorithmic Breakdown (Individual Scores)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-sans">
            {providerResults.map((pr: any) => (
              <div
                key={pr.id}
                className="p-3 bg-white/80 border border-moss/20 rounded-lg shadow-2xs space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-forest">{pr.provider}</span>
                  <span className="text-[10px] uppercase font-bold text-moss">{pr.label}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-moss/10 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        (pr.aiScore || 0) > 60
                          ? 'bg-red-700'
                          : (pr.aiScore || 0) > 20
                          ? 'bg-amber'
                          : 'bg-moss'
                      }`}
                      style={{ width: `${pr.aiScore || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-ink w-8 text-right">
                    {pr.aiScore !== null ? `${pr.aiScore}%` : 'N/A'}
                  </span>
                </div>

                <div className="text-[10px] text-ink/50 flex justify-between">
                  <span>Latency: {pr.latencyMs || 0}ms</span>
                  <span>Status: {pr.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluated Manuscript Text Appendix */}
        <div className="mt-8 pt-6 border-t border-forest/20">
          <h3 className="text-sm font-bold text-forest uppercase tracking-wider mb-3">
            Evaluated Manuscript Excerpt
          </h3>
          <div className="p-5 bg-white/60 border border-moss/20 rounded-lg text-sm text-ink/90 leading-relaxed italic whitespace-pre-wrap">
            {submission.text}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-[11px] text-ink/50 border-t border-moss/10 pt-4 font-sans leading-normal">
          <strong>Editorial Notice:</strong> AI detection calculations represent statistical likelihoods derived from perplexity, burstiness, and neural pattern metrics. They should serve as editorial signals rather than sole definitive grounds for rejection.
        </div>
      </div>
    </div>
  );
};
