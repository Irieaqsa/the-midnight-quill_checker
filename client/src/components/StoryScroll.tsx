import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, Pause, Play, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface StoryScrollProps {
  onSkipToDetector: () => void;
}

export const StoryScroll: React.FC<StoryScrollProps> = ({ onSkipToDetector }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Chapter 1 Typing state
  const [typedText, setTypedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  // Typing effect for Chapter 1 per spec:
  // "I don't know how to tell you this" pauses, backspaces over "tell", and retypes it as "say"
  useEffect(() => {
    if (isPaused) return;

    let timeoutId: NodeJS.Timeout;
    const fullFirst = "I don't know how to tell you this";
    let isCancelled = false;

    const runTypingSequence = async () => {
      setTypedText('');

      // Type initial sentence
      for (let i = 0; i <= fullFirst.length; i++) {
        if (isCancelled) return;
        setTypedText(fullFirst.slice(0, i));
        const delay = Math.random() * (140 - 40) + 40;
        await new Promise(r => { timeoutId = setTimeout(r, delay); });
      }

      // Deliberate pause
      await new Promise(r => { timeoutId = setTimeout(r, 600); });
      if (isCancelled) return;

      // Backspace "tell you this" -> backspace 13 chars
      for (let i = fullFirst.length; i >= fullFirst.length - 13; i--) {
        if (isCancelled) return;
        setTypedText(fullFirst.slice(0, i));
        await new Promise(r => { timeoutId = setTimeout(r, 70); });
      }

      // Retype "say this"
      const rest = "say this.";
      const base = "I don't know how to ";
      for (let i = 0; i <= rest.length; i++) {
        if (isCancelled) return;
        setTypedText(base + rest.slice(0, i));
        const delay = Math.random() * (140 - 50) + 50;
        await new Promise(r => { timeoutId = setTimeout(r, delay); });
      }
    };

    runTypingSequence();

    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      clearInterval(cursorInterval);
    };
  }, [isPaused]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const chapters = gsap.utils.toArray<HTMLElement>('.story-chapter');

      // Scroll progress line
      if (progressBarRef.current && containerRef.current) {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.transform = `scaleY(${self.progress})`;
            }
          },
        });
      }

      // Pin each chapter for desktop (> 640px)
      const mm = gsap.matchMedia();

      mm.add('(min-width: 641px)', () => {
        chapters.forEach((chapter, i) => {
          ScrollTrigger.create({
            trigger: chapter,
            start: 'top top',
            end: '+=130%',
            pin: true,
            pinSpacing: true,
            scrub: 0.6,
            onEnter: () => setCurrentChapter(i + 1),
            onEnterBack: () => setCurrentChapter(i + 1),
          });

          // Entry and exit animations
          const content = chapter.querySelector('.chapter-content');
          if (content) {
            gsap.fromTo(
              content,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: chapter,
                  start: 'top 70%',
                  end: 'top 20%',
                  scrub: 0.6,
                },
              }
            );
          }
        });
      });

      mm.add('(max-width: 640px)', () => {
        // Mobile simple fade & rise without pinning
        chapters.forEach((chapter, i) => {
          ScrollTrigger.create({
            trigger: chapter,
            start: 'top 80%',
            onEnter: () => setCurrentChapter(i + 1),
          });
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full border-y border-tmq-border bg-tmq-bg selection:bg-tmq-brand-soft">
      {/* 2px Green Progress Line on the left edge per spec */}
      <div className="fixed left-0 top-0 bottom-0 w-[2px] bg-tmq-border-subtle z-40 hidden sm:block">
        <div
          ref={progressBarRef}
          className="w-full bg-tmq-brand origin-top h-full transition-transform duration-75"
          style={{ transform: 'scaleY(0)' }}
        />
      </div>

      {/* Floating Story Header / Controls */}
      <div className="sticky top-20 z-30 max-w-[1280px] mx-auto px-6 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-3 bg-tmq-surface/80 backdrop-blur-md px-3 py-1.5 rounded-pill border border-tmq-border">
          <span className="text-[12px] font-mono font-semibold text-tmq-brand tracking-[0.06em]">
            0{currentChapter} / 07
          </span>
          <span className="text-tmq-border-strong">|</span>
          <span className="text-[12px] text-tmq-text-muted hidden sm:inline">Why Human Writing Matters</span>
        </div>

        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPaused(p => !p)}
            className="p-1.5 rounded-btn bg-tmq-surface/80 backdrop-blur-md border border-tmq-border text-tmq-text-soft hover:text-tmq-text transition-colors text-[12px] flex items-center gap-1.5"
            aria-label="Pause animations"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-tmq-brand" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            type="button"
            onClick={onSkipToDetector}
            className="btn-secondary text-[12px] py-1.5 px-3"
          >
            Skip to detector
          </button>
        </div>
      </div>

      {/* Chapter 01 / 07: Every sentence began as someone's breath */}
      <section className="story-chapter min-h-screen flex items-center justify-center px-6 py-20 relative">
        <div className="chapter-content max-w-[720px] mx-auto space-y-6 text-center">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-brand block">
            01 / 07 &mdash; The Origin
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-tmq-text-strong tracking-[-0.02em] leading-[1.05]">
            Every sentence began as someone's breath.
          </h2>
          <p className="text-[18px] text-tmq-text-muted leading-[1.55] max-w-[600px] mx-auto">
            A hand hesitates. A word is wrong. It is crossed out and tried again.
          </p>

          {/* Typing visual per spec */}
          <div className="mt-12 p-6 bg-tmq-surface border border-tmq-border rounded-lg text-left max-w-[540px] mx-auto shadow-standard">
            <span className="text-[11px] font-mono uppercase text-tmq-text-soft block mb-2">Live Breath</span>
            <div className="font-mono text-[18px] text-tmq-text min-h-[48px] flex items-center" aria-label="I don't know how to say this.">
              <span>{typedText}</span>
              <span className={`inline-block w-2 h-5 bg-tmq-brand ml-1 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 02 / 07: Then machines learned to sound like us */}
      <section className="story-chapter min-h-screen flex items-center justify-center px-6 py-20 relative">
        <div className="chapter-content max-w-[720px] mx-auto space-y-8 text-center">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-text-soft block">
            02 / 07 &mdash; The Imitation
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-tmq-text-strong tracking-[-0.02em] leading-[1.05]">
            Then machines learned to sound like us.
          </h2>
          <p className="text-[18px] text-tmq-text-muted leading-[1.55]">
            Smooth. Fast. Fluent. And all of it the same.
          </p>

          {/* 8 text bars transitioning to grey grid */}
          <div className="max-w-[480px] mx-auto p-6 bg-tmq-surface border border-tmq-border rounded-lg space-y-3">
            <div className="flex justify-between items-center text-[11px] font-mono text-tmq-text-soft pb-2 border-b border-tmq-border-subtle">
              <span>Human cadence (varied)</span>
              <span>Machine cadence (uniform)</span>
            </div>
            <div className="space-y-2">
              {[88, 54, 76, 42, 92, 60, 80, 48].map((w, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div
                    className="h-2 rounded-full bg-tmq-brand transition-all duration-500"
                    style={{ width: `${w}%` }}
                  />
                  <div className="h-2 flex-1 rounded-full bg-tmq-surface-3 opacity-60" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 03 / 07: But it has never lost anyone */}
      <section className="story-chapter min-h-screen flex items-center justify-center px-6 py-20 relative">
        <div className="chapter-content max-w-[720px] mx-auto space-y-8 text-center">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-brand block">
            03 / 07 &mdash; The Unlived Life
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-tmq-text-strong tracking-[-0.02em] leading-[1.05]">
            But it has never lost anyone.
          </h2>

          <div className="space-y-4 max-w-[560px] mx-auto text-left">
            {[
              "It has never waited for a phone to ring.",
              "Never rehearsed an apology in the shower.",
              "Never said 'I'm fine' and meant 'please ask again.'"
            ].map((line, idx) => (
              <div key={idx} className="p-4 bg-tmq-surface border border-tmq-border rounded-md flex items-center space-x-3.5">
                {/* Pulsing green heartbeat dot next to flat grey */}
                <div className="w-2.5 h-2.5 rounded-full bg-tmq-brand animate-pulse flex-shrink-0" />
                <span className="text-[16px] text-tmq-text-strong font-medium">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter 04 / 07: Fluent is not the same as true */}
      <section className="story-chapter min-h-screen flex items-center justify-center px-6 py-20 relative">
        <div className="chapter-content max-w-[720px] mx-auto space-y-8 text-center">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-text-soft block">
            04 / 07 &mdash; The Contrast
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-tmq-text-strong tracking-[-0.02em] leading-[1.05]">
            Fluent is not the same as true.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-5 bg-tmq-surface border border-tmq-border rounded-lg space-y-2 opacity-80">
              <span className="text-[11px] font-mono text-tmq-text-soft uppercase">Generic Fluency</span>
              <p className="text-[14px] text-tmq-text-muted leading-relaxed">
                In the intricate <span className="line-through text-tmq-danger">tapestry</span> of human experience, memories emerge as a poignant <span className="line-through text-tmq-danger">symphony</span> of <span className="line-through text-tmq-danger">whispers</span> and resilience.
              </p>
            </div>

            <div className="p-5 bg-tmq-surface-2 border border-tmq-brand/40 rounded-lg space-y-2 shadow-focusGlow">
              <span className="text-[11px] font-mono text-tmq-brand uppercase font-semibold">Human Particular</span>
              <p className="text-[17px] text-tmq-text-strong font-medium italic leading-relaxed pt-2">
                &ldquo;My father looked at the rice. Not at me.&rdquo;
              </p>
              <span className="text-[12px] text-tmq-brand block font-mono pt-2">
                Specific is the proof.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 05 / 07: When everyone borrows one voice, no one is heard */}
      <section className="story-chapter min-h-screen flex items-center justify-center px-6 py-20 relative">
        <div className="chapter-content max-w-[720px] mx-auto space-y-8 text-center">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-brand block">
            05 / 07 &mdash; The Monoculture
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-tmq-text-strong tracking-[-0.02em] leading-[1.05]">
            When everyone borrows one voice, no one is heard.
          </h2>

          {/* Twelve waveforms merging to one flat grey line, with one green wave lifting off */}
          <div className="p-6 bg-tmq-surface border border-tmq-border rounded-lg max-w-[500px] mx-auto space-y-4">
            <div className="flex items-end justify-between h-24 gap-1.5 px-4 pt-4 border-b border-tmq-border-subtle">
              {[40, 70, 30, 95, 45, 80, 20, 60, 85, 35, 90, 50].map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t transition-all duration-300 ${i === 8 ? 'bg-tmq-brand h-24 shadow-focusGlow' : 'bg-tmq-surface-3 h-4 opacity-50'}`}
                  style={{ height: i === 8 ? '100%' : '14%' }}
                />
              ))}
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono text-tmq-text-muted">
              <span>Standardised flat output</span>
              <span className="text-tmq-brand font-semibold">&uarr; One distinct human timbre</span>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 06 / 07: The struggle is the signature */}
      <section className="story-chapter min-h-screen flex items-center justify-center px-6 py-20 relative">
        <div className="chapter-content max-w-[720px] mx-auto space-y-8 text-center">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-text-soft block">
            06 / 07 &mdash; The Signature
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-tmq-text-strong tracking-[-0.02em] leading-[1.05]">
            The struggle is the signature.
          </h2>
          <p className="text-[18px] text-tmq-text-muted leading-[1.55]">
            A machine can imitate the sentence. It cannot live the life behind it.
          </p>

          <div className="p-6 bg-tmq-surface border border-tmq-border rounded-lg text-left max-w-[520px] mx-auto space-y-2">
            <span className="text-[11px] font-mono uppercase text-tmq-text-soft">Draft Artifacts</span>
            <div className="font-mono text-[14px] text-tmq-text-muted space-y-1 pt-2">
              <p className="line-through text-tmq-text-faint">It felt like winter had settled into our bones.</p>
              <p className="line-through text-tmq-text-faint">Cold tea on the wooden table.</p>
              <p className="text-tmq-text-strong font-semibold text-[16px] text-tmq-brand pt-1">
                Just silence. No, noise… Nothing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 07 / 07: Write it yourself */}
      <section className="story-chapter min-h-screen flex items-center justify-center px-6 py-20 relative">
        <div className="chapter-content max-w-[720px] mx-auto space-y-8 text-center">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tmq-brand block">
            07 / 07 &mdash; The Promise
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-tmq-text-strong tracking-[-0.02em] leading-[1.05]">
            Write it yourself.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center max-w-[560px] mx-auto">
            <div className="p-3 bg-tmq-surface border border-tmq-border rounded-md">
              <span className="font-semibold text-tmq-text-strong text-[14px]">Is it true?</span>
            </div>
            <div className="p-3 bg-tmq-surface border border-tmq-border rounded-md">
              <span className="font-semibold text-tmq-text-strong text-[14px]">Is it specific?</span>
            </div>
            <div className="p-3 bg-tmq-surface border border-tmq-border rounded-md">
              <span className="font-semibold text-tmq-text-strong text-[14px]">Does it move?</span>
            </div>
          </div>

          <p className="text-[18px] text-tmq-text-muted max-w-[560px] mx-auto leading-[1.55]">
            In TMQ, every word is human. We built this tool to protect that.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onSkipToDetector}
              className="btn-primary px-6 py-3 text-[15px] font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-tmq-on-brand" />
              <span>Check a piece of writing</span>
            </button>
            <button
              type="button"
              onClick={onSkipToDetector}
              className="btn-secondary text-[14px] px-5 py-3"
            >
              Read our promise
            </button>
          </div>

          <div className="text-[12px] font-mono text-tmq-text-soft pt-4">
            Detection is a probability, not proof. A human reviews every flag.
          </div>
        </div>
      </section>
    </div>
  );
};
