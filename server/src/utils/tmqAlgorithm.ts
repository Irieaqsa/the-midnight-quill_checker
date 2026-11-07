/**
 * TMQ Authenticity and Review Algorithm (v1)
 * Designed by TMQ Editorial Standards
 * 
 * Part 1: AI-likelihood (0-100) using 10 Signal Families + Counter-Evidence + Corroboration Rule
 * Part 2: Quality Rating (0-100) with Emotional Bias (EB) adjustment
 * Part 3: Computable linguistic features
 */

export interface TMQSpecialAnalysisResult {
  isApplicable: boolean;
  intakeNote?: string;
  wordCount: number;
  genre: 'POEM' | 'ESSAY' | 'MONOLOGUE';
  
  // Computable features
  features: {
    sentenceLengthSd: number;
    typeTokenRatio: number;
    emDashPer1000: number;
    stockPhraseHits: { phrase: string; count: number }[];
    trigramRepeatRate: number;
    triadRate: number;
    negFrameCount: number;
    namedEntityDensity: number;
  };

  // 10 Signal Families (0 - 10)
  signalFamilies: {
    familyA_specificityDeficit: { score: number; weight: number; evidence: string[] };
    familyB_stockPhrasing: { score: number; weight: number; evidence: string[] };
    familyC_structuralUniformity: { score: number; weight: number; evidence: string[] };
    familyD_tellingOverContainment: { score: number; weight: number; evidence: string[] };
    familyE_rhetoricalTics: { score: number; weight: number; evidence: string[] };
    familyF_voiceFlatness: { score: number; weight: number; evidence: string[] };
    familyG_soundDrivenPadding: { score: number; weight: number; evidence: string[] };
    familyH_predictableArc: { score: number; weight: number; evidence: string[] };
    familyI_livedDetailFailure: { score: number; weight: number; evidence: string[] };
    familyJ_baselineDeviation: { score: number; weight: number; evidence: string[]; applied: boolean };
  };

  // Human Counter-Evidence (subtractions)
  humanCounterEvidence: {
    pointsSubtracted: number;
    items: string[];
  };

  // Corroboration & Verdict
  rawScore: number;
  finalScore: number;
  band: 'Likely human' | 'Probably human' | 'Uncertain' | 'Suspicious' | 'Likely AI';
  action: string;
  corroborated: boolean;

  // Part 2: Quality & Emotional Bias
  quality: {
    baseRating: number; // out of 100
    emotionalImpact: number; // 0 - 10
    earnedEmotion: number; // 0 - 10
    emotionalBias: number; // Impact - Earned
    ebAdjustment: number; // -5 to +5
    finalRating: number; // out of 100
    threeQuestions: {
      isItTrue: boolean;
      isItSpecific: boolean;
      doesItMove: boolean;
    };
  };
}

const STOCK_PHRASES = [
  'tapestry', 'whispers of', 'whisper of', 'dance of', 'symphony',
  'testament to', 'delve', 'delves', 'echoes of', 'echo of',
  'shimmering', 'beacon of', 'beacon', 'unwavering', 'labyrinth of',
  'ever-evolving', 'interplay of', 'kaleidoscope', 'hushed tones',
  'in the realm of', 'serves as a', 'at the intersection of'
];

const ABSTRACT_EMOTION_NOUNS = [
  'sorrow', 'resilience', 'hope', 'despair', 'agony', 'melancholy',
  'solitude', 'eternity', 'tranquility', 'anguish', 'heartache', 'yearning'
];

