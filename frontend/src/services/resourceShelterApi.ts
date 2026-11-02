import type {
  Resource, ResourceSummary, ShortageAlert, ResourceAllocation,
  CreateAllocationDto, PartnerSupportRequest, CreatePartnerSupportRequestDto,
  Shelter, NearbyShelter, ShelterCapacity, HouseholdAllocation,
  CreateHouseholdAllocationDto, ShelterSupplyRequest, CreateShelterSupplyRequestDto,
  EmergencyRequest, FloodZone, OperationalCoverage, RouteResult,
} from '../types/resourcesAndShelters';

const BASE_URL = 'http://localhost:5100/api';

// ─── Default In-Memory Mock State (Fallback if backend is offline) ────────────
let MOCK_RESOURCES: Resource[] = [
  { id: 1, name: 'Bottled Drinking Water (5L)', category: 'Water', availableQuantity: 12400, allocatedQuantity: 3200, minimumStockLevel: 2500, unit: 'Liters', status: 'Normal', updatedAt: new Date().toISOString() },
  { id: 2, name: 'Family Food Ration Packs', category: 'Food Packs', availableQuantity: 3200, allocatedQuantity: 1100, minimumStockLevel: 800, unit: 'Packs', status: 'Normal', updatedAt: new Date().toISOString() },
  { id: 3, name: 'Emergency Medicine Kits', category: 'Medicine Kits', availableQuantity: 310, allocatedQuantity: 95, minimumStockLevel: 400, unit: 'Kits', status: 'Warning', updatedAt: new Date().toISOString() },
  { id: 4, name: 'First Aid Trauma Kits', category: 'First Aid Kits', availableQuantity: 180, allocatedQuantity: 65, minimumStockLevel: 100, unit: 'Kits', status: 'Normal', updatedAt: new Date().toISOString() },
  { id: 5, name: 'Purification Tablets (Box of 100)', category: 'Water', availableQuantity: 850, allocatedQuantity: 400, minimumStockLevel: 300, unit: 'Boxes', status: 'Normal', updatedAt: new Date().toISOString() },
  { id: 6, name: 'Infant Nutrition Formula', category: 'Food Packs', availableQuantity: 85, allocatedQuantity: 60, minimumStockLevel: 150, unit: 'Tins', status: 'Critical', updatedAt: new Date().toISOString() },
  { id: 7, name: 'Emergency Blankets & Tarpaulins', category: 'Essential Supplies', availableQuantity: 1450, allocatedQuantity: 620, minimumStockLevel: 500, unit: 'Sets', status: 'Normal', updatedAt: new Date().toISOString() },
];

let MOCK_ALLOCATIONS: ResourceAllocation[] = [
  { id: 1, resourceId: 1, resourceName: 'Bottled Drinking Water (5L)', resourceCategory: 'Water', destinationType: 'Shelter', destinationShelterId: 1, destinationShelterName: 'Kelaniya Maha Vidyalaya Center', destinationName: 'Kelaniya Maha Vidyalaya Center', quantity: 1200, allocatedBy: 'Chaminda Silva', notes: 'Initial intake water supply', status: 'Fulfilled', allocatedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 2, resourceId: 2, resourceName: 'Family Food Ration Packs', resourceCategory: 'Food Packs', destinationType: 'Shelter', destinationShelterId: 2, destinationShelterName: 'Biyagama Community Hall', destinationName: 'Biyagama Community Hall', quantity: 450, allocatedBy: 'Nadeesha Perera', notes: 'Evening meal packs', status: 'Fulfilled', allocatedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 3, resourceId: 3, resourceName: 'Emergency Medicine Kits', resourceCategory: 'Medicine Kits', destinationType: 'EmergencyRequest', emergencyRequestId: 'RQ-2041', destinationName: 'Emergency Request RQ-2041', quantity: 25, allocatedBy: 'Chaminda Silva', notes: 'Flood surge medical kit dispatch', status: 'Fulfilled', allocatedAt: new Date(Date.now() - 1800000).toISOString() },
];

