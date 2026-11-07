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

  // Build WhatsApp share link
  const pdfDownloadUrl = report.pdfUrl 
    ? `https://tmq-authenticity-api.onrender.com${report.pdfUrl.startsWith('/') ? '' : '/'}${report.pdfUrl}`
    : '';

  const waText = encodeURIComponent(
    `*The Midnight Quill - Authenticity Desk Report*\n\n` +
    `*Submission ID:* #${submission.id.slice(0, 8)}\n` +
    `*Combined AI Likelihood:* ${report.combinedScore}%\n` +
    `*Editorial Verdict:* ${report.verdict}\n` +
    `*Detector Agreement:* ${report.agreement}\n` +
    `*Word Count:* ${submission.wordCount} words\n\n` +
    (pdfDownloadUrl ? `📄 *Download Official PDF Certificate:*\n${pdfDownloadUrl}\n\n` : '') +
    `View on Desk: https://tmq-checker.vercel.app/report/${submission.id}`
  );

  const userPhone = user?.whatsappNumber ? user.whatsappNumber.replace(/\D/g, '') : '';
  const waUrl = userPhone 
    ? `https://wa.me/${userPhone}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  // Parse TMQ Special Algorithm data if present in provider results
  const tmqSpecialRaw = providerResults.find((p: any) => p.provider === 'TMQ_SPECIAL')?.rawResponse;
  const tmqSpecialData = tmqSpecialRaw
    ? (() => {
        try {
          return typeof tmqSpecialRaw === 'string' ? JSON.parse(tmqSpecialRaw) : tmqSpecialRaw;
        } catch {
          return null;
        }
      })()
    : null;
  return (
    <div className="space-y-6">
      {/* Top back action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/history"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-moss hover:text-forest"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ledger</span>
        </Link>

        <div className="flex items-center space-x-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#25D366] text-white rounded-lg text-xs font-bold shadow hover:bg-[#1EBE5D] transition font-sans"
            title="Open report slip and PDF certificate in WhatsApp"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Send to WhatsApp</span>
          </a>

          {report.pdfUrl && (
            <a
              href={pdfDownloadUrl}
              download={`TMQ_Report_${submission.id}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-forest text-parchment rounded-lg text-xs font-bold shadow hover:bg-forest/90 transition font-serif"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Certificate (PDF)</span>
            </a>
          )}
        </div>
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

                {/* TMQ Special Editorial Algorithm Section (Part 1, 2, 3) */}
        {tmqSpecialData && (
          <div className="mb-8 p-6 bg-white/90 border-2 border-forest/30 rounded-xl shadow-sm space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-forest/20 pb-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 bg-forest text-parchment rounded text-[10px] font-bold tracking-widest uppercase mb-1">
                  TMQ Proprietary Forensic Engine
                </div>
                <h3 className="font-serif text-xl font-bold text-forest">TMQ Authenticity & Review Algorithm (v1)</h3>
                <p className="text-xs text-ink/70">
                  Genre: <span className="font-bold text-forest">{tmqSpecialData.genre}</span> &bull; Words: {tmqSpecialData.wordCount}
                  {tmqSpecialData.intakeNote && <span className="text-amber ml-2 font-medium">({tmqSpecialData.intakeNote})</span>}
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  tmqSpecialData.band === 'Likely human' || tmqSpecialData.band === 'Probably human'
                    ? 'bg-moss/20 text-forest border border-moss/40'
                    : tmqSpecialData.band === 'Uncertain'
                    ? 'bg-amber/20 text-amber border border-amber/40'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {tmqSpecialData.band} ({tmqSpecialData.finalScore}/100)
                </span>
                <p className="text-[11px] text-ink/60 mt-0.5">Action: {tmqSpecialData.action}</p>
              </div>
            </div>

            {/* Part 2: Quality & Emotional Bias */}
            {tmqSpecialData.quality && (
              <div className="space-y-4">
                <div className="p-4 bg-parchment/60 border border-moss/20 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-ink/60">Quality Rating</div>
                    <div className="font-serif text-2xl font-bold text-forest">
                      {tmqSpecialData.quality.finalRating}/100
                    </div>
                    <div className="text-[10px] font-semibold text-moss mt-0.5">
                      Band: {tmqSpecialData.quality.band || 'Standard'}
                    </div>
                    <div className="text-[9px] text-ink/50">
                      Raw: {tmqSpecialData.quality.earnedRaw || tmqSpecialData.quality.baseRating} / {tmqSpecialData.quality.availableRaw || 70} ({tmqSpecialData.quality.percentage || tmqSpecialData.quality.baseRating}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-ink/60">Emotional Impact</div>
                    <div className="font-mono text-xl font-bold text-forest">{tmqSpecialData.quality.emotionalImpact}/10</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-ink/60">Earned Emotion</div>
                    <div className="font-mono text-xl font-bold text-forest">{tmqSpecialData.quality.earnedEmotion}/10</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-ink/60">Emotional Bias (EB)</div>
                    <div className={`font-mono text-xl font-bold ${tmqSpecialData.quality.emotionalBias > 2 ? 'text-amber' : 'text-forest'}`}>
                      {tmqSpecialData.quality.emotionalBias > 0 ? `+${tmqSpecialData.quality.emotionalBias}` : tmqSpecialData.quality.emotionalBias}
                    </div>
                    <div className="text-[9px] text-ink/50">Adj: {tmqSpecialData.quality.ebAdjustment > 0 ? `+${tmqSpecialData.quality.ebAdjustment}` : tmqSpecialData.quality.ebAdjustment} pts</div>
                  </div>
                </div>

                {/* Gate Alerts if applicable */}
                {tmqSpecialData.quality.masterworkGated && (
                  <div className="p-3 bg-amber/10 border-l-4 border-amber rounded text-xs text-ink/80">
                    <strong>Masterwork Gate:</strong> {tmqSpecialData.quality.masterworkGateNotes}
                  </div>
                )}
                {tmqSpecialData.quality.authenticityHeld && (
                  <div className="p-3 bg-red-100 border-l-4 border-red-700 rounded text-xs text-red-900">
                    <strong>Authenticity Gate:</strong> Part 1 returned {tmqSpecialData.band}. Quality rating held until human review.
                  </div>
                )}

                {/* 13 Descriptive Metrics Rubric */}
                {tmqSpecialData.quality.metrics && tmqSpecialData.quality.metrics.length > 0 && (
                  <div className="border border-moss/20 rounded-lg overflow-hidden bg-white/50">
                    <div className="px-4 py-2.5 bg-sage/20 border-b border-moss/20 flex justify-between items-center">
                      <h5 className="text-xs font-bold font-serif text-forest uppercase tracking-wider">
                        13 TMQ Quality Metrics (Scored out of {tmqSpecialData.quality.availableRaw || 70} Raw Points)
                      </h5>
                      <span className="text-[10px] font-mono text-ink/60">
                        Total Earned: {tmqSpecialData.quality.earnedRaw} pts
                      </span>
                    </div>

                    <div className="divide-y divide-moss/10 text-xs">
                      {tmqSpecialData.quality.metrics.map((m: any, idx: number) => (
                        <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-parchment/40 transition">
                          <div className="space-y-0.5 max-w-md">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-forest">{m.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-forest/10 text-forest rounded font-mono uppercase">
                                {m.group}
                              </span>
                              {m.isNA && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-amber/20 text-ink rounded font-mono">
                                  N/A (Free verse/prose)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-ink/70 italic">
                              Evidence: {m.evidence}
                            </p>
                          </div>

                          <div className="flex items-center space-x-3 self-end sm:self-center">
                            <span className="font-mono text-xs font-bold text-forest">
                              {m.isNA ? '—' : `${m.score} / ${m.max}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* The Three Questions Summary */}
                {tmqSpecialData.quality.threeQuestions && (
                  <div className="p-3 bg-forest/5 border border-moss/20 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="font-bold text-forest block">1. Is it True?</span>
                      <span className="text-ink/80 text-[11px]">{tmqSpecialData.quality.threeQuestions.isItTrue?.note || 'Voice, Specificity & Containment aligned'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-forest block">2. Is it Specific?</span>
                      <span className="text-ink/80 text-[11px]">{tmqSpecialData.quality.threeQuestions.isItSpecific?.note || 'Anchored in concrete detail'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-forest block">3. Does it Move?</span>
                      <span className="text-ink/80 text-[11px]">{tmqSpecialData.quality.threeQuestions.doesItMove?.note || 'Iceberg depth & musical pivot intact'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Part 3: Computable Linguistic Features */}
            {tmqSpecialData.features && (
              <div>
                <h4 className="text-xs font-bold text-forest uppercase tracking-wider mb-2">Computable Forensic Features</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-white border border-moss/10 rounded">
                    <span className="text-ink/60 block text-[10px]">Sentence Length SD:</span>
                    <span className="font-bold text-forest">{tmqSpecialData.features.sentenceLengthSd} words</span>
                  </div>
                  <div className="p-2.5 bg-white border border-moss/10 rounded">
                    <span className="text-ink/60 block text-[10px]">Type-Token Ratio:</span>
                    <span className="font-bold text-forest">{tmqSpecialData.features.typeTokenRatio}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-moss/10 rounded">
                    <span className="text-ink/60 block text-[10px]">Em-dash per 1k:</span>
                    <span className="font-bold text-forest">{tmqSpecialData.features.emDashPer1000}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-moss/10 rounded">
                    <span className="text-ink/60 block text-[10px]">Named Entity Density:</span>
                    <span className="font-bold text-forest">{tmqSpecialData.features.namedEntityDensity}/1k</span>
                  </div>
                </div>
              </div>
            )}

            {/* Part 1: Signal Families & Counter-Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-forest uppercase tracking-wider mb-2">10 Signal Families (AI Indicators)</h4>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(tmqSpecialData.signalFamilies || {}).map(([key, val]: any) => (
                    <div key={key} className="p-2 bg-white/80 border border-moss/15 rounded flex justify-between items-center">
                      <span className="text-ink/80 text-[11px] truncate max-w-[220px]">
                        {key.replace('family', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-ink/40">(Wt: {val.weight})</span>
                        <span className={`font-mono font-bold text-xs ${val.score >= 6 ? 'text-red-700' : val.score >= 3 ? 'text-amber' : 'text-forest'}`}>
                          {val.score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-forest uppercase tracking-wider mb-2">Human Counter-Evidence Subtractions</h4>
                <div className="p-3 bg-moss/5 border border-moss/20 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between items-center text-moss font-bold border-b border-moss/20 pb-1.5">
                    <span>Evidence Credit Subtracted:</span>
                    <span className="font-mono text-sm">-{tmqSpecialData.humanCounterEvidence?.pointsSubtracted || 0} pts</span>
                  </div>
                  {tmqSpecialData.humanCounterEvidence?.items?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-ink/80 text-[11px]">
                      {tmqSpecialData.humanCounterEvidence.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-ink/50 italic">No counter-evidence particulars identified.</p>
                  )}

                  <div className="pt-2 border-t border-moss/10 text-[10px] text-ink/60">
                    <strong>Corroboration Rule:</strong> {tmqSpecialData.corroborated ? 'Met (>= 3 families >= 6)' : 'Protected (Single signals cannot trigger suspicion)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
