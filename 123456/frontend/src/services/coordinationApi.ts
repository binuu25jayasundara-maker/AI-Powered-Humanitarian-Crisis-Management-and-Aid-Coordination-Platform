import {
  AIAssessment,
  AIDecisionLogEntry,
  AIReviewItem,
  AreaStatus,
  CaseStatus,
  CaseTimelineEntry,
  CrisisCase,
  CrisisEvent,
  DailyAIPoint,
  DecisionType,
  EventSeverity,
  EventStatus,
  NeedType,
  OperationalArea,
  Partner,
  PartnerRequest,
  PartnerRequestStatus,
  ResourceStock,
  Shelter,
  Urgency
} from '../types/coordination';

/**
 * Coordination & Governance service.
 *
 * Follows the same pattern as the rest of the platform (mock data persisted in
 * localStorage, async methods). Replace the bodies with real fetch() calls to
 * the backend when the endpoints are ready - page components will not change.
 */

const KEYS = {
  CASES: 'resqnet_coord_cases_v1',
  EVENTS: 'resqnet_coord_events_v1',
  PARTNERS: 'resqnet_coord_partners_v1',
  PARTNER_REQUESTS: 'resqnet_coord_partner_requests_v1',
  REVIEWS: 'resqnet_coord_ai_reviews_v1',
  LOG: 'resqnet_coord_ai_log_v1'
};

const getStored = <T>(key: string, seed: () => T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item) return JSON.parse(item) as T;
  } catch {
    /* fall through to seed */
  }
  const value = seed();
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
  return value;
};

const setStored = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
};

const minsAgo = (m: number): string => new Date(Date.now() - m * 60000).toISOString();
const minsAhead = (m: number): string => new Date(Date.now() + m * 60000).toISOString();
const uid = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

// ==========================================
// Helpers shared by pages
// ==========================================
export const URGENCY_ORDER: Urgency[] = ['Critical', 'High', 'Medium', 'Low'];
export const NEED_TYPES: NeedType[] = ['Medical', 'Food', 'Water', 'Shelter', 'Rescue', 'Sanitation', 'Evacuation'];
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

export const isOverdue = (c: CrisisCase): boolean =>
  c.status !== 'Resolved' && new Date(c.dueAt).getTime() < Date.now();

export const isActive = (c: CrisisCase): boolean => c.status !== 'Resolved';

const URGENCY_WEIGHT: Record<Urgency, number> = { Critical: 100, High: 70, Medium: 40, Low: 15 };

export const priorityScore = (c: CrisisCase): number => {
  let score = URGENCY_WEIGHT[c.urgency];
  if (c.status === 'Escalated') score += 25;
  if (c.status === 'Unresolved') score += 15;
  if (isOverdue(c)) score += 20;
  score += Math.min(c.peopleAffected, 100) / 10;
  return Math.round(score * 10) / 10;
};

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

export const timeAgo = (iso: string): string => {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff} min ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ${diff % 60}m ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const slaLabel = (c: CrisisCase): string => {
  if (c.status === 'Resolved') return 'Closed';
  const diff = Math.round((new Date(c.dueAt).getTime() - Date.now()) / 60000);
  if (diff < 0) {
    const over = Math.abs(diff);
    return over >= 60 ? `Overdue ${Math.floor(over / 60)}h ${over % 60}m` : `Overdue ${over}m`;
  }
  return diff >= 60 ? `Due in ${Math.floor(diff / 60)}h ${diff % 60}m` : `Due in ${diff}m`;
};

// ==========================================
// Seed data
// ==========================================
const EVENT_FLOOD = 'ev-flood-kelani';
const EVENT_SLIDE = 'ev-landslide-ratnapura';

const ai = (
  suggestedUrgency: Urgency,
  confidence: number,
  recommendedAction: string,
  rationale: string[],
  fallback = false
): AIAssessment => ({
  suggestedUrgency,
  confidence,
  recommendedAction,
  rationale,
  fallback,
  modelVersion: fallback ? 'rules-fallback-1.2' : 'triage-model-2.4'
});

interface SeedCase {
  n: number;
  title: string;
  description: string;
  reporter: string;
  contact: string;
  location: string;
  district: string;
  needType: NeedType;
  urgency: Urgency;
  status: CaseStatus;
  createdMin: number;
  dueInMin: number;
  assignedTo: string | null;
  peopleAffected: number;
  evidence: { type: 'Photo' | 'Voice Note' | 'Document' | 'Location Pin'; label: string }[];
  duplicateOfN?: number;
  extra?: { minAgo: number; actor: string; action: string; note?: string }[];
  ai: AIAssessment;
  firstResponseMinutes: number | null;
  eventId: string;
}

const buildCase = (s: SeedCase): CrisisCase => {
  const timeline: CaseTimelineEntry[] = [
    { id: uid('tl'), at: minsAgo(s.createdMin), actor: 'Citizen Portal', action: 'Case created', note: `Reported by ${s.reporter}` },
    { id: uid('tl'), at: minsAgo(s.createdMin - 1), actor: 'AI Triage', action: `Urgency suggested: ${s.ai.suggestedUrgency}`, note: `Confidence ${Math.round(s.ai.confidence * 100)}%` }
  ];
  (s.extra || []).forEach((e) =>
    timeline.push({ id: uid('tl'), at: minsAgo(e.minAgo), actor: e.actor, action: e.action, note: e.note })
  );
  timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return {
    id: `c-${s.n}`,
    ref: `CS-${s.n}`,
    title: s.title,
    description: s.description,
    reporter: s.reporter,
    contact: s.contact,
    location: s.location,
    district: s.district,
    needType: s.needType,
    urgency: s.urgency,
    status: s.status,
    createdAt: minsAgo(s.createdMin),
    dueAt: minsAhead(s.dueInMin),
    assignedTo: s.assignedTo,
    peopleAffected: s.peopleAffected,
    evidence: s.evidence.map((e, i) => ({ id: `ev-${s.n}-${i}`, type: e.type, label: e.label, addedAt: minsAgo(s.createdMin - 2) })),
    duplicateOfId: s.duplicateOfN ? `c-${s.duplicateOfN}` : null,
    timeline,
    ai: s.ai,
    firstResponseMinutes: s.firstResponseMinutes,
    eventId: s.eventId
  };
};

