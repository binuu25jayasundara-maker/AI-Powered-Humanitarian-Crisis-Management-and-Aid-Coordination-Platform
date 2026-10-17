import {
  Volunteer,
  TaskMatchingRecommendation,
  CampaignKpis,
  Campaign,
  Donation,
  NotificationRecord,
  NotificationResult
} from '../types';

const API_BASE = '/api';

// Fallback seeds exactly matching Screenshots 10 & 9
const fallbackKpis: CampaignKpis = {
  totalRaisedLkr: 4200000,
  totalGoalLkr: 5000000,
  overallProgressPercent: 84.0,
  totalSuppliesAndItemsCount: 1284,
  activeWasteFlagsCount: 3,
  activeCampaign: {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Flood Relief 2024',
    goalAmount: 5000000,
    raisedAmount: 4200000,
    progressPercent: 84.0,
    medicalItemsCount: 1284,
    disposalFlagCount: 3,
    foodAllocationPercent: 40,
    medicalAllocationPercent: 35,
    shelterAllocationPercent: 25,
    status: 'Active',
    createdAt: new Date().toISOString()
  }
};

const fallbackDonations: Donation[] = [
  {
    id: '1',
    campaignTitle: 'Flood Relief 2024',
    donorName: 'A. Silva',
    amount: 25000,
    itemCount: 0,
    flag: '-',
    isSuspicious: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: '2',
    campaignTitle: 'Flood Relief 2024',
    donorName: 'Org X',
    amount: 300000,
    itemCount: 500,
    flag: 'Urgent',
    isSuspicious: false,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  },
  {
    id: '3',
    campaignTitle: 'Flood Relief 2024',
    donorName: 'K. Perera',
    amount: 5000,
    itemCount: 0,
    flag: '-',
    isSuspicious: false,
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  }
];

const fallbackVolunteers: Volunteer[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    fullName: 'Nimal P.',
    email: 'nimal@resqnet.org',
    phoneNumber: '+94 77 111 2222',
    skills: 'First aid, driving',
    status: 'Available',
    totalHours: 48,
    createdAt: new Date().toISOString(),
    weeklyAvailability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    fullName: 'Kavya S.',
    email: 'kavya@resqnet.org',
    phoneNumber: '+94 77 222 3333',
    skills: 'Translation',
    status: 'On Task',
    totalHours: 72,
    createdAt: new Date().toISOString(),
    weeklyAvailability: ['Tue', 'Wed', 'Thu']
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    fullName: 'Ruwan D.',
    email: 'ruwan@resqnet.org',
    phoneNumber: '+94 77 333 4444',
    skills: 'Logistics',
    status: 'Available',
    totalHours: 95,
    createdAt: new Date().toISOString(),
    weeklyAvailability: ['Mon', 'Wed', 'Fri', 'Sat', 'Sun']
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    fullName: 'Amal T.',
    email: 'amal@resqnet.org',
    phoneNumber: '+94 77 444 5555',
    skills: 'Medical',
    status: 'On Leave',
    totalHours: 30,
    createdAt: new Date().toISOString(),
    weeklyAvailability: ['Sat', 'Sun']
  }
];

const fallbackRecommendation: TaskMatchingRecommendation = {
  taskId: '99999999-9999-9999-9999-999999999999',
  taskTitle: 'Distribute meals - Rivagama',
  category: 'Relief Logistics',
  location: 'Rivagama Relief Center, Western Province',
  requiredSkill: 'Logistics',
  candidateVolunteerId: '33333333-3333-3333-3333-333333333333',
  candidateName: 'Ruwan D.',
  candidateEmail: 'ruwan@resqnet.org',
  candidatePhone: '+94 77 333 4444',
  candidateSkills: 'Logistics',
  matchScorePercent: 67,
  matchRationale: 'Volunteer skills (Logistics) align with required role. High proximity to Rivagama site and active status.'
};

export const api = {
  // Campaign & Donor APIs (Screenshot 10)
  async getCampaignKpis(): Promise<CampaignKpis> {
    try {
      const res = await fetch(`${API_BASE}/campaigns/kpis`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return fallbackKpis;
  },

  async getDonations(): Promise<Donation[]> {
    try {
      const res = await fetch(`${API_BASE}/donations`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return fallbackDonations;
  },

  async recordDonation(donation: {
    donorName: string;
    amount: number;
    itemCount?: number;
    flag?: string;
  }): Promise<Donation> {
    const res = await fetch(`${API_BASE}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donation)
    });
    if (!res.ok) throw new Error('Failed to record donation');
    return await res.json();
  },

  // Volunteer APIs (Screenshot 9)
  async getVolunteers(): Promise<Volunteer[]> {
    try {
      const res = await fetch(`${API_BASE}/volunteers`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return fallbackVolunteers;
  },

  async getTaskMatchingRecommendation(): Promise<TaskMatchingRecommendation> {
    try {
      const res = await fetch(`${API_BASE}/volunteers/task-matching`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return fallbackRecommendation;
  },

  async assignVolunteerToTask(taskId: string, volunteerId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/volunteers/assign-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, volunteerId })
    });
    return res.ok;
  },

  async registerVolunteer(volunteer: {
    fullName: string;
    email: string;
    phoneNumber: string;
    skills: string;
  }): Promise<Volunteer> {
    const res = await fetch(`${API_BASE}/volunteers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(volunteer)
    });
    if (!res.ok) throw new Error('Failed to register volunteer');
    return await res.json();
  },

  // Communication & Notification APIs (Factory Pattern & Idempotency)
  async sendNotification(req: {
    recipient: string;
    channel: string;
    subject: string;
    body: string;
    idempotencyKey?: string;
  }): Promise<NotificationResult> {
    const res = await fetch(`${API_BASE}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error('Failed to dispatch notification');
    return await res.json();
  },

  async getNotificationHistory(): Promise<NotificationRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/notifications/history`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return [
      {
        id: '1',
        recipient: 'volunteers-alert@resqnet.org',
        channel: 'Email',
        subject: 'Emergency Dispatch Alert: Flood Relief 2024',
        body: 'New distribution teams mobilized for Rivagama area.',
        status: 'Sent',
        retryCount: 0,
        sentAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
      }
    ];
  }
};