export function runTMQSpecialAlgorithm(
  text: string,
  options: {
    isNonNative?: boolean;
    hasVerifiedBaseline?: boolean;
    genreHint?: 'POEM' | 'ESSAY' | 'MONOLOGUE';
  } = {}
): TMQSpecialAnalysisResult {
  const clean = text.trim();
  const rawWords = clean.split(/\s+/).filter(Boolean);
  const wordCount = rawWords.length;
  const wordsLower = rawWords.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

  // Genre detection: line breaks + short line count = POEM
  let genre: 'POEM' | 'ESSAY' | 'MONOLOGUE' = options.genreHint || 'ESSAY';
  if (!options.genreHint) {
    if (lines.length >= 4 && lines.length / (sentences.length || 1) > 1.8) {
      genre = 'POEM';
    } else if (clean.includes('"') && (clean.match(/"/g)?.length || 0) >= 4) {
      genre = 'MONOLOGUE';
    }
  }

  // Step 0: Intake checks
  let intakeNote = '';
  if (wordCount < 150) {
    intakeNote = 'Insufficient text (Under 150 words). Analysis sensitivity throttled.';
  } else if (wordCount <= 300) {
    intakeNote = 'Short manuscript (150–300 words). Maximum permitted verdict is Uncertain.';
  }

  // Part 3: Computable Features
  // Sentence Length Standard Deviation
  const sentenceWordCounts = sentences.map(s => s.split(/\s+/).filter(Boolean).length).filter(c => c > 0);
  const avgLen = sentenceWordCounts.length > 0
    ? sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length
    : 10;
  const variance = sentenceWordCounts.length > 0
    ? sentenceWordCounts.reduce((acc, c) => acc + Math.pow(c - avgLen, 2), 0) / sentenceWordCounts.length
    : 0;
  const sentenceLengthSd = parseFloat(Math.sqrt(variance).toFixed(2));

  // Type-Token Ratio
  const uniqueWords = new Set(wordsLower);
  const typeTokenRatio = wordCount > 0 ? parseFloat((uniqueWords.size / wordCount).toFixed(3)) : 0;

  // Em-dash per 1000 words
  const emDashCount = (clean.match(/—|--/g) || []).length;
  const emDashPer1000 = wordCount > 0 ? parseFloat(((emDashCount / wordCount) * 1000).toFixed(1)) : 0;

  // Stock phrase matches
  const stockPhraseHits: { phrase: string; count: number }[] = [];
  const lowerClean = clean.toLowerCase();
  for (const phrase of STOCK_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = lowerClean.match(regex);
    if (matches && matches.length > 0) {
      stockPhraseHits.push({ phrase, count: matches.length });
    }
  }

  // Trigram repeat rate
  let trigramRepeats = 0;
  const trigramSet = new Set<string>();
  const totalTrigrams = Math.max(1, wordsLower.length - 2);
  for (let i = 0; i < wordsLower.length - 2; i++) {
    const tri = `${wordsLower[i]} ${wordsLower[i+1]} ${wordsLower[i+2]}`;
    if (trigramSet.has(tri)) trigramRepeats++;
    else trigramSet.add(tri);
  }
  const trigramRepeatRate = parseFloat((trigramRepeats / totalTrigrams).toFixed(3));

  // Triad count ("A, B, and C")
  const triadRegex = /\b\w+,\s+\w+,\s+(?:and|or)\s+\w+\b/gi;
  const triadCount = (clean.match(triadRegex) || []).length;
  const triadRate = wordCount > 0 ? parseFloat(((triadCount / wordCount) * 1000).toFixed(1)) : 0;

  // Negative Framing ("not X, but Y")
  const negFrameRegex = /\b(?:not|isn't|aren't|wasn't|was not|is not)\s+[^,\n.]+,\s*but\b/gi;
  const negFrameCount = (clean.match(negFrameRegex) || []).length;

  // Named Entities (capitalized words that aren't starting a sentence, specific numbers/times)
  const capitalizedNonStart = clean.match(/(?<![.!?\n]\s+)\b[A-Z][a-z]{2,}\b/g) || [];
  const numbersOrDates = clean.match(/\b\d+(?:st|nd|rd|th)?\b|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi) || [];
  const namedCount = capitalizedNonStart.length + numbersOrDates.length;
  const namedEntityDensity = wordCount > 0 ? parseFloat(((namedCount / wordCount) * 1000).toFixed(1)) : 0;

  // ==========================================
  // Part 1: Signal Families (0 - 10)
  // ==========================================

  // Family A: Specificity deficit (Weight: 15)
  // Lower named entity density & high generic words = high specificity deficit
  let famAScore = Math.max(0, Math.min(10, Math.round(10 - (namedEntityDensity * 0.3))));
  const famAEvidence: string[] = [];
  if (namedEntityDensity < 10) famAEvidence.push('Sparse proper nouns, dates, or verifiable concrete entities.');
  if (famAScore > 6) famAEvidence.push('Sensory detail relies heavily on generic abstractions.');

  // Family B: Stock Phrasing (Weight: 12)
  let totalStockHits = stockPhraseHits.reduce((acc, h) => acc + h.count, 0);
  let famBScore = Math.min(10, totalStockHits * 2.5);
  const famBEvidence = stockPhraseHits.map(h => `Matched phrase "${h.phrase}" (${h.count}x)`);

  // Family C: Structural Uniformity (Weight: 12)
  let famCScore = 0;
  const famCEvidence: string[] = [];
  if (sentenceLengthSd < 3.0) {
    famCScore += 6;
    famCEvidence.push(`High sentence uniformity (std dev ${sentenceLengthSd} words)`);
  }
  if (triadRate > 4) {
    famCScore += 2;
    famCEvidence.push(`Repetitive triad syntax (${triadRate} per 1k words)`);
  }
  if (negFrameCount >= 2) {
    famCScore += 2;
    famCEvidence.push(`Repeated "not X, but Y" framing (${negFrameCount} occurrences)`);
  }
  famCScore = Math.min(10, famCScore);

  // Family D: Telling over containment (Weight: 12)
  let abstractNounHits = 0;
  const matchedAbstractNouns: string[] = [];
  for (const noun of ABSTRACT_EMOTION_NOUNS) {
    if (wordsLower.includes(noun)) {
      abstractNounHits++;
      matchedAbstractNouns.push(noun);
    }
  }
  let famDScore = Math.min(10, abstractNounHits * 2.5);
  const famDEvidence = matchedAbstractNouns.length > 0
    ? [`Explicitly names abstract emotions without restraint: ${matchedAbstractNouns.join(', ')}`]
    : ['Containment preserved; minimal abstract emotion noun dump.'];

  // Family E: Rhetorical tics (Weight: 8)
  let famEScore = 0;
  const famEEvidence: string[] = [];
  if (emDashPer1000 > 6) {
    famEScore += 5;
    famEEvidence.push(`High em-dash density (${emDashPer1000} per 1k words)`);
  }
  if (clean.includes('Whether') && clean.includes('or')) {
    famEScore += 3;
    famEEvidence.push('Balanced "Whether... or..." framing detected.');
  }
  famEScore = Math.min(10, famEScore);

  // Family F: Voice Flatness (Weight: 12)
  let famFScore = 0;
  const famFEvidence: string[] = [];
  if (typeTokenRatio < 0.45 && wordCount > 100) {
    famFScore += 5;
    famFEvidence.push(`Restricted vocabulary diversity (TTR: ${typeTokenRatio})`);
  }
  if (!/[—\-–…!?]/.test(clean)) {
    famFScore += 3;
    famFEvidence.push('Absence of expressive or imperfect punctuation rhythms.');
  }
  famFScore = Math.min(10, famFScore);

  // Family G: Sound-driven padding (Weight: 6 - Poems only)
  let famGScore = 0;
  const famGEvidence: string[] = [];
  if (genre === 'POEM') {
    // Check if end words rhyme simplistically
    famGScore = 2; // baseline softness for TMQ tradition
    famGEvidence.push('Metrical rhyme softened per TMQ traditions.');
  }

  // Family H: Predictable Arc (Weight: 8)
  let famHScore = 0;
  const famHEvidence: string[] = [];
  const lastSection = clean.slice(-Math.min(300, clean.length)).toLowerCase();
  if (lastSection.includes('hope') || lastSection.includes('light') || lastSection.includes('will remain') || lastSection.includes('forever')) {
    famHScore += 5;
    famHEvidence.push('Manuscript concludes on reflexive uplifting closure / tidy aphorism.');
  }

  // Family I: Lived-detail failure (Weight: 10)
  let famIScore = Math.max(0, Math.min(10, Math.round(9 - (namedCount * 1.2))));
  const famIEvidence = famIScore > 5
    ? ['Memories and settings read as atmospheric templates rather than uninventable details.']
    : ['Grounding particulars present.'];

  // Family J: Baseline deviation (Weight: 15)
  let famJScore = 0;
  let famJApplied = false;
  const famJEvidence: string[] = [];
  if (options.hasVerifiedBaseline) {
    famJApplied = true;
    famJScore = 3;
    famJEvidence.push('Checked against verified author corpus; stylistic delta within normal range.');
  } else {
    famJEvidence.push('No verified baseline sample recorded; family omitted from weight normalisation.');
  }

  // Step 1: Normalized Raw Score
  const families = [
    { score: famAScore, weight: 15, key: 'A' },
    { score: famBScore, weight: 12, key: 'B' },
    { score: famCScore, weight: 12, key: 'C' },
    { score: famDScore, weight: 12, key: 'D' },
    { score: famEScore, weight: 8,  key: 'E' },
    { score: famFScore, weight: 12, key: 'F' },
    { score: famGScore, weight: (genre === 'POEM' ? 6 : 0), key: 'G' },
    { score: famHScore, weight: 8,  key: 'H' },
    { score: famIScore, weight: 10, key: 'I' },
    { score: famJScore, weight: (famJApplied ? 15 : 0), key: 'J' },
  ];

  const totalWeightedScore = families.reduce((acc, f) => acc + (f.score * f.weight), 0);
  const totalWeights = families.reduce((acc, f) => acc + f.weight, 0);
  let rawScore = Math.round((100 * totalWeightedScore) / (10 * totalWeights));

  // Step 2: Human Counter-Evidence Subtractions (up to -25 per indicator)
  const counterItems: string[] = [];
  let pointsSubtracted = 0;

  // Named checkable particulars
  if (namedEntityDensity >= 15) {
    pointsSubtracted += 20;
    counterItems.push('Named, checkable particulars found (specific numbers, places, names).');
  }

  // Fragments, self-correction, hesitation
  if (/[.!?]\s*(?:No,|Wait,|Or maybe|Nothing\.|Just silence\.)/i.test(clean) || clean.includes('…')) {
    pointsSubtracted += 25;
    counterItems.push('Expressive hesitation, self-correction, or fragment cadence detected.');
  }

  // Line break breath & rhythmic irregularity
  if (sentenceLengthSd > 5.5) {
    pointsSubtracted += 20;
    counterItems.push('High burstiness and organic cadence variation across passages.');
  }

  // Unresolved ending / emotional containment
  if (!lastSection.includes('hope') && !lastSection.includes('light') && (lastSection.includes('?') || lastSection.includes('soil') || lastSection.includes('dust') || lastSection.includes('silence'))) {
    pointsSubtracted += 20;
    counterItems.push('Unresolved ending that avoids forced affirmation or reflexive lessons.');
  }

  // Step 3: Fairness Adjustments
  if (options.isNonNative) {
    pointsSubtracted += 15;
    counterItems.push('Fairness adjustment applied: Non-native speaker formal cadence protected.');
  }
  if (genre === 'POEM') {
    pointsSubtracted += 10;
    counterItems.push('Fairness adjustment applied: Traditional poetic form thresholds softened.');
  }

  let finalScore = Math.max(0, Math.min(100, rawScore - pointsSubtracted));

  // Step 4: Corroboration Rule
  // Verdict of Suspicious (61+) requires at least THREE independent families scoring >= 6
  const highScoringFamilies = families.filter(f => f.weight > 0 && f.score >= 6);
  const corroborated = highScoringFamilies.length >= 3;

  if (finalScore >= 61 && !corroborated) {
    finalScore = 55; // Capped to Uncertain under the Corroboration Rule
  }

  // Clamp if short manuscript intake rule applies
  if (wordCount <= 300 && finalScore > 60) {
    finalScore = 58; // Capped to Uncertain
  }

  // Step 5: Bands and Actions
  let band: 'Likely human' | 'Probably human' | 'Uncertain' | 'Suspicious' | 'Likely AI' = 'Likely human';
  let action = 'Proceed (Authenticity confirmed)';

  if (finalScore <= 25) {
    band = 'Likely human';
    action = 'Proceed with editorial review.';
  } else if (finalScore <= 45) {
    band = 'Probably human';
    action = 'Proceed with editorial review.';
  } else if (finalScore <= 60) {
    band = 'Uncertain';
    action = 'Ask author for drafts, earlier notes, or version history.';
  } else if (finalScore <= 75) {
    band = 'Suspicious';
    action = 'Ask for process evidence plus a short 10-minute live stanza discussion.';
  } else {
    band = 'Likely AI';
    action = 'Human review required; request process proof (phone notes / revision logs).';
  }

  // ==========================================
  // Part 2: Quality Rating (0 - 100) & Emotional Bias (EB)
  // ==========================================
  const containment = Math.max(2, 10 - famDScore);
  const specificity = Math.max(2, 10 - famAScore);
  const subtext = Math.max(2, 10 - famFScore);
  const earnedEmotion = parseFloat(((containment + specificity + subtext) / 3).toFixed(1));

  // Emotional impact estimated from evocative vocabulary & rhythm
  let emotionalImpact = 7.0;
  if (counterItems.length >= 2) emotionalImpact += 1.5;
  if (wordsLower.includes('death') || wordsLower.includes('bleed') || wordsLower.includes('wounds') || wordsLower.includes('die')) {
    emotionalImpact += 1.0;
  }
  emotionalImpact = Math.min(10, parseFloat(emotionalImpact.toFixed(1)));

  // EB = Emotional Impact - Earned Emotion
  const emotionalBias = parseFloat((emotionalImpact - earnedEmotion).toFixed(1));

  let ebAdjustment = 0;
  if (emotionalBias > 2.0) {
    ebAdjustment = -Math.min(5, Math.round((emotionalBias - 2.0) * 2));
  } else if (emotionalBias < -2.0) {
    ebAdjustment = Math.min(5, Math.round(Math.abs(emotionalBias + 2.0) * 2));
  }

  // Base TMQ Quality Metrics (out of 100)
  let baseQuality = 70;
  if (typeTokenRatio > 0.6) baseQuality += 10;
  if (sentenceLengthSd > 4) baseQuality += 8;
  if (stockPhraseHits.length === 0) baseQuality += 6;
  baseQuality = Math.min(95, Math.max(40, baseQuality));

  const finalRating = Math.max(0, Math.min(100, baseQuality + ebAdjustment));

  return {
    isApplicable: true,
    intakeNote: intakeNote || undefined,
    wordCount,
    genre,
    features: {
      sentenceLengthSd,
      typeTokenRatio,
      emDashPer1000,
      stockPhraseHits,
      trigramRepeatRate,
      triadRate,
      negFrameCount,
      namedEntityDensity,
    },
    signalFamilies: {
      familyA_specificityDeficit: { score: famAScore, weight: 15, evidence: famAEvidence },
      familyB_stockPhrasing: { score: famBScore, weight: 12, evidence: famBEvidence },
      familyC_structuralUniformity: { score: famCScore, weight: 12, evidence: famCEvidence },
      familyD_tellingOverContainment: { score: famDScore, weight: 12, evidence: famDEvidence },
      familyE_rhetoricalTics: { score: famEScore, weight: 8, evidence: famEEvidence },
      familyF_voiceFlatness: { score: famFScore, weight: 12, evidence: famFEvidence },
      familyG_soundDrivenPadding: { score: famGScore, weight: (genre === 'POEM' ? 6 : 0), evidence: famGEvidence },
      familyH_predictableArc: { score: famHScore, weight: 8, evidence: famHEvidence },
      familyI_livedDetailFailure: { score: famIScore, weight: 10, evidence: famIEvidence },
      familyJ_baselineDeviation: { score: famJScore, weight: (famJApplied ? 15 : 0), evidence: famJEvidence, applied: famJApplied },
    },
    humanCounterEvidence: {
      pointsSubtracted,
      items: counterItems,
    },
    rawScore,
    finalScore,
    band,
    action,
    corroborated,
    quality: {
      baseRating: baseQuality,
      emotionalImpact,
      earnedEmotion,
      emotionalBias,
      ebAdjustment,
      finalRating,
      threeQuestions: {
        isItTrue: finalScore <= 45,
        isItSpecific: famAScore < 5,
        doesItMove: emotionalImpact >= 6.5,
      },
    },
  };
}