const seedCases = (): CrisisCase[] => {
  const seeds: SeedCase[] = [
    {
      n: 2341, title: 'Elderly couple stranded on rooftop', description: 'Water level has reached the first floor. Two elderly residents, one with limited mobility, are waiting on the roof and have no phone battery left. Neighbour reporting on their behalf.',
      reporter: 'Sunil Weerasinghe', contact: '+94 77 123 4501', location: 'Temple Road, Kolonnawa', district: 'Colombo', needType: 'Rescue', urgency: 'Critical', status: 'Escalated',
      createdMin: 95, dueInMin: -35, assignedTo: 'Chaminda Silva', peopleAffected: 2,
      evidence: [{ type: 'Photo', label: 'Rooftop view.jpg' }, { type: 'Location Pin', label: '6.9335, 79.8870' }],
      extra: [{ minAgo: 80, actor: 'Chaminda Silva', action: 'Assigned to self' }, { minAgo: 60, actor: 'Chaminda Silva', action: 'Escalated to Navy rescue', note: 'Boat required, road access cut' }],
      ai: ai('Critical', 0.93, 'Dispatch water rescue team immediately', ['Mentions rising water and mobility limitation', 'Location within mapped flood zone', 'Reporter confirms no phone battery']),
      firstResponseMinutes: 15, eventId: EVENT_FLOOD
    },
    {
      n: 2342, title: 'Insulin supply needed at relief camp', description: 'Three diabetic residents at Rajagiriya relief camp have run out of insulin. Camp warden requests urgent medical delivery.',
      reporter: 'Camp Warden - Rajagiriya', contact: '+94 71 555 2210', location: 'Rajagiriya Community Hall', district: 'Colombo', needType: 'Medical', urgency: 'Critical', status: 'Open',
      createdMin: 48, dueInMin: -8, assignedTo: null, peopleAffected: 3,
      evidence: [{ type: 'Document', label: 'Prescription list.pdf' }],
      ai: ai('Critical', 0.88, 'Route to medical partner and dispatch courier', ['Time-sensitive medication', 'Named chronic conditions', 'Vulnerable group in shelter']),
      firstResponseMinutes: null, eventId: EVENT_FLOOD
    },
    {
      n: 2343, title: 'Drinking water shortage - 120 families', description: 'Wells contaminated by floodwater. Village has been without clean drinking water for two days.',
      reporter: 'Village Officer Nimal', contact: '+94 76 440 1188', location: 'Hanwella Village Centre', district: 'Colombo', needType: 'Water', urgency: 'High', status: 'In Progress',
      createdMin: 210, dueInMin: 40, assignedTo: 'Nadeesha Perera', peopleAffected: 480,
      evidence: [{ type: 'Photo', label: 'Well contamination.jpg' }, { type: 'Voice Note', label: 'Officer briefing 0:42' }],
      extra: [{ minAgo: 190, actor: 'Nadeesha Perera', action: 'Assigned to Nadeesha Perera' }, { minAgo: 150, actor: 'Nadeesha Perera', action: 'Water bowser requested', note: 'Request sent to Sri Lanka Red Cross' }],
      ai: ai('High', 0.81, 'Request water bowsers from partners', ['Large affected population', 'Contaminated source confirmed in photo']),
      firstResponseMinutes: 20, eventId: EVENT_FLOOD
    },
    {
      n: 2344, title: 'Landslide blocking access road', description: 'Mud and debris have blocked the only access road to three hamlets. Residents are safe but cannot reach supplies.',
      reporter: 'GN Division Officer', contact: '+94 70 990 7721', location: 'Kuruwita - Ratnapura Road', district: 'Ratnapura', needType: 'Evacuation', urgency: 'High', status: 'Escalated',
      createdMin: 300, dueInMin: -120, assignedTo: 'Chaminda Silva', peopleAffected: 160,
      evidence: [{ type: 'Photo', label: 'Road blockage 1.jpg' }, { type: 'Photo', label: 'Road blockage 2.jpg' }],
      extra: [{ minAgo: 270, actor: 'Chaminda Silva', action: 'Escalated to Road Development Authority' }],
      ai: ai('High', 0.76, 'Escalate to RDA and pre-position supplies', ['Single access route blocked', 'Heavy rain forecast continues']),
      firstResponseMinutes: 30, eventId: EVENT_SLIDE
    },
    {
      n: 2345, title: 'Pregnant woman needs transport to hospital', description: 'Woman in 36th week with contractions starting. Roads flooded; ambulance cannot reach.',
      reporter: 'Husband - R. Fernando', contact: '+94 77 312 8899', location: 'Biyagama', district: 'Gampaha', needType: 'Medical', urgency: 'Critical', status: 'In Progress',
      createdMin: 30, dueInMin: 10, assignedTo: 'Nadeesha Perera', peopleAffected: 1,
      evidence: [{ type: 'Location Pin', label: '6.9540, 79.9890' }],
      extra: [{ minAgo: 25, actor: 'Nadeesha Perera', action: 'Assigned to Nadeesha Perera' }],
      ai: ai('Critical', 0.9, 'Arrange boat/4x4 transfer to Gampaha hospital', ['Pregnancy with labour signs', 'Road access cut']),
      firstResponseMinutes: 5, eventId: EVENT_FLOOD
    },
    {
      n: 2346, title: 'Food packs for displaced families', description: 'Sixty families sheltering at the school have received no food since yesterday.',
      reporter: 'School Principal', contact: '+94 71 802 3345', location: 'Mahara Maha Vidyalaya', district: 'Gampaha', needType: 'Food', urgency: 'Medium', status: 'Open',
      createdMin: 180, dueInMin: 60, assignedTo: null, peopleAffected: 230,
      evidence: [{ type: 'Document', label: 'Family list.pdf' }],
      ai: ai('High', 0.62, 'Allocate dry ration packs from central stock', ['Elapsed time since last meal', 'Includes children under five'], true),
      firstResponseMinutes: null, eventId: EVENT_FLOOD
    },
    {
      n: 2347, title: 'Blankets and mats for relief centre', description: 'Temple relief centre needs bedding for 80 people. Nights are cold and many are sleeping on bare floor.',
      reporter: 'Temple Committee', contact: '+94 77 998 1204', location: 'Gangaramaya Annex, Kaduwela', district: 'Colombo', needType: 'Shelter', urgency: 'Medium', status: 'Open',
      createdMin: 120, dueInMin: 200, assignedTo: null, peopleAffected: 80,
      evidence: [],
      ai: ai('Medium', 0.84, 'Allocate blankets from warehouse stock', ['No immediate life risk', 'Basic need within standard supply']),
      firstResponseMinutes: null, eventId: EVENT_FLOOD
    },
    {
      n: 2348, title: 'Sanitation facilities overflowing', description: 'Latrines at the camp are flooded. Risk of disease spread flagged by camp nurse.',
      reporter: 'Camp Nurse', contact: '+94 76 118 6672', location: 'Ambatale Camp', district: 'Colombo', needType: 'Sanitation', urgency: 'High', status: 'Unresolved',
      createdMin: 520, dueInMin: -300, assignedTo: 'Nadeesha Perera', peopleAffected: 340,
      evidence: [{ type: 'Photo', label: 'Latrine overflow.jpg' }],
      extra: [{ minAgo: 400, actor: 'Nadeesha Perera', action: 'Marked unresolved', note: 'No portable toilets available in stock' }],
      ai: ai('High', 0.58, 'Source portable toilets from partners', ['Disease outbreak risk', 'Large number of residents'], true),
      firstResponseMinutes: 45, eventId: EVENT_FLOOD
    },
    {
      n: 2349, title: 'Couple on rooftop - Kolonnawa', description: 'Second call about an elderly couple on a roof near the temple, water up to first floor.',
      reporter: 'Neighbour - K. Perera', contact: '+94 70 245 8830', location: 'Temple Road, Kolonnawa', district: 'Colombo', needType: 'Rescue', urgency: 'Critical', status: 'Open',
      createdMin: 70, dueInMin: 20, assignedTo: null, peopleAffected: 2,
      evidence: [{ type: 'Voice Note', label: 'Caller recording 0:35' }],
      duplicateOfN: 2341,
      ai: ai('Critical', 0.79, 'Merge with CS-2341 and notify rescue team', ['Same location and description as CS-2341', 'Reporter matches neighbour role']),
      firstResponseMinutes: null, eventId: EVENT_FLOOD
    },
    {
      n: 2350, title: 'Evacuation request - riverbank homes', description: 'Eight households on the riverbank want to move before water peaks tonight.',
      reporter: 'Community Leader', contact: '+94 77 700 4410', location: 'Kelaniya Riverside', district: 'Gampaha', needType: 'Evacuation', urgency: 'High', status: 'In Progress',
      createdMin: 140, dueInMin: 90, assignedTo: 'Chaminda Silva', peopleAffected: 36,
      evidence: [{ type: 'Location Pin', label: '6.9660, 79.9170' }],
      extra: [{ minAgo: 120, actor: 'Chaminda Silva', action: 'Assigned to self' }],
      ai: ai('High', 0.85, 'Arrange buses and notify shelter at Kelaniya school', ['Forecast crest tonight', 'Households within 50m of river']),
      firstResponseMinutes: 20, eventId: EVENT_FLOOD
    },
    {
      n: 2351, title: 'Child with fever and no medicine', description: 'Four-year-old with high fever for two days. Parents sheltering in a church hall without medicine.',
      reporter: 'Church Volunteer', contact: '+94 71 678 2290', location: 'St. Anthony Church Hall', district: 'Colombo', needType: 'Medical', urgency: 'High', status: 'Open',
      createdMin: 55, dueInMin: 5, assignedTo: null, peopleAffected: 1,
      evidence: [],
      ai: ai('High', 0.66, 'Dispatch mobile medical team', ['Young child with sustained fever', 'Limited details on symptoms'], true),
      firstResponseMinutes: null, eventId: EVENT_FLOOD
    },
    {
      n: 2352, title: 'Hot meals for landslide-affected families', description: 'Families moved to the community centre after the landslide. Request for hot meals twice a day.',
      reporter: 'Divisional Secretariat', contact: '+94 77 411 3902', location: 'Kuruwita Community Centre', district: 'Ratnapura', needType: 'Food', urgency: 'Medium', status: 'In Progress',
      createdMin: 360, dueInMin: 120, assignedTo: 'Kasun Jayawardena', peopleAffected: 95,
      evidence: [{ type: 'Document', label: 'Registration list.pdf' }],
      extra: [{ minAgo: 330, actor: 'Kasun Jayawardena', action: 'Assigned to Kasun Jayawardena' }],
      ai: ai('Medium', 0.87, 'Assign volunteer kitchen team', ['Stable situation with steady need']),
      firstResponseMinutes: 30, eventId: EVENT_SLIDE
    },
    {
      n: 2353, title: 'Clean water tanks delivered - confirmation', description: 'Water tanks were delivered to Hanwella and confirmed by the village officer.',
      reporter: 'Village Officer Nimal', contact: '+94 76 440 1188', location: 'Hanwella Village Centre', district: 'Colombo', needType: 'Water', urgency: 'Low', status: 'Resolved',
      createdMin: 900, dueInMin: -700, assignedTo: 'Nadeesha Perera', peopleAffected: 120,
      evidence: [{ type: 'Photo', label: 'Delivery receipt.jpg' }],
      extra: [{ minAgo: 700, actor: 'Nadeesha Perera', action: 'Resolved', note: 'Delivery confirmed by village officer' }],
      ai: ai('Low', 0.92, 'Close case after confirmation', ['Delivery confirmed']),
      firstResponseMinutes: 18, eventId: EVENT_FLOOD
    },
    {
      n: 2354, title: 'Shelter overcrowding at Mahara school', description: 'School shelter is at maximum capacity; new arrivals have nowhere to sleep.',
      reporter: 'School Principal', contact: '+94 71 802 3345', location: 'Mahara Maha Vidyalaya', district: 'Gampaha', needType: 'Shelter', urgency: 'Medium', status: 'Unresolved',
      createdMin: 640, dueInMin: -400, assignedTo: 'Nadeesha Perera', peopleAffected: 110,
      evidence: [{ type: 'Photo', label: 'Hall overcrowding.jpg' }],
      extra: [{ minAgo: 500, actor: 'Nadeesha Perera', action: 'Marked unresolved', note: 'No nearby shelter with capacity' }],
      ai: ai('Medium', 0.74, 'Identify overflow shelter in adjacent district', ['Shelter at 100% occupancy']),
      firstResponseMinutes: 40, eventId: EVENT_FLOOD
    }
  ];
  return seeds.map(buildCase);
};

