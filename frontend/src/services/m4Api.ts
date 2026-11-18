/**
 * m4Api.ts — Member 4 Original AI Service Client
 *
 * This file is the adapted version of Member 4's standalone api.ts,
 * integrated into the Member 12356 merged project (123456).
 *
 * - Uses VITE_AI_API_URL (same env var as aiApi.ts) for the backend base URL.
 * - Falls back to localhost:5157 (Member 4's API port), then to mock data.
 * - Member 4's original mock data (Kandyya flood case #2341) is preserved here
 *   as the canonical offline fallback for Member 4 features.
 * - Do NOT import from src/services/api.ts (Member 1 auth API).
 * - For the richer multilingual/offline-FAQ variant, see src/services/aiApi.ts.
 */

import type { AiRecommendation } from '../types/ai';

// ─── Types (Member 4 originals, scoped to avoid collision with ai.ts) ────────

export interface M4CaseReview {
  id: string;
  caseNumber: string;
  title: string;
  location: string;
  requestDetails: string;
  evidence: string;
  status: string;
  assignedAgency: string;
  possibleDuplicate?: string | null;
  duplicateRiskLevel?: string | null;
  recommendation?: AiRecommendation | null;
}

export interface M4DemandForecast {
  id: string;
  region: string;
  disasterType: string;
  resourceCategory: string;
  projectedQuantity: number;
  unit: string;
  confidence: number;
  forecastPeriod: string;
}