let MOCK_SHELTERS: Shelter[] = [
  { id: 1, name: 'Kelaniya Maha Vidyalaya Center', location: 'Kelaniya, Gampaha District', latitude: 6.9538, longitude: 79.9167, totalCapacity: 450, currentOccupancy: 369, availableSpaces: 81, occupancyPercentage: 82, operationalStatus: 'Open', facilities: ['Accessibility', 'Meals', 'Medical Assistance', 'Drinking Water', 'Sanitation'], contactPerson: 'Sunil Wickramasinghe', contactPhone: '+94 77 123 4567', lastUpdated: new Date().toISOString() },
  { id: 2, name: 'Biyagama Community Hall', location: 'Biyagama South', latitude: 6.9421, longitude: 79.9482, totalCapacity: 300, currentOccupancy: 192, availableSpaces: 108, occupancyPercentage: 64, operationalStatus: 'Open', facilities: ['Meals', 'Medical Assistance', 'Sanitation'], contactPerson: 'Malini Perera', contactPhone: '+94 71 234 5678', lastUpdated: new Date().toISOString() },
  { id: 3, name: 'Kaduwela Town Hall Center', location: 'Kaduwela Junction', latitude: 6.9344, longitude: 79.9839, totalCapacity: 250, currentOccupancy: 245, availableSpaces: 5, occupancyPercentage: 98, operationalStatus: 'Almost Full', facilities: ['Accessibility', 'Meals', 'Drinking Water'], contactPerson: 'Ruwan Jayasuriya', contactPhone: '+94 76 345 6789', lastUpdated: new Date().toISOString() },
  { id: 4, name: 'Wellampitiya Youth Club', location: 'Wellampitiya', latitude: 6.9481, longitude: 79.8894, totalCapacity: 180, currentOccupancy: 180, availableSpaces: 0, occupancyPercentage: 100, operationalStatus: 'Full', facilities: ['Meals', 'Sanitation'], contactPerson: 'Ananda Silva', contactPhone: '+94 70 456 7890', lastUpdated: new Date().toISOString() },
  { id: 5, name: 'Peliyagoda Central College', location: 'Peliyagoda', latitude: 6.9688, longitude: 79.8972, totalCapacity: 350, currentOccupancy: 110, availableSpaces: 240, occupancyPercentage: 31, operationalStatus: 'Open', facilities: ['Accessibility', 'Meals', 'Medical Assistance', 'Drinking Water', 'Sanitation'], contactPerson: 'Kanthi Rajapaksha', contactPhone: '+94 72 567 8901', lastUpdated: new Date().toISOString() },
];

let MOCK_SUPPORT_REQUESTS: PartnerSupportRequest[] = [
  { id: 1, requiredResource: 'Ambulance Units & Emergency Paramedics', quantityRequired: 3, requestingLocation: 'Kelaniya Basin Flood Zone', priority: 'High', reason: 'High flood water preventing regular transport for 8 stranded dialysis patients.', status: 'Pending', partnerOrganization: 'Sri Lanka Red Cross Society', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: 2, requiredResource: 'Clean Drinking Water Tankers (10,000L)', quantityRequired: 2, requestingLocation: 'Biyagama Community Hall Shelter', priority: 'High', reason: 'Municipal water supply contaminated by river flood surge.', status: 'Accepted', partnerOrganization: 'National Water Supply & Drainage Board', createdAt: new Date(Date.now() - 3600000 * 6).toISOString() },
];

let MOCK_SUPPLY_REQUESTS: ShelterSupplyRequest[] = [
  { id: 1, shelterId: 1, shelterName: 'Kelaniya Maha Vidyalaya Center', requestedResource: 'Family Food Ration Packs', quantity: 200, priority: 'High', reason: 'Evening influx of 45 newly evacuated families from river bank.', status: 'Pending', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 2, shelterId: 2, shelterName: 'Biyagama Community Hall', requestedResource: 'Infant Nutrition Formula', quantity: 40, priority: 'Critical', reason: '8 infants among evacuees requiring immediate formula feed.', status: 'Approved', createdAt: new Date(Date.now() - 10800000).toISOString() },
];

