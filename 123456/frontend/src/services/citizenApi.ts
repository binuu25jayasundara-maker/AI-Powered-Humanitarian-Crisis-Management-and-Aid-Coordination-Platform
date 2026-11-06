import {
  AidRequest, CitizenNotification, CitizenProfile, NewAidRequest,
  REQUEST_STEPS, SafetyAlert, Shelter
} from '../types/citizen';
import { CORE_API_URL } from '../config';

const API_BASE = CORE_API_URL;

const KEYS = {
  requests: 'cz_requests',
  notifications: 'cz_notifications',
  profile: 'cz_profile'
};

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const wait = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));
const ago = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();

/** Try the real backend. Returns null if it is offline or fails (we then use mock data). */
async function tryBackend<T>(path: string, init?: RequestInit): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const token = localStorage.getItem('resqnet_token');
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Seed (mock) data ----------
const seedShelters: Shelter[] = [
  {
    id: 's1',
    name: 'Kelaniya Maha Vidyalaya Center',
    district: 'Western',
    address: 'Kelaniya, Gampaha District',
    capacity: 450,
    occupied: 369,
    distanceKm: 1.2,
    facilities: ['Food', 'Medical', 'Water', 'Accessibility'],
    latitude: 6.9538,
    longitude: 79.9167,
    contactPerson: 'Sunil Wickramasinghe',
    contactPhone: '+94 77 123 4567',
    operationalStatus: 'Open'
  },
  {
    id: 's2',
    name: 'Biyagama Community Hall',
    district: 'Western',
    address: 'Biyagama South, Gampaha District',
    capacity: 300,
    occupied: 192,
    distanceKm: 2.5,
    facilities: ['Food', 'Medical', 'Water'],
    latitude: 6.9421,
    longitude: 79.9482,
    contactPerson: 'Malini Perera',
    contactPhone: '+94 71 234 5678',
    operationalStatus: 'Open'
  },
  {
    id: 's3',
    name: 'Peliyagoda Central College',
    district: 'Western',
    address: 'Peliyagoda, Gampaha District',
    capacity: 350,
    occupied: 110,
    distanceKm: 2.9,
    facilities: ['Food', 'Medical', 'Water', 'Accessibility'],
    latitude: 6.9688,
    longitude: 79.8972,
    contactPerson: 'Kanthi Rajapaksha',
    contactPhone: '+94 72 567 8901',
    operationalStatus: 'Open'
  },
  {
    id: 's4',
    name: 'Rivagama Relief Center',
    district: 'Western',
    address: 'Rivagama, Western Province',
    capacity: 300,
    occupied: 120,
    distanceKm: 3.8,
    facilities: ['Food', 'Medical', 'Water', 'Accessibility'],
    latitude: 6.9215,
    longitude: 79.9140,
    contactPerson: 'Dhammika Fernando',
    contactPhone: '+94 77 890 1234',
    operationalStatus: 'Open'
  },
  {
    id: 's5',
    name: 'Wellampitiya Youth Club',
    district: 'Western',
    address: 'Wellampitiya, Colombo District',
    capacity: 180,
    occupied: 180,
    distanceKm: 4.1,
    facilities: ['Food', 'Water'],
    latitude: 6.9481,
    longitude: 79.8894,
    contactPerson: 'Ananda Silva',
    contactPhone: '+94 70 456 7890',
    operationalStatus: 'Full'
  },
  {
    id: 's6',
    name: 'Kaduwela Town Hall Center',
    district: 'Western',
    address: 'Kaduwela Junction, Colombo District',
    capacity: 250,
    occupied: 245,
    distanceKm: 5.4,
    facilities: ['Food', 'Water', 'Accessibility'],
    latitude: 6.9344,
    longitude: 79.9839,
    contactPerson: 'Ruwan Jayasuriya',
    contactPhone: '+94 76 345 6789',
    operationalStatus: 'Almost Full'
  },
  {
    id: 's7',
    name: 'Community Hall Gampaha',
    district: 'Western',
    address: 'Main Street, Gampaha District',
    capacity: 120,
    occupied: 40,
    distanceKm: 7.9,
    facilities: ['Food', 'Beds', 'Water', 'Accessibility'],
    latitude: 7.0840,
    longitude: 79.9925,
    contactPerson: 'Nimali Senanayake',
    contactPhone: '+94 33 456 7890',
    operationalStatus: 'Open'
  },
  {
    id: 's8',
    name: 'St. Mary School Shelter',
    district: 'Central',
    address: 'Peradeniya Road, Kandy',
    capacity: 150,
    occupied: 128,
    distanceKm: 8.4,
    facilities: ['Food', 'Water', 'Medical'],
    latitude: 7.2750,
    longitude: 80.6050,
    contactPerson: 'Sister Theresa',
    contactPhone: '+94 81 234 5678',
    operationalStatus: 'Almost Full'
  },
  {
    id: 's9',
    name: 'Town Hall Safe Zone',
    district: 'Central',
    address: 'Kandy Town Hall, Kandy',
    capacity: 200,
    occupied: 196,
    distanceKm: 9.1,
    facilities: ['Medical', 'Beds', 'Water', 'Accessibility'],
    latitude: 7.2906,
    longitude: 80.6337,
    contactPerson: 'Sarath Bandara',
    contactPhone: '+94 81 345 6789',
    operationalStatus: 'Almost Full'
  },
];