const seedEvents = (): CrisisEvent[] => [
  {
    id: EVENT_FLOOD, name: 'Kelani River Flood 2026', type: 'Flood', severity: 'Critical', status: 'Active',
    description: 'Severe flooding along the Kelani River basin following sustained monsoon rainfall.',
    startedAt: minsAgo(60 * 52),
    areas: [
      { id: 'ar-1', name: 'Kolonnawa', district: 'Colombo', populationAtRisk: 18000, status: 'Affected' },
      { id: 'ar-2', name: 'Hanwella', district: 'Colombo', populationAtRisk: 9500, status: 'Responding' },
      { id: 'ar-3', name: 'Biyagama', district: 'Gampaha', populationAtRisk: 7200, status: 'Responding' }
    ]
  },
  {
    id: EVENT_SLIDE, name: 'Ratnapura Landslide Alert', type: 'Landslide', severity: 'High', status: 'Monitoring',
    description: 'Landslide in Kuruwita area with ongoing risk of further slope failure.',
    startedAt: minsAgo(60 * 20),
    areas: [{ id: 'ar-4', name: 'Kuruwita', district: 'Ratnapura', populationAtRisk: 3400, status: 'Stabilised' }]
  },
  {
    id: 'ev-drought-hambantota', name: 'Hambantota Drought Response', type: 'Drought', severity: 'Moderate', status: 'Planned',
    description: 'Preparedness plan for forecast water scarcity in the southern dry zone.',
    startedAt: minsAhead(60 * 72),
    areas: []
  }
];

