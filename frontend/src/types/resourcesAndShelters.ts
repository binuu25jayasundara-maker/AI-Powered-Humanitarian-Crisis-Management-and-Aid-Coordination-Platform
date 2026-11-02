// ─── ResQnet.AI — Resources, Shelters & Maps TypeScript Definitions ───────────────

// Resources & Logistics
export interface Resource {
  id: number;
  name: string;
  category: string; // "Water" | "Food Packs" | "Medicine Kits" | "First Aid Kits" | "Essential Supplies"
  availableQuantity: number;
  allocatedQuantity: number;
  minimumStockLevel: number;
  unit: string;
  status: 'Normal' | 'Warning' | 'Critical';
  updatedAt: string;
}

export interface ResourceSummary {
  totalWaterAvailable: number;
  totalWaterAllocated: number;
  waterStatus: string;
  totalFoodPacksAvailable: number;
  totalFoodPacksAllocated: number;
  foodPacksStatus: string;
  totalMedicineKitsAvailable: number;
  totalMedicineKitsAllocated: number;
  medicineKitsStatus: string;
  totalItemsCount: number;
  criticalStockCount: number;
  warningStockCount: number;
  normalStockCount: number;
}

export interface ShortageAlert {
  resourceId: number;
  resourceName: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortageAmount: number;
  affectedShelterOrRequest: string;
  priority: string;
  suggestedResolution: string;
}

export interface ResourceAllocation {
  id: number;
  resourceId: number;
  resourceName?: string;
  resourceCategory?: string;
  unit?: string;
  destinationType: string;
  destinationShelterId?: number;
  destinationShelterName?: string;
  destinationName?: string;
  emergencyRequestId?: string;
  quantity: number;
  allocatedBy?: string;
  notes?: string;
  status: string;
  allocatedAt?: string;
}

export interface CreateAllocationDto {
  resourceId: number;
  destinationType: string;
  destinationShelterId?: number;
  destinationShelterName?: string;
  emergencyRequestId?: string;
  quantity: number;
  allocatedBy?: string;
  notes?: string;
}

export interface PartnerSupportRequest {
  id: number;
  requiredResource: string;
  quantityRequired: number;
  requestingLocation: string;
  priority: string;
  reason: string;
  status: string;
  partnerOrganization?: string;
  createdAt: string;
}

export interface CreatePartnerSupportRequestDto {
  requiredResource: string;
  quantityRequired: number;
  requestingLocation: string;
  priority: string;
  reason: string;
  partnerOrganization?: string;
}

// Shelters
export interface Shelter {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  totalCapacity: number;
  currentOccupancy: number;
  availableSpaces: number;
  occupancyPercentage: number;
  operationalStatus: 'Open' | 'Almost Full' | 'Full' | 'Closed';
  facilities: string[];
  contactPerson: string;
  contactPhone: string;
  lastUpdated: string;
}

export interface ShelterCapacity {
  shelterId: number;
  shelterName: string;
  totalCapacity: number;
  currentOccupancy: number;
  availableSpaces: number;
  occupancyPercentage: number;
  status: string;
}

export interface NearbyShelter extends Shelter {
  distanceKm: number;
  estimatedTravelMinutes: number;
}

export interface HouseholdAllocation {
  id: number;
  shelterId: number;
  shelterName: string;
  householdHeadName: string;
  caseReferenceId?: string;
  numberOfPeople: number;
  specialNeeds: string;
  allocatedBy: string;
  status: string;
  allocatedAt: string;
}

export interface CreateHouseholdAllocationDto {
  shelterId: number;
  householdHeadName: string;
  caseReferenceId?: string;
  numberOfPeople: number;
  specialNeeds?: string;
  allocatedBy?: string;
}

export interface ShelterSupplyRequest {
  id: number;
  shelterId: number;
  shelterName: string;
  requestedResource: string;
  quantity: number;
  priority: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface CreateShelterSupplyRequestDto {
  shelterId: number;
  requestedResource: string;
  quantity: number;
  priority: string;
  reason: string;
}

// Map & Operational
export interface EmergencyRequest {
  id: number;
  requestIdentifier: string;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  priority: string;
  currentStatus: string;
  peopleCount: number;
  description: string;
  reportedAt: string;
}

export interface FloodZone {
  id: number;
  zoneName: string;
  severityLevel: string;
  waterLevelTrend: string;
  estimatedAffectedPopulation: number;
  evacuationStatus: string;
  polygonCoordinatesJson: string;
  centerLatitude: number;
  centerLongitude: number;
  lastUpdated: string;
}

export interface OperationalCoverage {
  totalShelters: number;
  openShelters: number;
  sheltersNearingCapacity: number;
  sheltersFull: number;
  activeEmergencyRequests: number;
  criticalRequestsCount: number;
  floodZonesActiveCount: number;
  totalEvacueesSheltered: number;
  totalShelterCapacity: number;
  overallCapacityUsagePercent: number;
}

export interface RouteResult {
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number;
  travelTimeMinutes: number;
  routeSummary: string;
  navigationUrl: string;
  waypoints: [number, number][];
}
