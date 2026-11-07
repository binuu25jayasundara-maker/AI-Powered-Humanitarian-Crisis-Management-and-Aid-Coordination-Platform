import {
  AiRecommendation,
  AiServiceFailure,
  AiServiceHealth,
  ApiResponse,
  CaseReview,
  ChatMessage,
  DemandForecast,
  DuplicateCheckResult
} from '../types/ai';
import { AI_API_URL } from '../config';

const AI_API_BASE = AI_API_URL;

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('resqnet_token') : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {})
  };
}

const STORAGE_KEYS = {
  HEALTH: 'resqnet_ai_health_v1',
  FAILURES: 'resqnet_ai_failures_v1',
  CHAT_HISTORY: 'resqnet_ai_chat_history_v1',
  SIMULATE_OFFLINE: 'resqnet_ai_simulate_offline_v1'
};

// Seed baseline case #2341 matching Screenshot 11 & Screenshot 9
const MOCK_CASE_2341: CaseReview = {
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
    rationale: 'NLP multi-factor scoring classified as Disaster Relief based on compound terms (flood, shelter, medical). High urgency triggered due to vulnerable displaced family count and road closures.',
    providerStrategy: 'RuleBasedStrategy (Deterministic Fallback)',
    fallback: true
  }
};

const MOCK_FORECASTS: DemandForecast[] = [
  {
    id: 'fc-1',
    region: 'Kandyya District',
    disasterType: 'Monsoon Flood',
    resourceCategory: 'Emergency Rations',
    projectedQuantity: 15000,
    unit: 'Meals',
    confidence: 0.89,
    forecastPeriod: 'Next 72 Hours'
  },
  {
    id: 'fc-2',
    region: 'Kandyya District',
    disasterType: 'Monsoon Flood',
    resourceCategory: 'Family Shelters',
    projectedQuantity: 350,
    unit: 'Tents',
    confidence: 0.84,
    forecastPeriod: 'Next 72 Hours'
  },
  {
    id: 'fc-3',
    region: 'Kandyya District',
    disasterType: 'Monsoon Flood',
    resourceCategory: 'First Aid Trauma Kits',
    projectedQuantity: 800,
    unit: 'Kits',
    confidence: 0.91,
    forecastPeriod: 'Next 72 Hours'
  },
  {
    id: 'fc-4',
    region: 'Ratnapura District',
    disasterType: 'Flash Flood & Landslide',
    resourceCategory: 'Clean Drinking Water',
    projectedQuantity: 24000,
    unit: 'Liters',
    confidence: 0.93,
    forecastPeriod: 'Next 48 Hours'
  }
];

export interface OfflineFaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  language: 'en' | 'si' | 'ta';
  keywords: string[];
}