const seedPartners = (): Partner[] => [
  { id: 'pt-1', name: 'Sri Lanka Red Cross Society', type: 'NGO', focus: 'Medical, first aid, relief kits', contact: 'info@redcross.lk', capacityTotal: 500, capacityAvailable: 320, capacityUnit: 'relief kits', status: 'Available' },
  { id: 'pt-2', name: 'Sarvodaya Shramadana Movement', type: 'NGO', focus: 'Community kitchens, volunteers', contact: 'relief@sarvodaya.org', capacityTotal: 1200, capacityAvailable: 260, capacityUnit: 'meals / day', status: 'Limited' },
  { id: 'pt-3', name: 'Sri Lanka Navy - Disaster Relief', type: 'Military', focus: 'Water rescue, boats', contact: 'dro@navy.lk', capacityTotal: 24, capacityAvailable: 14, capacityUnit: 'boats', status: 'Available' },
  { id: 'pt-4', name: 'National Water Supply Board', type: 'Government', focus: 'Water bowsers, purification', contact: 'ops@nwsdb.lk', capacityTotal: 40, capacityAvailable: 6, capacityUnit: 'bowsers', status: 'Limited' },
  { id: 'pt-5', name: 'WFP Sri Lanka', type: 'UN Agency', focus: 'Food logistics', contact: 'lk.logistics@wfp.org', capacityTotal: 60, capacityAvailable: 0, capacityUnit: 'tonnes', status: 'Unavailable' }
];

