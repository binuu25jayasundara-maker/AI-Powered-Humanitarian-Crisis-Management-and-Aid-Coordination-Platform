// ==========================================
// Coordination & Governance module types
// ==========================================

export type Urgency = 'Critical' | 'High' | 'Medium' | 'Low';
export type CaseStatus = 'Open' | 'In Progress' | 'Escalated' | 'Unresolved' | 'Resolved';
export type NeedType =
  | 'Medical'
  | 'Food'
  | 'Water'
  | 'Shelter'
  | 'Rescue'
  | 'Sanitation'
  | 'Evacuation';

export interface CaseEvidence {
  id: string;
  type: 'Photo' | 'Voice Note' | 'Document' | 'Location Pin';
  label: string;
  addedAt: string;
}

export interface CaseTimelineEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  note?: string;
}

export interface AIAssessment {
  suggestedUrgency: Urgency;
  confidence: number; // 0..1
  recommendedAction: string;
  rationale: string[];
  fallback: boolean; // true when rule-based fallback was used instead of the AI model
  modelVersion: string;
}

export interface CrisisCase {
  id: string;
  ref: string;
  title: string;
  description: string;
  reporter: string;
  contact: string;
  location: string;
  district: string;
  needType: NeedType;
  urgency: Urgency;
  status: CaseStatus;
  createdAt: string;
  dueAt: string; // response SLA deadline
  assignedTo: string | null;
  peopleAffected: number;
  evidence: CaseEvidence[];
  duplicateOfId: string | null;
  timeline: CaseTimelineEntry[];
  ai: AIAssessment;
  firstResponseMinutes: number | null;
  eventId: string;
}

// ---------- Crisis events ----------
export type EventStatus = 'Planned' | 'Active' | 'Monitoring' | 'Closed';
export type EventSeverity = 'Critical' | 'High' | 'Moderate' | 'Low';
export type AreaStatus = 'Affected' | 'Responding' | 'Stabilised' | 'Cleared';

export interface OperationalArea {
  id: string;
  name: string;
  district: string;
  populationAtRisk: number;
  status: AreaStatus;
}

export interface CrisisEvent {
  id: string;
  name: string;
  type: string;
  severity: EventSeverity;
  status: EventStatus;
  description: string;
  startedAt: string;
  areas: OperationalArea[];
}

// ---------- Partner coordination ----------
export interface Partner {
  id: string;
  name: string;
  type: 'Government' | 'NGO' | 'Military' | 'Private' | 'UN Agency';
  focus: string;
  contact: string;
  capacityTotal: number;
  capacityAvailable: number;
  capacityUnit: string;
  status: 'Available' | 'Limited' | 'Unavailable';
}

export type PartnerRequestStatus = 'Pending' | 'Accepted' | 'In Transit' | 'Delivered' | 'Declined';

export interface PartnerRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  eventId: string;
  eventName: string;
  resource: string;
  quantity: number;
  priority: 'Urgent' | 'High' | 'Normal';
  notes: string;
  status: PartnerRequestStatus;
  requestedBy: string;
  requestedAt: string;
}

// ---------- Resources / shelters (dashboard KPIs) ----------
export interface Shelter {
  id: string;
  name: string;
  district: string;
  capacity: number;
  occupied: number;
}

export interface ResourceStock {
  id: string;
  name: string;
  unit: string;
  total: number;
  allocated: number;
  demand: number; // current estimated demand
}

// ---------- Governance ----------
export type ReviewStatus = 'Pending' | 'Approved' | 'Overridden' | 'Rejected';

export interface AIReviewItem {
  id: string;
  caseId: string;
  caseRef: string;
  caseTitle: string;
  currentUrgency: Urgency;
  suggestedUrgency: Urgency;
  recommendation: string;
  confidence: number;
  fallback: boolean;
  rationale: string[];
  modelVersion: string;
  createdAt: string;
  status: ReviewStatus;
}

export type DecisionType = 'Approved' | 'Overridden' | 'Rejected';

export interface AIDecisionLogEntry {
  id: string;
  at: string;
  caseRef: string;
  reviewer: string;
  aiRecommendation: string;
  aiUrgency: Urgency;
  finalUrgency: Urgency;
  confidence: number;
  fallback: boolean;
  decision: DecisionType;
  reason: string;
  modelVersion: string;
}

// ---------- Reports ----------
export interface DailyAIPoint {
  label: string;
  recommendations: number;
  accepted: number;
  overridden: number;
}