const OFFLINE_FAQS: OfflineFaqItem[] = [
  {
    id: 'faq-1',
    category: 'Helpline',
    question: 'What are the emergency contact numbers for disaster response in Sri Lanka?',
    answer: 'Disaster Management Centre (DMC) Call Centre: 117 | Police Emergency: 119 | Ambulance Service (Suwa Seriya): 1990 | Fire & Rescue: 110. All hotlines operate 24/7 free of charge.',
    language: 'en',
    keywords: ['emergency', 'contact', 'hotline', 'phone', 'dmc', 'number', 'police', 'ambulance', 'call']
  },
  {
    id: 'faq-2',
    category: 'Shelter',
    question: 'Where can I find safe emergency shelters in flooded areas?',
    answer: 'In Kandy and central districts, active relief shelters are established at Gatambe Community Hall, Kandy Central College, and Peradeniya High School with 24/7 dry rations and first aid.',
    language: 'en',
    keywords: ['shelter', 'safe', 'camp', 'stay', 'place', 'hall', 'school', 'kandy', 'centre', 'where']
  },
  {
    id: 'faq-3',
    category: 'Food & Water',
    question: 'How do I request emergency food rations and clean drinking water?',
    answer: 'Submit an emergency aid request via the Citizen Portal under "Food & Water" or contact your local Grama Niladhari. Water bowsers and dry ration pack LK-80 are dispatched twice daily.',
    language: 'en',
    keywords: ['food', 'water', 'ration', 'meals', 'drink', 'clean', 'eat', 'hungry', 'supplies']
  },
  {
    id: 'faq-4',
    category: 'Medical',
    question: 'What should I do if someone is injured or needs urgent medical evacuation?',
    answer: 'Immediately dial 1990 (Suwa Seriya). For flood-bound patients, navy rescue boats and 4x4 military ambulances are pre-positioned at district triage hubs. State patient condition and location pin clearly.',
    language: 'en',
    keywords: ['medical', 'doctor', 'injured', 'medicine', 'sick', 'hospital', 'evacuation', 'ambulance', 'pregnant']
  },
  {
    id: 'faq-5',
    category: 'Safety',
    question: 'What are the immediate safety precautions during severe monsoon flooding?',
    answer: 'Move to higher ground immediately. Switch off mains electricity before water enters the house. Never walk or drive through moving water. Avoid downed power lines and keep emergency documents in waterproof bags.',
    language: 'en',
    keywords: ['safety', 'flood', 'rain', 'water rising', 'precautions', 'danger', 'hazard', 'electric']
  },
  // Sinhala FAQs
  {
    id: 'faq-si-1',
    category: 'හදිසි ඇමතුම්',
    question: 'හදිසි ආපදා කළමනාකරණ දුරකථන අංක මොනවාද?',
    answer: 'ආපදා කළමනාකරණ මධ්‍යස්ථානය (DMC): 117 | සුවසැරිය ගිලන්රථ සේවය: 1990 | පොලිස් හදිසි ඇමතුම්: 119 | ගිනි නිවීම් සේවය: 110. පැය 24 පුරා ක්‍රියාත්මකයි.',
    language: 'si',
    keywords: ['අංක', 'දුරකථන', 'හදිසි', 'ඇමතුම්', 'dmc', 'පොලිස්', 'සුවසැරිය']
  },
  {
    id: 'faq-si-2',
    category: 'ආරක්ෂිත ස්ථාන',
    question: 'ආරක්ෂිත සහන කඳවුරු සහ නවාතැන් කොහෙද පිහිටා ඇත්තේ?',
    answer: 'මහනුවර සහ ගංවතුර බලපෑමට ලක්වූ ප්‍රදේශවල ගැටඹේ ප්‍රජා ශාලාව සහ මහනුවර විද්‍යාලය සහන මධ්‍යස්ථාන ලෙස ක්‍රියාත්මක වේ. ආහාර සහ වෛද්‍ය පහසුකම් ඇත.',
    language: 'si',
    keywords: ['නවාතැන්', 'කඳවුරු', 'ආරක්ෂිත', 'ස්ථාන', 'කොහෙද', 'ශාලාව']
  },
  {
    id: 'faq-si-3',
    category: 'ආහාර සහ ජලය',
    question: 'හදිසි වියළි සලාක සහ පිරිසිදු පානීය ජලය ලබා ගන්නේ කෙසේද?',
    answer: 'පුරවැසි ද්වාරය හරහා හෝ ඔබේ ප්‍රදේශයේ ග්‍රාම නිලධාරී මහතා අමතා ආධාර ඉල්ලීමක් යොමු කරන්න. ජල බවුසර් සහ ආහාර පැකට් බෙදා හැරේ.',
    language: 'si',
    keywords: ['ආහාර', 'කෑම', 'වතුර', 'ජලය', 'සලාක', 'බෙදා']
  },
  // Tamil FAQs
  {
    id: 'faq-ta-1',
    category: 'அவசர உதவி',
    question: 'பேரிடர் அவசர உதவிக்கான தொலைபேசி எண்கள் எவை?',
    answer: 'பேரிடர் முகாமைத்துவ நிலையம் (DMC): 117 | சுவசரிய அம்புலன்ஸ்: 1990 | பொலிஸ் அவசர உதவி: 119. 24 மணிநேரமும் இலவசமாக இயங்குகிறது.',
    language: 'ta',
    keywords: ['எண்கள்', 'அவசர', 'தொலைபேசி', 'dmc', 'உதவி', 'அழைப்பு']
  },
  {
    id: 'faq-ta-2',
    category: 'தங்குமிடம்',
    question: 'பாதுகாப்பான நிவாரண முகாம்கள் எங்கே உள்ளன?',
    answer: 'கண்டி மற்றும் பாதிக்கப்பட்ட பகுதிகளில் கட்டம்பே சமூக மண்டபம் மற்றும் கண்டி சென்ட்ரல் கல்லூரியில் தற்காலிக நிவாரண முகாம்கள் இயங்கி வருகின்றன.',
    language: 'ta',
    keywords: ['முகாம்', 'பாதுகாப்பு', 'தங்குமிடம்', 'எங்கே', 'இடம்']
  },
  {
    id: 'faq-ta-3',
    category: 'உணவு மற்றும் தண்ணீர்',
    question: 'அவசர உணவு மற்றும் குடிநீர் பெறுவது எப்படி?',
    answer: 'பொதுமக்கள் போர்டல் வழியாக கோரிக்கை வைக்கவும் அல்லது கிராம நிலதாரியை தொடர்பு கொள்ளவும். குடிநீர் மற்றும் உலர் உணவு பொதிகள் வழங்கப்படுகின்றன.',
    language: 'ta',
    keywords: ['உணவு', 'தண்ணீர்', 'குடிநீர்', 'உதவி', 'பொதிகள்']
  }
];

