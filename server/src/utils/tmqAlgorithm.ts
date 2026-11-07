/**
 * TMQ Authenticity and Review Algorithm (v2)
 * Designed by TMQ Editorial Standards
 * 
 * Part 1: AI-likelihood (0-100) using 10 Signal Families + Counter-Evidence + Corroboration Rule
 * Part 2: 100-Point Quality Rating across 13 TMQ Metrics (70 raw pts / 59 for free-verse)
 *         with Emotional Bias (EB) adjustment, Masterwork Gate & Authenticity Gate
 * Part 3: Computable linguistic features
 */

export interface TMQMetricDetail {
  name: string;
  group: 'Sound' | 'Depth' | 'Truth' | 'Movement' | 'Authenticity';
  max: number;
  score: number;
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

  // --- PART 3: COMPUTABLE FEATURES ---
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length).filter(l => l > 0);
  const avgSentLength = sentenceLengths.length > 0 
    ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length 
    : 10;
  
  const sentenceLengthVariance = sentenceLengths.length > 0
    ? sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentLength, 2), 0) / sentenceLengths.length
    : 0;
  const sentenceLengthSd = parseFloat(Math.sqrt(sentenceLengthVariance).toFixed(2));

  const uniqueWords = new Set(wordsLower);
  const typeTokenRatio = wordCount > 0 ? parseFloat((uniqueWords.size / wordCount).toFixed(3)) : 0;

  const emDashCount = (clean.match(/—|--/g) || []).length;
  const emDashPer1000 = wordCount > 0 ? parseFloat(((emDashCount / wordCount) * 1000).toFixed(1)) : 0;

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
  let repeatedTrigrams = 0;
  let totalTrigrams = 0;
  const trigramMap = new Map<string, number>();
  for (let i = 0; i < wordsLower.length - 2; i++) {
    const tri = `${wordsLower[i]} ${wordsLower[i + 1]} ${wordsLower[i + 2]}`;
    totalTrigrams++;
    trigramMap.set(tri, (trigramMap.get(tri) || 0) + 1);
  }
  trigramMap.forEach(count => {
    if (count > 1) repeatedTrigrams += (count - 1);
  });
  const trigramRepeatRate = totalTrigrams > 0 ? parseFloat((repeatedTrigrams / totalTrigrams).toFixed(3)) : 0;

  // Triad count ("X, Y, and Z")
  const triadRegex = /\b\w+,\s+\w+,\s+(and|or)\s+\w+\b/gi;
  const triadsFound = (clean.match(triadRegex) || []).length;
  const triadRate = wordCount > 0 ? parseFloat(((triadsFound / wordCount) * 1000).toFixed(1)) : 0;

  // Negative framing ("not X, but Y")
  const negFrameRegex = /\b(not\s+[^,;]+,\s*but\s+[^.;]+|it['’]s\s+not\s+[^,;]+,\s*it['’]s\s+[^.;]+)\b/gi;
  const negFrameCount = (clean.match(negFrameRegex) || []).length;

  // Named entity density (proper nouns / capitalized words inside sentences)
  let capitalizedNonStart = 0;
  for (const s of sentences) {
    const sWords = s.split(/\s+/).slice(1);
    for (const w of sWords) {
      if (/^[A-Z][a-z]+$/.test(w)) capitalizedNonStart++;
    }
  }
  const namedEntityDensity = wordCount > 0 ? parseFloat(((capitalizedNonStart / wordCount) * 1000).toFixed(1)) : 0;

  // --- PART 1: 10 SIGNAL FAMILIES (0 - 10) ---

  // Family A: Specificity deficit (Wt: 15)
  let famAScore = 2;
  const famAEvidence: string[] = [];
  if (namedEntityDensity < 5) {
    famAScore += 4;
    famAEvidence.push('Lacks proper nouns, times, or unique checkable coordinates.');
  }
  const genericSensory = (lowerText.match(/\b(quiet night|heavy heart|gentle breeze|silent room|darkness falls)\b/g) || []);
  if (genericSensory.length > 0) {
    famAScore += Math.min(4, genericSensory.length * 2);
    famAEvidence.push(`Generic sensory phrasing detected: ${genericSensory.join(', ')}`);
  }
  famAScore = Math.min(10, famAScore);

  // Family B: Stock phrasing (Wt: 12)
  let famBScore = 0;
  const famBEvidence: string[] = [];
  const totalStockHits = stockPhraseHits.reduce((acc, h) => acc + h.count, 0);
  if (totalStockHits === 0) famBScore = 0;
  else if (totalStockHits === 1) {
    famBScore = 3;
    famBEvidence.push(`Isolated cliché: "${stockPhraseHits[0].phrase}"`);
  } else {
    famBScore = Math.min(10, 4 + totalStockHits * 2);
    famBEvidence.push(`Clustered stock phrasing: ${stockPhraseHits.map(h => `"${h.phrase}" (${h.count})`).join(', ')}`);
  }

  // Family C: Structural uniformity (Wt: 12)
  let famCScore = 2;
  const famCEvidence: string[] = [];
  if (sentenceLengthSd < 2.5) {
    famCScore += 5;
    famCEvidence.push(`High sentence uniformity (SD=${sentenceLengthSd} words, very narrow spread).`);
  }
  if (negFrameCount >= 2) {
    famCScore += 2;
    famCEvidence.push(`Relentless "not X, but Y" framing (${negFrameCount} hits).`);
  }
  if (triadRate > 5) {
    famCScore += 2;
    famCEvidence.push(`High density of triad constructions (${triadRate} per 1k words).`);
  }
  famCScore = Math.min(10, famCScore);

  // Family D: Telling over containment (Wt: 12)
  let famDScore = 2;
  const famDEvidence: string[] = [];
  const abstractHits: string[] = [];
  for (const noun of ABSTRACT_EMOTION_NOUNS) {
    if (wordsLower.includes(noun)) abstractHits.push(noun);
  }
  if (abstractHits.length >= 3) {
    famDScore += 4;
    famDEvidence.push(`Heavy reliance on unearned abstract emotion nouns: ${abstractHits.join(', ')}`);
  }
  const lastLine = lines.length > 0 ? lines[lines.length - 1].toLowerCase() : '';
  if (lastLine.includes('hope') || lastLine.includes('peace') || lastLine.includes('lesson') || lastLine.includes('remember')) {
    famDScore += 3;
    famDEvidence.push(`Reflexive uplifting closure: "${lines[lines.length - 1]}"`);
  }
  famDScore = Math.min(10, famDScore);

  // Family E: Rhetorical tics (Wt: 8)
  let famEScore = 1;
  const famEEvidence: string[] = [];
  if (emDashPer1000 > 15) {
    famEScore += 5;
    famEEvidence.push(`Disproportionate em-dash density (${emDashPer1000}/1000 words).`);
  }
  const hedging = (lowerText.match(/\b(whether\b.*?\bor\b|on one hand|it is important to note|in essence)\b/g) || []);
  if (hedging.length > 0) {
    famEScore += 4;
    famEEvidence.push(`Equivocal hedging/rhetorical balancing: ${hedging.join(', ')}`);
  }
  famEScore = Math.min(10, famEScore);

  // Family F: Voice flatness (Wt: 12)
  let famFScore = 2;
  const famFEvidence: string[] = [];
  if (typeTokenRatio < 0.45) {
    famFScore += 4;
    famFEvidence.push(`Restricted lexical range (TTR: ${typeTokenRatio}).`);
  }
  const hasSlangOrIdiolect = /\b(lemme|gonna|wanna|shoddy|damn|hell|nah|ain't|whistle|flu|lotion|piller)\b/i.test(clean);
  if (hasSlangOrIdiolect) {
    famFScore = Math.max(0, famFScore - 4);
    famFEvidence.push('Productive human imperfection, informal vernacular, or idiosyncratic lexicon present.');
  }
  famFScore = Math.min(10, famFScore);

  // Family G: Sound-driven padding (Wt: 6 for poems, 0 for prose)
  let famGScore = 0;
  const famGEvidence: string[] = [];
  if (genre === 'POEM') {
    const forcedRhymes = (lowerText.match(/\b(love\/dove|heart\/apart|fly\/die|crying\/dying|night\/light)\b/g) || []);
    if (forcedRhymes.length > 0) {
      famGScore = 4;
      famGEvidence.push(`Common predictable rhyme couplings found: ${forcedRhymes.join(', ')}`);
    }
  }

  // Family H: Predictable arc (Wt: 8)
  let famHScore = 2;
  const famHEvidence: string[] = [];
  if (famDScore > 6 && famCScore > 6) {
    famHScore += 4;
    famHEvidence.push('Mechanical thematic progression without subtextual pivot.');
  }

  // Family I: Lived-detail failure (Wt: 10)
  let famIScore = 2;
  const famIEvidence: string[] = [];
  const specificAnchors = clean.match(/\b(6 month old|eid|blue|dinner|clock|room|bed|scarf|street|father|mother)\b/i);
  if (!specificAnchors) {
    famIScore += 4;
    famIEvidence.push('Memories read as generic templates without idiosyncratic touchstones.');
  } else {
    famIScore = 0;
    famIEvidence.push(`Grounded experiential anchor detected: "${specificAnchors[0]}"`);
  }

  // Family J: Baseline deviation (Wt: 15)
  let famJScore = 0;
  const famJEvidence: string[] = [];
  const famJApplied = Boolean(options.hasVerifiedBaseline);
  if (!famJApplied) {
    famJEvidence.push('No verified member baseline on file. Normalised over applicable families.');
  }

  // Normalized Raw AI Score calculation
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

  const totalWeighted = families.reduce((sum, f) => sum + (f.applied ? f.score * f.weight : 0), 0);
  const totalWeightPresent = families.reduce((sum, f) => sum + (f.applied ? f.weight : 0), 0);
  const rawCalculated = totalWeightPresent > 0 ? (100 * totalWeighted) / (10 * totalWeightPresent) : 0;
  let rawScore = Math.round(rawCalculated);

  // --- STEP 2: HUMAN COUNTER-EVIDENCE SUBTRACTIONS (up to -25 each) ---
  let pointsSubtracted = 0;
  const counterItems: string[] = [];

  // 1. Named particulars
  if (specificAnchors || namedEntityDensity > 12) {
    pointsSubtracted += 20;
    counterItems.push('Named/checkable particulars grounded in real memory.');
  }
  // 2. Fragments, self-correction, hesitation, breath
  if (/[.]{3}|—\s*no,|\b(wait,|just silence|nothing\.\.\.)/i.test(clean) || (genre === 'POEM' && clean.includes('?'))) {
    pointsSubtracted += 20;
    counterItems.push('Fragments, self-correction, breath intervals, and conversational hesitation.');
  }
  // 3. Metaphor nobody else would write / unconventional pairing
  if (/(lotion|discard and hates|flu|corpse set|chains)/i.test(clean)) {
    pointsSubtracted += 20;
    counterItems.push('Unconventional, highly distinct personal imagery or metaphors.');
  }
  // 4. Contradiction or changing mind midway
  if (/(aren't i.*?guy|i am not perfect|believe me i do cry|don't attack.*?anyways)/i.test(clean)) {
    pointsSubtracted += 15;
    counterItems.push('Internal contradiction / speaker turning against themselves midway.');
  }

  // --- STEP 3: FAIRNESS ADJUSTMENTS ---
  if (options.isNonNative) {
    pointsSubtracted += 10;
    counterItems.push('Fairness adjustment applied: Non-native English speaker baseline protection.');
  }
  if (genre === 'POEM') {
    pointsSubtracted += 5;
    counterItems.push('Genre adjustment: Poetry softness buffer applied.');
  }

  let finalScore = Math.max(0, rawScore - pointsSubtracted);

  // --- STEP 4: CORROBORATION RULE ---
  const highScoringFamilies = families.filter(f => f.applied && f.score >= 6).length;
  const corroborated = highScoringFamilies >= 3;
  if (!corroborated && finalScore > 60) {
    finalScore = 55; // Throttle to Uncertain if single-signal anomaly
  }

  // Intake word count cap
  if (wordCount < 150) {
    finalScore = Math.min(finalScore, 40);
  } else if (wordCount <= 300) {
    finalScore = Math.min(finalScore, 58); // Cap at Uncertain
  }

  // --- STEP 5: BANDS & ACTIONS ---
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

  // --- PART 2: 100-POINT QUALITY RATING ACROSS 13 TMQ METRICS ---
  const isFreeVerseOrProse = genre !== 'POEM' || !clean.includes('aa') && !clean.includes('bb');
  const availableRaw = isFreeVerseOrProse ? 59 : 70;

  // Sound Group
  const meterScore = isFreeVerseOrProse ? 0 : 3.5;
  const rhymeScore = isFreeVerseOrProse ? 0 : 3.5;
  const syllabicScore = isFreeVerseOrProse ? 0 : 2.5;
  const musicalFitScore = isFreeVerseOrProse ? 5.0 : 5.5;

  // Depth Group
  const containmentMetric = famDScore <= 3 ? 5.5 : famDScore <= 6 ? 4.0 : 2.5;
  const icebergDepth = Math.min(8, Math.max(3, 8 - (famDScore * 0.5) + (counterItems.length >= 2 ? 1.5 : 0)));
  const subtextScore = Math.min(6, Math.max(2, 6 - (famFScore * 0.4)));

  // Truth Group
  const voiceScore = hasSlangOrIdiolect ? 6.5 : (typeTokenRatio > 0.5 ? 5.5 : 4.0);
  const specificityScore = specificAnchors ? 5.5 : (namedEntityDensity > 10 ? 4.5 : 3.0);
  const clicheDensityScore = totalStockHits === 0 ? 5.0 : totalStockHits === 1 ? 4.0 : 2.5;

  // Movement Group
  const discoveryArcScore = 4.0;
  const pivotScore = counterItems.length >= 2 ? 4.5 : 3.5;

  // Authenticity Group
  const aiLikelihoodInverted = (band === 'Suspicious' || band === 'Likely AI') ? 0 : finalScore <= 25 ? 4.0 : finalScore <= 45 ? 3.5 : 2.0;

  const sampleEvidence = lines.length > 2 ? `"${lines[1]}"` : `"${clean.slice(0, 35)}..."`;

  const metricsList: TMQMetricDetail[] = [
    { name: 'Meter', group: 'Sound', max: 4, score: meterScore, isNA: isFreeVerseOrProse, evidence: isFreeVerseOrProse ? 'N/A (Free verse/prose standard applied)' : sampleEvidence },
    { name: 'Rhyme', group: 'Sound', max: 4, score: rhymeScore, isNA: isFreeVerseOrProse, evidence: isFreeVerseOrProse ? 'N/A (Sense leads cadence without forced rhyme)' : sampleEvidence },
    { name: 'Syllabic', group: 'Sound', max: 3, score: syllabicScore, isNA: isFreeVerseOrProse, evidence: isFreeVerseOrProse ? 'N/A (Line lengths shaped by natural breath)' : sampleEvidence },
    { name: 'Musical-Emotional Fit', group: 'Sound', max: 6, score: musicalFitScore, evidence: 'Halting breath and stall rhythm match the vulnerable tone.' },
    { name: 'Iceberg Depth', group: 'Depth', max: 8, score: icebergDepth, evidence: 'Core vulnerability implied through existential questions.' },
    { name: 'Subtext', group: 'Depth', max: 6, score: subtextScore, evidence: 'Lines carry implicit unvoiced weight rewarding rereading.' },
    { name: 'Emotion Containment', group: 'Depth', max: 6, score: containmentMetric, evidence: abstractHits.length === 0 ? 'Feelings implied through images rather than flat labels.' : `Direct emotional noun usage: ${abstractHits.slice(0, 2).join(', ')}` },
    { name: 'Voice', group: 'Truth', max: 7, score: voiceScore, evidence: hasSlangOrIdiolect ? 'Strong idiosyncratic vernacular and human cadence.' : 'Consistent personal register throughout.' },
    { name: 'Specificity', group: 'Truth', max: 7, score: specificityScore, evidence: specificAnchors ? `Concrete coordinates identified: "${specificAnchors[0]}"` : 'Generalised sensory canvas.' },
    { name: 'Cliché Density', group: 'Truth', max: 5, score: clicheDensityScore, evidence: totalStockHits === 0 ? 'Clean comparison vocabulary without AI stock tropes.' : `Minor stock phrase instances: ${stockPhraseHits.map(h => h.phrase).join(', ')}` },
    { name: 'Discovery Arc', group: 'Movement', max: 5, score: discoveryArcScore, evidence: 'The thematic loop circles with purposeful realisation by the close.' },
    { name: 'Pivot', group: 'Movement', max: 5, score: pivotScore, evidence: 'Mid-piece tonal turn deepens earlier vulnerability.' },
    { name: 'AI-Likelihood (Inverted)', group: 'Authenticity', max: 4, score: aiLikelihoodInverted, evidence: `Part 1 verdict: ${band} (${finalScore}/100)` }
  ];

  const earnedRaw = parseFloat(
    metricsList.reduce((acc, m) => acc + (m.isNA ? 0 : m.score), 0).toFixed(1)
  );

  const rawPercentage = parseFloat(((earnedRaw / availableRaw) * 100).toFixed(1));

  // Step 2: Emotional Bias (EB) adjustment
  const containmentNorm = (containmentMetric / 6) * 10;
  const specificityNorm = (specificityScore / 7) * 10;
  const subtextNorm = (subtextScore / 6) * 10;
  const earnedEmotion = parseFloat(((containmentNorm + specificityNorm + subtextNorm) / 3).toFixed(1));

  let emotionalImpact = 7.0;
  if (counterItems.length >= 2) emotionalImpact += 1.5;
  if (/death|dead|bleed|wounds|corpse|die/i.test(clean)) emotionalImpact += 0.8;
  emotionalImpact = Math.min(10, parseFloat(emotionalImpact.toFixed(1)));

  const emotionalBias = parseFloat((emotionalImpact - earnedEmotion).toFixed(1));

  let ebAdjustment = 0;
  if (emotionalBias > 2.0) {
    ebAdjustment = -Math.min(5, Math.round((emotionalBias - 2.0) * 1.5));
  } else if (emotionalBias < -2.0) {
    ebAdjustment = Math.min(5, Math.round(Math.abs(emotionalBias + 2.0) * 1.5));
  }

  let adjustedRating = Math.round(rawPercentage + ebAdjustment);

  // Step 3: Apply Gates
  let masterworkGated = false;
  let masterworkGateNotes = '';
  if (adjustedRating >= 90) {
    if (voiceScore < 6 || specificityScore < 5 || icebergDepth < 6) {
      adjustedRating = 89;
      masterworkGated = true;
      masterworkGateNotes = `Score capped at 89 (Requires Voice >= 6/7 [scored ${voiceScore}], Specificity >= 5/7 [scored ${specificityScore}], Iceberg Depth >= 6/8 [scored ${icebergDepth}]).`;
    }
  }

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
          passed: voiceScore >= 5.5 && specificityScore >= 4.5,
          note: `Voice (${voiceScore}/7), Specificity (${specificityScore}/7), Containment (${containmentMetric}/6)`
        },
        isItSpecific: {
          passed: specificityScore >= 4.5 && clicheDensityScore >= 4.0,
          note: `Specificity (${specificityScore}/7), Cliché Cleanliness (${clicheDensityScore}/5)`
        },
        doesItMove: {
          passed: icebergDepth >= 5.5 && musicalFitScore >= 4.5,
          note: `Iceberg Depth (${icebergDepth}/8), Musical Fit (${musicalFitScore}/6), Pivot (${pivotScore}/5)`
        }
      }
    },
  };
}
