import {
  User,
  AuthResponse,
  Organization,
  Role,
  Permission,
  AuditEvent,
  ApiResponse,
  DeletedUserRecord,
  DonorProfile,
  MonetaryPaymentMethod,
  MonetaryDonationStatus,
  MonetaryDonation,
  GoodsCategory,
  GoodsCondition,
  GoodsItem,
  GoodsDonationStatus,
  GoodsDonationRequest,
  VolunteerRegistrationStatus,
  VolunteerRegistration,
  VolunteerSchedule,
  InAppNotification,
  Volunteer,
  VolunteerTask,
  TaskMatchingRecommendation,
  CampaignKpis,
  Campaign,
  Donation,
  NotificationRecord,
  NotificationResult
} from '../types';

const API_BASE = 'http://localhost:5000/api';
const DELETED_USERS_KEY = 'resqnet_m1m6_deleted_users';

// ==========================================
// Member 1: Security, RBAC & Mock Storage
// ==========================================
const MOCK_ORGS: Organization[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'National Disaster Management Centre', code: 'DMC-LK', type: 'Government', contactEmail: 'ops@dmc.gov.lk', contactPhone: '+94 11 213 6136', address: 'Vidya Mawatha, Colombo 07', isVerified: true, memberCount: 14 },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sri Lanka Red Cross Society', code: 'SLRC', type: 'NGO', contactEmail: 'info@redcross.lk', contactPhone: '+94 11 269 1095', address: 'Dharmapala Mawatha, Colombo 07', isVerified: true, memberCount: 28 },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Sarvodaya Shramadana Movement', code: 'SARVODAYA', type: 'NGO', contactEmail: 'relief@sarvodaya.org', contactPhone: '+94 11 265 5255', address: 'Rawatawatte Road, Moratuwa', isVerified: true, memberCount: 42 }
];

const MOCK_USERS: User[] = [
  { id: 'u-1', fullName: 'Platform Administrator', email: 'admin@resqnet.org', role: 'SystemAdmin', organizationName: 'National Disaster Management Centre', isActive: true, createdAt: '2026-10-01T08:00:00Z', lastLoginAt: '2026-10-13T10:15:00Z' },
  { id: 'u-2', fullName: 'Chaminda Silva', email: 'coordinator@resqnet.org', role: 'EmergencyCoordinator', organizationName: 'National Disaster Management Centre', isActive: true, createdAt: '2026-10-02T09:30:00Z', lastLoginAt: '2026-10-13T09:40:00Z' },
  { id: 'u-3', fullName: 'Nadeesha Perera', email: 'casemanager@resqnet.org', role: 'CaseManager', organizationName: 'National Disaster Management Centre', isActive: true, createdAt: '2026-10-03T11:00:00Z', lastLoginAt: '2026-10-13T08:20:00Z' },
  { id: 'u-4', fullName: 'Kasun Jayawardena', email: 'volunteer.coord@resqnet.org', role: 'VolunteerCoordinator', organizationName: 'Sri Lanka Red Cross Society', isActive: true, createdAt: '2026-10-04T12:00:00Z', lastLoginAt: '2026-10-12T17:10:00Z' },
  { id: 'u-5', fullName: 'Anura Fernando', email: 'donor.officer@resqnet.org', role: 'DonorOfficer', organizationName: 'Sri Lanka Red Cross Society', isActive: true, createdAt: '2026-10-05T14:30:00Z', lastLoginAt: '2026-10-13T07:55:00Z' },
  { id: 'u-6', fullName: 'Sunil Weerasinghe', email: 'citizen@resqnet.org', role: 'Citizen', organizationName: null, isActive: true, createdAt: '2026-10-06T15:00:00Z', lastLoginAt: '2026-10-13T11:05:00Z' }
];

const MOCK_AUDIT_LOGS: AuditEvent[] = [
  { id: 'aud-1', actorId: 'u-1', actorEmail: 'admin@resqnet.org', action: 'USER_CREATED', entityName: 'User', entityId: 'u-6', detailsJson: '{"email":"citizen@resqnet.org","role":"Citizen"}', ipAddress: '192.168.1.10', status: 'Success', createdAt: '2026-10-13T10:16:00Z' },
  { id: 'aud-2', actorId: 'u-2', actorEmail: 'coordinator@resqnet.org', action: 'AI_RECOMMENDATION_APPROVED', entityName: 'Case', entityId: 'Case #2341', detailsJson: '{"caseNumber":"#2341","action":"Approved","urgency":"High"}', ipAddress: '192.168.1.25', status: 'Success', createdAt: '2026-10-13T09:42:00Z' },
  { id: 'aud-3', actorId: 'u-4', actorEmail: 'volunteer.coord@resqnet.org', action: 'VOLUNTEER_TASK_ASSIGNED', entityName: 'VolunteerTask', entityId: 'VT-882', detailsJson: '{"volunteer":"Ruwan D.","task":"Distribute meals - Rivagama"}', ipAddress: '192.168.1.44', status: 'Success', createdAt: '2026-10-13T09:15:00Z' },
  { id: 'aud-4', actorId: 'u-5', actorEmail: 'donor.officer@resqnet.org', action: 'DONATION_RECORDED', entityName: 'Donation', entityId: 'DON-1044', detailsJson: '{"donor":"Org X","amount":300000,"flag":"Urgent"}', ipAddress: '192.168.1.60', status: 'Success', createdAt: '2026-10-13T08:30:00Z' },
  { id: 'aud-5', actorId: 'system', actorEmail: 'system@resqnet.org', action: 'SYSTEM_INITIALIZED', entityName: 'System', entityId: 'V1.0', detailsJson: '{"status":"Production baseline seeded"}', ipAddress: '127.0.0.1', status: 'Success', createdAt: '2026-10-13T08:00:00Z' }
];

