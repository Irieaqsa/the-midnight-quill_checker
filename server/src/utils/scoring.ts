export interface ScoringInput {
  aiScore: number;
  weight: number;
}

export function normalizeScore(score: number, min: number = 0, max: number = 1): number {
  if (max === min) return 50;
  const normalized = ((score - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

export function weightedMean(inputs: ScoringInput[]): number {
  if (inputs.length === 0) return 0;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const input of inputs) {
    weightedSum += input.aiScore * input.weight;
    totalWeight += input.weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

export function calculateCombinedScore(scores: number[], weights?: number[]): number {
  if (scores.length === 0) return 0;
  const w = weights && weights.length === scores.length ? weights : scores.map(() => 1.0);
  const inputs: ScoringInput[] = scores.map((s, idx) => ({ aiScore: s, weight: w[idx] }));
  return weightedMean(inputs);
}

export function calculateAgreement(scores: number[]): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (scores.length <= 1) return 'HIGH';
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const spread = Math.sqrt(variance);
  if (spread < 15) return 'HIGH';
  if (spread <= 35) return 'MEDIUM';
  return 'LOW';
}

export function determineVerdict(score: number): 'LIKELY_HUMAN' | 'MIXED' | 'LIKELY_AI' {
  if (score < 20) return 'LIKELY_HUMAN';
  if (score < 60) return 'MIXED';
  return 'LIKELY_AI';
}