export interface M4DuplicateRecord {
  primaryCase: string;
  suspected: string;
  similarity: string;
  risk: string;
  rationale: string;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

// ─── Member 4 Baseline Mock Data (Screenshot 11 & Screenshot 9) ──────────────

const MOCK_CASE_2341: M4CaseReview = {
  id: '12345678-2341-2341-2341-123456789abc',
  caseNumber: '#2341',
  title: 'Flood, Kandyyva',
  location: 'Kandyya, Central Province, Sri Lanka',
  requestDetails: 'Emergency shelter, food, and medical assistance required.',
  evidence: 'Photos, news reports, witness statements.',
  status: 'Assessed - awaiting approval',
  assignedAgency: 'DMC-LK',
  possibleDuplicate: '#2187 - Flood (Kandy)',
  duplicateRiskLevel: 'Medium',
  recommendation: {
    id: 'rec-2341',
    category: 'Disaster Relief',
    urgency: 'High - immediate assistance needed.',
    view: 'Provide shelter, food supplies, medical aid.',
    suggest: 'Coordinate with local authorities and NGOs.',
    priorityScore: 88,
    confidence: 0.94,
    rationale:
      'NLP multi-factor scoring classified as Disaster Relief based on compound terms (flood, shelter, medical). ' +
      'High urgency triggered due to vulnerable displaced family count and road closures.',
    providerStrategy: 'RuleBasedStrategy',
  },
};

const MOCK_FORECASTS: M4DemandForecast[] = [
  {
    id: 'fc-1',
    region: 'Kandyya District',
    disasterType: 'Monsoon Flood',
    resourceCategory: 'Emergency Rations',
    projectedQuantity: 15000,
    unit: 'Meals',
    confidence: 0.89,
    forecastPeriod: 'Next 72 Hours',
  },
  {
    id: 'fc-2',
    region: 'Kandyya District',
    disasterType: 'Monsoon Flood',
    resourceCategory: 'Family Shelters',
    projectedQuantity: 350,
    unit: 'Tents',
    confidence: 0.84,
    forecastPeriod: 'Next 72 Hours',
  },
  {
    id: 'fc-3',
    region: 'Kandyya District',
    disasterType: 'Monsoon Flood',
    resourceCategory: 'First Aid Trauma Kits',
    projectedQuantity: 800,
    unit: 'Kits',
    confidence: 0.91,
    forecastPeriod: 'Next 72 Hours',
  },
];

// Member 4's duplicate detection dataset (enhanced from standalone project)
export const M4_DUPLICATE_RECORDS: M4DuplicateRecord[] = [
  {
    primaryCase: '#2341 - Flood, Kandyyva',
    suspected: '#2187 - Flood (Kandy)',
    similarity: '74%',
    risk: 'Medium',
    rationale:
      'High semantic and geographical overlap with #2187. Both cases request food and shelter aid within Kandy flood operational sector.',
    status: 'Flagged for Review (Non-destructive)',
  },
  {
    primaryCase: '#2348 - River Overbank, Rivagama',
    suspected: '#2344 - Rivagama Bridge Flooding',
    similarity: '88%',
    risk: 'High',
    rationale:
      'Identical caller contact coordinates and duplicate meal requests submitted 14 minutes apart.',
    status: 'Awaiting Coordinator Merge',
  },
];

// ─── API Base URL Resolution ─────────────────────────────────────────────────

const API_BASE =
  (import.meta.env.VITE_AI_API_URL as string | undefined) ||
  'http://localhost:5157/api';

// ─── m4Api Service ────────────────────────────────────────────────────────────

export const m4Api = {
  /**
   * Fetch a case review from Member 4's backend, falling back to the
   * canonical Kandyya mock if the backend is unavailable.
   */
  async getCase(caseNumber: string = '#2341'): Promise<M4CaseReview> {
    try {
      const cleanNum = caseNumber.replace('#', '');
      const res = await fetch(`${API_BASE}/cases/${cleanNum}`);
      if (res.ok) {
        const json: ApiResponse<M4CaseReview> = await res.json();
        return json.data;
      }
    } catch {
      // Backend offline — return mock
    }
    return { ...MOCK_CASE_2341 };
  },

  /**
   * Submit a human-in-the-loop (HITL) decision for a case.
   * Falls back to local mock mutation when backend is unavailable.
   */
  async submitHumanDecision(
    caseNumber: string,
    action: string,
    justification?: string,
    modifiedCategory?: string,
    modifiedUrgency?: string
  ): Promise<boolean> {
    try {
      const cleanNum = caseNumber.replace('#', '');
      const res = await fetch(`${API_BASE}/cases/${cleanNum}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          justification,
          modifiedCategory,
          modifiedUrgency,
          reviewerEmail: 'coordinator@resqnet.org',
        }),
      });
      if (res.ok) return true;
    } catch {
      // Backend offline — apply mock update
    }

    // Mock local state update
    if (action === 'Approve') MOCK_CASE_2341.status = 'Approved';
    else if (action === 'Modify') {
      MOCK_CASE_2341.status = 'Approved with Modifications';
      if (modifiedCategory && MOCK_CASE_2341.recommendation)
        MOCK_CASE_2341.recommendation.category = modifiedCategory;
      if (modifiedUrgency && MOCK_CASE_2341.recommendation)
        MOCK_CASE_2341.recommendation.urgency = modifiedUrgency;
    } else if (action === 'Reject') MOCK_CASE_2341.status = 'Rejected';
    else if (action === 'Defer')
      MOCK_CASE_2341.status = 'Deferred for Investigation';
    return true;
  },

  /**
   * Ask the AI chatbot a question. Falls back to keyword-matching FAQ
   * when backend is unreachable.
   */
  async askChatbot(
    question: string,
    caseNumber: string = '#2341',
    language: string = 'en'
  ): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, caseNumber, language }),
      });
      if (res.ok) {
        const json: ApiResponse<{ reply: string }> = await res.json();
        return json.data.reply;
      }
    } catch {
      // Backend offline — use keyword FAQ
    }

    // Offline keyword FAQ fallback (Member 4's original logic)
    const q = question.toLowerCase();
    if (q.includes('affected area') || q.includes('where')) {
      return 'The affected area is Kandyya, Sri Lanka. The area is experiencing heavy flooding and road closures.';
    }
    if (
      q.includes('immediate needs') ||
      q.includes('needs') ||
      q.includes('what are')
    ) {
      return 'Immediate needs include food, clean water, medical aid, and temporary shelter for the affected families.';
    }
    return `Based on live situational reports for ${caseNumber}, emergency medical units and food relief teams are deployed in Kandyya.`;
  },

  /**
   * Retrieve demand forecasts. Falls back to mock forecasts when backend
   * is unavailable.
   */
  async getForecasts(): Promise<M4DemandForecast[]> {
    try {
      const res = await fetch(`${API_BASE}/forecasts`);
      if (res.ok) {
        const json: ApiResponse<M4DemandForecast[]> = await res.json();
        return json.data;
      }
    } catch {
      // Backend offline
    }
    return [...MOCK_FORECASTS];
  },
};