const STORAGE_KEYS = {
  DONORS: 'resqnet_m6_donors',
  MONETARY: 'resqnet_m6_monetary_donations',
  GOODS: 'resqnet_m6_goods_donations',
  VOL_REGISTRATIONS: 'resqnet_m6_volunteer_registrations',
  VOL_SCHEDULES: 'resqnet_m6_volunteer_schedules',
  NOTIFICATIONS: 'resqnet_m6_inapp_notifications'
};

const getStored = <T>(key: string, defaultVal: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setStored = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

// Seed Donors
const initialDonors: DonorProfile[] = [
  { id: 'd-1', donorId: 'DON-0001', fullName: 'A. Silva', email: 'a.silva@resqnet.org', phoneNumber: '+94 77 123 4567', address: 'Colombo 03', createdAt: '2026-10-10T08:00:00Z' },
  { id: 'd-2', donorId: 'DON-0002', fullName: 'Org X Relief Consortium', email: 'relief@orgx.org', phoneNumber: '+94 11 234 5678', address: 'Kollupitiya, Colombo 03', createdAt: '2026-10-11T09:00:00Z' },
  { id: 'd-3', donorId: 'DON-0003', fullName: 'K. Perera', email: 'k.perera@resqnet.org', phoneNumber: '+94 77 345 6789', address: 'Moratuwa', createdAt: '2026-10-12T10:00:00Z' }
];

// Seed Monetary Donations
const initialMonetary: MonetaryDonation[] = [
  {
    id: 'mon-1',
    donationReference: 'REQ-MON-1001',
    donorId: 'DON-0001',
    donorName: 'A. Silva',
    email: 'a.silva@resqnet.org',
    contactNumber: '+94 77 123 4567',
    amount: 25000,
    currency: 'LKR',
    purpose: 'Flood Relief 2024 - Urgent Medicals',
    paymentMethod: 'Bank Transfer',
    bankReference: 'BOC-TXN-882190',
    paymentGatewayStatus: 'Pending Verification',
    status: 'Payment Verification',
    submittedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
  },
  {
    id: 'mon-2',
    donationReference: 'REQ-MON-1002',
    donorId: 'DON-0002',
    donorName: 'Org X Relief Consortium',
    email: 'relief@orgx.org',
    contactNumber: '+94 11 234 5678',
    amount: 300000,
    currency: 'LKR',
    purpose: 'Emergency Shelter Operations',
    paymentMethod: 'Online Card Payment',
    paymentGatewayStatus: 'Verified',
    status: 'Confirmed',
    submittedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    verifiedAt: new Date(Date.now() - 3600 * 1000 * 23).toISOString(),
    verifiedBy: 'Coordinator System'
  }
];

// Seed Goods Donations
const initialGoods: GoodsDonationRequest[] = [
  {
    id: 'gds-1',
    requestReference: 'REQ-GDS-1001',
    donorId: 'DON-0002',
    donorName: 'Org X Relief Consortium',
    email: 'relief@orgx.org',
    contactNumber: '+94 11 234 5678',
    address: 'Consortium Warehouse, Colombo 03',
    notes: 'Urgent medical and hygiene relief supplies ready for inspection.',
    items: [
      { id: 'item-1', category: 'Medical supplies', itemName: 'First Aid Packs & Gauze', quantity: 300, unit: 'packs', condition: 'New', notes: 'Sterilized' },
      { id: 'item-2', category: 'Hygiene products', itemName: 'Antiseptic Solution 500ml', quantity: 200, unit: 'units', condition: 'New' }
    ],
    status: 'Approved',
    earliestHandoverDate: '2026-11-01',
    latestHandoverDate: '2026-11-07',
    handoverLocation: 'Rivagama Relief Center Warehouse',
    availableTimeSlots: ['09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM'],
    selectedHandoverDate: '2026-11-03',
    selectedTimeSlot: '09:00 AM - 12:00 PM',
    handoverConfirmedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString()
  },
  {
    id: 'gds-2',
    requestReference: 'REQ-GDS-1002',
    donorId: 'DON-0003',
    donorName: 'K. Perera',
    email: 'k.perera@resqnet.org',
    contactNumber: '+94 77 345 6789',
    address: '14 Rawatawatte, Moratuwa',
    notes: 'Packaged dry rations and clean clothing.',
    items: [
      { id: 'item-3', category: 'Food and water', itemName: 'Dry Ration Rice & Dhal Packs', quantity: 50, unit: 'boxes', condition: 'New' },
      { id: 'item-4', category: 'Clothing', itemName: 'Adult Raincoats & Blankets', quantity: 40, unit: 'units', condition: 'New' }
    ],
    status: 'Pending Approval',
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
  }
];

// Seed Volunteer Registrations
const initialVolRegistrations: VolunteerRegistration[] = [
  {
    id: 'vr-1',
    volunteerId: 'VOL-0001',
    registrationReference: 'REG-VOL-1001',
    fullName: 'Ruwan D.',
    email: 'ruwan@resqnet.org',
    phoneNumber: '+94 77 333 4444',
    address: 'Rivagama Town, Western Province',
    preferredLocations: ['Western Province', 'Rivagama Relief Center'],
    preferredDates: ['2026-11-01', '2026-11-05'],
    availableStartTime: '09:00 AM',
    availableEndTime: '05:00 PM',
    preferredDaysOfWeek: ['Mon', 'Wed', 'Fri', 'Sat'],
    activityTypes: ['Logistics', 'Meal Distribution'],
    skills: 'Logistics, heavy vehicle driving, inventory sorting',
    status: 'Approved',
    totalHours: 95,
    createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString()
  },
  {
    id: 'vr-2',
    volunteerId: 'VOL-0002',
    registrationReference: 'REG-VOL-1002',
    fullName: 'Nimal P.',
    email: 'nimal@resqnet.org',
    phoneNumber: '+94 77 111 2222',
    address: 'Dehiwala, Western Province',
    preferredLocations: ['Western Province', 'Colombo Central'],
    preferredDates: ['2026-11-02', '2026-11-06'],
    availableStartTime: '08:00 AM',
    availableEndTime: '02:00 PM',
    preferredDaysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu'],
    activityTypes: ['First Aid', 'Meal Distribution'],
    skills: 'First aid certified, defensive driving',
    status: 'Approved',
    totalHours: 48,
    createdAt: new Date(Date.now() - 3600 * 1000 * 36).toISOString()
  },
  {
    id: 'vr-3',
    volunteerId: 'VOL-0003',
    registrationReference: 'REG-VOL-1003',
    fullName: 'Kavya S.',
    email: 'kavya@resqnet.org',
    phoneNumber: '+94 77 222 3333',
    address: 'Bambalapitiya, Colombo',
    preferredLocations: ['Colombo Central', 'Shelter Camps'],
    preferredDates: ['2026-11-03'],
    availableStartTime: '10:00 AM',
    availableEndTime: '04:00 PM',
    preferredDaysOfWeek: ['Tue', 'Wed', 'Thu'],
    activityTypes: ['Translation & Helpdesk', 'Shelter Management'],
    skills: 'Tamil/Sinhala/English translation, counseling',
    status: 'Pending Approval',
    totalHours: 72,
    createdAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString()
  }
];

// Seed Volunteer Confirmed Schedules
const initialSchedules: VolunteerSchedule[] = [
  {
    id: 'sch-1',
    volunteerId: 'VOL-0001',
    volunteerName: 'Ruwan D.',
    date: '2026-11-02',
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    location: 'Rivagama Relief Center',
    activity: 'Distribute meals - Rivagama',
    status: 'Approved',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
  },
  {
    id: 'sch-2',
    volunteerId: 'VOL-0002',
    volunteerName: 'Nimal P.',
    date: '2026-11-03',
    startTime: '08:00 AM',
    endTime: '01:00 PM',
    location: 'Colombo Central Depot',
    activity: 'First Aid Triage & Water Dispatch',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString()
  }
];

// Seed In-App Notifications
const initialNotifications: InAppNotification[] = [
  {
    id: 'notif-1',
    recipientRole: 'Coordinator',
    type: 'Donation_Submitted',
    title: 'New Monetary Donation Pending Verification',
    message: 'Donor A. Silva (DON-0001) submitted LKR 25,000 via Bank Transfer (Ref: BOC-TXN-882190).',
    referenceId: 'REQ-MON-1001',
    timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    isRead: false
  },
  {
    id: 'notif-2',
    recipientRole: 'Officer',
    recipientEmail: 'relief@orgx.org',
    type: 'Donation_Approved',
    title: 'Goods Donation Approved for Handover',
    message: 'Request REQ-GDS-1001 approved. Please select your handover date between Nov 1 and Nov 7 at Rivagama Relief Center.',
    referenceId: 'REQ-GDS-1001',
    timestamp: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    isRead: false
  },
  {
    id: 'notif-3',
    recipientRole: 'Coordinator',
    type: 'Volunteer_Submitted',
    title: 'New Volunteer Application',
    message: 'Kavya S. (VOL-0003) submitted volunteer registration for Translation & Helpdesk.',
    referenceId: 'REG-VOL-1003',
    timestamp: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
    isRead: false
  }
];

// ==========================================
// Existing Fallback Seeds for Member 6
// ==========================================
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
    volunteerId: 'VOL-0002',
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
    volunteerId: 'VOL-0003',
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
    volunteerId: 'VOL-0001',
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
    volunteerId: 'VOL-0004',
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

// ==========================================
// API Implementation
// ==========================================


export const api = {
  // ==========================================
  // Member 1 Methods: Auth, RBAC & Admin
  // ==========================================
  // Authentication
  async login(email: string, password: string, role?: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      if (res.ok) {
        const json: ApiResponse<AuthResponse> = await res.json();
        return json.data;
      }
    } catch {
      // Backend offline: use mock credentials
    }

    // Mock fallback
    const matched = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      if (matched.isDeleted) {
        throw new Error('This account has been deleted. Please contact an administrator.');
      }
      const effectiveUser = role ? { ...matched, role: role } : matched;
      return {
        token: 'mock-jwt-token-' + matched.id,
        refreshToken: 'mock-refresh-token-' + matched.id,
        expiresAt: new Date(Date.now() + 7200000).toISOString(),
        user: effectiveUser
      };
    }

    // Default mock user if not matched
    const defaultUser: User = {
      id: 'mock-user-id',
      fullName: email.split('@')[0],
      email: email,
      role: role || 'Citizen',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    return {
      token: 'mock-jwt-token-custom',
      refreshToken: 'mock-refresh-token-custom',
      expiresAt: new Date(Date.now() + 7200000).toISOString(),
      user: defaultUser
    };
  },

  async register(fullName: string, email: string, password: string, role: string, organizationId?: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role, organizationId })
      });
      if (res.ok) {
        const json: ApiResponse<AuthResponse> = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }

    const newUser: User = {
      id: 'u-' + (MOCK_USERS.length + 1),
      fullName,
      email,
      role,
      organizationId,
      organizationName: MOCK_ORGS.find(o => o.id === organizationId)?.name,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    MOCK_USERS.push(newUser);

    return {
      token: 'mock-jwt-token-' + newUser.id,
      refreshToken: 'mock-refresh-token-' + newUser.id,
      expiresAt: new Date(Date.now() + 7200000).toISOString(),
      user: newUser
    };
  },

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const token = localStorage.getItem('resqnet_token');
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json: ApiResponse<User[]> = await res.json();
        return json.data;
      }
    } catch {}
    return [...MOCK_USERS].filter(u => !u.isDeleted);
  },

  async toggleUserStatus(id: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('resqnet_token');
      const res = await fetch(`${API_BASE}/users/${id}/toggle-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json: ApiResponse<boolean> = await res.json();
        return json.data;
      }
    } catch {}
    const user = MOCK_USERS.find(u => u.id === id);
    if (user) {
      user.isActive = !user.isActive;
      return user.isActive;
    }
    return false;
  },

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    try {
      const res = await fetch(`${API_BASE}/organizations`);
      if (res.ok) {
        const json: ApiResponse<Organization[]> = await res.json();
        return json.data;
      }
    } catch {}
    return [...MOCK_ORGS];
  },

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    const newOrg: Organization = {
      id: 'org-' + (MOCK_ORGS.length + 1),
      name: org.name || 'New Organization',
      code: org.code || 'ORG',
      type: org.type || 'NGO',
      contactEmail: org.contactEmail || '',
      contactPhone: org.contactPhone || '',
      address: org.address || '',
      isVerified: true,
      memberCount: 1
    };
    MOCK_ORGS.push(newOrg);
    return newOrg;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditEvent[]> {
    try {
      const res = await fetch(`${API_BASE}/audit`);
      if (res.ok) {
        const json: ApiResponse<AuditEvent[]> = await res.json();
        return json.data;
      }
    } catch {}
    return [...MOCK_AUDIT_LOGS];
  },

  // ==========================================
  // Member 6 Methods: Volunteers, Donors, Scheduling & Notifications
  // ==========================================
  // ----------------------------------------
  // DONOR MANAGEMENT & UNIQUE DON ID GENERATOR
  // ----------------------------------------
  getOrCreateDonor(fullName: string, email: string, phoneNumber: string, address?: string): DonorProfile {
    const donors = getStored<DonorProfile[]>(STORAGE_KEYS.DONORS, initialDonors);
    const normalizedEmail = email.trim().toLowerCase();
    const existing = donors.find(d => d.email.trim().toLowerCase() === normalizedEmail);

    if (existing) {
      if (fullName && (!existing.fullName || existing.fullName === 'Anonymous')) existing.fullName = fullName;
      if (phoneNumber && !existing.phoneNumber) existing.phoneNumber = phoneNumber;
      if (address && !existing.address) existing.address = address;
      setStored(STORAGE_KEYS.DONORS, donors);
      return existing;
    }

    // Generate next DON-000X
    const nextSeq = donors.length + 1;
    const formattedId = `DON-${String(nextSeq).padStart(4, '0')}`;
    const newDonor: DonorProfile = {
      id: 'd-' + (nextSeq + 10),
      donorId: formattedId,
      fullName: fullName || 'Anonymous Donor',
      email: email,
      phoneNumber: phoneNumber || '',
      address: address || '',
      createdAt: new Date().toISOString()
    };
    donors.push(newDonor);
    setStored(STORAGE_KEYS.DONORS, donors);
    return newDonor;
  },

  getDonors(): DonorProfile[] {
    return getStored<DonorProfile[]>(STORAGE_KEYS.DONORS, initialDonors);
  },

  // ----------------------------------------
  // MONETARY DONATION WORKFLOW
  // ----------------------------------------
  async getMonetaryDonations(): Promise<MonetaryDonation[]> {
    return getStored<MonetaryDonation[]>(STORAGE_KEYS.MONETARY, initialMonetary);
  },

  async submitMonetaryDonation(data: {
    fullName: string;
    contactNumber: string;
    email: string;
    amount: number;
    currency?: 'LKR' | 'USD';
    purpose?: string;
    paymentMethod: 'Bank Transfer' | 'Online Card Payment';
    bankReference?: string;
  }): Promise<MonetaryDonation> {
    const donor = api.getOrCreateDonor(data.fullName, data.email, data.contactNumber);
    const donations = getStored<MonetaryDonation[]>(STORAGE_KEYS.MONETARY, initialMonetary);
    const nextRefNumber = 1000 + donations.length + 1;
    const ref = `REQ-MON-${nextRefNumber}`;

    const isBank = data.paymentMethod === 'Bank Transfer';
    const status = isBank ? 'Payment Verification' : 'Confirmed';

    const newDonation: MonetaryDonation = {
      id: 'mon-' + (donations.length + 1),
      donationReference: ref,
      donorId: donor.donorId,
      donorName: data.fullName,
      email: data.email,
      contactNumber: data.contactNumber,
      amount: data.amount,
      currency: data.currency || 'LKR',
      purpose: data.purpose || 'General Emergency Disaster Relief',
      paymentMethod: data.paymentMethod,
      bankReference: isBank ? data.bankReference : undefined,
      paymentGatewayStatus: isBank ? 'Pending Verification' : 'Verified',
      status: status,
      submittedAt: new Date().toISOString(),
      verifiedAt: !isBank ? new Date().toISOString() : undefined,
      verifiedBy: !isBank ? 'Online Gateway Protocol' : undefined
    };

    donations.unshift(newDonation);
    setStored(STORAGE_KEYS.MONETARY, donations);

    // Also update existing fallbackDonations and campaign KPIs
    fallbackDonations.unshift({
      id: String(fallbackDonations.length + 1),
      campaignTitle: 'Flood Relief 2024',
      donorName: data.fullName,
      amount: data.amount,
      itemCount: 0,
      flag: '-',
      isSuspicious: false,
      createdAt: new Date().toISOString()
    });
    if (!isBank) {
      fallbackKpis.totalRaisedLkr += data.amount;
    }

    // Trigger Notification to Coordinator
    api.addInAppNotification({
      recipientRole: 'Coordinator',
      type: 'Donation_Submitted',
      title: isBank ? 'New Bank Transfer Pending Verification' : 'New Online Donation Confirmed',
      message: `${data.fullName} (${donor.donorId}) submitted ${data.currency || 'LKR'} ${data.amount.toLocaleString()} via ${data.paymentMethod}. Ref: ${ref}.`,
      referenceId: ref
    });

    return newDonation;
  },

  async verifyMonetaryDonation(donationId: string, isApproved: boolean, rejectionReason?: string): Promise<MonetaryDonation> {
    const donations = getStored<MonetaryDonation[]>(STORAGE_KEYS.MONETARY, initialMonetary);
    const target = donations.find(d => d.id === donationId || d.donationReference === donationId);
    if (!target) throw new Error('Donation not found');

    if (isApproved) {
      target.status = 'Confirmed';
      target.paymentGatewayStatus = 'Verified';
      target.verifiedAt = new Date().toISOString();
      target.verifiedBy = 'Volunteer and Donation Coordinator';
      fallbackKpis.totalRaisedLkr += target.amount;

      api.addInAppNotification({
        recipientRole: 'Officer',
        recipientEmail: target.email,
        type: 'Payment_Verified',
        title: 'Bank Transfer Payment Verified & Confirmed',
        message: `Your payment of ${target.currency} ${target.amount.toLocaleString()} (Ref: ${target.donationReference}) has been verified and confirmed. Thank you for your support!`,
        referenceId: target.donationReference
      });
    } else {
      target.status = 'Rejected';
      target.rejectionReason = rejectionReason || 'Payment verification failed or receipt invalid.';

      api.addInAppNotification({
        recipientRole: 'Officer',
        recipientEmail: target.email,
        type: 'Payment_Rejected',
        title: 'Payment Verification Rejected',
        message: `Payment reference ${target.donationReference} could not be verified. Reason: ${target.rejectionReason}`,
        referenceId: target.donationReference
      });
    }

    setStored(STORAGE_KEYS.MONETARY, donations);
    return target;
  },

  // ----------------------------------------
  // PHYSICAL GOODS DONATION WORKFLOW
  // ----------------------------------------
  async getGoodsDonations(): Promise<GoodsDonationRequest[]> {
    return getStored<GoodsDonationRequest[]>(STORAGE_KEYS.GOODS, initialGoods);
  },

  async submitGoodsDonation(data: {
    fullName: string;
    contactNumber: string;
    email: string;
    address: string;
    notes?: string;
    items: GoodsItem[];
  }): Promise<GoodsDonationRequest> {
    const donor = api.getOrCreateDonor(data.fullName, data.email, data.contactNumber, data.address);
    const requests = getStored<GoodsDonationRequest[]>(STORAGE_KEYS.GOODS, initialGoods);
    const nextRef = `REQ-GDS-${1000 + requests.length + 1}`;

    const newReq: GoodsDonationRequest = {
      id: 'gds-' + (requests.length + 1),
      requestReference: nextRef,
      donorId: donor.donorId,
      donorName: data.fullName,
      email: data.email,
      contactNumber: data.contactNumber,
      address: data.address,
      notes: data.notes || '',
      items: data.items,
      status: 'Pending Approval',
      createdAt: new Date().toISOString()
    };

    requests.unshift(newReq);
    setStored(STORAGE_KEYS.GOODS, requests);

    // Notify Coordinator
    const totalQty = data.items.reduce((acc, curr) => acc + curr.quantity, 0);
    api.addInAppNotification({
      recipientRole: 'Coordinator',
      type: 'Donation_Submitted',
      title: 'New Physical Goods Donation Request',
      message: `${data.fullName} (${donor.donorId}) submitted ${data.items.length} goods categories (${totalQty} total units). Ref: ${nextRef}.`,
      referenceId: nextRef
    });

    return newReq;
  },

  async approveGoodsDonation(
    requestId: string,
    earliestHandoverDate: string,
    latestHandoverDate: string,
    handoverLocation: string,
    availableTimeSlots: string[]
  ): Promise<GoodsDonationRequest> {
    const requests = getStored<GoodsDonationRequest[]>(STORAGE_KEYS.GOODS, initialGoods);
    const req = requests.find(r => r.id === requestId || r.requestReference === requestId);
    if (!req) throw new Error('Goods request not found');

    req.status = 'Approved';
    req.earliestHandoverDate = earliestHandoverDate;
    req.latestHandoverDate = latestHandoverDate;
    req.handoverLocation = handoverLocation;
    req.availableTimeSlots = availableTimeSlots;

    setStored(STORAGE_KEYS.GOODS, requests);

    // Notify Donor
    api.addInAppNotification({
      recipientRole: 'Officer',
      recipientEmail: req.email,
      type: 'Donation_Approved',
      title: 'Goods Donation Request Approved',
      message: `Request ${req.requestReference} is approved! Handover window: ${earliestHandoverDate} to ${latestHandoverDate} at ${handoverLocation}. Please select your handover date.`,
      referenceId: req.requestReference
    });

    return req;
  },

  async rejectGoodsDonation(requestId: string, reason: string): Promise<GoodsDonationRequest> {
    const requests = getStored<GoodsDonationRequest[]>(STORAGE_KEYS.GOODS, initialGoods);
    const req = requests.find(r => r.id === requestId || r.requestReference === requestId);
    if (!req) throw new Error('Goods request not found');

    req.status = 'Rejected';
    req.rejectionReason = reason || 'Request does not meet current relief intake criteria.';

    setStored(STORAGE_KEYS.GOODS, requests);

    // Notify Donor
    api.addInAppNotification({
      recipientRole: 'Officer',
      recipientEmail: req.email,
      type: 'Donation_Rejected',
      title: 'Goods Donation Request Declined',
      message: `Request ${req.requestReference} was declined. Reason: ${req.rejectionReason}`,
      referenceId: req.requestReference
    });

    return req;
  },

  async scheduleGoodsHandover(requestId: string, selectedDate: string, selectedTimeSlot: string): Promise<GoodsDonationRequest> {
    const requests = getStored<GoodsDonationRequest[]>(STORAGE_KEYS.GOODS, initialGoods);
    const req = requests.find(r => r.id === requestId || r.requestReference === requestId);
    if (!req) throw new Error('Goods request not found');

    // Validation: Date must be within approved range
    if (req.earliestHandoverDate && req.latestHandoverDate) {
      if (selectedDate < req.earliestHandoverDate || selectedDate > req.latestHandoverDate) {
        throw new Error(`Selected date must be between ${req.earliestHandoverDate} and ${req.latestHandoverDate}.`);
      }
    }

    req.selectedHandoverDate = selectedDate;
    req.selectedTimeSlot = selectedTimeSlot;
    req.handoverConfirmedAt = new Date().toISOString();
    req.status = 'Handover Scheduled';

    setStored(STORAGE_KEYS.GOODS, requests);

    // Notify Coordinator
    api.addInAppNotification({
      recipientRole: 'Coordinator',
      type: 'Donation_Handover_Scheduled',
      title: 'Donor Confirmed Handover Date',
      message: `${req.donorName} scheduled handover for ${req.requestReference} on ${selectedDate} (${selectedTimeSlot}) at ${req.handoverLocation}.`,
      referenceId: req.requestReference
    });

    return req;
  },

  async confirmGoodsReceived(requestId: string, officerName?: string): Promise<GoodsDonationRequest> {
    const requests = getStored<GoodsDonationRequest[]>(STORAGE_KEYS.GOODS, initialGoods);
    const req = requests.find(r => r.id === requestId || r.requestReference === requestId);
    if (!req) throw new Error('Goods request not found');

    req.status = 'Received';
    req.receivedAt = new Date().toISOString();
    req.receivedBy = officerName || 'Volunteer and Donation Coordinator';

    setStored(STORAGE_KEYS.GOODS, requests);

    // Update campaign metrics
    const totalItems = req.items.reduce((sum, item) => sum + item.quantity, 0);
    fallbackKpis.totalSuppliesAndItemsCount += totalItems;

    // Notify Donor
    api.addInAppNotification({
      recipientRole: 'Officer',
      recipientEmail: req.email,
      type: 'Donation_Received',
      title: 'Goods Successfully Handed Over & Received',
      message: `Relief items for ${req.requestReference} were verified and formally received into inventory at ${req.handoverLocation}.`,
      referenceId: req.requestReference
    });

    return req;
  },

  // ----------------------------------------
  // VOLUNTEER REGISTRATION & UNIQUE VOL ID
  // ----------------------------------------
  getOrCreateVolunteer(fullName: string, email: string, phoneNumber: string, address?: string): { volunteerId: string } {
    const registrations = getStored<VolunteerRegistration[]>(STORAGE_KEYS.VOL_REGISTRATIONS, initialVolRegistrations);
    const normalizedEmail = email.trim().toLowerCase();
    const existing = registrations.find(v => v.email.trim().toLowerCase() === normalizedEmail);

    if (existing) {
      return { volunteerId: existing.volunteerId };
    }

    const nextSeq = registrations.length + 1;
    return { volunteerId: `VOL-${String(nextSeq).padStart(4, '0')}` };
  },

  async getVolunteerRegistrations(): Promise<VolunteerRegistration[]> {
    return getStored<VolunteerRegistration[]>(STORAGE_KEYS.VOL_REGISTRATIONS, initialVolRegistrations);
  },

  async submitVolunteerRegistration(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    preferredLocations: string[];
    preferredDates: string[];
    availableStartTime: string;
    availableEndTime: string;
    preferredDaysOfWeek: string[];
    activityTypes: string[];
    skills: string;
    additionalNotes?: string;
  }): Promise<VolunteerRegistration> {
    // Validate time range
    if (data.availableStartTime && data.availableEndTime) {
      if (data.availableStartTime >= data.availableEndTime) {
        throw new Error('Available end time must be later than start time.');
      }
    }

    const { volunteerId } = api.getOrCreateVolunteer(data.fullName, data.email, data.phoneNumber, data.address);
    const registrations = getStored<VolunteerRegistration[]>(STORAGE_KEYS.VOL_REGISTRATIONS, initialVolRegistrations);
    const nextRef = `REG-VOL-${1000 + registrations.length + 1}`;

    const newReg: VolunteerRegistration = {
      id: 'vr-' + (registrations.length + 1),
      volunteerId: volunteerId,
      registrationReference: nextRef,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      address: data.address,
      preferredLocations: data.preferredLocations,
      preferredDates: data.preferredDates,
      availableStartTime: data.availableStartTime,
      availableEndTime: data.availableEndTime,
      preferredDaysOfWeek: data.preferredDaysOfWeek,
      activityTypes: data.activityTypes,
      skills: data.skills,
      additionalNotes: data.additionalNotes,
      status: 'Pending Approval',
      totalHours: 0,
      createdAt: new Date().toISOString()
    };

    registrations.unshift(newReg);
    setStored(STORAGE_KEYS.VOL_REGISTRATIONS, registrations);

    // Also register in fallbackVolunteers if not present
    if (!fallbackVolunteers.some(v => v.email.toLowerCase() === data.email.toLowerCase())) {
      fallbackVolunteers.push({
        id: 'vol-' + (fallbackVolunteers.length + 1),
        volunteerId: volunteerId,
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        skills: data.skills,
        status: 'Available',
        totalHours: 0,
        createdAt: new Date().toISOString(),
        weeklyAvailability: data.preferredDaysOfWeek
      });
    }

    // Notify Coordinator
    api.addInAppNotification({
      recipientRole: 'Coordinator',
      type: 'Volunteer_Submitted',
      title: 'New Volunteer Application Submitted',
      message: `${data.fullName} registered with ID ${volunteerId} for ${data.activityTypes.join(', ')}. Ref: ${nextRef}.`,
      referenceId: nextRef
    });

    return newReg;
  },

  async approveVolunteerRegistration(registrationId: string): Promise<VolunteerRegistration> {
    const registrations = getStored<VolunteerRegistration[]>(STORAGE_KEYS.VOL_REGISTRATIONS, initialVolRegistrations);
    const reg = registrations.find(r => r.id === registrationId || r.registrationReference === registrationId);
    if (!reg) throw new Error('Registration not found');

    reg.status = 'Approved';
    setStored(STORAGE_KEYS.VOL_REGISTRATIONS, registrations);

    // Update roster status
    const vol = fallbackVolunteers.find(v => v.email.toLowerCase() === reg.email.toLowerCase());
    if (vol) vol.status = 'Available';

    // Notify Volunteer
    api.addInAppNotification({
      recipientRole: 'Officer',
      recipientEmail: reg.email,
      type: 'Volunteer_Approved',
      title: 'Volunteer Registration Approved',
      message: `Congratulations ${reg.fullName}! Your volunteer profile (${reg.volunteerId}) is approved. You will now be scheduled for relief operations.`,
      referenceId: reg.registrationReference
    });

    return reg;
  },

  async rejectVolunteerRegistration(registrationId: string, reason: string): Promise<VolunteerRegistration> {
    const registrations = getStored<VolunteerRegistration[]>(STORAGE_KEYS.VOL_REGISTRATIONS, initialVolRegistrations);
    const reg = registrations.find(r => r.id === registrationId || r.registrationReference === registrationId);
    if (!reg) throw new Error('Registration not found');

    reg.status = 'Rejected';
    reg.rejectionReason = reason || 'Application does not meet current requirements.';
    setStored(STORAGE_KEYS.VOL_REGISTRATIONS, registrations);

    // Notify Volunteer
    api.addInAppNotification({
      recipientRole: 'Officer',
      recipientEmail: reg.email,
      type: 'Volunteer_Rejected',
      title: 'Volunteer Application Decision',
      message: `Application ${reg.registrationReference} was not approved at this time. Reason: ${reg.rejectionReason}`,
      referenceId: reg.registrationReference
    });

    return reg;
  },

  // ----------------------------------------
  // VOLUNTEER SCHEDULE MANAGEMENT
  // ----------------------------------------
  async getVolunteerSchedules(): Promise<VolunteerSchedule[]> {
    return getStored<VolunteerSchedule[]>(STORAGE_KEYS.VOL_SCHEDULES, initialSchedules);
  },

  async createVolunteerSchedule(schedule: {
    volunteerId: string;
    volunteerName: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    activity: string;
  }): Promise<{ schedule: VolunteerSchedule; hasConflictWarning?: boolean }> {
    // Validate end time > start time
    if (schedule.startTime >= schedule.endTime) {
      throw new Error('Shift end time must be later than start time.');
    }

    const schedules = getStored<VolunteerSchedule[]>(STORAGE_KEYS.VOL_SCHEDULES, initialSchedules);

    // Conflict detection: Same volunteer, same date, overlapping time window
    const hasOverlap = schedules.some(s =>
      s.volunteerId === schedule.volunteerId &&
      s.date === schedule.date &&
      s.status !== 'Cancelled' &&
      ((schedule.startTime >= s.startTime && schedule.startTime < s.endTime) ||
       (schedule.endTime > s.startTime && schedule.endTime <= s.endTime) ||
       (schedule.startTime <= s.startTime && schedule.endTime >= s.endTime))
    );

    const newSchedule: VolunteerSchedule = {
      id: 'sch-' + (schedules.length + 1),
      volunteerId: schedule.volunteerId,
      volunteerName: schedule.volunteerName,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location,
      activity: schedule.activity,
      status: 'Approved',
      createdAt: new Date().toISOString()
    };

    schedules.push(newSchedule);
    setStored(STORAGE_KEYS.VOL_SCHEDULES, schedules);

    // Notify Volunteer
    api.addInAppNotification({
      recipientRole: 'Officer',
      type: 'Volunteer_Scheduled',
      title: 'New Volunteering Shift Assigned',
      message: `Volunteer ${schedule.volunteerName} (${schedule.volunteerId}) assigned to "${schedule.activity}" at ${schedule.location} on ${schedule.date} (${schedule.startTime} - ${schedule.endTime}).`,
      referenceId: newSchedule.id
    });

    return {
      schedule: newSchedule,
      hasConflictWarning: hasOverlap
    };
  },

  async cancelVolunteerSchedule(scheduleId: string): Promise<boolean> {
    const schedules = getStored<VolunteerSchedule[]>(STORAGE_KEYS.VOL_SCHEDULES, initialSchedules);
    const target = schedules.find(s => s.id === scheduleId);
    if (target) {
      target.status = 'Cancelled';
      setStored(STORAGE_KEYS.VOL_SCHEDULES, schedules);
      return true;
    }
    return false;
  },

  // ----------------------------------------
  // IN-APP NOTIFICATIONS & DISPATCH
  // ----------------------------------------
  async getInAppNotifications(role?: 'Coordinator' | 'Officer' | 'All'): Promise<InAppNotification[]> {
    const list = getStored<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    if (!role || role === 'All') return list;
    return list.filter(n => n.recipientRole === role || n.recipientRole === 'All');
  },

  addInAppNotification(notif: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>): InAppNotification {
    const list = getStored<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const created: InAppNotification = {
      ...notif,
      id: 'notif-' + (list.length + 1) + '-' + Date.now(),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    list.unshift(created);
    setStored(STORAGE_KEYS.NOTIFICATIONS, list);
    return created;
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const list = getStored<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const target = list.find(n => n.id === id);
    if (target) {
      target.isRead = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, list);
      return true;
    }
    return false;
  },

  // ----------------------------------------
  // PRESERVED MEMBER 6 SERVICES & APIS
  // ----------------------------------------
  async getCampaignKpis(): Promise<CampaignKpis> {
    try {
      const res = await fetch(`${API_BASE}/campaigns/kpis`);
      if (res.ok) return await res.json();
    } catch {}
    return fallbackKpis;
  },

  async getDonations(): Promise<Donation[]> {
    try {
      const res = await fetch(`${API_BASE}/donations`);
      if (res.ok) return await res.json();
    } catch {}
    return fallbackDonations;
  },

  async recordDonation(donation: {
    donorName: string;
    amount: number;
    itemCount?: number;
    flag?: string;
  }): Promise<Donation> {
    try {
      const res = await fetch(`${API_BASE}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donation)
      });
      if (res.ok) return await res.json();
    } catch {}

    const newDonation: Donation = {
      id: String(fallbackDonations.length + 1),
      campaignTitle: 'Flood Relief 2024',
      donorName: donation.donorName,
      amount: donation.amount,
      itemCount: donation.itemCount || 0,
      flag: donation.flag || '-',
      isSuspicious: false,
      createdAt: new Date().toISOString()
    };
    fallbackDonations.unshift(newDonation);
    fallbackKpis.totalRaisedLkr += donation.amount;
    fallbackKpis.totalSuppliesAndItemsCount += (donation.itemCount || 0);
    return newDonation;
  },

  async getVolunteers(): Promise<Volunteer[]> {
    try {
      const res = await fetch(`${API_BASE}/volunteers`);
      if (res.ok) return await res.json();
    } catch {}
    return fallbackVolunteers;
  },

  async getTaskMatchingRecommendation(): Promise<TaskMatchingRecommendation> {
    try {
      const res = await fetch(`${API_BASE}/volunteers/task-matching`);
      if (res.ok) return await res.json();
    } catch {}
    return fallbackRecommendation;
  },

  async assignVolunteerToTask(taskId: string, volunteerId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/volunteers/assign-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, volunteerId })
      });
      if (res.ok) return true;
    } catch {}
    const vol = fallbackVolunteers.find(v => v.id === volunteerId);
    if (vol) vol.status = 'On Task';
    return true;
  },

  async registerVolunteer(volunteer: {
    fullName: string;
    email: string;
    phoneNumber: string;
    skills: string;
  }): Promise<Volunteer> {
    try {
      const res = await fetch(`${API_BASE}/volunteers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volunteer)
      });
      if (res.ok) return await res.json();
    } catch {}

    const newVol: Volunteer = {
      id: 'vol-' + (fallbackVolunteers.length + 1),
      fullName: volunteer.fullName,
      email: volunteer.email,
      phoneNumber: volunteer.phoneNumber,
      skills: volunteer.skills,
      status: 'Available',
      totalHours: 0,
      createdAt: new Date().toISOString(),
      weeklyAvailability: ['Mon', 'Wed', 'Fri']
    };
    fallbackVolunteers.push(newVol);
    return newVol;
  },

  async sendNotification(req: {
    recipient: string;
    channel: string;
    subject: string;
    body: string;
    idempotencyKey?: string;
  }): Promise<NotificationResult> {
    try {
      const res = await fetch(`${API_BASE}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (res.ok) return await res.json();
    } catch {}

    return {
      isSuccess: true,
      messageId: 'MSG-' + Math.floor(100000 + Math.random() * 900000),
      channelUsed: req.channel,
      recipient: req.recipient,
      wasDuplicateSuppressed: false,
      dispatchedAt: new Date().toISOString()
    };
  },

  async getNotificationHistory(): Promise<NotificationRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/notifications/history`);
      if (res.ok) return await res.json();
    } catch {}
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
  },

  // Admin User Management (edit, delete, restore)
  async editUser(id: string, updates: { fullName?: string; email?: string; phoneNumber?: string; role?: string }): Promise<User> {
    const user = MOCK_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      const conflict = MOCK_USERS.find(u => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase());
      if (conflict) throw new Error('A user with this email already exists.');
    }
    if (updates.fullName !== undefined) user.fullName = updates.fullName;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.phoneNumber !== undefined) user.phoneNumber = updates.phoneNumber;
    if (updates.role !== undefined) user.role = updates.role;
    return { ...user };
  },

  async deleteUser(id: string, deletedBy: string): Promise<boolean> {
    const user = MOCK_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    if (user.isDeleted) throw new Error('User is already deleted');
    const activeAdmins = MOCK_USERS.filter(u => u.role === 'SystemAdmin' && !u.isDeleted && u.isActive);
    if (user.role === 'SystemAdmin' && activeAdmins.length <= 1) {
      throw new Error('Cannot delete the last active System Administrator.');
    }
    user.isActive = false;
    user.isDeleted = true;
    user.deletedAt = new Date().toISOString();
    user.deletedBy = deletedBy;
    const existing: DeletedUserRecord[] = JSON.parse(localStorage.getItem(DELETED_USERS_KEY) || '[]');
    const record: DeletedUserRecord = {
      id: 'del-' + Date.now(),
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
      deletedAt: user.deletedAt!,
      deletedBy: deletedBy,
      restorationStatus: 'Deleted'
    };
    existing.push(record);
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(existing));
    return true;
  },

  async restoreUser(id: string, restoredBy: string): Promise<User> {
    const user = MOCK_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    if (!user.isDeleted) throw new Error('User is not deleted');
    const conflict = MOCK_USERS.find(u => u.id !== id && !u.isDeleted && u.email.toLowerCase() === user.email.toLowerCase());
    if (conflict) throw new Error('Cannot restore: another active user already has this email address.');
    user.isActive = true;
    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedBy = null;
    const existing: DeletedUserRecord[] = JSON.parse(localStorage.getItem(DELETED_USERS_KEY) || '[]');
    const record = existing.filter(r => r.userId === id).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))[0];
    if (record) {
      record.restorationStatus = 'Restored';
      record.restoredAt = new Date().toISOString();
      record.restoredBy = restoredBy;
      localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(existing));
    }
    return { ...user };
  },

  async getDeletedUsers(): Promise<DeletedUserRecord[]> {
    const stored: DeletedUserRecord[] = JSON.parse(localStorage.getItem(DELETED_USERS_KEY) || '[]');
    const inMemoryDeleted = MOCK_USERS.filter(u => u.isDeleted);
    for (const u of inMemoryDeleted) {
      const inStore = stored.some(r => r.userId === u.id && r.restorationStatus === 'Deleted');
      if (!inStore) {
        stored.push({
          id: 'del-mem-' + u.id,
          userId: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          organizationName: u.organizationName,
          deletedAt: u.deletedAt || new Date().toISOString(),
          deletedBy: u.deletedBy || 'System',
          restorationStatus: 'Deleted'
        });
      }
    }
    return stored;
  }
};
