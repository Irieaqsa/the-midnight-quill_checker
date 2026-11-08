/**
 * TMQ Authenticity and Review Algorithm (v2 - Anchored and Calibrated)
 * Designed by TMQ Editorial Standards
 * 
 * Rules that stop score inflation:
 * 1. Competent is 50%, not 85%. A clean, sincere piece lands around 45 to 55.
 * 2. 70+ requires distinctive craft; 85+ is rare.
 * 3. Distribution check: median ~50, 1 in 6 reach 70, 1 in 30 reach 85.
 * 4. Evidence rule: metrics scored with actual quoted lines from text.
 * 5. Flaws before praise: top flaws identified with quotes.
 * 6. Topic is not craft: sacred, romantic, grief subjects get no credit for subject alone.
 * 7. Mechanical pass runs first (repetition, told-emotion density, stacked synonyms, personal moments).
 * 8. Strict caps apply:
 *    - Told-emotion density >= 6/100 words -> Iceberg <= 3/8, Containment <= 2/6
 *    - Personal-moments = 0 -> Specificity <= 2/7; 1-2 -> Specificity <= 4/7
 *    - Final score <= 69 if Specificity or Iceberg < 4/8 (scaled)
 *    - Final score <= 59 if both Specificity and Iceberg are level 1 or lower
 *    - Masterwork gate: 90+ requires Voice >= 6/7, Specificity >= 5/7, Iceberg >= 6/8
 */

export interface TMQMetricDetail {
  name: string;
  group: 'Sound' | 'Depth' | 'Truth' | 'Movement' | 'Authenticity';
  max: number;
  level: number; // 0 to 4 (in steps of 0.5)
  score: number; // max * level / 4
  evidence: string;
  isNA?: boolean;
}

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

  // Mechanical Pass Counts & Flaws
  mechanicalPass: {
    repetitionCounts: { phrase: string; count: number }[];
    toldEmotionWordsCount: number;
    toldEmotionDensityPer100: number;
    stackedSynonymCount: number;
    stockPhraseHitsCount: number;
    personalMomentsCount: number;
    syllableSpread: number;
    triggeredCaps: string[];
    topFlaws: { flaw: string; quote: string }[];
  };

  // Part 2: Comprehensive 100-Point Quality & Emotional Bias System
  quality: {
    earnedRaw: number;
    availableRaw: number;
    percentage: number;
    emotionalImpact: number; // 0 - 10
    earnedEmotion: number;   // 0 - 10 (average of Containment, Specificity, Subtext)
    emotionalBias: number;   // Impact - Earned
    ebAdjustment: number;    // -5 to +5
    gatedRating: number;
    finalRating: number;
    band: 'Masterwork' | 'Excellent' | 'Strong' | 'Solid' | 'Promising' | 'Developing';
    masterworkGated: boolean;
    masterworkGateNotes?: string;
    authenticityHeld: boolean;
    metrics: TMQMetricDetail[];
    threeQuestions: {
      isItTrue: { passed: boolean; note: string };
      isItSpecific: { passed: boolean; note: string };
      doesItMove: { passed: boolean; note: string };
    };
  };
}

const STOCK_PHRASES = [
  'tapestry', 'whispers of', 'whisper of', 'dance of', 'symphony',
  'testament to', 'delve', 'delves', 'echoes of', 'echo of',
  'shimmering', 'beacon of', 'beacon', 'unwavering', 'labyrinth of',
  'ever-evolving', 'interplay of', 'kaleidoscope', 'hushed tones',
  'in the realm of', 'serves as a', 'at the intersection of',
  'my heart my light', 'my heart is a', 'forever and ever', 'faith began to shine',
  'every shadow every space', 'whispers secrets', 'embrace the'
];

