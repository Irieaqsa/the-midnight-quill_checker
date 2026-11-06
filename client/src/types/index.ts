/* ------------------------------------------------------------------ */
/*  TMQ Authenticity Desk — shared TypeScript types                   */
/* ------------------------------------------------------------------ */

export type Role = 'USER' | 'ADMIN' | 'user' | 'admin';

export type SubmissionStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'PARTIAL'
  | 'COMPLETE'
  | 'FAILED'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type DetectorHealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export type VerdictLabel = 'LIKELY_HUMAN' | 'MIXED' | 'LIKELY_AI' | 'Likely Human' | 'Mixed / Uncertain' | 'Likely AI';

export type AgreementLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  whatsappNumber?: string | null;
  whatsappVerifiedAt?: string | null;
  quotaRemaining: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'active' | 'suspended';
  createdAt?: string;
}

export interface ProviderResult {
  id: string;
  submissionId?: string;
  provider: string;
  status: string;
  aiScore: number | null;
  label: string | null;
  sentenceData?: string | null;
  rawResponse?: string | null;
  latencyMs?: number | null;
  cost?: number | null;
}

export interface Report {
  id: string;
  submissionId: string;
  combinedScore: number;
  verdict: string;
  agreement: string;
  pdfUrl?: string | null;
  createdAt: string;
  deliveries?: any[];
}

export interface Submission {
  id: string;
  userId: string;
  text: string;
  textHash?: string;
  wordCount: number;
  sourceType?: string;
  status: string;
  deliveryEmail?: boolean;
  deliveryWhatsapp?: boolean;
  deliveryEmailAddress?: string | null;
  createdAt: string;
  completedAt?: string | null;
  user?: Partial<User>;
  report?: Report | null;
  providerResults?: ProviderResult[];
}
