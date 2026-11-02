export type RequestCategory = 'Food & Water' | 'Shelter' | 'Medical' | 'Rescue / Evacuation' | 'Other';
export type Urgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type RequestStatus = 'Received' | 'Assigned' | 'On the way' | 'Delivered';

export const REQUEST_STEPS: RequestStatus[] = ['Received', 'Assigned', 'On the way', 'Delivered'];
export const CATEGORIES: RequestCategory[] = ['Food & Water', 'Shelter', 'Medical', 'Rescue / Evacuation', 'Other'];
export const URGENCIES: Urgency[] = ['Low', 'Medium', 'High', 'Critical'];

export interface AidRequest {
  id: string;
  reference: string;
  category: RequestCategory;
  urgency: Urgency;
  description: string;
  location: string;
  lat?: number;
  lng?: number;
  contactPhone?: string;
  evidenceName?: string;
  status: RequestStatus;
  createdAt: string;
  etaMinutes?: number;
  rating?: number;
  feedback?: string;
  queued?: boolean; // true = saved offline, waiting to be sent
}

export type NewAidRequest = Pick<
  AidRequest,
  'category' | 'urgency' | 'description' | 'location' | 'lat' | 'lng' | 'contactPhone' | 'evidenceName'
>;

export interface Shelter {
  id: string;
  name: string;
  district: string;
  address: string;
  capacity: number;
  occupied: number;
  distanceKm: number;
  facilities: string[];
}

export type AlertLevel = 'Danger' | 'Warning' | 'Info';

export interface SafetyAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  source: string;
  verified: boolean;
  guidance: string[];
  issuedAt: string;
}

export type NotificationChannel = 'SMS' | 'Email' | 'Push';

export interface CitizenNotification {
  id: string;
  title: string;
  message: string;
  type: 'Request' | 'Alert';
  channel: NotificationChannel;
  read: boolean;
  createdAt: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  age: number;
  needs: string;
}

export interface CitizenProfile {
  fullName: string;
  phone: string;
  address: string;
  language: 'EN' | 'SI' | 'TA';
  household: HouseholdMember[];
  accessibility: string[];
  prefs: { sms: boolean; email: boolean; push: boolean };
}