const MOCK_EMERGENCIES: EmergencyRequest[] = [
  { id: 1, requestIdentifier: 'RQ-2041', category: 'Medical & Evacuation', location: 'Kelaniya River Road, Pilapitiya', latitude: 6.9585, longitude: 79.9122, priority: 'Critical', currentStatus: 'Responder Assigned', peopleCount: 5, description: 'Elderly patient with insulin requirement trapped on second floor due to 4ft water level.', reportedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, requestIdentifier: 'RQ-2042', category: 'Food & Clean Water', location: 'Biyagama North, Siyambalape', latitude: 6.9510, longitude: 79.9550, priority: 'High', currentStatus: 'Pending Dispatch', peopleCount: 14, description: 'Three families isolated on rooftop; no food or potable water since yesterday evening.', reportedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, requestIdentifier: 'RQ-2043', category: 'Search & Rescue Boat', location: 'Kaduwela River Bank, Weliwita', latitude: 6.9388, longitude: 79.9790, priority: 'Critical', currentStatus: 'In Progress', peopleCount: 8, description: 'Rapidly rising water level encroaching ground floor; immediate motorized rescue boat needed.', reportedAt: new Date(Date.now() - 1800000).toISOString() },
];

const MOCK_FLOOD_ZONES: FloodZone[] = [
  { id: 1, zoneName: 'Kelani River Lower Basin — Zone A', severityLevel: 'Critical', waterLevelTrend: 'Rising (+0.18m/hr)', estimatedAffectedPopulation: 8500, evacuationStatus: 'Mandatory Evacuation Active', polygonCoordinatesJson: '[[6.958,79.910],[6.962,79.925],[6.950,79.932],[6.945,79.915]]', centerLatitude: 6.9538, centerLongitude: 79.9205, lastUpdated: new Date().toISOString() },
  { id: 2, zoneName: 'Biyagama Industrial Flood Spillway — Zone B', severityLevel: 'Warning', waterLevelTrend: 'Stable (Peak Reached)', estimatedAffectedPopulation: 4200, evacuationStatus: 'Precautionary Warning', polygonCoordinatesJson: '[[6.940,79.940],[6.948,79.955],[6.938,79.960],[6.932,79.945]]', centerLatitude: 6.9395, centerLongitude: 79.9500, lastUpdated: new Date().toISOString() },
  { id: 3, zoneName: 'Kaduwela Lowland Inundation Sector — Zone C', severityLevel: 'Critical', waterLevelTrend: 'Rising (+0.22m/hr)', estimatedAffectedPopulation: 6100, evacuationStatus: 'Immediate Evacuation Required', polygonCoordinatesJson: '[[6.930,79.975],[6.942,79.988],[6.931,79.995],[6.924,79.982]]', centerLatitude: 6.9318, centerLongitude: 79.9850, lastUpdated: new Date().toISOString() },
];

// Helper to calculate Haversine distance
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ─── Network request helper with automatic fallback ───────────────────────────
async function safeFetch<T>(path: string, options?: RequestInit, fallback?: () => T | Promise<T>): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    });
    if (res.ok) {
      if (res.status === 204) return undefined as unknown as T;
      return await res.json();
    }
  } catch {
    // Backend server offline - use fallback
  }

  if (fallback) {
    return await fallback();
  }
  throw new Error(`Service temporarily unavailable. Please ensure the backend is running.`);
}