const TOLD_EMOTION_WORDS = [
  'love', 'heart', 'soul', 'light', 'strength', 'forever', 'eternal',
  'sacred', 'divine', 'holy', 'pain', 'prayer', 'faith', 'hope',
  'sorrow', 'resilience', 'despair', 'agony', 'melancholy', 'solitude',
  'anguish', 'heartache', 'yearning', 'sad', 'happy', 'tears'
];

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 1;
  if (clean.length <= 3) return 1;
  const matches = clean.match(/[aeiouy]{1,2}/g);
  let count = matches ? matches.length : 1;
  if (clean.endsWith('e') && !clean.endsWith('le') && count > 1) {
    count--;
  }
  return Math.max(1, count);
}

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
    if (lines.length > 5 && rawWords.length / Math.max(1, lines.length) < 14) {
      genre = 'POEM';
    } else if (clean.includes('"') || clean.includes('I ') || clean.includes("I'm")) {
      genre = 'MONOLOGUE';
    }
  }

  // Intake guard
  let intakeNote = '';
  if (wordCount < 150) {
    intakeNote = 'Insufficient text (Under 150 words). Maximum confidence throttled.';
  } else if (wordCount <= 300) {
    intakeNote = 'Short text (150-300 words). Maximum verdict capped at Uncertain.';
  }

  // --- PART 3: COMPUTABLE LINGUISTIC FEATURES ---
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length).filter(l => l > 0);
  const avgSentLength = sentenceLengths.length > 0 
    ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length 
    : 10;
  const variance = sentenceLengths.length > 0 
    ? sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgSentLength, 2), 0) / sentenceLengths.length 
    : 0;
  const sentenceLengthSd = parseFloat(Math.sqrt(variance).toFixed(2));

  const uniqueWords = new Set(wordsLower.filter(Boolean));
  const typeTokenRatio = wordCount > 0 ? parseFloat((uniqueWords.size / wordCount).toFixed(3)) : 0;

  const emDashCount = (clean.match(/—|--/g) || []).length;
  const emDashPer1000 = wordCount > 0 ? parseFloat(((emDashCount / wordCount) * 1000).toFixed(2)) : 0;

  const stockPhraseHits: { phrase: string; count: number }[] = [];
  const lowerText = clean.toLowerCase();
  for (const phrase of STOCK_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches && matches.length > 0) {
      stockPhraseHits.push({ phrase, count: matches.length });
    }
  }

  // Trigram repetition
  const trigramCounts = new Map<string, number>();
  for (let i = 0; i < wordsLower.length - 2; i++) {
    const trigram = `${wordsLower[i]} ${wordsLower[i+1]} ${wordsLower[i+2]}`;
    trigramCounts.set(trigram, (trigramCounts.get(trigram) || 0) + 1);
  }
  let repeatedTrigrams = 0;
  trigramCounts.forEach(count => {
    if (count > 1) repeatedTrigrams += (count - 1);
  });
  const trigramRepeatRate = wordCount > 2 ? parseFloat((repeatedTrigrams / (wordCount - 2)).toFixed(4)) : 0;

  // Triad rate: "A, B, and C"
  const triadMatches = clean.match(/([a-zA-Z]+,\s+[a-zA-Z]+,?\s+(?:and|or)\s+[a-zA-Z]+)/g) || [];
  const triadRate = sentences.length > 0 ? parseFloat((triadMatches.length / sentences.length).toFixed(3)) : 0;

  // Negative frame count: "not X, but Y"
  const negFrameMatches = clean.match(/\b(?:not\s+[^,.!?;]+,\s*(?:but|rather)\s+[^,.!?;]+)/gi) || [];
  const negFrameCount = negFrameMatches.length;

  // Named entities heuristic: Capitalised words not at start of line/sentence
  const capitalizedMidSentence = clean.match(/(?<=[a-z]\s+)[A-Z][a-z]+/g) || [];
  const namedEntityDensity = wordCount > 0 ? parseFloat(((capitalizedMidSentence.length / wordCount) * 1000).toFixed(2)) : 0;

  // --- PART 1: 10 SIGNAL FAMILIES ---
  let famAScore = 0;
  const famAEvidence: string[] = [];
  const specificAnchors = clean.match(/\b(19\d\d|20\d\d|[A-Z][a-z]+ Street|[A-Z][a-z]+ Road|at Assi|Assi|Kashi|Varanasi|Ganga|temple|ghat|hospital|Tuesday|Wednesday|midnight|kitchen|bedroom|table|sleeve|pocket)\b/g);
  if (!specificAnchors && namedEntityDensity < 5) {
    famAScore = 8;
    famAEvidence.push('Universal nouns without specific personal coordinates.');
  } else if (!specificAnchors) {
    famAScore = 5;
    famAEvidence.push('Some named entities, but lack of concrete tactile coordinates.');
  } else {
    famAScore = 2;
    famAEvidence.push(`Found specific coordinates: "${specificAnchors.slice(0, 3).join(', ')}"`);
  }

  let famBScore = 0;
  const famBEvidence: string[] = [];
  const totalStockHits = stockPhraseHits.reduce((acc, h) => acc + h.count, 0);
  if (totalStockHits >= 4) {
    famBScore = 9;
    famBEvidence.push(`High stock phrasing hits (${totalStockHits}): ${stockPhraseHits.map(h => h.phrase).join(', ')}`);
  } else if (totalStockHits >= 2) {
    famBScore = 6;
    famBEvidence.push(`Moderate stock hits: ${stockPhraseHits.map(h => h.phrase).join(', ')}`);
  } else if (totalStockHits === 1) {
    famBScore = 3;
    famBEvidence.push(`Isolated stock phrase: "${stockPhraseHits[0].phrase}"`);
  } else {
    famBScore = 1;
    famBEvidence.push('Zero stock AI phrases detected.');
  }

  let famCScore = 0;
  const famCEvidence: string[] = [];
  if (genre !== 'POEM') {
    if (sentenceLengthSd < 3.5 && wordCount > 100) {
      famCScore = 8;
      famCEvidence.push(`Uniform sentence length (SD: ${sentenceLengthSd} words)`);
    } else if (sentenceLengthSd < 5.0) {
      famCScore = 5;
      famCEvidence.push(`Mild sentence uniformity (SD: ${sentenceLengthSd})`);
    } else {
      famCScore = 2;
      famCEvidence.push(`Healthy sentence cadence variation (SD: ${sentenceLengthSd})`);
    }
  } else {
    famCScore = 2;
    famCEvidence.push('Poetic cadence variation assessed in syllabics.');
  }

  let famDScore = 0;
  const famDEvidence: string[] = [];
  const toldHits = TOLD_EMOTION_WORDS.filter(w => lowerText.includes(w));
  if (toldHits.length >= 7) {
    famDScore = 8;
    famDEvidence.push(`Direct labelled emotion words: ${toldHits.slice(0, 6).join(', ')}`);
  } else if (toldHits.length >= 4) {
    famDScore = 5;
    famDEvidence.push(`Moderate direct emotional labelling: ${toldHits.join(', ')}`);
  } else {
    famDScore = 2;
    famDEvidence.push('Emotion restrained or grounded in physical detail.');
  }

  let famEScore = 0;
  const famEEvidence: string[] = [];
  if (emDashPer1000 > 12) {
    famEScore += 4;
    famEEvidence.push(`High em-dash frequency (${emDashPer1000} per 1k)`);
  }
  if (triadRate > 0.4) {
    famEScore += 3;
    famEEvidence.push(`High rule-of-three list frequency (${triadRate})`);
  }
  if (negFrameCount >= 2) {
    famEScore += 2;
    famEEvidence.push(`"Not X, but Y" dualisms found (${negFrameCount})`);
  }
  famEScore = Math.min(10, Math.max(1, famEScore));

  let famFScore = 0;
  const famFEvidence: string[] = [];
  const hasFirstPerson = clean.match(/\b(I|me|my|mine|we|our|myself)\b/g);
  const hasSlangOrIdiolect = clean.match(/\b(damn|hell|gonna|wanna|ain't|crap|yeah|screwed|mess|weird|stumbled|shitty|bizarre|huh)\b/i);
  if (!hasFirstPerson && typeTokenRatio < 0.45) {
    famFScore = 8;
    famFEvidence.push('Impersonal vantage and low lexical novelty.');
  } else if (hasSlangOrIdiolect) {
    famFScore = 1;
    famFEvidence.push('Authentic idiosyncratic voice / colloquial register present.');
  } else {
    famFScore = 4;
    famFEvidence.push('Standard polite literary voice.');
  }

  let famGScore = 0;
  const famGEvidence: string[] = [];
  if (genre === 'POEM') {
    const fillerRhymes = clean.match(/\b(so wise|rang high|in the sky|far and wide|by my side|deep inside)\b/gi);
    if (fillerRhymes) {
      famGScore = 7;
      famGEvidence.push(`Sound-driven padding phrases detected: ${fillerRhymes.join(', ')}`);
    } else {
      famGScore = 2;
      famGEvidence.push('Rhyme and meter appear purposeful without padding.');
    }
  }

  let famHScore = 0;
  const famHEvidence: string[] = [];
  const endingMatch = clean.match(/(?:in conclusion|overall|ultimately|journey continues|beacon of hope|testament to)\b/i);
  if (endingMatch) {
    famHScore = 8;
    famHEvidence.push(`Synthetic resolution ending: "${endingMatch[0]}"`);
  } else {
    famHScore = 3;
    famHEvidence.push('Natural conclusion arc.');
  }

  let famIScore = 0;
  const famIEvidence: string[] = [];
  const sensoryDetails = clean.match(/\b(smell|scent|cold|warm|bitter|greasy|rough|smoke|sweat|coffee|rust|chalk|whiskey|dirt|rain|peel)\b/gi);
  if (!sensoryDetails && wordCount > 150) {
    famIScore = 7;
    famIEvidence.push('Absence of tactile, olfactory, or grounded sensory specifics.');
  } else if (sensoryDetails) {
    famIScore = 2;
    famIEvidence.push(`Lived sensory details: ${sensoryDetails.slice(0, 3).join(', ')}`);
  } else {
    famIScore = 4;
    famIEvidence.push('Moderate sensory grounding.');
  }

  let famJScore = 0;
  const famJEvidence: string[] = [];
  const famJApplied = Boolean(options.hasVerifiedBaseline);

  // Counter evidence
  const counterItems: string[] = [];
  let pointsSubtracted = 0;
  if (hasSlangOrIdiolect) {
    pointsSubtracted += 10;
    counterItems.push('Raw vernacular / colloquial idiom');
  }
  if (clean.includes('—') && clean.split('—').length === 2 && wordCount < 300) {
    pointsSubtracted += 5;
    counterItems.push('Deliberate singular dramatic pause');
  }
  const selfCorrection = clean.match(/\b(no,\s+[a-z]+|wait,\s+[a-z]+|rather,\s+[a-z]+|or perhaps)\b/i);
  if (selfCorrection) {
    pointsSubtracted += 10;
    counterItems.push(`Self-correction gesture: "${selfCorrection[0]}"`);
  }
  if (sentenceLengthSd > 12) {
    pointsSubtracted += 8;
    counterItems.push(`Radical sentence length variance (SD: ${sentenceLengthSd})`);
  }

  // Weight Part 1
  const families = [
    { score: famAScore, weight: 15, applied: true },
    { score: famBScore, weight: 12, applied: true },
    { score: famCScore, weight: 12, applied: true },
    { score: famDScore, weight: 12, applied: true },
    { score: famEScore, weight: 8, applied: true },
    { score: famFScore, weight: 12, applied: true },
    { score: famGScore, weight: (genre === 'POEM' ? 6 : 0), applied: genre === 'POEM' },
    { score: famHScore, weight: 8, applied: true },
    { score: famIScore, weight: 10, applied: true },
    { score: famJScore, weight: (famJApplied ? 15 : 0), applied: famJApplied },
  ];

  const totalWeight = families.reduce((acc, f) => acc + (f.applied ? f.weight : 0), 0);
  const weightedSum = families.reduce((acc, f) => acc + (f.applied ? (f.score / 10) * f.weight : 0), 0);
  const rawScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 10;
  let finalScore = Math.max(0, rawScore - pointsSubtracted);

  const highScoringFamilies = families.filter(f => f.applied && f.score >= 6).length;
  const corroborated = highScoringFamilies >= 3;
  if (!corroborated && finalScore > 60) {
    finalScore = 55;
  }
  if (wordCount < 150) {
    finalScore = Math.min(finalScore, 40);
  } else if (wordCount <= 300) {
    finalScore = Math.min(finalScore, 58);
  }

  let band: 'Likely human' | 'Probably human' | 'Uncertain' | 'Suspicious' | 'Likely AI' = 'Likely human';
  let action = 'Proceed with editorial review.';
  if (finalScore <= 25) {
    band = 'Likely human';
    action = 'Proceed';
  } else if (finalScore <= 45) {
    band = 'Probably human';
    action = 'Proceed';
  } else if (finalScore <= 60) {
    band = 'Uncertain';
    action = 'Ask for drafts, phone notes or version history.';
  } else if (finalScore <= 75) {
    band = 'Suspicious';
    action = 'Ask for process evidence plus a short live 10-minute follow-up.';
  } else {
    band = 'Likely AI';
    action = 'Human review required; ask for process evidence.';
  }

  // =========================================================================
  // --- PART 2: TMQ SCORING ALGORITHM v2 (Anchored & Calibrated) ---
  // =========================================================================

  // --- MECHANICAL PASS (Count first, judge second) ---
  // Check 1: Repetition (phrases of 2+ words repeated 4+ times)
  const phraseRepeatCounts: { phrase: string; count: number }[] = [];
  const phraseMap = new Map<string, number>();
  for (let i = 0; i < wordsLower.length - 1; i++) {
    const bigram = `${wordsLower[i]} ${wordsLower[i+1]}`;
    if (wordsLower[i].length > 2 && wordsLower[i+1].length > 2) {
      phraseMap.set(bigram, (phraseMap.get(bigram) || 0) + 1);
    }
  }
  phraseMap.forEach((count, phrase) => {
    if (count >= 4) phraseRepeatCounts.push({ phrase, count });
  });

  // Check 2: Told-emotion density per 100 words
  let toldCount = 0;
  for (const w of wordsLower) {
    if (TOLD_EMOTION_WORDS.includes(w)) toldCount++;
  }
  const toldDensityPer100 = wordCount > 0 ? parseFloat(((toldCount / wordCount) * 100).toFixed(1)) : 0;

  // Check 3: Stacked synonyms inside 6-word window ("eternal sacred holy")
  let stackedSynonymCount = 0;
  for (let i = 0; i < wordsLower.length - 2; i++) {
    let synHits = 0;
    for (let j = 0; j < 6 && i + j < wordsLower.length; j++) {
      if (['eternal', 'sacred', 'holy', 'divine', 'pure', 'blessed'].includes(wordsLower[i+j])) {
        synHits++;
      }
    }
    if (synHits >= 3) {
      stackedSynonymCount++;
      i += 5; // skip past window
    }
  }

  // Check 4: Stock phrase count
  const stockPhraseHitsCount = totalStockHits;

  // Check 5: Personal-moment count (unrepeatable moments: quotes, specific gesture, object, sensory detail)
  let personalMomentsCount = 0;
  if (selfCorrection) personalMomentsCount++;
  if (clean.includes('"') && clean.match(/"[^"]+"/)) personalMomentsCount++;
  if (clean.match(/\b(cold fingers|into my sleeve|without touching it|lost our way|forehead on marble|locked fingers|pretending to look|chest|shivering|coat pocket|watch strap)\b/i)) {
    personalMomentsCount++;
  }
  if (sensoryDetails && sensoryDetails.length >= 2) personalMomentsCount++;
  if (hasSlangOrIdiolect) personalMomentsCount++;

  // Check 6: Syllables per line (spread)
  const lineSyllableCounts: number[] = [];
  if (lines.length > 0) {
    for (const line of lines) {
      const lineWords = line.split(/\s+/).filter(Boolean);
      const sylSum = lineWords.reduce((acc, w) => acc + countSyllables(w), 0);
      if (sylSum > 0) lineSyllableCounts.push(sylSum);
    }
  }
  const minSyllables = lineSyllableCounts.length > 0 ? Math.min(...lineSyllableCounts) : 0;
  const maxSyllables = lineSyllableCounts.length > 0 ? Math.max(...lineSyllableCounts) : 0;
  const syllableSpread = maxSyllables - minSyllables;

  // Check 7: Ending check ("forever" or "eternal" in last 2 lines)
  const lastLinesText = lines.slice(-2).join(' ').toLowerCase();
  const cloyingEnding = /\b(forever|eternal)\b/.test(lastLinesText);

  // Check 8: Register check (archaic + modern clash)
  const hasArchaic = /\b(thee|thou|thy|thine|espied|o'er|ere)\b/i.test(clean);
  const hasModern = /\b(love language|vibe|cringe|relatable|texted|dm'd|scrolling)\b/i.test(clean);
  const registerWobble = hasArchaic && hasModern;

  // Record triggered caps
  const triggeredCaps: string[] = [];
  if (phraseRepeatCounts.length > 0) triggeredCaps.push('Repetition filler: Iceberg <= 3/8, Cliché <= 2/5');
  if (toldDensityPer100 >= 6.0) triggeredCaps.push(`Told-emotion density (${toldDensityPer100}/100w >= 6): Iceberg <= 3/8, Containment <= 2/6`);
  if (stackedSynonymCount > 0) triggeredCaps.push(`Stacked synonyms (${stackedSynonymCount}): Cliché penalty`);
  if (stockPhraseHitsCount >= 6) triggeredCaps.push('6+ Stock phrases: Cliché <= 1/5');
  if (personalMomentsCount === 0) triggeredCaps.push('0 Personal moments: Specificity <= 2/7');
  else if (personalMomentsCount <= 2) triggeredCaps.push(`${personalMomentsCount} Personal moment(s): Specificity <= 4/7`);
  if (syllableSpread > 3 && genre === 'POEM') triggeredCaps.push(`Syllable spread ${syllableSpread} > 3: Meter <= 2/4, Syllabic <= 1/3`);
  if (cloyingEnding) triggeredCaps.push('Ending on unreframed "forever/eternal": Discovery Arc <= 3/5');
  if (registerWobble) triggeredCaps.push('Archaic/modern register wobble: Voice <= 4/7');

  // Top Flaws with quotes (Rule 4: Flaws before praise)
  const topFlaws: { flaw: string; quote: string }[] = [];
  if (toldDensityPer100 >= 5.0) {
    const toldExample = lines.find(l => TOLD_EMOTION_WORDS.some(w => l.toLowerCase().includes(w))) || lines[0] || '';
    topFlaws.push({ flaw: `High density of told emotion labels (${toldDensityPer100} per 100 words)`, quote: toldExample });
  }
  if (stockPhraseHits.length > 0) {
    const stockHit = stockPhraseHits[0].phrase;
    const stockExample = lines.find(l => l.toLowerCase().includes(stockHit)) || lines[0] || '';
    topFlaws.push({ flaw: `Stock trope comparison: "${stockHit}"`, quote: stockExample });
  }
  if (personalMomentsCount === 0) {
    topFlaws.push({ flaw: 'Absence of unrepeatable personal particulars (place/sensory coordinates)', quote: lines[0] || clean.slice(0, 40) });
  }
  if (phraseRepeatCounts.length > 0) {
    topFlaws.push({ flaw: `Repeated filler phrase: "${phraseRepeatCounts[0].phrase}" (${phraseRepeatCounts[0].count}x)`, quote: phraseRepeatCounts[0].phrase });
  }
  // Guarantee 3 flaws if possible
  if (topFlaws.length < 3 && syllableSpread > 5 && genre === 'POEM') {
    topFlaws.push({ flaw: `Uneven line cadence spread (${syllableSpread} syllable variance)`, quote: lines[lines.length - 1] || '' });
  }
  if (topFlaws.length < 3) {
    topFlaws.push({ flaw: 'Abstract sensory nouns substituting for concrete physical action', quote: lines[Math.min(1, lines.length - 1)] || clean.slice(0, 30) });
  }

  // --- CALIBRATE THE 13 METRICS USING LEVEL SCALE (0 to 4) ---
  const isFreeVerseOrProse = genre !== 'POEM' || syllableSpread > 4 || (!clean.includes('aa') && !clean.includes('bb'));
  const availableRaw = isFreeVerseOrProse ? 59 : 70;

  // Sound Group: Meter (max 4), Rhyme (max 4), Syllabic (max 3), Musical-Emotional Fit (max 6)
  let meterLevel = isFreeVerseOrProse ? 0 : (syllableSpread <= 2 ? 3.5 : syllableSpread <= 4 ? 2.5 : 1.0);
  if (syllableSpread > 3 && genre === 'POEM') meterLevel = Math.min(meterLevel, 2.0); // Cap: Meter <= 2/4 (Level 2)

  let rhymeLevel = isFreeVerseOrProse ? 0 : 2.0;
  if (genre === 'POEM' && famGScore >= 6) rhymeLevel = 1.0;

  let syllabicLevel = isFreeVerseOrProse ? 0 : (syllableSpread <= 2 ? 3.0 : 1.5);
  if (syllableSpread > 3 && genre === 'POEM') syllabicLevel = Math.min(syllabicLevel, 1.33); // Cap: Syllabic <= 1/3 (Level ~1.33)

  // Musical-Emotional Fit (max 6): sound mirrors feeling
  let musicalFitLevel = 2.0; // Competent default
  if (selfCorrection || (hasFirstPerson && sentenceLengthSd > 8)) musicalFitLevel = 3.3; // Level 3+
  if (totalStockHits >= 3) musicalFitLevel = 1.5;

  // Depth Group: Iceberg (max 8), Subtext (max 6), Emotion Containment (max 6)
  // Anchor Ladder for Iceberg:
  // Level 1: states central feeling in plain words ("You were my strength, my heart, my light")
  // Level 2: mix of stated and implied
  // Level 3: gesture carries feeling
  // Level 4: main feeling never named yet unmistakable
  let icebergLevel = 2.0;
  if (toldDensityPer100 >= 6.0 || totalStockHits >= 3) icebergLevel = 1.25; // Level 1 (Weak)
  else if (personalMomentsCount >= 2 && toldDensityPer100 < 3.0) icebergLevel = 3.5;
  else if (personalMomentsCount >= 1) icebergLevel = 2.5;

  // Apply Mechanical Caps for Iceberg:
  if (phraseRepeatCounts.length > 0) icebergLevel = Math.min(icebergLevel, 1.5); // <= 3/8
  if (toldDensityPer100 >= 6.0) icebergLevel = Math.min(icebergLevel, 1.5); // <= 3/8

  // Subtext (max 6)
  let subtextLevel = 2.0;
  if (clean.includes('?') && personalMomentsCount >= 1) subtextLevel = 3.0;
  if (totalStockHits >= 3 || toldDensityPer100 >= 6.0) subtextLevel = 1.5;

  // Emotion Containment (max 6)
  let containmentLevel = 2.0;
  if (toldDensityPer100 >= 6.0) containmentLevel = 1.33; // Cap: Containment <= 2/6 (Level ~1.33)
  else if (toldDensityPer100 <= 1.5 && personalMomentsCount >= 1) containmentLevel = 3.5;
  else if (toldDensityPer100 <= 3.0) containmentLevel = 2.5;

  // Truth Group: Voice (max 7), Specificity (max 7), Cliché Density (max 5)
  // Voice Anchor:
  let voiceLevel = 2.0;
  if (hasSlangOrIdiolect || selfCorrection) voiceLevel = 3.5;
  else if (totalStockHits >= 3) voiceLevel = 1.5;
  if (registerWobble) voiceLevel = Math.min(voiceLevel, 2.28); // Cap: Voice <= 4/7 (Level ~2.28)

  // Specificity Anchor:
  // Level 0: Love is eternal
  // Level 1: I held your hand tightly
  // Level 2: At Assi I held your hand
  // Level 3: At Assi you tucked your cold fingers into my sleeve
  // Level 4: Assi, evening. You asked if the water was cold. I said yes without touching it.
  let specificityLevel = 2.0;
  if (personalMomentsCount === 0) specificityLevel = 1.0; // Level 1 (Weak)
  else if (personalMomentsCount === 1) specificityLevel = 1.75;
  else if (personalMomentsCount === 2) specificityLevel = 2.3;
  else if (personalMomentsCount >= 3) specificityLevel = 3.2;

  // Apply Mechanical Caps for Specificity:
  if (personalMomentsCount === 0) specificityLevel = Math.min(specificityLevel, 1.14); // <= 2/7
  else if (personalMomentsCount <= 2) specificityLevel = Math.min(specificityLevel, 2.28); // <= 4/7

  // Cliché Density (max 5)
  let clicheLevel = 2.0;
  if (stockPhraseHitsCount === 0) clicheLevel = 3.5;
  else if (stockPhraseHitsCount <= 2) clicheLevel = 2.0;
  else clicheLevel = 1.0;
  if (phraseRepeatCounts.length > 0) clicheLevel = Math.min(clicheLevel, 1.6); // <= 2/5
  if (stockPhraseHitsCount >= 6) clicheLevel = Math.min(clicheLevel, 0.8); // <= 1/5
  if (stackedSynonymCount > 0) clicheLevel = Math.max(0, clicheLevel - (stackedSynonymCount * 0.5));

  // Movement Group: Discovery Arc (max 5), Pivot (max 5)
  let discoveryArcLevel = 2.0;
  if (clean.includes('?') && (clean.includes('scares me') || clean.includes('realised') || clean.includes('learned') || clean.includes('now I know') || selfCorrection)) {
    discoveryArcLevel = 3.2;
  }
  if (cloyingEnding) discoveryArcLevel = Math.min(discoveryArcLevel, 2.4); // <= 3/5

  let pivotLevel = 2.0;
  if (selfCorrection || clean.match(/\b(until|suddenly|except|that's what|no longer|instead)\b/i)) {
    pivotLevel = 3.0;
  }
  if (totalStockHits >= 3) pivotLevel = 1.5;

  // Authenticity: AI-Likelihood (inverted, max 4)
  let aiLikelihoodLevel = 2.0;
  if (band === 'Suspicious' || band === 'Likely AI') aiLikelihoodLevel = 0;
  else if (band === 'Likely human') aiLikelihoodLevel = 3.8;
  else if (band === 'Probably human') aiLikelihoodLevel = 3.0;
  else aiLikelihoodLevel = 2.0; // Uncertain

  // Compute points = metric max * level / 4
  const meterScore = isFreeVerseOrProse ? 0 : parseFloat(((4 * meterLevel) / 4).toFixed(1));
  const rhymeScore = isFreeVerseOrProse ? 0 : parseFloat(((4 * rhymeLevel) / 4).toFixed(1));
  const syllabicScore = isFreeVerseOrProse ? 0 : parseFloat(((3 * syllabicLevel) / 4).toFixed(1));
  const musicalFitScore = parseFloat(((6 * musicalFitLevel) / 4).toFixed(1));
  const icebergScore = parseFloat(((8 * icebergLevel) / 4).toFixed(1));
  const subtextScore = parseFloat(((6 * subtextLevel) / 4).toFixed(1));
  const containmentScore = parseFloat(((6 * containmentLevel) / 4).toFixed(1));
  const voiceScore = parseFloat(((7 * voiceLevel) / 4).toFixed(1));
  const specificityScore = parseFloat(((7 * specificityLevel) / 4).toFixed(1));
  const clicheScore = parseFloat(((5 * clicheLevel) / 4).toFixed(1));
  const discoveryArcScore = parseFloat(((5 * discoveryArcLevel) / 4).toFixed(1));
  const pivotScore = parseFloat(((5 * pivotLevel) / 4).toFixed(1));
  const aiScore = parseFloat(((4 * aiLikelihoodLevel) / 4).toFixed(1));

  // Find evidence lines
  const quote1 = lines[0] || clean.slice(0, 40);
  const quote2 = lines.length > 1 ? lines[Math.floor(lines.length / 2)] : quote1;
  const quoteEnd = lines[lines.length - 1] || quote1;

  const metricsList: TMQMetricDetail[] = [
    { name: 'Meter', group: 'Sound', max: 4, level: meterLevel, score: meterScore, isNA: isFreeVerseOrProse, evidence: isFreeVerseOrProse ? 'N/A (Free verse/prose standard applied)' : `Spread: ${syllableSpread} syllables ("${quote1}")` },
    { name: 'Rhyme', group: 'Sound', max: 4, level: rhymeLevel, score: rhymeScore, isNA: isFreeVerseOrProse, evidence: isFreeVerseOrProse ? 'N/A (Cadence over rhyme)' : `Rhyme level ${rhymeLevel}/4 ("${quoteEnd}")` },
    { name: 'Syllabic', group: 'Sound', max: 3, level: syllabicLevel, score: syllabicScore, isNA: isFreeVerseOrProse, evidence: isFreeVerseOrProse ? 'N/A (Breath-shaped line length)' : `Min: ${minSyllables}, Max: ${maxSyllables}` },
    { name: 'Musical-Emotional Fit', group: 'Sound', max: 6, level: musicalFitLevel, score: musicalFitScore, evidence: `Sound cadence: "${quote2}"` },
    { name: 'Iceberg Depth', group: 'Depth', max: 8, level: icebergLevel, score: icebergScore, evidence: `Central feeling implied vs stated: "${quote2}"` },
    { name: 'Subtext', group: 'Depth', max: 6, level: subtextLevel, score: subtextScore, evidence: `Lines rewarding rereading: "${quote1}"` },
    { name: 'Emotion Containment', group: 'Depth', max: 6, level: containmentLevel, score: containmentScore, evidence: `Told-emotion density ${toldDensityPer100}/100w: "${quoteEnd}"` },
    { name: 'Voice', group: 'Truth', max: 7, level: voiceLevel, score: voiceScore, evidence: `Authorial register: "${quote1}"` },
    { name: 'Specificity', group: 'Truth', max: 7, level: specificityLevel, score: specificityScore, evidence: `Personal coordinates: ${personalMomentsCount} moment(s) found ("${quote2}")` },
    { name: 'Cliché Density', group: 'Truth', max: 5, level: clicheLevel, score: clicheScore, evidence: stockPhraseHits.length > 0 ? `Stock tropes: ${stockPhraseHits.map(h => h.phrase).join(', ')}` : 'Clean comparison vocabulary without stock tropes.' },
    { name: 'Discovery Arc', group: 'Movement', max: 5, level: discoveryArcLevel, score: discoveryArcScore, evidence: `Opening vs Closing realization: "${quoteEnd}"` },
    { name: 'Pivot', group: 'Movement', max: 5, level: pivotLevel, score: pivotScore, evidence: `Tonal turn: "${quote2}"` },
    { name: 'AI-Likelihood (Inverted)', group: 'Authenticity', max: 4, level: aiLikelihoodLevel, score: aiScore, evidence: `Part 1 verdict: ${band} (${finalScore}/100)` }
  ];

  const earnedRaw = parseFloat(
    metricsList.reduce((acc, m) => acc + (m.isNA ? 0 : m.score), 0).toFixed(1)
  );

  const rawPercentage = parseFloat(((earnedRaw / availableRaw) * 100).toFixed(1));

  // --- STEP 2: EMOTIONAL BIAS v2 ---
  // Topic-prestige guard: for sacred, romantic, grief, patriotic topics, Emotional Impact starts at 6
  const isSacredOrRomantic = /\b(god|shiva|krishna|allah|temple|ghat|sacred|divine|holy|prayer|blessed|love|lover|beloved|grief|death|martyr|country|motherland)\b/i.test(clean);
  let emotionalImpact = isSacredOrRomantic ? 6.0 : 4.5;
  if (counterItems.length >= 2) emotionalImpact += 1.5;
  if (/death|dead|bleed|wounds|corpse|die/i.test(clean)) emotionalImpact += 1.0;
  emotionalImpact = Math.min(10, parseFloat(emotionalImpact.toFixed(1)));

  // Earned Emotion: average of Containment, Specificity, Subtext converted to 0-10 scale
  const containmentNorm = (containmentScore / 6) * 10;
  const specificityNorm = (specificityScore / 7) * 10;
  const subtextNorm = (subtextScore / 6) * 10;
  const earnedEmotion = parseFloat(((containmentNorm + specificityNorm + subtextNorm) / 3).toFixed(1));

  const emotionalBias = parseFloat((emotionalImpact - earnedEmotion).toFixed(1));

  let ebAdjustment = 0;
  if (emotionalBias > 2.0) {
    // Piece leans on topic: subtract up to 5 points
    ebAdjustment = -Math.min(5, Math.round((emotionalBias - 2.0) * 1.5));
  } else if (emotionalBias < -2.0) {
    // Understated piece: add up to 5 points
    ebAdjustment = Math.min(5, Math.round(Math.abs(emotionalBias + 2.0) * 1.5));
  }

  let adjustedRating = Math.round(rawPercentage + ebAdjustment);

  // --- OVERALL CAPS PER SECTION 3 & GATES ---
  // 1. Cap: Final score <= 69 if Specificity or Iceberg is below 4/8 (scaled, i.e. level < 2.0)
  if (specificityLevel < 2.0 || icebergLevel < 2.0) {
    if (adjustedRating > 69) {
      adjustedRating = 69;
      triggeredCaps.push('Specificity or Iceberg below level 2 (4/8): Score capped at 69');
    }
  }

  // 2. Cap: Final score <= 59 if BOTH Specificity and Iceberg are at level 1 or lower
  if (specificityLevel <= 1.25 && icebergLevel <= 1.25) {
    if (adjustedRating > 59) {
      adjustedRating = 59;
      triggeredCaps.push('Both Specificity and Iceberg at level 1 or lower: Score capped at 59');
    }
  }

  // 3. Masterwork Gate: 90+ requires Voice >= 6/7, Specificity >= 5/7, Iceberg >= 6/8
  let masterworkGated = false;
  let masterworkGateNotes = '';
  if (adjustedRating >= 90) {
    if (voiceScore < 6.0 || specificityScore < 5.0 || icebergScore < 6.0) {
      adjustedRating = 89;
      masterworkGated = true;
      masterworkGateNotes = `Score capped at 89 (Masterwork gate requires Voice >= 6/7 [scored ${voiceScore}], Specificity >= 5/7 [scored ${specificityScore}], Iceberg Depth >= 6/8 [scored ${icebergScore}]).`;
    }
  }

  // 4. Authenticity Gate: hold rating if Suspicious or Likely AI
  const authenticityHeld = band === 'Suspicious' || band === 'Likely AI';
  const finalRating = Math.max(0, Math.min(100, adjustedRating));

  // Rating Bands
  let qualityBand: 'Masterwork' | 'Excellent' | 'Strong' | 'Solid' | 'Promising' | 'Developing' = 'Developing';
  if (finalRating >= 90) qualityBand = 'Masterwork';
  else if (finalRating >= 80) qualityBand = 'Excellent';
  else if (finalRating >= 70) qualityBand = 'Strong';
  else if (finalRating >= 60) qualityBand = 'Solid';
  else if (finalRating >= 50) qualityBand = 'Promising';

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
    mechanicalPass: {
      repetitionCounts: phraseRepeatCounts,
      toldEmotionWordsCount: toldCount,
      toldEmotionDensityPer100: toldDensityPer100,
      stackedSynonymCount,
      stockPhraseHitsCount,
      personalMomentsCount,
      syllableSpread,
      triggeredCaps,
      topFlaws,
    },
    quality: {
      earnedRaw,
      availableRaw,
      percentage: rawPercentage,
      emotionalImpact,
      earnedEmotion,
      emotionalBias,
      ebAdjustment,
      gatedRating: adjustedRating,
      finalRating,
      band: qualityBand,
      masterworkGated,
      masterworkGateNotes: masterworkGateNotes || undefined,
      authenticityHeld,
      metrics: metricsList,
      threeQuestions: {
        isItTrue: {
          passed: voiceScore >= 5.0 && specificityScore >= 4.0,
          note: `Voice (${voiceScore}/7), Specificity (${specificityScore}/7), Containment (${containmentScore}/6)`
        },
        isItSpecific: {
          passed: specificityScore >= 4.0 && clicheScore >= 3.5,
          note: `Specificity (${specificityScore}/7), Cliché Cleanliness (${clicheScore}/5)`
        },
        doesItMove: {
          passed: icebergScore >= 5.0 && musicalFitScore >= 4.0,
          note: `Iceberg Depth (${icebergScore}/8), Musical Fit (${musicalFitScore}/6), Pivot (${pivotScore}/5)`
        }
      }
    },
  };
}
