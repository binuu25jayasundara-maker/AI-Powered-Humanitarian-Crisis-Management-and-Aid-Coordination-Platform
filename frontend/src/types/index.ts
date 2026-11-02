export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  organizationId?: string | null;
  organizationName?: string | null;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface DeletedUserRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  organizationName?: string | null;
  deletedAt: string;
  deletedBy: string;
  restorationStatus: 'Deleted' | 'Restored';
  restoredAt?: string | null;
  restoredBy?: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  isVerified: boolean;
  memberCount: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

export interface Permission {
  id: string;
  code: string;
  description: string;
  category: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityName: string;
  entityId?: string | null;
  detailsJson: string;
  ipAddress?: string | null;
  status: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}
// Member 6: Volunteers, Donors, Campaigns & Communication Services Types

export interface DonorProfile {
  id: string;
  donorId: string; // e.g. DON-0001
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  createdAt: string;
}

export type MonetaryPaymentMethod = 'Bank Transfer' | 'Online Card Payment';
export type MonetaryDonationStatus = 'Pending' | 'Payment Verification' | 'Confirmed' | 'Rejected' | 'Cancelled';

export interface MonetaryDonation {
  id: string;
  donationReference: string; // e.g. REQ-MON-1001
  donorId: string; // DON-0001
  donorName: string;
  email: string;
  contactNumber: string;
  amount: number;
  currency: 'LKR' | 'USD';
  purpose?: string;
  paymentMethod: MonetaryPaymentMethod;
  bankReference?: string; // For bank transfer
  paymentGatewayStatus?: 'Pending Verification' | 'Verified' | 'Failed' | 'Unverified';
  status: MonetaryDonationStatus;
  rejectionReason?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export type GoodsCategory =
  | 'Food and water'
  | 'Clothing'
  | 'Medical supplies'
  | 'Hygiene products'
  | 'Household items'
  | 'Educational supplies'
  | 'Other essential goods';

export type GoodsCondition = 'New' | 'Like New' | 'Gently Used';

export interface GoodsItem {
  id: string;
  category: GoodsCategory;
  itemName: string;
  quantity: number;
  unit: string; // kg, units, boxes, packs, liters, pairs
  condition: GoodsCondition;
  notes?: string;
}

export type GoodsDonationStatus =
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Handover Scheduled'
  | 'Received';

export interface GoodsDonationRequest {
  id: string;
  requestReference: string; // e.g. REQ-GDS-1001
  donorId: string; // DON-0001
  donorName: string;
  email: string;
  contactNumber: string;
  address: string;
  notes?: string;
  items: GoodsItem[];
  status: GoodsDonationStatus;
  rejectionReason?: string;
  earliestHandoverDate?: string;
  latestHandoverDate?: string;
  handoverLocation?: string;
  availableTimeSlots?: string[];
  selectedHandoverDate?: string;
  selectedTimeSlot?: string;
  handoverConfirmedAt?: string;
  receivedAt?: string;
  receivedBy?: string;
  createdAt: string;
}

export type VolunteerRegistrationStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Inactive';

export interface VolunteerRegistration {
  id: string;
  volunteerId: string; // e.g. VOL-0001
  registrationReference: string; // e.g. REG-VOL-1001
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
  status: VolunteerRegistrationStatus;
  rejectionReason?: string;
  totalHours: number;
  createdAt: string;
}

export interface VolunteerSchedule {
  id: string;
  volunteerId: string; // e.g. VOL-0001
  volunteerName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. 09:00 AM
  endTime: string; // e.g. 12:00 PM
  location: string;
  activity: string;
  status: 'Approved' | 'Confirmed' | 'Cancelled' | 'Completed';
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  recipientRole: 'Coordinator' | 'Officer' | 'All';
  recipientEmail?: string;
  type:
    | 'Donation_Submitted'
    | 'Donation_Approved'
    | 'Donation_Rejected'
    | 'Donation_Handover_Scheduled'
    | 'Donation_Received'
    | 'Payment_Verified'
    | 'Payment_Rejected'
    | 'Volunteer_Submitted'
    | 'Volunteer_Approved'
    | 'Volunteer_Rejected'
    | 'Volunteer_Scheduled';
  title: string;
  message: string;
  referenceId?: string;
  timestamp: string;
  isRead: boolean;
}

// Existing Member 6 Types preserved for backward compatibility
export interface Volunteer {
  id: string;
  volunteerId?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  skills: string;
  status: 'Available' | 'On Task' | 'On Leave' | string;
  totalHours: number;
  createdAt: string;
  weeklyAvailability: string[];
}

export interface VolunteerTask {
  id: string;
  title: string;
  category: string;
  location: string;
  requiredSkill: string;
  status: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  matchScorePercent: number;
  createdAt: string;
}

export interface TaskMatchingRecommendation {
  taskId: string;
  taskTitle: string;
  category: string;
  location: string;
  requiredSkill: string;
  candidateVolunteerId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateSkills: string;
  matchScorePercent: number;
  matchRationale: string;
}

export interface Campaign {
  id: string;
  title: string;
  goalAmount: number;
  raisedAmount: number;
  progressPercent: number;
  medicalItemsCount: number;
  disposalFlagCount: number;
  foodAllocationPercent: number;
  medicalAllocationPercent: number;
  shelterAllocationPercent: number;
  status: string;
  createdAt: string;
}

export interface CampaignKpis {
  totalRaisedLkr: number;
  totalGoalLkr: number;
  overallProgressPercent: number;
  totalSuppliesAndItemsCount: number;
  activeWasteFlagsCount: number;
  activeCampaign: Campaign;
}

export interface Donation {
  id: string;
  campaignId?: string;
  campaignTitle: string;
  donorName: string;
  amount: number;
  itemCount: number;
  flag: string;
  isSuspicious: boolean;
  paymentReference?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  recipient: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  retryCount: number;
  sentAt: string;
}

export interface NotificationResult {
  isSuccess: boolean;
  messageId: string;
  channelUsed: string;
  recipient: string;
  errorMessage?: string;
  wasDuplicateSuppressed: boolean;
  dispatchedAt: string;
}

// Member 3 Coordination & Governance Module Types
export * from './coordination';



// Re-export Resources, Shelters & Maps types (with Shelter alias to avoid collision with coordination.ts Shelter)
export type {
  Resource, ResourceSummary, ShortageAlert, ResourceAllocation,
  CreateAllocationDto, PartnerSupportRequest, CreatePartnerSupportRequestDto,
  ShelterCapacity, NearbyShelter, HouseholdAllocation,
  CreateHouseholdAllocationDto, ShelterSupplyRequest, CreateShelterSupplyRequestDto,
  EmergencyRequest, FloodZone, OperationalCoverage, RouteResult
} from './resourcesAndShelters';
export type { Shelter as ShelterFacility } from './resourcesAndShelters';