const seedAlerts: SafetyAlert[] = [
  {
    id: 'a1', level: 'Danger', title: 'Flood warning: Kelani River level rising',
    message: 'Water level is above the danger mark in low-lying areas. Move to higher ground now.',
    source: 'Disaster Management Centre (verified)', verified: true,
    guidance: ['Move to higher ground or the nearest shelter', 'Switch off electricity at the main switch', 'Do not walk or drive through flood water', 'Keep documents and medicine in a waterproof bag'],
    issuedAt: ago(45)
  },
  {
    id: 'a2', level: 'Warning', title: 'Heavy rain expected for the next 24 hours',
    message: 'Rain above 100 mm is expected in Western and Central provinces.',
    source: 'Department of Meteorology (verified)', verified: true,
    guidance: ['Charge your phone and power bank', 'Store drinking water', 'Avoid river banks and landslide-prone slopes'],
    issuedAt: ago(180)
  },
  {
    id: 'a3', level: 'Info', title: 'Relief food distribution at Rivagama',
    message: 'Dry rations will be given from 9:00 AM to 4:00 PM. Bring your ID.',
    source: 'District Secretariat (verified)', verified: true,
    guidance: ['Bring a national ID or any ID', 'Elderly and disabled people have a priority line'],
    issuedAt: ago(600)
  }
];

const seedRequests: AidRequest[] = [
  {
    id: 'r1', reference: 'REQ-100231', category: 'Food & Water', urgency: 'High',
    description: 'Family of 5 without drinking water since yesterday.', location: 'Rivagama, Western Province',
    status: 'On the way', createdAt: ago(95), etaMinutes: 25
  },
  {
    id: 'r2', reference: 'REQ-100198', category: 'Medical', urgency: 'Medium',
    description: 'Need blood pressure medicine for an elderly person.', location: 'Peradeniya Road, Kandy',
    status: 'Delivered', createdAt: ago(1500)
  }
];

const seedNotifications: CitizenNotification[] = [
  { id: 'n1', title: 'Your request is on the way', message: 'REQ-100231: the team will arrive in about 25 minutes.', type: 'Request', channel: 'SMS', read: false, createdAt: ago(10) },
  { id: 'n2', title: 'Flood warning issued', message: 'Kelani River level rising. Move to higher ground.', type: 'Alert', channel: 'Push', read: false, createdAt: ago(45) },
  { id: 'n3', title: 'Request delivered', message: 'REQ-100198 was delivered. Please rate this help.', type: 'Request', channel: 'Email', read: true, createdAt: ago(1400) }
];

const defaultProfile = (name: string): CitizenProfile => ({
  fullName: name, phone: '', address: '', language: 'EN', household: [], accessibility: [],
  prefs: { sms: true, email: true, push: true }
});

