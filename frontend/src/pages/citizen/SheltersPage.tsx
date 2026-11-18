import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Navigation, Phone, Search, AlertTriangle } from 'lucide-react';
import { citizenApi } from '../../services/citizenApi';
import type { Shelter } from '../../types/citizen';
import { CapacityBar, EmptyState, ErrorBox, Loading, PageHeader, useAsync } from '../../components/citizen/ui';

// ─── Leaflet dynamic import & icon fix ─────────────────────────────────────────
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default icon URLs in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CENTER_LK: [number, number] = [6.9535, 79.9167];

// ─── Marker Icon Factory ───────────────────────────────────────────────────────
function createShelterMarkerIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: 'cz-custom-marker',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;">
        <div style="
          width: 32px; height: 38px; display: flex; align-items: center; justify-content: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
        ">
          <svg viewBox="0 0 24 32" width="32" height="38" fill="${color}" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 7.732 12 20 12 20S24 19.732 24 12C24 5.373 18.627 0 12 0z"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
          </svg>
        </div>
        <div style="
          background: rgba(15, 23, 42, 0.9); color: #fff; font-size: 10px; font-weight: 700;
          padding: 2px 6px; border-radius: 4px; white-space: nowrap; margin-top: -2px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25); max-width: 120px; overflow: hidden; text-overflow: ellipsis;
        ">${label}</div>
      </div>
    `,
    iconSize: [32, 54],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
  });
}

function getShelterStatus(s: Shelter): { label: string; color: string; badgeCls: string } {
  const pct = s.capacity > 0 ? (s.occupied / s.capacity) * 100 : 0;
  if (pct >= 100 || s.occupied >= s.capacity) {
    return { label: 'Full', color: '#dc2626', badgeCls: 'badge-red' };
  }
  if (pct >= 85) {
    return { label: 'Almost Full', color: '#d97706', badgeCls: 'badge-amber' };
  }
  return { label: 'Open', color: '#059669', badgeCls: 'badge-green' };
}

export const SheltersPage: React.FC = () => {
  const { data, loading, error, reload } = useAsync(() => citizenApi.getShelters());
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('All');
  const [spaceOnly, setSpaceOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const districts = useMemo(() => ['All', ...Array.from(new Set((data ?? []).map((s) => s.district)))], [data]);

  const list = useMemo(
    () => (data ?? [])
      .filter((s) => (district === 'All' || s.district === district)
        && (!spaceOnly || s.occupied < s.capacity * 0.9)
        && s.name.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => a.distanceKm - b.distanceKm),
    [data, district, spaceOnly, search]
  );

  // Shelters that have valid GPS coordinates for the map
  const mappableShelters = useMemo(
    () => list.filter(
      (s): s is Shelter & { latitude: number; longitude: number } =>
        typeof s.latitude === 'number' &&
        typeof s.longitude === 'number' &&
        !isNaN(s.latitude) &&
        !isNaN(s.longitude)
    ),
    [list]
  );

  const missingCoordsCount = list.length - mappableShelters.length;

  // ─── Initialize Leaflet Map ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent Leaflet "Map container is already initialized" conflict error
    const container = mapContainerRef.current as HTMLElement & { _leaflet_id?: number | null };
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // ignore already removed
      }
      mapInstanceRef.current = null;
    }
    if (container._leaflet_id != null) {
      container._leaflet_id = null;
    }

    try {
      const map = L.map(container, {
        center: CENTER_LK,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // User location marker
      L.circleMarker(CENTER_LK, {
        radius: 8,
        fillColor: '#2563eb',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
      })
        .addTo(map)
        .bindPopup('<strong>Your Location</strong><br/><span style="font-size:12px;color:#64748b;">Colombo Reference Center</span>');

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
      setMapReady(true);

      // Trigger size invalidation to guarantee full tile coverage
      const t1 = setTimeout(() => map.invalidateSize(), 150);
      const t2 = setTimeout(() => map.invalidateSize(), 500);

      const handleResize = () => map.invalidateSize();
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        window.removeEventListener('resize', handleResize);
        try {
          map.remove();
        } catch {
          // ignore
        }
        if (container) {
          container._leaflet_id = null;
        }
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        setMapReady(false);
      };
    } catch (e) {
      console.error('Error initializing map:', e);
    }
  }, []);

  // ─── Sync Map Markers with Filtered Shelters ───────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !mapReady) return;

    // Clear previous markers
    layer.clearLayers();
    markersRef.current.clear();

    if (mappableShelters.length === 0) return;

    const bounds = L.latLngBounds([]);

    mappableShelters.forEach((shelter) => {
      const { label: statusLabel, color, badgeCls } = getShelterStatus(shelter);
      const icon = createShelterMarkerIcon(color, shelter.name);

      const marker = L.marker([shelter.latitude, shelter.longitude], { icon });

      const availableSpaces = Math.max(0, shelter.capacity - shelter.occupied);
      const pct = shelter.capacity > 0 ? Math.round((shelter.occupied / shelter.capacity) * 100) : 0;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shelter.name + ' ' + shelter.address)}`;

      const popupContent = `
        <div class="cz-marker-popup" style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
            <h4 style="margin:0; font-size:14px; font-weight:700; color:#0f172a;">${shelter.name}</h4>
          </div>
          <div class="cz-popup-addr" style="font-size:12px; color:#64748b; margin-bottom:6px;">
            ${shelter.address} · <strong>${shelter.distanceKm} km away</strong>
          </div>
          <div style="margin-bottom:8px; display:flex; gap:6px; align-items:center;">
            <span class="badge ${badgeCls}" style="font-size:11px; padding:2px 8px; border-radius:999px;">${statusLabel}</span>
            <span style="font-size:11px; color:#475569; font-weight:600;">${availableSpaces} spaces left</span>
          </div>
          <div style="background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden; margin-bottom:8px;">
            <div style="background:${color}; width:${pct}%; height:100%;"></div>
          </div>
          <div style="font-size:11px; color:#475569; margin-bottom:8px;">
            Occupancy: ${shelter.occupied}/${shelter.capacity} (${pct}%)
          </div>
          ${shelter.contactPhone ? `
            <div style="font-size:11px; color:#475569; margin-bottom:8px;">
              📞 <a href="tel:${shelter.contactPhone}" style="color:#2563eb; text-decoration:none; font-weight:600;">${shelter.contactPhone}</a>
              ${shelter.contactPerson ? `(${shelter.contactPerson})` : ''}
            </div>
          ` : ''}
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px;">
            ${shelter.facilities.map((f) => `<span style="background:#eff6ff; color:#1d4ed8; font-size:10px; font-weight:600; padding:2px 6px; border-radius:4px;">${f}</span>`).join('')}
          </div>
          <a href="${directionsUrl}" target="_blank" rel="noreferrer" style="
            display: inline-flex; align-items: center; justify-content: center; gap: 4px;
            width: 100%; padding: 6px 12px; background: #2563eb; color: #fff;
            text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;
          ">
            Get directions ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });

      marker.on('click', () => {
        setSelectedId(shelter.id);
        const cardElem = cardRefs.current.get(shelter.id);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      marker.addTo(layer);
      markersRef.current.set(shelter.id, marker);
      bounds.extend([shelter.latitude, shelter.longitude]);
    });

    // Auto-fit map to visible markers
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [mapReady, mappableShelters]);

  // ─── Center Map on Shelter from Card Click ─────────────────────────────────
  const focusShelterOnMap = useCallback((shelter: Shelter) => {
    setSelectedId(shelter.id);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (
      typeof shelter.latitude === 'number' &&
      typeof shelter.longitude === 'number' &&
      !isNaN(shelter.latitude) &&
      !isNaN(shelter.longitude)
    ) {
      map.setView([shelter.latitude, shelter.longitude], 14, { animate: true });
      const marker = markersRef.current.get(shelter.id);
      if (marker) {
        marker.openPopup();
      }
    }
  }, []);

  return (
    <div className="cz-page">
      <PageHeader title="Map & Shelters" subtitle="Find a safe shelter with free space." />

      <div className="card">
        {/* Interactive Leaflet Map */}
        <div
          className="cz-map-wrapper"
          style={{
            position: 'relative',
            width: '100%',
            height: 400,
            minHeight: 340,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            background: 'var(--color-blue-soft)',
            marginBottom: 16,
          }}
        >
          <div
            ref={mapContainerRef}
            className="cz-map-inner"
            style={{ width: '100%', height: '100%', minHeight: 340, zIndex: 1 }}
          />
        </div>

        {missingCoordsCount > 0 && (
          <div style={{
            fontSize: 12,
            color: 'var(--color-amber-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
            padding: '6px 10px',
            background: 'var(--color-warning-soft)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <AlertTriangle size={14} />
            <span>Note: {missingCoordsCount} shelter(s) without GPS coordinates are excluded from the map pins but shown in the list below.</span>
          </div>
        )}

        {/* Filter Controls (Member 2 Implementation) */}
        <div className="cz-row">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="cz-input"
              style={{ width: '100%', paddingLeft: 32 }}
              aria-label="Search shelters"
              placeholder="Search shelter name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="cz-input"
            style={{ width: 160 }}
            aria-label="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            {districts.map((d) => <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>)}
          </select>
          <label className="cz-row" style={{ fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={spaceOnly}
              onChange={(e) => setSpaceOnly(e.target.checked)}
            />
            Has free space
          </label>
        </div>
      </div>

      {/* Shelters List Content */}
      <div className="cz-mt">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Showing {list.length} shelter{list.length !== 1 ? 's' : ''} ({mappableShelters.length} on map)
          </div>
          {selectedId && (
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setSelectedId(null)}
            >
              Clear selection
            </button>
          )}
        </div>

        {loading ? (
          <Loading />
        ) : error || !data ? (
          <ErrorBox message={error ?? 'Could not load shelters'} onRetry={reload} />
        ) : list.length === 0 ? (
          <div className="card">
            <EmptyState title="No shelters found" text="Try adjusting your search query or filter options." />
          </div>
        ) : (
          list.map((s) => {
            const { label: statusLabel, badgeCls } = getShelterStatus(s);
            const isSelected = selectedId === s.id;
            const availableSpaces = Math.max(0, s.capacity - s.occupied);
            const hasCoords = typeof s.latitude === 'number' && typeof s.longitude === 'number' && !isNaN(s.latitude) && !isNaN(s.longitude);

            return (
              <div
                key={s.id}
                ref={(el) => { cardRefs.current.set(s.id, el); }}
                className={`card cz-shelter-card ${isSelected ? 'selected' : ''}`}
                style={{
                  borderLeft: isSelected ? '4px solid var(--color-primary-blue)' : undefined,
                }}
              >
                <div className="cz-between">
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 15 }}>{s.name}</strong>
                      <span className={`badge ${badgeCls}`}>{statusLabel}</span>
                    </div>
                    <div className="cz-muted" style={{ marginTop: 2 }}>
                      {s.address} · <strong>{s.distanceKm} km away</strong>
                    </div>

                    {s.contactPhone && (
                      <div className="cz-muted" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={13} />
                        <a href={`tel:${s.contactPhone}`} style={{ color: 'var(--color-primary-blue)', textDecoration: 'none' }}>
                          {s.contactPhone}
                        </a>
                        {s.contactPerson && <span>({s.contactPerson})</span>}
                      </div>
                    )}

                    <div className="cz-row" style={{ marginTop: 8 }}>
                      {s.facilities.map((f) => (
                        <span key={f} className="badge badge-blue">{f}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {hasCoords && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={() => focusShelterOnMap(s)}
                      >
                        <MapPin size={15} /> View on Map
                      </button>
                    )}
                    <a
                      className="btn-primary"
                      style={{ textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.name + ' ' + s.address)}`}
                    >
                      <Navigation size={15} /> Get directions
                    </a>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span className="cz-muted">Capacity Status</span>
                    <span style={{ fontWeight: 600, color: availableSpaces > 0 ? 'var(--color-secondary-green)' : 'var(--color-error)' }}>
                      {availableSpaces > 0 ? `${availableSpaces} spaces available` : 'Full (0 spaces)'}
                    </span>
                  </div>
                  <CapacityBar occupied={s.occupied} capacity={s.capacity} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SheltersPage;
