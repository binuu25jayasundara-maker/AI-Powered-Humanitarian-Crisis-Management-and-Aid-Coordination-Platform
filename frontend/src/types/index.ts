export interface Volunteer {
  id: string;
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
  flag: string; // '-', 'Urgent', 'Disposal'
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