// ---------- API ----------
export const citizenApi = {
  async getRequests(): Promise<AidRequest[]> {
    await wait();
    const list = read<AidRequest[]>(KEYS.requests, seedRequests);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createRequest(input: NewAidRequest): Promise<AidRequest> {
    await wait(400);
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    const req: AidRequest = {
      ...input,
      id: `r${Date.now()}`,
      reference: `REQ-${String(Date.now()).slice(-6)}`,
      status: 'Received',
      createdAt: new Date().toISOString(),
      queued: offline
    };
    if (!offline) {
      await tryBackend<AidRequest>('/citizen/requests', { method: 'POST', body: JSON.stringify(req) });
    }
    const list = read<AidRequest[]>(KEYS.requests, seedRequests);
    write(KEYS.requests, [req, ...list]);
    return req;
  },

  /** Call this when the browser comes back online. Marks queued requests as sent. */
  async flushQueue(): Promise<number> {
    const list = read<AidRequest[]>(KEYS.requests, seedRequests);
    let sent = 0;
    const next = list.map((r) => {
      if (r.queued) { sent += 1; return { ...r, queued: false }; }
      return r;
    });
    if (sent > 0) write(KEYS.requests, next);
    return sent;
  },

  /** DEMO ONLY: moves a request to the next step (staff do this in the real system). */
  async advanceRequest(id: string): Promise<AidRequest[]> {
    const list = read<AidRequest[]>(KEYS.requests, seedRequests);
    const next = list.map((r) => {
      if (r.id !== id) return r;
      const i = REQUEST_STEPS.indexOf(r.status);
      if (i >= REQUEST_STEPS.length - 1) return r;
      const status = REQUEST_STEPS[i + 1];
      return { ...r, status, etaMinutes: status === 'On the way' ? 30 : status === 'Delivered' ? undefined : 45 };
    });
    write(KEYS.requests, next);
    return next;
  },

  async rateRequest(id: string, rating: number, feedback: string): Promise<void> {
    const list = read<AidRequest[]>(KEYS.requests, seedRequests);
    write(KEYS.requests, list.map((r) => (r.id === id ? { ...r, rating, feedback } : r)));
    await tryBackend(`/citizen/requests/${id}/rating`, { method: 'POST', body: JSON.stringify({ rating, feedback }) });
  },

  async getShelters(): Promise<Shelter[]> {
    try {
      const backendData = await tryBackend<any[]>('/shelters');
      if (backendData && Array.isArray(backendData) && backendData.length > 0) {
        return backendData.map((s) => ({
          id: String(s.id),
          name: s.name,
          district: (s.location || '').toLowerCase().includes('kandy') || (s.location || '').toLowerCase().includes('central') ? 'Central' : 'Western',
          address: s.location || s.address || '',
          capacity: s.totalCapacity ?? s.capacity ?? 100,
          occupied: s.currentOccupancy ?? s.occupied ?? 0,
          distanceKm: s.distanceKm ?? 2.5,
          facilities: s.facilities ?? ['Food', 'Water'],
          latitude: s.latitude,
          longitude: s.longitude,
          contactPhone: s.contactPhone,
          contactPerson: s.contactPerson,
          operationalStatus: s.operationalStatus
        }));
      }
    } catch {
      // fallback to mock
    }
    await wait(100);
    return seedShelters;
  },

  async getAlerts(): Promise<SafetyAlert[]> {
    await wait();
    return seedAlerts;
  },

  async getNotifications(): Promise<CitizenNotification[]> {
    await wait();
    return read<CitizenNotification[]>(KEYS.notifications, seedNotifications);
  },

  async markNotificationRead(id?: string): Promise<CitizenNotification[]> {
    const list = read<CitizenNotification[]>(KEYS.notifications, seedNotifications);
    const next = list.map((n) => (id === undefined || n.id === id ? { ...n, read: true } : n));
    write(KEYS.notifications, next);
    return next;
  },

  async getProfile(defaultName: string): Promise<CitizenProfile> {
    await wait(100);
    return read<CitizenProfile>(KEYS.profile, defaultProfile(defaultName));
  },

  async saveProfile(profile: CitizenProfile): Promise<void> {
    await wait(300);
    write(KEYS.profile, profile);
  }
};