// ─── Resource API ─────────────────────────────────────────────────────────────
export const ResourceApi = {
  getAll: (category?: string, status?: string, search?: string): Promise<Resource[]> => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (status && status !== 'All') params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();

    return safeFetch<Resource[]>(`/resources${qs ? `?${qs}` : ''}`, undefined, () => {
      let list = [...MOCK_RESOURCES];
      if (category && category !== 'All') list = list.filter(r => r.category.toLowerCase() === category.toLowerCase());
      if (status && status !== 'All') list = list.filter(r => r.status.toLowerCase() === status.toLowerCase());
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
      }
      return list;
    });
  },

  getById: (id: number): Promise<Resource> =>
    safeFetch<Resource>(`/resources/${id}`, undefined, () => {
      const found = MOCK_RESOURCES.find(r => r.id === id);
      if (!found) throw new Error(`Resource #${id} not found.`);
      return found;
    }),

  create: (data: { name: string; category: string; availableQuantity: number; minimumStockLevel: number; unit: string }): Promise<Resource> =>
    safeFetch<Resource>('/resources', { method: 'POST', body: JSON.stringify(data) }, () => {
      const status: 'Normal' | 'Warning' | 'Critical' =
        data.availableQuantity <= 0 ? 'Critical' :
        data.availableQuantity <= data.minimumStockLevel ? 'Warning' : 'Normal';
      const newItem: Resource = {
        id: Math.max(0, ...MOCK_RESOURCES.map(r => r.id)) + 1,
        name: data.name,
        category: data.category,
        availableQuantity: data.availableQuantity,
        allocatedQuantity: 0,
        minimumStockLevel: data.minimumStockLevel,
        unit: data.unit,
        status,
        updatedAt: new Date().toISOString(),
      };
      MOCK_RESOURCES.push(newItem);
      return newItem;
    }),

  update: (id: number, data: { name: string; category: string; availableQuantity: number; minimumStockLevel: number; unit: string }): Promise<Resource> =>
    safeFetch<Resource>(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () => {
      const idx = MOCK_RESOURCES.findIndex(r => r.id === id);
      if (idx === -1) throw new Error(`Resource #${id} not found.`);
      const status: 'Normal' | 'Warning' | 'Critical' =
        data.availableQuantity <= 0 ? 'Critical' :
        data.availableQuantity <= data.minimumStockLevel ? 'Warning' : 'Normal';
      MOCK_RESOURCES[idx] = {
        ...MOCK_RESOURCES[idx],
        ...data,
        status,
        updatedAt: new Date().toISOString(),
      };
      return MOCK_RESOURCES[idx];
    }),

  delete: (id: number): Promise<void> =>
    safeFetch<void>(`/resources/${id}`, { method: 'DELETE' }, () => {
      MOCK_RESOURCES = MOCK_RESOURCES.filter(r => r.id !== id);
    }),

  getSummary: (): Promise<ResourceSummary> =>
    safeFetch<ResourceSummary>('/resources/summary', undefined, () => {
      const water = MOCK_RESOURCES.filter(r => r.category === 'Water');
      const food = MOCK_RESOURCES.filter(r => r.category === 'Food Packs');
      const med = MOCK_RESOURCES.filter(r => r.category === 'Medicine Kits' || r.category === 'First Aid Kits');

      const sumAvail = (items: Resource[]) => items.reduce((s, i) => s + i.availableQuantity, 0);
      const sumAlloc = (items: Resource[]) => items.reduce((s, i) => s + i.allocatedQuantity, 0);

      const waterAvail = sumAvail(water);
      const foodAvail = sumAvail(food);
      const medAvail = sumAvail(med);

      return {
        totalWaterAvailable: waterAvail,
        totalWaterAllocated: sumAlloc(water),
        waterStatus: waterAvail > 5000 ? 'Normal' : waterAvail > 1000 ? 'Warning' : 'Critical',
        totalFoodPacksAvailable: foodAvail,
        totalFoodPacksAllocated: sumAlloc(food),
        foodPacksStatus: foodAvail > 1500 ? 'Normal' : foodAvail > 500 ? 'Warning' : 'Critical',
        totalMedicineKitsAvailable: medAvail,
        totalMedicineKitsAllocated: sumAlloc(med),
        medicineKitsStatus: medAvail > 300 ? 'Normal' : medAvail > 100 ? 'Warning' : 'Critical',
        totalItemsCount: MOCK_RESOURCES.length,
        criticalStockCount: MOCK_RESOURCES.filter(r => r.status === 'Critical').length,
        warningStockCount: MOCK_RESOURCES.filter(r => r.status === 'Warning').length,
        normalStockCount: MOCK_RESOURCES.filter(r => r.status === 'Normal').length,
      };
    }),

  getShortages: (): Promise<ShortageAlert[]> =>
    safeFetch<ShortageAlert[]>('/resources/shortages', undefined, () => [
      {
        resourceId: 6,
        resourceName: 'Infant Nutrition Formula',
        requiredQuantity: 150,
        availableQuantity: 85,
        shortageAmount: 65,
        affectedShelterOrRequest: 'Biyagama Community Hall (8 infants registered)',
        priority: 'Critical',
        suggestedResolution: 'Request urgent emergency restock from UNICEF / Sri Lanka Red Cross.',
      },
      {
        resourceId: 3,
        resourceName: 'Emergency Medicine Kits',
        requiredQuantity: 400,
        availableQuantity: 310,
        shortageAmount: 90,
        affectedShelterOrRequest: 'Kelaniya Basin Flood Evacuation Sector',
        priority: 'Warning',
        suggestedResolution: 'Coordinate with Ministry of Health central depot for second wave dispatch.',
      },
    ]),
};

