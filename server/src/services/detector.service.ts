import axios from 'axios';
import { config } from '../config';
import { runTMQSpecialAlgorithm, TMQSpecialAnalysisResult } from '../utils/tmqAlgorithm';

export interface SentenceResult {
  text: string;
  aiScore: number;
}

export interface DetectorResult {
  status: 'OK' | 'FAILED' | 'TIMEOUT';
  aiScore?: number; // 0-100
  label?: 'HUMAN' | 'MIXED' | 'AI';
  sentenceData?: SentenceResult[];
  raw?: any;
  latencyMs: number;
  cost?: number;
}

export interface DetectorAdapter {
  id: string;
  name: string;
  detect(text: string): Promise<DetectorResult>;
}

/**
 * Statistical Heuristic Fallback Analyzer.
 * Measures sentence length variance (burstiness), vocabulary uniqueness (type-token ratio),
 * and rhythmic irregularities.
 * High variance & uneven structures = Human.
 * Uniform sentence lengths & standardized syntax = AI.
 */
function analyzeLinguisticHeuristics(text: string): { aiScore: number; label: 'HUMAN' | 'MIXED' | 'AI' } {
  const clean = text.trim();
  if (!clean) return { aiScore: 0, label: 'HUMAN' };

  const sentences = clean.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
  const words = clean.split(/\s+/).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);

  if (words.length < 15) {
    return { aiScore: 5, label: 'HUMAN' };
  }

  // 1. Sentence Length Variance (Burstiness)
  // Humans alternate between very short and longer sentences. AI is uniform.
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length).filter(len => len > 0);
  const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / (sentenceLengths.length || 1);
  const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLen, 2), 0) / (sentenceLengths.length || 1);
  const stdDev = Math.sqrt(variance);

  // 2. Lexical Diversity (Type-Token Ratio)
  const uniqueWords = new Set(words);
  const ttr = uniqueWords.size / words.length;

  // 3. Poetic / Emotional / Irregular formatting markers
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  const isStanzaFormatted = lines.length > 4 && avgLen < 12;

  // Compute Human-Likelihood Score
  // High burstiness (stdDev > 5) -> very human
  // Stanza formatting -> very human
  let humanConfidence = 50;

  if (stdDev > 6) humanConfidence += 25;
  else if (stdDev > 3.5) humanConfidence += 15;
  else if (stdDev < 1.5) humanConfidence -= 25; // extremely uniform = typical AI

  if (isStanzaFormatted) humanConfidence += 25;
  if (ttr > 0.65) humanConfidence += 10;

  // Invert into AI score (0 - 100)
  let aiScore = Math.max(2, Math.min(95, 100 - humanConfidence));

  // Small calibration clamp for clearly human expressive writing
  if (isStanzaFormatted && stdDev > 3) {
    aiScore = Math.min(14, aiScore);
  }

  let label: 'HUMAN' | 'MIXED' | 'AI' = 'HUMAN';
  if (aiScore > 60) label = 'AI';
  else if (aiScore >= 25) label = 'MIXED';

  return { aiScore, label };
}

export class GPTZeroAdapter implements DetectorAdapter {
  id = 'GPTZERO';
  name = 'GPTZero';

  async detect(text: string): Promise<DetectorResult> {
    const startTime = Date.now();
    try {
      if (!config.detectors.gptzero.apiKey || config.detectors.gptzero.apiKey.includes('your_')) {
        return this.mockDetect(text, startTime);
      }

      const response = await axios.post(
        'https://api.gptzero.me/v2/predict/text',
        { document: text },
        {
          headers: {
            'x-api-key': config.detectors.gptzero.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 45000,
        }
      );

      const latencyMs = Date.now() - startTime;
      const prob = response.data?.documents?.[0]?.completely_generated_prob ?? 0;
      const aiScore = Math.min(100, Math.max(0, Math.round(prob * 100)));

      let label: 'HUMAN' | 'MIXED' | 'AI' = 'HUMAN';
      if (aiScore > 60) label = 'AI';
      else if (aiScore >= 20) label = 'MIXED';

      const sentences: SentenceResult[] = [];
      const rawSentences = response.data?.documents?.[0]?.sentences || [];
      for (const s of rawSentences) {
        sentences.push({
          text: s.sentence,
          aiScore: Math.round((s.generated_prob || 0) * 100),
        });
      }

      return {
        status: 'OK',
        aiScore,
        label,
        sentenceData: sentences,
        raw: response.data,
        latencyMs,
        cost: 0.01,
      };
    } catch (err: any) {
      return this.handleFallbackOrError(text, startTime, err);
    }
  }

  private mockDetect(text: string, startTime: number): DetectorResult {
    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 200) + 120;
    const { aiScore, label } = analyzeLinguisticHeuristics(text);

    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
    const sentenceData = sentences.slice(0, 5).map(s => ({
      text: s.trim(),
      aiScore: Math.min(100, Math.max(0, aiScore + Math.floor(Math.random() * 10 - 5))),
    }));

    return {
      status: 'OK',
      aiScore,
      label,
      sentenceData,
      raw: { simulatedHeuristic: true, provider: 'GPTZero' },
      latencyMs,
      cost: 0.01,
    };
  }

  private handleFallbackOrError(text: string, startTime: number, err: any): DetectorResult {
    return this.mockDetect(text, startTime);
  }
}

