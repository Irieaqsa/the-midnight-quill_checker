import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StoryScroll } from '../components/StoryScroll';
import { Send, AlertCircle, CheckCircle2, Clock, Upload, ShieldCheck, Mail, Sparkles, BookOpen } from 'lucide-react';

export const CheckText: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pasteCardRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState('');
  const [genre, setGenre] = useState<'POEM' | 'MONOLOGUE' | 'ESSAY'>('POEM');
  const [deliveryEmail, setDeliveryEmail] = useState(true);
  const [deliveryEmailAddress, setDeliveryEmailAddress] = useState(user?.email || '');
  const [deliveryWhatsapp, setDeliveryWhatsapp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live status tracking after submission
  const [statusState, setStatusState] = useState<'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED' | null>(null);
  const [detectorStatus, setDetectorStatus] = useState<Record<string, { status: string; score?: number }>>({});

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > 10000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wordCount === 0) {
      setError('Please provide text to evaluate.');
      return;
    }
    if (isOverLimit) {
      setError('Maximum 10,000 words limit exceeded.');
      return;
    }
    if (!deliveryEmail && !deliveryWhatsapp) {
      setError('Choose at least one report destination: Email or WhatsApp.');
      return;
    }

    setError(null);
    setSubmitting(true);
    setStatusState('QUEUED');

    try {
      const res = await api.post('/submissions', {
        text,
        deliveryEmail,
        deliveryEmailAddress,
        deliveryWhatsapp,
      });

      const submissionId = res.data.submissionId;

      // Initialize only active engines from response
      const activeList: string[] = res.data.activeProviders || ['TMQ_SPECIAL', 'SAPLING'];
      const initialMap: Record<string, { status: string; score?: number }> = {};
      activeList.forEach((provName: string) => {
        initialMap[provName] = { status: 'PENDING' };
      });
      setDetectorStatus(initialMap);

      // Start SSE listening
      const token = localStorage.getItem('tmq_token') || localStorage.getItem('tmq_access_token') || '';
      const apiBase = 'https://tmq-authenticity-api.onrender.com/api';
      const eventSource = new EventSource(`${apiBase}/submissions/${submissionId}/events?token=${encodeURIComponent(token)}`);

      let completed = false;

      // Fast active polling fallback
      const pollInterval = setInterval(async () => {
        if (completed) {
          clearInterval(pollInterval);
          return;
        }
        try {
          const checkRes = await api.get(`/submissions/${submissionId}`);
          const sub = checkRes.data?.submission;
          if (sub && (sub.status === 'COMPLETE' || sub.status === 'FAILED')) {
            completed = true;
            clearInterval(pollInterval);
            try { eventSource.close(); } catch (e) {}
            navigate(`/report/${submissionId}`);
          }
        } catch (e) {
          // ignore transient poll error
        }
      }, 1200);

      // Timeout fallback safeguard
      setTimeout(() => {
        if (!completed) {
          completed = true;
          clearInterval(pollInterval);
          try { eventSource.close(); } catch (e) {}
          navigate(`/report/${submissionId}`);
        }
      }, 25000);

      eventSource.addEventListener('status', (e: any) => {
        const data = JSON.parse(e.data);
        setStatusState(data.status);
        if (data.status === 'COMPLETE' || data.status === 'FAILED') {
          completed = true;
          clearInterval(pollInterval);
          try { eventSource.close(); } catch (e) {}
          setTimeout(() => {
            navigate(`/report/${submissionId}`);
          }, 400);
        }
      });

      eventSource.addEventListener('detector', (e: any) => {
        const data = JSON.parse(e.data);
        setDetectorStatus((prev) => ({
          ...prev,
          [data.provider]: { status: data.status, score: data.aiScore },
        }));
      });

      eventSource.onerror = () => {
        eventSource.close();
      };
    } catch (err: any) {
      setError(err.response?.data?.error || 'Submission failed');
      setSubmitting(false);
      setStatusState(null);
    }
  };

  const handleSampleFill = () => {
    setText(
      `Is that red Blood on my hands?\nAren't I the same guy who offer lands.\nIs it so hard to let me live?\nWhy can't critics be fair under the sleeve.\n\nI hope someday I can live normally,\nI hope anyone be my true ally.\nBelieve me I do cry, Don't attack me always,\nJust lemme live a bit, I've to die anyways.\n\nTime and again histories repeat,\nWhy can't a new one call me and meet.\nIt seems Joy lost my location,\nAll the happiness slips as I have a lotion.`
    );
  };

  const scrollToDetector = () => {
    pasteCardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToStory = () => {
    storyRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-16 animate-fadeIn">
      {/* Hero Section per DESIGN.md Section 7 & 11 */}
      <div className="max-w-[720px] mx-auto space-y-6 pt-4 text-center sm:text-left">
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-brand block">
          The Midnight Quill
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-tmq-text-strong tracking-[-0.02em] leading-[1.05]">
          Writing Authenticity Detector
        </h1>
        <p className="text-[18px] text-tmq-text-muted leading-[1.55]">
          A calm, forensic review layer assessing 10 signal families, human counter-evidence, and 13 literary craft metrics.
        </p>

        {/* Hero two buttons per Section 11: "Read why we built this" and "Skip to the detector" */}
        <div className="flex flex-wrap items-center gap-3 pt-2 justify-center sm:justify-start">
          <button
            type="button"
            onClick={scrollToStory}
            className="btn-primary flex items-center space-x-2"
          >
            <BookOpen className="w-4 h-4 text-tmq-on-brand" />
            <span>Read why we built this</span>
          </button>
          <button
            type="button"
            onClick={scrollToDetector}
            className="btn-ghost flex items-center space-x-1.5 text-tmq-text-muted hover:text-tmq-text border border-tmq-border-strong rounded-btn px-4 py-2"
          >
            <span>Skip to the detector &darr;</span>
          </button>
        </div>
      </div>

      {/* Full-width scroll story: Section 11 */}
      <div ref={storyRef} className="w-full">
        <StoryScroll onSkipToDetector={scrollToDetector} />
      </div>

      {/* Main Paste Card Area (Anchored at 720px width) */}
      <div ref={pasteCardRef} className="max-w-[720px] mx-auto space-y-6 pt-6">
        <div className="border-b border-tmq-border-subtle pb-4">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-text-soft block">
            Manuscript Desk
          </span>
          <h2 className="text-[28px] font-semibold text-tmq-text-strong tracking-[-0.015em]">
            Submit Text for Analysis
          </h2>
        </div>

      {error && (
        <div className="bg-tmq-surface-2 border border-tmq-danger/30 rounded-md p-4 text-[14px] text-tmq-danger flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Paste Card per DESIGN.md */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="tmq-card space-y-4">
          {/* Genre Selector + Baseline Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tmq-border-subtle pb-3">
            <div className="flex items-center space-x-1.5 bg-tmq-surface-2 p-1 rounded-btn border border-tmq-border">
              {(['POEM', 'MONOLOGUE', 'ESSAY'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`px-3 py-1 rounded-sm text-[12px] font-semibold transition-colors ${
                    genre === g
                      ? 'bg-tmq-surface-3 text-tmq-text-strong shadow-sm'
                      : 'text-tmq-text-muted hover:text-tmq-text'
                  }`}
                >
                  {g.charAt(0) + g.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSampleFill}
                className="btn-ghost text-[13px] text-tmq-brand hover:underline"
              >
                Insert Sample Draft
              </button>
              <button
                type="button"
                className="btn-secondary text-[12px] py-1 px-2.5 flex items-center space-x-1"
                title="Optional verified baseline comparison"
              >
                <Upload className="w-3.5 h-3.5 text-tmq-text-muted" />
                <span>Upload baseline</span>
              </button>
            </div>
          </div>

          {/* Large Textarea min 280px tall per DESIGN.md */}
          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste poem, chapter draft, essay, or monologue excerpt here..."
              rows={12}
              className="tmq-input min-h-[280px] text-[16px] leading-[1.55] font-sans resize-y bg-tmq-surface-2 placeholder:text-tmq-text-faint"
            />

            {/* Word count & intake hint */}
            <div className="flex items-center justify-between text-[12px] text-tmq-text-soft">
              <span>
                {wordCount} words {wordCount > 0 && <span className="text-tmq-text-faint font-mono">&bull; {(text.length).toLocaleString()} chars</span>}
              </span>
              {wordCount > 0 && wordCount < 150 && (
                <span className="text-tmq-warning flex items-center gap-1">
                  <span>Add a little more text for a reliable read. (150+ words recommended)</span>
                </span>
              )}
              {isOverLimit && (
                <span className="text-tmq-danger font-semibold">Exceeds 10,000 word limit.</span>
              )}
            </div>
          </div>

          {/* Delivery destination settings */}
          <div className="pt-3 border-t border-tmq-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="deliveryEmail"
                checked={deliveryEmail}
                onChange={(e) => setDeliveryEmail(e.target.checked)}
                className="rounded text-tmq-brand focus:ring-tmq-brand bg-tmq-surface-2 border-tmq-border-strong w-4 h-4 cursor-pointer"
              />
              <label htmlFor="deliveryEmail" className="text-tmq-text cursor-pointer flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-tmq-text-muted" />
                <span>Deliver verdict to Email</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="deliveryWhatsapp"
                checked={deliveryWhatsapp}
                onChange={(e) => setDeliveryWhatsapp(e.target.checked)}
                className="rounded text-tmq-brand focus:ring-tmq-brand bg-tmq-surface-2 border-tmq-border-strong w-4 h-4 cursor-pointer"
              />
              <label htmlFor="deliveryWhatsapp" className="text-tmq-text cursor-pointer">
                <span>Deliver link to WhatsApp</span>
              </label>
            </div>
          </div>
        </div>

        {/* Primary Action Button per DESIGN.md: Green is the single loud element */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || isOverLimit || wordCount === 0}
            className="btn-primary w-full sm:w-auto px-8 py-3 text-[15px] font-semibold tracking-[-0.005em] shadow-standard"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin text-tmq-on-brand" />
                <span>Analysing writing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-tmq-on-brand" />
                <span>Analyse writing</span>
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Live Pipeline Monitor per DESIGN.md */}
      {submitting && (
        <div className="tmq-card border-tmq-border-strong space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-tmq-text-strong flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-tmq-brand" />
              <span>Multi-Engine Inspection Active</span>
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-pill bg-tmq-brand-soft text-tmq-brand uppercase">
              {statusState || 'PROCESSING'}
            </span>
          </div>

          <p className="text-[13px] text-tmq-text-muted">
            Manuscript fanned out across activated linguistic detection engines. Building consolidated report slip.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(detectorStatus).map(([name, info]) => (
              <div key={name} className="bg-tmq-surface-2 p-3 rounded-md border border-tmq-border flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-tmq-text-strong">{name}</div>
                  <div className="text-[11px] text-tmq-text-soft font-mono">
                    {info.score !== undefined ? `${info.score}% AI` : info.status}
                  </div>
                </div>
                <div>
                  {info.status === 'OK' ? (
                    <CheckCircle2 className="w-4 h-4 text-tmq-brand" />
                  ) : (
                    <Clock className="w-4 h-4 text-tmq-warning animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
