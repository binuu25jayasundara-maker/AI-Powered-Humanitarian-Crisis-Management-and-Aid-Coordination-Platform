export interface AiRecommendation {
  id: string;
  category: string;
  urgency: string;
  view: string;
  suggest: string;
  priorityScore: number;
  confidence: number;
  rationale: string;
  providerStrategy: string;
  fallback?: boolean;
}

export interface CaseReview {
  id: string;
  caseNumber: string;
  title: string;
  location: string;
  requestDetails: string;
  evidence: string;
  status: string;
  assignedAgency: string;
  possibleDuplicate?: string | null;
  duplicateRiskLevel?: 'Low' | 'Medium' | 'High' | null;
  recommendation?: AiRecommendation | null;
}

export interface ChatMessage {
  id?: string;
  sender: 'You' | 'AI' | 'System';
  text: string;
  timestamp: string;
  language?: 'en' | 'si' | 'ta';
  isFallback?: boolean;
  confidence?: number;
  suggestedAction?: string;
}

export interface DemandForecast {
  id: string;
  region: string;
  disasterType: string;
  resourceCategory: string;
  projectedQuantity: number;
  unit: string;
  confidence: number;
  forecastPeriod: string;
}

export interface DuplicateCheckResult {
  caseNumber: string;
  suspectedDuplicate: string;
  similarityScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  rationale: string;
  status?: string;
}

export type AiServiceStatus = 'Online' | 'Degraded' | 'Offline' | 'Unknown';

export interface AiServiceHealth {
  status: AiServiceStatus;
  activeStrategy: string;
  isFallback: boolean;
  latencyMs: number;
  lastChecked: string;
  uptimePercent: number;
  providerName: string;
  supportedLanguages: string[];
}

export interface AiServiceFailure {
  id: string;
  timestamp: string;
  endpoint: string;
  errorCode: string;
  errorSummary: string;
  fallbackAction: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}