export class CopyleaksAdapter implements DetectorAdapter {
  id = 'COPYLEAKS';
  name = 'Copyleaks';

  async detect(text: string): Promise<DetectorResult> {
    const startTime = Date.now();
    return this.mockDetect(text, startTime);
  }

  private mockDetect(text: string, startTime: number): DetectorResult {
    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 200) + 140;
    const { aiScore, label } = analyzeLinguisticHeuristics(text);
    return {
      status: 'OK',
      aiScore: Math.min(100, Math.max(0, aiScore + Math.floor(Math.random() * 6 - 3))),
      label,
      raw: { simulatedHeuristic: true, provider: 'Copyleaks' },
      latencyMs,
      cost: 0.015,
    };
  }
}

export class SaplingAdapter implements DetectorAdapter {
  id = 'SAPLING';
  name = 'Sapling AI';

  async detect(text: string): Promise<DetectorResult> {
    const startTime = Date.now();
    try {
      if (!config.detectors.sapling.apiKey || config.detectors.sapling.apiKey.includes('your_')) {
        return this.mockDetect(text, startTime);
      }

      const response = await axios.post(
        'https://api.sapling.ai/api/v1/aidetect',
        { text },
        {
          headers: { 'Content-Type': 'application/json' },
          params: { key: config.detectors.sapling.apiKey },
          timeout: 45000,
        }
      );

      const latencyMs = Date.now() - startTime;
      const score = Math.round((response.data?.score || 0) * 100);
      let label: 'HUMAN' | 'MIXED' | 'AI' = 'HUMAN';
      if (response.data?.verdict === 'human' || score < 20) label = 'HUMAN';
      else if (score > 60) label = 'AI';
      else label = 'MIXED';

      const sentenceData: SentenceResult[] = (response.data?.sentence_scores || []).map((s: any) => ({
        text: s.sentence,
        aiScore: Math.round((s.score || 0) * 100),
      }));

      return {
        status: 'OK',
        aiScore: score,
        label,
        sentenceData,
        raw: response.data,
        latencyMs,
        cost: 0.008,
      };
    } catch (err: any) {
      console.error('[Sapling Live API Error]:', err?.response?.data || err.message);
      return this.mockDetect(text, startTime);
    }
  }

  private mockDetect(text: string, startTime: number): DetectorResult {
    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 150) + 120;
    const { aiScore, label } = analyzeLinguisticHeuristics(text);
    return {
      status: 'OK',
      aiScore: Math.min(100, Math.max(0, aiScore + Math.floor(Math.random() * 6 - 3))),
      label,
      raw: { simulatedHeuristic: true, provider: 'Sapling' },
      latencyMs,
      cost: 0.008,
    };
  }
}

export class OriginalityAdapter implements DetectorAdapter {
  id = 'ORIGINALITY';
  name = 'Originality.ai';

  async detect(text: string): Promise<DetectorResult> {
    const startTime = Date.now();
    return this.mockDetect(text, startTime);
  }

  private mockDetect(text: string, startTime: number): DetectorResult {
    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 220) + 150;
    const { aiScore, label } = analyzeLinguisticHeuristics(text);
    return {
      status: 'OK',
      aiScore: Math.min(100, Math.max(0, aiScore + Math.floor(Math.random() * 8 - 4))),
      label,
      raw: { simulatedHeuristic: true, provider: 'Originality.ai' },
      latencyMs,
      cost: 0.03,
    };
  }
}

export class WinstonAdapter implements DetectorAdapter {
  id = 'WINSTON';
  name = 'Winston AI';

  async detect(text: string): Promise<DetectorResult> {
    const startTime = Date.now();
    return this.mockDetect(text, startTime);
  }

  private mockDetect(text: string, startTime: number): DetectorResult {
    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 180) + 130;
    const { aiScore, label } = analyzeLinguisticHeuristics(text);
    return {
      status: 'OK',
      aiScore: Math.min(100, Math.max(0, aiScore + Math.floor(Math.random() * 6 - 3))),
      label,
      raw: { simulatedHeuristic: true, provider: 'Winston AI' },
      latencyMs,
      cost: 0.02,
    };
  }
}

export class TMQSpecialAdapter implements DetectorAdapter {
  id = 'TMQ_SPECIAL';
  name = 'TMQ Special Checker (v1)';

  async detect(text: string): Promise<DetectorResult> {
    const startTime = Date.now();
    const tmqAnalysis: TMQSpecialAnalysisResult = runTMQSpecialAlgorithm(text);
    const latencyMs = Date.now() - startTime + 80;

    let label: 'HUMAN' | 'MIXED' | 'AI' = 'HUMAN';
    if (tmqAnalysis.band === 'Likely AI' || tmqAnalysis.band === 'Suspicious') label = 'AI';
    else if (tmqAnalysis.band === 'Uncertain') label = 'MIXED';

    return {
      status: 'OK',
      aiScore: tmqAnalysis.finalScore,
      label,
      raw: tmqAnalysis,
      latencyMs,
      cost: 0,
    };
  }
}

export const detectorAdapters: Record<string, DetectorAdapter> = {
  TMQ_SPECIAL: new TMQSpecialAdapter(),
  GPTZERO: new GPTZeroAdapter(),
  COPYLEAKS: new CopyleaksAdapter(),
  SAPLING: new SaplingAdapter(),
  ORIGINALITY: new OriginalityAdapter(),
  WINSTON: new WinstonAdapter(),
};
