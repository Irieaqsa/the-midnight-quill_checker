import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  Download,
  AlertCircle,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMetrics, setExpandedMetrics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/submissions/${id}`);
        setSubmission(res.data.submission);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load report slip');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const toggleMetric = (name: string) => {
    setExpandedMetrics(prev => ({ ...prev, [name]: !prev[name] }));
  };

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto py-16 text-center space-y-4">
        <div className="h-6 w-48 bg-tmq-surface-3 rounded animate-pulse mx-auto" />
        <div className="h-4 w-72 bg-tmq-surface-2 rounded animate-pulse mx-auto" />
        <div className="h-64 w-full bg-tmq-surface rounded-lg animate-pulse mt-6" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-[720px] mx-auto py-12">
        <div className="tmq-card border-tmq-danger/30 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-tmq-danger mx-auto" />
          <h2 className="text-[20px] font-semibold text-tmq-text-strong">Unable to Load Report</h2>
          <p className="text-[14px] text-tmq-text-muted">{error || 'Record does not exist'}</p>
          <Link to="/check" className="btn-secondary inline-block">
            Return to Authenticity Desk
          </Link>
        </div>
      </div>
    );
  }

  const { report, providerResults } = submission;
  const tmqSpecialResult = providerResults?.find((p: any) => p.provider === 'TMQ_SPECIAL');
  let tmqSpecialData: any = null;
  if (tmqSpecialResult?.rawResponse) {
    try {
      tmqSpecialData = JSON.parse(tmqSpecialResult.rawResponse);
    } catch (e) {}
  }

  const combinedScore = report?.combinedScore ?? 0;
  const verdict = report?.verdict || 'MIXED';

  // Band styles per DESIGN.md
  // Likely human & Probably human -> success green
  // Uncertain -> warning
  // Suspicious -> warning with strong border
  // Likely AI -> danger
  const isHuman = combinedScore <= 45;
  const isUncertain = combinedScore > 45 && combinedScore <= 60;
  const isSuspicious = combinedScore > 60 && combinedScore <= 75;
  const isLikelyAI = combinedScore > 75;

  const bandLabel = tmqSpecialData?.band || (
    isHuman ? (combinedScore <= 25 ? 'Likely human' : 'Probably human') :
    isUncertain ? 'Uncertain' :
    isSuspicious ? 'Suspicious' : 'Likely AI'
  );

  const bandColor = isHuman ? 'text-tmq-brand' : isLikelyAI ? 'text-tmq-danger' : 'text-tmq-warning';
  const gaugeColor = isHuman ? '#34b059' : isLikelyAI ? '#e05656' : '#e0a020';

  const pdfFullUrl = `https://tmq-authenticity-api.onrender.com/uploads/reports/report_${submission.id}.pdf`;

  // WhatsApp click-to-chat
  const waSummary = encodeURIComponent(
    `*The Midnight Quill — Manuscript Authenticity Slip*\n` +
    `Ref: ${submission.id}\n` +
    `AI Likelihood: ${combinedScore}% (${bandLabel})\n` +
    `View Report: https://tmq-checker.vercel.app/report/${submission.id}\n` +
    `Download PDF: ${pdfFullUrl}`
  );
  const waLink = `https://wa.me/?text=${waSummary}`;

  return (
    <div className="max-w-[720px] mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-tmq-border-subtle">
        <Link
          to="/history"
          className="inline-flex items-center space-x-1.5 text-[14px] text-tmq-text-muted hover:text-tmq-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ledger</span>
        </Link>

        <div className="flex items-center space-x-2.5">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-[13px] px-3 py-1.5 flex items-center space-x-1.5"
            title="Share verdict to WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-tmq-brand" />
            <span>WhatsApp Slip</span>
          </a>

          <a
            href={pdfFullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-[13px] px-3 py-1.5 flex items-center space-x-1.5"
            download
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* Primary Authenticity Result Card per DESIGN.md */}
      <div className="tmq-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-text-soft block">
              Official Review Slip
            </span>
            <h2 className="text-[28px] font-semibold text-tmq-text-strong tracking-[-0.015em] mt-0.5">
              Authenticity Assessment
            </h2>
            <div className="text-[12px] text-tmq-text-muted font-mono mt-1 space-x-2">
              <span>Ref: {submission.id.substring(0, 13)}...</span>
              <span>&bull;</span>
              <span>Words: {submission.wordCount}</span>
              <span>&bull;</span>
              <span>{submission.user?.name || 'Author'}</span>
            </div>
          </div>

          {/* Probability Gauge / Band */}
          <div className="flex items-center space-x-4 p-3 bg-tmq-surface-2 border border-tmq-border rounded-lg self-start sm:self-auto">
            <div className="text-right">
              <div className={`text-[20px] font-bold ${bandColor} flex items-center gap-1.5 justify-end`}>
                <ShieldCheck className="w-5 h-5" />
                <span>{bandLabel}</span>
              </div>
              <div className="text-[12px] font-mono text-tmq-text-muted">
                Confidence: <strong className="text-tmq-text-strong">{combinedScore}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal probability bar with band edge ticks */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-tmq-surface-2 rounded-full overflow-hidden p-0.5 border border-tmq-border relative">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, Math.min(100, combinedScore))}%`, backgroundColor: gaugeColor }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-tmq-text-soft px-0.5">
            <span>0% Human</span>
            <span className="hidden sm:inline">25%</span>
            <span>45% Uncertain</span>
            <span className="hidden sm:inline">75% Suspicious</span>
            <span>100% AI</span>
          </div>
        </div>

        {/* Mandatory Policy Banner per DESIGN.md: "This is a probability, not proof. A human reviews every flag." */}
        <div className="p-3 bg-tmq-surface-2 border border-tmq-border-strong rounded-md flex items-center gap-2.5 text-[13px] text-tmq-text-muted">
          <Info className="w-4 h-4 text-tmq-brand flex-shrink-0" />
          <span>This is a probability, not proof. A human reviews every flag.</span>
        </div>

        {/* Recommended Editorial Action per DESIGN.md */}
        {tmqSpecialData?.action && (
          <div className="text-[13px] text-tmq-text-muted pt-2 border-t border-tmq-border-subtle">
            <strong className="text-tmq-text-strong">Recommended Action:</strong> {tmqSpecialData.action}
          </div>
        )}
      </div>

      {/* Multi-Engine Individual Breakdown */}
      {providerResults && providerResults.length > 0 && (
        <div className="tmq-card space-y-4">
          <h3 className="text-[16px] font-semibold text-tmq-text-strong">
            Individual Engine Scores
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {providerResults.map((pr: any) => (
              <div key={pr.id} className="p-3 bg-tmq-surface-2 border border-tmq-border rounded-md flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-tmq-text-strong">{pr.provider}</div>
                  <div className="text-[11px] font-mono text-tmq-text-soft">
                    Latency: {pr.latencyMs || 0}ms &bull; Status: {pr.status}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[16px] font-mono font-bold text-tmq-text-strong">
                    {pr.aiScore !== null ? `${pr.aiScore}%` : 'N/A'}
                  </span>
                  <div className="text-[11px] uppercase font-semibold text-tmq-text-muted">
                    {pr.label || 'PROCESSED'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Part 1: Evidence List & Human Counter-Evidence Cards */}
      {tmqSpecialData && (
        <>
          {/* 10 Signal Families Evidence List */}
          <div className="tmq-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-tmq-text-strong">
                Signal Family Analysis (Evidence Quotes)
              </h3>
              <span className="text-[11px] font-mono text-tmq-text-soft">
                Corroboration: {tmqSpecialData.corroborated ? 'Met' : 'Protected'}
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(tmqSpecialData.signalFamilies || {}).map(([key, val]: any) => (
                <div key={key} className="p-3.5 bg-tmq-surface-2 border border-tmq-border rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-tmq-text">
                      {key.replace('family', '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-tmq-text-soft font-mono">Weight: {val.weight}</span>
                      <span className={`text-[12px] font-mono font-bold px-2 py-0.5 rounded ${val.score >= 6 ? 'bg-tmq-danger/20 text-tmq-danger' : val.score >= 3 ? 'bg-tmq-warning/20 text-tmq-warning' : 'bg-tmq-brand-soft text-tmq-brand'}`}>
                        {val.score}/10
                      </span>
                    </div>
                  </div>

                  {val.evidence && val.evidence.length > 0 && (
                    <div className="space-y-1">
                      {val.evidence.map((ev: string, idx: number) => (
                        <div key={idx} className="pl-3 border-l-2 border-tmq-border-strong text-[12px] font-mono text-tmq-text-muted py-0.5">
                          {ev}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Signs of a Human Hand (Counter-Evidence Card per DESIGN.md) */}
          <div className="tmq-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-tmq-text-strong flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-tmq-brand" />
                <span>Signs of a human hand</span>
              </h3>
              <span className="text-[12px] font-mono font-bold text-tmq-brand">
                -{tmqSpecialData.humanCounterEvidence?.pointsSubtracted || 0} pts
              </span>
            </div>

            {tmqSpecialData.humanCounterEvidence?.items?.length > 0 ? (
              <ul className="space-y-1.5 text-[13px] text-tmq-text-muted list-disc list-inside">
                {tmqSpecialData.humanCounterEvidence.items.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-tmq-text-soft italic">No explicit human particulars detected.</p>
            )}
          </div>

          {/* Part 2: Quality Rating Result Card per DESIGN.md */}
          {tmqSpecialData.quality && (
            <div className="tmq-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tmq-border-subtle pb-4">
                <div>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-brand block">
                    Literary Quality Assessment
                  </span>
                  <div className="flex items-baseline space-x-3 mt-1">
                    <span className="text-4xl sm:text-5xl font-bold text-tmq-text-strong font-mono">
                      {tmqSpecialData.quality.finalRating}
                    </span>
                    <span className="text-[18px] text-tmq-text-muted font-medium">/ 100</span>
                    <span className="text-[14px] font-semibold px-2.5 py-0.5 rounded-pill bg-tmq-brand-soft text-tmq-brand">
                      {tmqSpecialData.quality.band}
                    </span>
                  </div>
                </div>

                {/* Emotional Bias Chip per DESIGN.md */}
                <div className="p-2.5 bg-tmq-surface-2 border border-tmq-border rounded-md text-right">
                  <div className="text-[11px] uppercase tracking-wider text-tmq-text-soft font-semibold">
                    Emotional Bias
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 justify-end">
                    <span className="text-[13px] font-semibold text-tmq-text-strong">
                      {tmqSpecialData.quality.emotionalBias > 2 ? 'Leaning' : tmqSpecialData.quality.emotionalBias < -2 ? 'Understated' : 'Earned'}
                    </span>
                    <span className="text-[11px] font-mono text-tmq-text-muted">
                      ({tmqSpecialData.quality.emotionalBias > 0 ? `+${tmqSpecialData.quality.emotionalBias}` : tmqSpecialData.quality.emotionalBias})
                    </span>
                  </div>
                </div>
              </div>

              {/* 13-Metric Grid of Horizontal Bars grouped by category */}
              {tmqSpecialData.quality.metrics && (
                <div className="space-y-4">
                  <h4 className="text-[14px] font-semibold text-tmq-text-strong">
                    13 Craft Metrics ({tmqSpecialData.quality.earnedRaw} / {tmqSpecialData.quality.availableRaw} pts)
                  </h4>

                  <div className="space-y-2.5">
                    {tmqSpecialData.quality.metrics.map((m: any, idx: number) => {
                      const isExpanded = Boolean(expandedMetrics[m.name]);
                      const pct = m.isNA ? 0 : (m.score / m.max) * 100;
                      return (
                        <div key={idx} className="p-3 bg-tmq-surface-2 border border-tmq-border rounded-md space-y-2">
                          <div className="flex items-center justify-between text-[13px]">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-tmq-text-strong">{m.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-tmq-surface-3 text-tmq-text-soft uppercase">
                                {m.group}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {m.isNA ? (
                                <span className="text-[11px] font-mono text-tmq-text-soft">N/A</span>
                              ) : (
                                <span className="text-[12px] font-mono font-bold text-tmq-text-strong">
                                  {m.score} / {m.max}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleMetric(m.name)}
                                className="text-tmq-text-soft hover:text-tmq-text p-0.5"
                                title="Toggle evidence quote"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Progress bar */}
                          {!m.isNA && (
                            <div className="h-1.5 w-full bg-tmq-surface-3 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-tmq-brand rounded-full transition-all"
                                style={{ width: `${Math.max(5, pct)}%` }}
                              />
                            </div>
                          )}

                          {/* Quoted Evidence Line (collapsed by default per DESIGN.md) */}
                          {isExpanded && (
                            <div className="pl-3 border-l-2 border-tmq-brand text-[12px] font-mono text-tmq-text-muted py-1 bg-tmq-surface-3/40 rounded-r">
                              &ldquo;{m.evidence}&rdquo;
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Evaluated Manuscript Reading Excerpt (720px reading width per DESIGN.md) */}
      <div className="tmq-card space-y-3">
        <h3 className="text-[14px] font-semibold uppercase tracking-[0.06em] text-tmq-text-soft">
          Evaluated Manuscript Excerpt
        </h3>
        <div className="p-4 bg-tmq-surface-2 border border-tmq-border rounded-md text-[16px] leading-[1.65] text-tmq-text font-sans whitespace-pre-wrap selection:bg-tmq-brand-soft">
          {submission.text}
        </div>
      </div>
    </div>
  );
};