const seedPartnerRequests = (): PartnerRequest[] => [
  { id: 'pr-1', partnerId: 'pt-3', partnerName: 'Sri Lanka Navy - Disaster Relief', eventId: EVENT_FLOOD, eventName: 'Kelani River Flood 2026', resource: 'Rescue boats', quantity: 3, priority: 'Urgent', notes: 'Kolonnawa rooftop rescues', status: 'In Transit', requestedBy: 'Chaminda Silva', requestedAt: minsAgo(70) },
  { id: 'pr-2', partnerId: 'pt-4', partnerName: 'National Water Supply Board', eventId: EVENT_FLOOD, eventName: 'Kelani River Flood 2026', resource: 'Water bowsers', quantity: 4, priority: 'High', notes: 'Hanwella wells contaminated', status: 'Accepted', requestedBy: 'Chaminda Silva', requestedAt: minsAgo(150) },
  { id: 'pr-3', partnerId: 'pt-1', partnerName: 'Sri Lanka Red Cross Society', eventId: EVENT_FLOOD, eventName: 'Kelani River Flood 2026', resource: 'Relief kits', quantity: 120, priority: 'Normal', notes: 'For Mahara school shelter', status: 'Delivered', requestedBy: 'Chaminda Silva', requestedAt: minsAgo(600) },
  { id: 'pr-4', partnerId: 'pt-5', partnerName: 'WFP Sri Lanka', eventId: EVENT_SLIDE, eventName: 'Ratnapura Landslide Alert', resource: 'Food rations', quantity: 8, priority: 'Normal', notes: 'Dry rations for Kuruwita', status: 'Declined', requestedBy: 'Chaminda Silva', requestedAt: minsAgo(900) }
];

const seedShelters = (): Shelter[] => [
  { id: 'sh-1', name: 'Mahara Maha Vidyalaya', district: 'Gampaha', capacity: 300, occupied: 300 },
  { id: 'sh-2', name: 'Rajagiriya Community Hall', district: 'Colombo', capacity: 200, occupied: 164 },
  { id: 'sh-3', name: 'Ambatale Camp', district: 'Colombo', capacity: 450, occupied: 372 },
  { id: 'sh-4', name: 'Kuruwita Community Centre', district: 'Ratnapura', capacity: 150, occupied: 95 },
  { id: 'sh-5', name: 'Gangaramaya Annex', district: 'Colombo', capacity: 120, occupied: 80 }
];

const seedResources = (): ResourceStock[] => [
  { id: 'rs-1', name: 'Drinking water', unit: 'litres', total: 60000, allocated: 52000, demand: 78000 },
  { id: 'rs-2', name: 'Dry ration packs', unit: 'packs', total: 2500, allocated: 1700, demand: 2300 },
  { id: 'rs-3', name: 'Medical kits', unit: 'kits', total: 400, allocated: 330, demand: 520 },
  { id: 'rs-4', name: 'Blankets', unit: 'pcs', total: 1800, allocated: 900, demand: 1100 },
  { id: 'rs-5', name: 'Portable toilets', unit: 'units', total: 60, allocated: 60, demand: 95 },
  { id: 'rs-6', name: 'Rescue boats', unit: 'boats', total: 24, allocated: 10, demand: 12 }
];

const REVIEW_BASE: Omit<AIReviewItem, 'id' | 'status' | 'createdAt'>[] = [
  { caseId: 'c-2342', caseRef: 'CS-2342', caseTitle: 'Insulin supply needed at relief camp', currentUrgency: 'Critical', suggestedUrgency: 'Critical', recommendation: 'Route to medical partner and dispatch courier', confidence: 0.88, fallback: false, rationale: ['Time-sensitive medication', 'Named chronic conditions', 'Vulnerable group in shelter'], modelVersion: 'triage-model-2.4' },
  { caseId: 'c-2346', caseRef: 'CS-2346', caseTitle: 'Food packs for displaced families', currentUrgency: 'Medium', suggestedUrgency: 'High', recommendation: 'Allocate dry ration packs from central stock', confidence: 0.62, fallback: true, rationale: ['Elapsed time since last meal', 'Includes children under five'], modelVersion: 'rules-fallback-1.2' },
  { caseId: 'c-2349', caseRef: 'CS-2349', caseTitle: 'Couple on rooftop - Kolonnawa', currentUrgency: 'Critical', suggestedUrgency: 'Critical', recommendation: 'Merge with CS-2341 and notify rescue team', confidence: 0.79, fallback: false, rationale: ['Same location and description as CS-2341'], modelVersion: 'triage-model-2.4' },
  { caseId: 'c-2351', caseRef: 'CS-2351', caseTitle: 'Child with fever and no medicine', currentUrgency: 'High', suggestedUrgency: 'High', recommendation: 'Dispatch mobile medical team', confidence: 0.66, fallback: true, rationale: ['Young child with sustained fever', 'Limited details on symptoms'], modelVersion: 'rules-fallback-1.2' },
  { caseId: 'c-2348', caseRef: 'CS-2348', caseTitle: 'Sanitation facilities overflowing', currentUrgency: 'High', suggestedUrgency: 'Critical', recommendation: 'Source portable toilets from partners', confidence: 0.58, fallback: true, rationale: ['Disease outbreak risk', 'Large number of residents'], modelVersion: 'rules-fallback-1.2' },
  { caseId: 'c-2354', caseRef: 'CS-2354', caseTitle: 'Shelter overcrowding at Mahara school', currentUrgency: 'Medium', suggestedUrgency: 'Medium', recommendation: 'Identify overflow shelter in adjacent district', confidence: 0.74, fallback: false, rationale: ['Shelter at 100% occupancy'], modelVersion: 'triage-model-2.4' },
  { caseId: 'c-2347', caseRef: 'CS-2347', caseTitle: 'Blankets and mats for relief centre', currentUrgency: 'Low', suggestedUrgency: 'Medium', recommendation: 'Allocate blankets from warehouse stock', confidence: 0.84, fallback: false, rationale: ['Cold nights', 'Basic need within standard supply'], modelVersion: 'triage-model-2.4' }
];