// ─── Allocation API ───────────────────────────────────────────────────────────
export const AllocationApi = {
  getAll: (): Promise<ResourceAllocation[]> =>
    safeFetch<ResourceAllocation[]>('/allocations', undefined, () => [...MOCK_ALLOCATIONS]),

  create: (data: CreateAllocationDto): Promise<ResourceAllocation> =>
    safeFetch<ResourceAllocation>('/allocations', { method: 'POST', body: JSON.stringify(data) }, () => {
      const res = MOCK_RESOURCES.find(r => r.id === data.resourceId);
      if (!res) throw new Error(`Resource #${data.resourceId} not found.`);
      if (data.quantity > res.availableQuantity) {
        throw new Error(`Insufficient stock. Requested ${data.quantity} units, but only ${res.availableQuantity} units available.`);
      }

      res.availableQuantity -= data.quantity;
      res.allocatedQuantity += data.quantity;
      res.status = res.availableQuantity <= 0 ? 'Critical' : res.availableQuantity <= res.minimumStockLevel ? 'Warning' : 'Normal';

      const newAlloc: ResourceAllocation = {
        id: Math.max(0, ...MOCK_ALLOCATIONS.map(a => a.id)) + 1,
        resourceId: res.id,
        resourceName: res.name,
        resourceCategory: res.category,
        unit: res.unit,
        destinationType: data.destinationType,
        destinationShelterId: data.destinationShelterId,
        destinationShelterName: data.destinationShelterName,
        destinationName: data.destinationShelterName || data.emergencyRequestId || 'Field Site',
        emergencyRequestId: data.emergencyRequestId,
        quantity: data.quantity,
        allocatedBy: data.allocatedBy || 'Current Staff',
        notes: data.notes || '',
        status: 'Fulfilled',
        allocatedAt: new Date().toISOString(),
      };
      MOCK_ALLOCATIONS.unshift(newAlloc);
      return newAlloc;
    }),
};