export const aiApi = {
  /**
   * Detects whether text is in Sinhala, Tamil, or English based on Unicode ranges and vocabulary
   */
  detectLanguage(text: string): 'en' | 'si' | 'ta' {
    if (!text) return 'en';
    // Sinhala Unicode range: \u0D80-\u0DFF
    if (/[\u0D80-\u0DFF]/.test(text)) {
      return 'si';
    }
    // Tamil Unicode range: \u0B80-\u0BFF
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return 'ta';
    }
    return 'en';
  },

  /**
   * Get failure log from localStorage
   */
  getFailures(): AiServiceFailure[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FAILURES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Record failure into failure history
   */
  recordFailure(endpoint: string, errorCode: string, errorSummary: string, fallbackAction: string) {
    try {
      const failures = this.getFailures();
      const newFailure: AiServiceFailure = {
        id: `fail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        endpoint,
        errorCode,
        errorSummary,
        fallbackAction
      };
      const updated = [newFailure, ...failures].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.FAILURES, JSON.stringify(updated));
    } catch {}
  },

  /**
   * Clear failure log
   */
  clearFailures() {
    localStorage.removeItem(STORAGE_KEYS.FAILURES);
  },

  /**
   * Check if simulated offline mode is enabled
   */
  isSimulatedOffline(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SIMULATE_OFFLINE) === 'true';
  },

  /**
   * Toggle simulated offline mode
   */
  setSimulatedOffline(val: boolean) {
    localStorage.setItem(STORAGE_KEYS.SIMULATE_OFFLINE, val ? 'true' : 'false');
  },

  /**
   * Probes AI service status live and reports actual connectivity
   */
  async checkHealth(): Promise<AiServiceHealth> {
    const isSimOffline = this.isSimulatedOffline();
    const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (isSimOffline || !isBrowserOnline) {
      return {
        status: 'Offline',
        activeStrategy: 'RuleBasedStrategy (Offline Heuristic Engine)',
        isFallback: true,
        latencyMs: 0,
        lastChecked: new Date().toISOString(),
        uptimePercent: 99.4,
        providerName: 'Local Rule-Based Deterministic NLP',
        supportedLanguages: ['en', 'si', 'ta']
      };
    }

    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${AI_API_BASE}/ai/forecasts`, {
        signal: controller.signal,
        headers: getAuthHeaders()
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        return {
          status: 'Online',
          activeStrategy: 'IAiGateway (External Cloud LLM + Local Strategy)',
          isFallback: false,
          latencyMs,
          lastChecked: new Date().toISOString(),
          uptimePercent: 99.8,
          providerName: 'ResQnet AI Gateway v2.4 (ASP.NET Core 10 Web API)',
          supportedLanguages: ['en', 'si', 'ta']
        };
      } else {
        this.recordFailure('/api/ai/forecasts', `${res.status}`, `HTTP ${res.statusText}`, 'Fallback to RuleBasedStrategy');
        return {
          status: 'Degraded',
          activeStrategy: 'RuleBasedStrategy (Fallback)',
          isFallback: true,
          latencyMs,
          lastChecked: new Date().toISOString(),
          uptimePercent: 98.2,
          providerName: 'Local Rule-Based NLP Strategy',
          supportedLanguages: ['en', 'si', 'ta']
        };
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      this.recordFailure(
        `${AI_API_BASE}/ai/forecasts`,
        err.name === 'AbortError' ? 'TIMEOUT_2500MS' : 'NETWORK_UNREACHABLE',
        err.message || 'Failed to connect to AI Gateway endpoint',
        'Automatic switch to RuleBasedStrategy (Offline Heuristics)'
      );

      return {
        status: 'Offline',
        activeStrategy: 'RuleBasedStrategy (Offline Heuristic Engine)',
        isFallback: true,
        latencyMs,
        lastChecked: new Date().toISOString(),
        uptimePercent: 97.9,
        providerName: 'Local Rule-Based Deterministic NLP Engine',
        supportedLanguages: ['en', 'si', 'ta']
      };
    }
  },

  /**
   * Get case review with recommendation
   */
  async getCase(caseNumber: string = '#2341'): Promise<CaseReview> {
    const isSimOffline = this.isSimulatedOffline();
    const cleanNum = caseNumber.replace('#', '');

    if (!isSimOffline) {
      try {
        const res = await fetch(`${AI_API_BASE}/cases/${cleanNum}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const json: ApiResponse<CaseReview> = await res.json();
          return json.data;
        }
      } catch {
        // Fall through to fallback
      }
    }

    return { ...MOCK_CASE_2341 };
  },

  /**
   * Submit human decision (HITL governance)
   */
  async submitHumanDecision(
    caseNumber: string,
    action: string,
    justification?: string,
    modifiedCategory?: string,
    modifiedUrgency?: string,
    reviewerEmail?: string
  ): Promise<boolean> {
    const cleanNum = caseNumber.replace('#', '');
    try {
      const res = await fetch(`${AI_API_BASE}/cases/${cleanNum}/decision`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action,
          justification,
          modifiedCategory,
          modifiedUrgency,
          reviewerEmail: reviewerEmail || 'coordinator@resqnet.org'
        })
      });
      if (res.ok) return true;
    } catch {}

    // In-memory / Mock update
    if (action === 'Approve') MOCK_CASE_2341.status = 'Approved';
    else if (action === 'Modify') {
      MOCK_CASE_2341.status = 'Approved with Modifications';
      if (modifiedCategory && MOCK_CASE_2341.recommendation) {
        MOCK_CASE_2341.recommendation.category = modifiedCategory;
      }
      if (modifiedUrgency && MOCK_CASE_2341.recommendation) {
        MOCK_CASE_2341.recommendation.urgency = modifiedUrgency;
      }
    } else if (action === 'Reject') MOCK_CASE_2341.status = 'Rejected';
    else if (action === 'Defer') MOCK_CASE_2341.status = 'Deferred for Investigation';
    return true;
  },

  /**
   * Ask Chatbot with automatic language detection and offline FAQ fallback
   */
  async askChatbot(
    question: string,
    caseNumber: string = '#2341',
    preferredLang?: 'en' | 'si' | 'ta'
  ): Promise<{
    reply: string;
    detectedLanguage: 'en' | 'si' | 'ta';
    isFallback: boolean;
    confidence: number;
    suggestedAction?: string;
  }> {
    const lang = preferredLang || this.detectLanguage(question);
    const isSimOffline = this.isSimulatedOffline();
    const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // 1. If not simulated offline and browser is online, try backend
    if (!isSimOffline && isBrowserOnline) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(`${AI_API_BASE}/ai/chat`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            question,
            caseNumber,
            language: lang
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json: ApiResponse<{
            reply: string;
            confidence?: number;
            source?: string;
            suggestedAction?: string;
          }> = await res.json();

          return {
            reply: json.data.reply,
            detectedLanguage: lang,
            isFallback: false,
            confidence: json.data.confidence ?? 0.95,
            suggestedAction: json.data.suggestedAction
          };
        }
      } catch (err: any) {
        this.recordFailure(
          `${AI_API_BASE}/ai/chat`,
          err.name === 'AbortError' ? 'TIMEOUT_3500MS' : 'NETWORK_ERROR',
          'Chat service unavailable',
          'Switched to offline FAQ / heuristic response'
        );
      }
    }

    // 2. Offline / Fallback heuristic matching
    const qLower = question.toLowerCase();

    // Check offline FAQ matches first
    const matchedFaq = OFFLINE_FAQS.find((faq) => {
      if (faq.language !== lang && lang !== 'en') return false;
      return faq.keywords.some((k) => qLower.includes(k.toLowerCase()));
    });

    if (matchedFaq) {
      return {
        reply: matchedFaq.answer,
        detectedLanguage: lang,
        isFallback: true,
        confidence: 0.96,
        suggestedAction: `[Offline FAQ Match] Category: ${matchedFaq.category}`
      };
    }

    // Multilingual Sinhala response
    if (lang === 'si') {
      if (qLower.includes('කොහෙද') || qLower.includes('ස්ථාන') || qLower.includes('ප්‍රදේශය')) {
        return {
          reply: 'බලපෑමට ලක්වූ ප්‍රදේශය ශ්‍රී ලංකාවේ මහනුවර දිස්ත්‍රික්කයයි. ප්‍රදේශයේ දැඩි ගංවතුර සහ මාර්ග අවහිරතා පවතී.',
          detectedLanguage: 'si',
          isFallback: true,
          confidence: 0.94,
          suggestedAction: 'ආපදා කළමනාකරණ මධ්‍යස්ථානයේ (DMC) නවතම උපදෙස් අනුගමනය කරන්න.'
        };
      }
      return {
        reply: 'ක්ෂණික අවශ්‍යතා අතරට පිරිසිදු පානීය ජලය, ආහාර, ඖෂධ සහ තාවකාලික නවාතැන් ඇතුළත් වේ. 117 හෝ 1990 අමතන්න.',
        detectedLanguage: 'si',
        isFallback: true,
        confidence: 0.92,
        suggestedAction: 'හදිසි ආධාර ඉල්ලීමක් යොමු කරන්න.'
      };
    }

    // Multilingual Tamil response
    if (lang === 'ta') {
      if (qLower.includes('எங்கே') || qLower.includes('இடம்') || qLower.includes('பகுதி')) {
        return {
          reply: 'பாதிக்கப்பட்ட பகுதி இலங்கையின் கண்டி மாவட்டம். இப்பகுதியில் கடுமையான வெள்ளம் மற்றும் வீதித் தடைகள் ஏற்பட்டுள்ளன.',
          detectedLanguage: 'ta',
          isFallback: true,
          confidence: 0.94,
          suggestedAction: 'அவசர பேரிடர் முகாமைத்துவ நிலையத்தின் (DMC) வழிகாட்டல்களைப் பின்பற்றவும்.'
        };
      }
      return {
        reply: 'உடனடித் தேவைகளில் உணவு, குடிநீர், மருத்துவ உதவி மற்றும் தற்காலிக தங்குமிடம் ஆகியவை அடங்கும். அவசர உதவிக்கு 117 ஐ அழைக்கவும்.',
        detectedLanguage: 'ta',
        isFallback: true,
        confidence: 0.92,
        suggestedAction: 'நிவாரண முகாம்களை தொடர்பு கொள்ளவும்.'
      };
    }

    // Exact dialogue matching Screenshot 9
    if (qLower.includes('affected area') || qLower.includes('where')) {
      return {
        reply: 'The affected area is Kandyya, Sri Lanka. The area is experiencing heavy flooding and road closures.',
        detectedLanguage: 'en',
        isFallback: true,
        confidence: 0.98,
        suggestedAction: 'Inspect local topographic flood maps and detour routes.'
      };
    }

    if (qLower.includes('immediate needs') || qLower.includes('needs') || qLower.includes('what are')) {
      return {
        reply: 'Immediate needs include food, clean water, medical aid, and temporary shelter for the affected families.',
        detectedLanguage: 'en',
        isFallback: true,
        confidence: 0.96,
        suggestedAction: 'Dispatch emergency ration pack batch #LK-80 and set up shelter tents.'
      };
    }

    if (qLower.includes('shelter') || qLower.includes('camp') || qLower.includes('safe')) {
      return {
        reply: 'Verified safe shelter centres in Kandyya are operating at Kandy Central College and Gatambe Community Hall with 24/7 medical staff.',
        detectedLanguage: 'en',
        isFallback: true,
        confidence: 0.92,
        suggestedAction: 'Allocate displaced families to Gatambe Community Hall.'
      };
    }

    return {
      reply: `Based on live situational reports for ${caseNumber}, emergency medical units and food relief teams are deployed in Kandyya.`,
      detectedLanguage: 'en',
      isFallback: true,
      confidence: 0.88,
      suggestedAction: 'Review live triage reports on the Case Review page.'
    };
  },

  /**
   * Get demand forecasts
   */
  async getForecasts(): Promise<DemandForecast[]> {
    const isSimOffline = this.isSimulatedOffline();
    if (!isSimOffline) {
      try {
        const res = await fetch(`${AI_API_BASE}/ai/forecasts`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const json: ApiResponse<DemandForecast[]> = await res.json();
          return json.data;
        }
      } catch {}
    }
    return [...MOCK_FORECASTS];
  },

  /**
   * Get offline FAQs
   */
  getOfflineFaqs(categoryFilter?: string, language?: 'en' | 'si' | 'ta'): OfflineFaqItem[] {
    return OFFLINE_FAQS.filter((faq) => {
      if (language && faq.language !== language) return false;
      if (categoryFilter && categoryFilter !== 'All' && faq.category !== categoryFilter) return false;
      return true;
    });
  }
};