const seedReviews = (): AIReviewItem[] =>
  REVIEW_BASE.map((r, i) => ({ ...r, id: `rv-${i + 1}`, status: 'Pending' as const, createdAt: minsAgo(15 + i * 22) }));

const seedLog = (): AIDecisionLogEntry[] => {
  const reviewers = ['Chaminda Silva', 'Nadeesha Perera', 'Platform Administrator'];
  const rows: [number, string, string, Urgency, Urgency, number, boolean, DecisionType, string][] = [
    [90, 'CS-2341', 'Dispatch water rescue team immediately', 'Critical', 'Critical', 0.93, false, 'Approved', 'Matches field report'],
    [150, 'CS-2343', 'Request water bowsers from partners', 'High', 'High', 0.81, false, 'Approved', 'Confirmed contamination'],
    [300, 'CS-2344', 'Escalate to RDA', 'High', 'High', 0.76, false, 'Approved', 'Road blockage verified'],
    [420, 'CS-2345', 'Send standard ambulance', 'High', 'Critical', 0.64, true, 'Overridden', 'Labour signs make this critical; ambulance cannot reach'],
    [600, 'CS-2355', 'Close as duplicate', 'Low', 'Medium', 0.55, true, 'Overridden', 'Not a duplicate - different household'],
    [780, 'CS-2339', 'Allocate blankets', 'Medium', 'Medium', 0.86, false, 'Approved', 'Stock available'],
    [1100, 'CS-2336', 'Reassign to Volunteer Coordinator', 'Medium', 'Medium', 0.72, false, 'Rejected', 'Needs case manager, not volunteer'],
    [1500, 'CS-2331', 'Evacuate 12 households', 'High', 'High', 0.89, false, 'Approved', 'Forecast supports evacuation'],
    [1800, 'CS-2328', 'Mark low priority', 'Low', 'High', 0.51, true, 'Overridden', 'Elderly person living alone with chronic illness'],
    [2200, 'CS-2325', 'Dispatch medical team', 'High', 'High', 0.83, false, 'Approved', 'Clear medical need'],
    [2600, 'CS-2320', 'Send food packs', 'Medium', 'Medium', 0.9, false, 'Approved', 'Standard allocation'],
    [3100, 'CS-2317', 'Escalate to Navy', 'Critical', 'Critical', 0.95, false, 'Approved', 'Boat access only'],
    [3700, 'CS-2312', 'Close case', 'Low', 'Medium', 0.6, true, 'Rejected', 'Caller still waiting for confirmation'],
    [4200, 'CS-2309', 'Provide portable toilets', 'High', 'High', 0.78, false, 'Approved', 'Camp nurse confirmed'],
    [5000, 'CS-2304', 'Medical kit delivery', 'High', 'Critical', 0.69, false, 'Overridden', 'Patient condition worsened since report'],
    [6000, 'CS-2299', 'Allocate shelter space', 'Medium', 'Medium', 0.82, false, 'Approved', 'Capacity confirmed'],
    [7200, 'CS-2293', 'Request bowsers', 'High', 'High', 0.8, false, 'Approved', 'Matches shortage report'],
    [8400, 'CS-2288', 'Merge duplicates', 'Medium', 'Medium', 0.74, false, 'Approved', 'Duplicate confirmed']
  ];
  return rows.map((r, i) => ({
    id: `lg-${i + 1}`,
    at: minsAgo(r[0]),
    caseRef: r[1],
    reviewer: reviewers[i % reviewers.length],
    aiRecommendation: r[2],
    aiUrgency: r[3],
    finalUrgency: r[4],
    confidence: r[5],
    fallback: r[6],
    decision: r[7],
    reason: r[8],
    modelVersion: r[6] ? 'rules-fallback-1.2' : 'triage-model-2.4'
  }));
};

// ==========================================
// Mock time-series for dashboard / reports
// ==========================================
const HOURLY_COUNTS = [3, 2, 2, 1, 1, 2, 4, 6, 9, 12, 14, 11, 10, 13, 17, 21, 19, 16, 14, 12, 9, 8, 6, 5];

export const getRequestsPerHourSeries = (): { label: string; value: number }[] => {
  const now = new Date();
  return HOURLY_COUNTS.map((value, i) => {
    const d = new Date(now.getTime() - (HOURLY_COUNTS.length - 1 - i) * 3600000);
    return { label: `${String(d.getHours()).padStart(2, '0')}:00`, value };
  });
};

const DAILY_AI: Omit<DailyAIPoint, 'label'>[] = [
  { recommendations: 38, accepted: 30, overridden: 8 },
  { recommendations: 44, accepted: 36, overridden: 8 },
  { recommendations: 41, accepted: 31, overridden: 10 },
  { recommendations: 52, accepted: 43, overridden: 9 },
  { recommendations: 49, accepted: 42, overridden: 7 },
  { recommendations: 57, accepted: 48, overridden: 9 },
  { recommendations: 61, accepted: 53, overridden: 8 },
  { recommendations: 55, accepted: 46, overridden: 9 },
  { recommendations: 63, accepted: 54, overridden: 9 },
  { recommendations: 70, accepted: 62, overridden: 8 },
  { recommendations: 66, accepted: 56, overridden: 10 },
  { recommendations: 72, accepted: 63, overridden: 9 },
  { recommendations: 78, accepted: 70, overridden: 8 },
  { recommendations: 74, accepted: 66, overridden: 8 }
];