// ─── Support API ──────────────────────────────────────────────────────────────
export const SupportApi = {
  getAll: (): Promise<PartnerSupportRequest[]> =>
    safeFetch<PartnerSupportRequest[]>('/support-requests', undefined, () => [...MOCK_SUPPORT_REQUESTS]),

  create: (data: CreatePartnerSupportRequestDto): Promise<PartnerSupportRequest> =>
    safeFetch<PartnerSupportRequest>('/support-requests', { method: 'POST', body: JSON.stringify(data) }, () => {
      const newReq: PartnerSupportRequest = {
        id: Math.max(0, ...MOCK_SUPPORT_REQUESTS.map(s => s.id)) + 1,
        requiredResource: data.requiredResource,
        quantityRequired: data.quantityRequired,
        requestingLocation: data.requestingLocation,
        priority: data.priority,
        reason: data.reason,
        partnerOrganization: data.partnerOrganization || 'Inter-Agency Humanitarian Cluster',
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      MOCK_SUPPORT_REQUESTS.unshift(newReq);
      return newReq;
    }),
};

// ─── Shelter API ──────────────────────────────────────────────────────────────
export const ShelterApi = {
  getAll: (status?: string, facility?: string, search?: string): Promise<Shelter[]> => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.set('status', status);
    if (facility && facility !== 'All') params.set('facility', facility);
    if (search) params.set('search', search);
    const qs = params.toString();

    return safeFetch<Shelter[]>(`/shelters${qs ? `?${qs}` : ''}`, undefined, () => {
      let list = [...MOCK_SHELTERS];
      if (status && status !== 'All') list = list.filter(s => s.operationalStatus.toLowerCase() === status.toLowerCase());
      if (facility && facility !== 'All') list = list.filter(s => s.facilities.some(f => f.toLowerCase().includes(facility.toLowerCase())));
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q));
      }
      return list;
    });
  },

  getById: (id: number): Promise<Shelter> =>
    safeFetch<Shelter>(`/shelters/${id}`, undefined, () => {
      const s = MOCK_SHELTERS.find(x => x.id === id);
      if (!s) throw new Error(`Shelter #${id} not found.`);
      return s;
    }),

  getNearby: (lat: number, lng: number, filter?: string): Promise<NearbyShelter[]> =>
    safeFetch<NearbyShelter[]>(`/shelters/nearby?latitude=${lat}&longitude=${lng}${filter ? `&filter=${filter}` : ''}`, undefined, () => {
      let list = [...MOCK_SHELTERS];
      if (filter && filter !== 'All') {
        if (filter === 'Open') list = list.filter(s => s.operationalStatus === 'Open');
        else list = list.filter(s => s.facilities.some(f => f.toLowerCase().includes(filter.toLowerCase())));
      }
      return list
        .map(s => {
          const d = haversineKm(lat, lng, s.latitude, s.longitude);
          return {
            ...s,
            distanceKm: d,
            estimatedTravelMinutes: Math.max(5, Math.round(d * 3.5)),
          };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }),

  getCapacity: (id: number): Promise<ShelterCapacity> =>
    safeFetch<ShelterCapacity>(`/shelters/${id}/capacity`, undefined, () => {
      const s = MOCK_SHELTERS.find(x => x.id === id);
      if (!s) throw new Error(`Shelter #${id} not found.`);
      return {
        shelterId: s.id,
        shelterName: s.name,
        totalCapacity: s.totalCapacity,
        currentOccupancy: s.currentOccupancy,
        availableSpaces: s.availableSpaces,
        occupancyPercentage: s.occupancyPercentage,
        status: s.operationalStatus,
      };
    }),

  create: (data: Partial<Shelter>): Promise<Shelter> =>
    safeFetch<Shelter>('/shelters', { method: 'POST', body: JSON.stringify(data) }, () => {
      const total = data.totalCapacity || 100;
      const occ = data.currentOccupancy || 0;
      const newShelter: Shelter = {
        id: Math.max(0, ...MOCK_SHELTERS.map(s => s.id)) + 1,
        name: data.name || 'New Relief Shelter',
        location: data.location || 'Colombo District',
        latitude: data.latitude || 6.9319,
        longitude: data.longitude || 79.8577,
        totalCapacity: total,
        currentOccupancy: occ,
        availableSpaces: Math.max(0, total - occ),
        occupancyPercentage: Math.min(100, Math.round((occ / total) * 100)),
        operationalStatus: data.operationalStatus || 'Open',
        facilities: data.facilities || ['Meals', 'Drinking Water'],
        contactPerson: data.contactPerson || 'Officer In Charge',
        contactPhone: data.contactPhone || '+94 11 000 0000',
        lastUpdated: new Date().toISOString(),
      };
      MOCK_SHELTERS.push(newShelter);
      return newShelter;
    }),

  update: (id: number, data: Partial<Shelter>): Promise<Shelter> =>
    safeFetch<Shelter>(`/shelters/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () => {
      const idx = MOCK_SHELTERS.findIndex(s => s.id === id);
      if (idx === -1) throw new Error(`Shelter #${id} not found.`);
      const prev = MOCK_SHELTERS[idx];
      const total = data.totalCapacity ?? prev.totalCapacity;
      const occ = data.currentOccupancy ?? prev.currentOccupancy;
      MOCK_SHELTERS[idx] = {
        ...prev,
        ...data,
        totalCapacity: total,
        currentOccupancy: occ,
        availableSpaces: Math.max(0, total - occ),
        occupancyPercentage: Math.min(100, Math.round((occ / total) * 100)),
        lastUpdated: new Date().toISOString(),
      };
      return MOCK_SHELTERS[idx];
    }),

  allocateHousehold: (idOrData: number | CreateHouseholdAllocationDto, maybeData?: any): Promise<HouseholdAllocation> => {
    const data: CreateHouseholdAllocationDto = typeof idOrData === 'number'
      ? { ...maybeData, shelterId: idOrData }
      : idOrData;

    return safeFetch<HouseholdAllocation>('/shelters/allocate-household', { method: 'POST', body: JSON.stringify(data) }, () => {
      const s = MOCK_SHELTERS.find(x => x.id === data.shelterId);
      if (!s) throw new Error(`Shelter #${data.shelterId} not found.`);

      // Strict Over-Allocation Guard
      if (s.availableSpaces < data.numberOfPeople) {
        throw new Error(`Insufficient shelter capacity. This allocation of ${data.numberOfPeople} people exceeds the available space of ${s.availableSpaces} at ${s.name}.`);
      }

      s.currentOccupancy += data.numberOfPeople;
      s.availableSpaces = Math.max(0, s.totalCapacity - s.currentOccupancy);
      s.occupancyPercentage = Math.min(100, Math.round((s.currentOccupancy / s.totalCapacity) * 100));
      if (s.availableSpaces === 0) s.operationalStatus = 'Full';
      else if (s.occupancyPercentage >= 85) s.operationalStatus = 'Almost Full';

      return {
        id: Math.floor(Math.random() * 90000) + 1000,
        shelterId: s.id,
        shelterName: s.name,
        householdHeadName: data.householdHeadName,
        caseReferenceId: data.caseReferenceId,
        numberOfPeople: data.numberOfPeople,
        specialNeeds: data.specialNeeds || 'None',
        allocatedBy: data.allocatedBy || 'Current Shelter Admin',
        status: 'Assigned',
        allocatedAt: new Date().toISOString(),
      };
    });
  },
};

// ─── Shelter Supply API ───────────────────────────────────────────────────────
export const ShelterSupplyApi = {
  getAll: (shelterId?: number): Promise<ShelterSupplyRequest[]> =>
    safeFetch<ShelterSupplyRequest[]>(`/shelters/supplies/requests${shelterId ? `?shelterId=${shelterId}` : ''}`, undefined, () => {
      if (shelterId) return MOCK_SUPPLY_REQUESTS.filter(s => s.shelterId === shelterId);
      return [...MOCK_SUPPLY_REQUESTS];
    }),

  create: (data: CreateShelterSupplyRequestDto): Promise<ShelterSupplyRequest> =>
    safeFetch<ShelterSupplyRequest>('/shelters/supplies/requests', { method: 'POST', body: JSON.stringify(data) }, () => {
      const s = MOCK_SHELTERS.find(x => x.id === data.shelterId);
      const newReq: ShelterSupplyRequest = {
        id: Math.max(0, ...MOCK_SUPPLY_REQUESTS.map(x => x.id)) + 1,
        shelterId: data.shelterId,
        shelterName: s ? s.name : `Shelter #${data.shelterId}`,
        requestedResource: data.requestedResource,
        quantity: data.quantity,
        priority: data.priority,
        reason: data.reason,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      MOCK_SUPPLY_REQUESTS.unshift(newReq);
      return newReq;
    }),
};

// ─── Map & Operational API ────────────────────────────────────────────────────
export const MapApi = {
  getShelters: (status?: string, facility?: string, search?: string): Promise<Shelter[]> =>
    ShelterApi.getAll(status, facility, search),

  getEmergencies: (): Promise<EmergencyRequest[]> =>
    safeFetch<EmergencyRequest[]>('/map/emergencies', undefined, () => [...MOCK_EMERGENCIES]),

  getCoverage: (): Promise<OperationalCoverage> =>
    safeFetch<OperationalCoverage>('/map/coverage', undefined, () => {
      const totalShelters = MOCK_SHELTERS.length;
      const openShelters = MOCK_SHELTERS.filter(s => s.operationalStatus === 'Open').length;
      const sheltersNearing = MOCK_SHELTERS.filter(s => s.operationalStatus === 'Almost Full').length;
      const sheltersFull = MOCK_SHELTERS.filter(s => s.operationalStatus === 'Full').length;
      const totalCapacity = MOCK_SHELTERS.reduce((s, x) => s + x.totalCapacity, 0);
      const totalOccupancy = MOCK_SHELTERS.reduce((s, x) => s + x.currentOccupancy, 0);

      return {
        totalShelters,
        openShelters,
        sheltersNearingCapacity: sheltersNearing,
        sheltersFull,
        activeEmergencyRequests: MOCK_EMERGENCIES.length,
        criticalRequestsCount: MOCK_EMERGENCIES.filter(e => e.priority === 'Critical').length,
        floodZonesActiveCount: MOCK_FLOOD_ZONES.length,
        totalEvacueesSheltered: totalOccupancy,
        totalShelterCapacity: totalCapacity,
        overallCapacityUsagePercent: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0,
      };
    }),

  getEmergencyRequests: (): Promise<EmergencyRequest[]> =>
    safeFetch<EmergencyRequest[]>('/map/emergencies', undefined, () => [...MOCK_EMERGENCIES]),

  getFloodZones: (): Promise<FloodZone[]> =>
    safeFetch<FloodZone[]>('/map/flood-zones', undefined, () => [...MOCK_FLOOD_ZONES]),
};

// ─── Route API ────────────────────────────────────────────────────────────────
export const RouteApi = {
  getRoute: (fromLat: number, fromLng: number, toLat: number, toLng: number, originName?: string, destName?: string): Promise<RouteResult> =>
    RouteApi.calculateRoute(fromLat, fromLng, toLat, toLng, originName, destName),

  calculateRoute: (fromLat: number, fromLng: number, toLat: number, toLng: number, originName?: string, destName?: string): Promise<RouteResult> =>
    safeFetch<RouteResult>(
      `/routes/calculate?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}&originName=${encodeURIComponent(originName || 'Current Location')}&destName=${encodeURIComponent(destName || 'Destination')}`,
      undefined,
      () => {
        const dist = haversineKm(fromLat, fromLng, toLat, toLng);
        const mins = Math.max(5, Math.round(dist * 3.5));
        const midLat = (fromLat + toLat) / 2 + 0.003;
        const midLng = (fromLng + toLng) / 2 - 0.002;
        return {
          originName: originName || 'Current Location',
          originLat: fromLat,
          originLng: fromLng,
          destinationName: destName || 'Destination',
          destinationLat: toLat,
          destinationLng: toLng,
          distanceKm: dist,
          travelTimeMinutes: mins,
          routeSummary: `Via A1 / Biyagama Relief Road (${dist} km · ~${mins} mins)`,
          navigationUrl: `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`,
          waypoints: [
            [fromLat, fromLng],
            [midLat, midLng],
            [toLat, toLng],
          ],
        };
      }
    ),
};