export const getDailyAISeries = (days: 7 | 14): DailyAIPoint[] => {
  const slice = DAILY_AI.slice(DAILY_AI.length - days);
  return slice.map((p, i) => {
    const d = new Date(Date.now() - (slice.length - 1 - i) * 86400000);
    return { ...p, label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) };
  });
};

// ==========================================
// CSV export helpers
// ==========================================
export const toCsv = (rows: (string | number | null | undefined)[][]): string =>
  rows
    .map((row) =>
      row
        .map((cell) => {
          const v = cell === null || cell === undefined ? '' : String(cell);
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(',')
    )
    .join('\n');

export const downloadCsv = (filename: string, rows: (string | number | null | undefined)[][]): void => {
  const blob = new Blob(['\ufeff' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ==========================================
// API
// ==========================================
const loadCases = (): CrisisCase[] => getStored<CrisisCase[]>(KEYS.CASES, seedCases);
const saveCases = (c: CrisisCase[]) => setStored(KEYS.CASES, c);

const patchCase = (
  caseId: string,
  mutate: (c: CrisisCase) => void,
  entry: { actor: string; action: string; note?: string }
): CrisisCase => {
  const cases = loadCases();
  const target = cases.find((c) => c.id === caseId);
  if (!target) throw new Error('Case not found');
  mutate(target);
  target.timeline.push({ id: uid('tl'), at: new Date().toISOString(), ...entry });
  saveCases(cases);
  return target;
};

export const coordinationApi = {
  // ---------- Cases ----------
  async getCases(): Promise<CrisisCase[]> {
    return loadCases();
  },

  async getCase(id: string): Promise<CrisisCase | null> {
    return loadCases().find((c) => c.id === id) || null;
  },

  async assignCase(id: string, assignee: string, actor: string): Promise<CrisisCase> {
    return patchCase(
      id,
      (c) => {
        c.assignedTo = assignee;
        if (c.status === 'Open') c.status = 'In Progress';
        if (c.firstResponseMinutes === null) {
          c.firstResponseMinutes = Math.max(1, Math.round((Date.now() - new Date(c.createdAt).getTime()) / 60000));
        }
      },
      { actor, action: `Assigned to ${assignee}` }
    );
  },

  async escalateCase(id: string, actor: string, note: string): Promise<CrisisCase> {
    return patchCase(id, (c) => { c.status = 'Escalated'; }, { actor, action: 'Escalated', note });
  },

  async markUnresolved(id: string, actor: string, note: string): Promise<CrisisCase> {
    return patchCase(id, (c) => { c.status = 'Unresolved'; }, { actor, action: 'Marked unresolved', note });
  },

  async resolveCase(id: string, actor: string, note: string): Promise<CrisisCase> {
    return patchCase(id, (c) => { c.status = 'Resolved'; }, { actor, action: 'Resolved', note });
  },

  async reopenCase(id: string, actor: string, note: string): Promise<CrisisCase> {
    return patchCase(id, (c) => { c.status = 'Open'; }, { actor, action: 'Reopened', note });
  },

  async addCaseNote(id: string, actor: string, note: string): Promise<CrisisCase> {
    return patchCase(id, () => undefined, { actor, action: 'Note added', note });
  },

  async dismissDuplicate(id: string, actor: string): Promise<CrisisCase> {
    return patchCase(id, (c) => { c.duplicateOfId = null; }, { actor, action: 'Duplicate flag dismissed', note: 'Confirmed as a separate case' });
  },

  async mergeDuplicate(id: string, actor: string): Promise<CrisisCase> {
    const cases = loadCases();
    const target = cases.find((c) => c.id === id);
    const original = target?.duplicateOfId ? cases.find((c) => c.id === target.duplicateOfId) : undefined;
    return patchCase(
      id,
      (c) => { c.status = 'Resolved'; },
      { actor, action: 'Merged as duplicate', note: original ? `Merged into ${original.ref}` : 'Merged into original case' }
    );
  },

  // ---------- Dashboard support data ----------
  async getShelters(): Promise<Shelter[]> {
    return seedShelters();
  },

  async getResources(): Promise<ResourceStock[]> {
    return seedResources();
  },

  // ---------- Crisis events ----------
  async getEvents(): Promise<CrisisEvent[]> {
    return getStored<CrisisEvent[]>(KEYS.EVENTS, seedEvents);
  },

  async createEvent(input: {
    name: string;
    type: string;
    severity: EventSeverity;
    description: string;
    startedAt: string;
  }): Promise<CrisisEvent> {
    const events = getStored<CrisisEvent[]>(KEYS.EVENTS, seedEvents);
    const event: CrisisEvent = { id: uid('ev'), status: 'Planned', areas: [], ...input };
    events.unshift(event);
    setStored(KEYS.EVENTS, events);
    return event;
  },

  async setEventStatus(eventId: string, status: EventStatus): Promise<CrisisEvent[]> {
    const events = getStored<CrisisEvent[]>(KEYS.EVENTS, seedEvents);
    const ev = events.find((e) => e.id === eventId);
    if (ev) ev.status = status;
    setStored(KEYS.EVENTS, events);
    return events;
  },

  async addOperationalArea(
    eventId: string,
    area: { name: string; district: string; populationAtRisk: number; status: AreaStatus }
  ): Promise<CrisisEvent[]> {
    const events = getStored<CrisisEvent[]>(KEYS.EVENTS, seedEvents);
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      const newArea: OperationalArea = { id: uid('ar'), ...area };
      ev.areas.push(newArea);
    }
    setStored(KEYS.EVENTS, events);
    return events;
  },

  // ---------- Partners ----------
  async getPartners(): Promise<Partner[]> {
    return getStored<Partner[]>(KEYS.PARTNERS, seedPartners);
  },

  async getPartnerRequests(): Promise<PartnerRequest[]> {
    return getStored<PartnerRequest[]>(KEYS.PARTNER_REQUESTS, seedPartnerRequests);
  },

  async createPartnerRequest(input: {
    partnerId: string;
    eventId: string;
    resource: string;
    quantity: number;
    priority: 'Urgent' | 'High' | 'Normal';
    notes: string;
    requestedBy: string;
  }): Promise<PartnerRequest> {
    const partners = getStored<Partner[]>(KEYS.PARTNERS, seedPartners);
    const events = getStored<CrisisEvent[]>(KEYS.EVENTS, seedEvents);
    const partner = partners.find((p) => p.id === input.partnerId);
    const event = events.find((e) => e.id === input.eventId);
    const request: PartnerRequest = {
      id: uid('pr'),
      partnerId: input.partnerId,
      partnerName: partner ? partner.name : 'Unknown partner',
      eventId: input.eventId,
      eventName: event ? event.name : 'Unknown event',
      resource: input.resource,
      quantity: input.quantity,
      priority: input.priority,
      notes: input.notes,
      status: 'Pending',
      requestedBy: input.requestedBy,
      requestedAt: new Date().toISOString()
    };
    const all = getStored<PartnerRequest[]>(KEYS.PARTNER_REQUESTS, seedPartnerRequests);
    all.unshift(request);
    setStored(KEYS.PARTNER_REQUESTS, all);
    return request;
  },

  async updatePartnerRequestStatus(id: string, status: PartnerRequestStatus): Promise<PartnerRequest[]> {
    const all = getStored<PartnerRequest[]>(KEYS.PARTNER_REQUESTS, seedPartnerRequests);
    const r = all.find((x) => x.id === id);
    if (r) r.status = status;
    setStored(KEYS.PARTNER_REQUESTS, all);
    return all;
  },

  // ---------- Governance ----------
  async getAIReviews(): Promise<AIReviewItem[]> {
    return getStored<AIReviewItem[]>(KEYS.REVIEWS, seedReviews);
  },

  async getDecisionLog(): Promise<AIDecisionLogEntry[]> {
    return getStored<AIDecisionLogEntry[]>(KEYS.LOG, seedLog).sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  },

  async reviewAIRecommendation(
    reviewId: string,
    decision: DecisionType,
    reviewer: string,
    opts: { finalUrgency?: Urgency; reason: string }
  ): Promise<void> {
    const reviews = getStored<AIReviewItem[]>(KEYS.REVIEWS, seedReviews);
    const review = reviews.find((r) => r.id === reviewId);
    if (!review || review.status !== 'Pending') return;

    const finalUrgency: Urgency =
      decision === 'Approved' ? review.suggestedUrgency : decision === 'Overridden' ? opts.finalUrgency || review.currentUrgency : review.currentUrgency;

    review.status = decision;
    setStored(KEYS.REVIEWS, reviews);

    const log = getStored<AIDecisionLogEntry[]>(KEYS.LOG, seedLog);
    log.unshift({
      id: uid('lg'),
      at: new Date().toISOString(),
      caseRef: review.caseRef,
      reviewer,
      aiRecommendation: review.recommendation,
      aiUrgency: review.suggestedUrgency,
      finalUrgency,
      confidence: review.confidence,
      fallback: review.fallback,
      decision,
      reason: opts.reason || (decision === 'Approved' ? 'Approved without changes' : ''),
      modelVersion: review.modelVersion
    });
    setStored(KEYS.LOG, log);

    // Reflect the decision on the case itself
    try {
      patchCase(
        review.caseId,
        (c) => { c.urgency = finalUrgency; },
        {
          actor: reviewer,
          action: `AI recommendation ${decision.toLowerCase()}`,
          note: `${review.recommendation}${opts.reason ? ` - ${opts.reason}` : ''}`
        }
      );
    } catch {
      /* case might have been removed - ignore */
    }
  },

  // ---------- Demo utilities ----------
  async resetDemoData(): Promise<void> {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }
};

// ==========================================
// Derived metrics
// ==========================================
export const computeOverrideStats = (log: AIDecisionLogEntry[]) => {
  const total = log.length;
  const approved = log.filter((l) => l.decision === 'Approved').length;
  const overridden = log.filter((l) => l.decision === 'Overridden').length;
  const rejected = log.filter((l) => l.decision === 'Rejected').length;
  const rate = total === 0 ? 0 : ((overridden + rejected) / total) * 100;
  const fallbackTotal = log.filter((l) => l.fallback).length;
  const fallbackOverridden = log.filter((l) => l.fallback && l.decision !== 'Approved').length;
  return {
    total,
    approved,
    overridden,
    rejected,
    rate,
    fallbackTotal,
    fallbackRate: fallbackTotal === 0 ? 0 : (fallbackOverridden / fallbackTotal) * 100
  };
};

export const computeCaseMetrics = (cases: CrisisCase[]) => {
  const active = cases.filter(isActive);
  const responded = cases.filter((c) => c.firstResponseMinutes !== null);
  const avgResponse =
    responded.length === 0
      ? 0
      : responded.reduce((sum, c) => sum + (c.firstResponseMinutes || 0), 0) / responded.length;
  return {
    total: cases.length,
    open: cases.filter((c) => c.status === 'Open' || c.status === 'In Progress').length,
    escalated: cases.filter((c) => c.status === 'Escalated').length,
    unresolved: cases.filter((c) => c.status === 'Unresolved').length,
    resolved: cases.filter((c) => c.status === 'Resolved').length,
    overdue: active.filter(isOverdue).length,
    avgResponse
  };
};
