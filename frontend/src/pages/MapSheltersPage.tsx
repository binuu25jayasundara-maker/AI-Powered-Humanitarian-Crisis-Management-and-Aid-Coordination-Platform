import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, List, X, RefreshCw, AlertTriangle } from 'lucide-react';
import type { NearbyShelter, RouteResult } from '../types/resourcesAndShelters';
import { ShelterApi, RouteApi } from '../services/resourceShelterApi';
import { useToast } from '../components/Toast';

// ─── Leaflet dynamic import (to avoid SSR issues in Vite/React) ───────────────
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default icon URLs in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Icon factories ───────────────────────────────────────────────────────────
function makeIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px; height:34px; position:relative; display:flex; align-items:center; justify-content:center;
    ">
      <svg viewBox="0 0 24 32" width="28" height="34" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 7.732 12 20 12 20S24 19.732 24 12C24 5.373 18.627 0 12 0z"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -34],
  });
}

const ICON_OPEN    = makeIcon('#0d9488');
const ICON_WARN    = makeIcon('#f59e0b');
const ICON_FULL    = makeIcon('#dc2626');
const ICON_CLOSED  = makeIcon('#94a3b8');

const FILTERS = ['All', 'Open', 'Medical', 'Accessible', 'Food'] as const;
type FilterType = typeof FILTERS[number];

const CENTER_LK: [number, number] = [6.9535, 79.9167];

// ─── Map & Shelters Page ──────────────────────────────────────────────────────
export const MapSheltersPage: React.FC = () => {
  const { showToast, ToastComponent } = useToast();
  const mapRef       = useRef<L.Map | null>(null);
  const mapElemRef   = useRef<HTMLDivElement | null>(null);
  const markersRef   = useRef<L.Marker[]>([]);

  const [shelters,     setShelters]     = useState<NearbyShelter[]>([]);
  const [selected,     setSelected]     = useState<NearbyShelter | null>(null);
  const [route,        setRoute]        = useState<RouteResult | null>(null);
  const [routeLayer,   setRouteLayer]   = useState<L.Polyline | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [userLat]      = useState(CENTER_LK[0]);
  const [userLng]      = useState(CENTER_LK[1]);

  // ── Load shelters ───────────────────────────────────────────────────────────
  const loadShelters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterArg = activeFilter === 'All' ? undefined :
                        activeFilter === 'Food' ? 'Meals' :
                        activeFilter === 'Medical' ? 'Medical' :
                        activeFilter === 'Accessible' ? 'Accessible' : 'open';

      const nearby = await ShelterApi.getNearby(userLat, userLng, filterArg);
      setShelters(nearby);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load shelters');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, userLat, userLng]);

  useEffect(() => { loadShelters(); }, [loadShelters]);

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapElemRef.current || mapRef.current) return;
    mapRef.current = L.map(mapElemRef.current, {
      center: CENTER_LK,
      zoom: 12,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(mapRef.current);

    // User position marker
    L.circleMarker(CENTER_LK, { radius: 8, fillColor: '#2563eb', fillOpacity: 1, color: '#fff', weight: 2 })
      .bindPopup('📍 Relief Center / Your Location')
      .addTo(mapRef.current);

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // ── Update markers when shelters change ─────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    shelters.forEach(s => {
      const icon = s.operationalStatus === 'Open' ? ICON_OPEN :
                   s.operationalStatus === 'Almost Full' ? ICON_WARN :
                   s.operationalStatus === 'Full' ? ICON_FULL : ICON_CLOSED;

      const marker = L.marker([s.latitude, s.longitude], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="min-width:200px; font-family:sans-serif;">
            <div style="font-weight:800; font-size:14px; margin-bottom:6px;">${s.name}</div>
            <div style="font-size:12px; color:#64748b; margin-bottom:4px;">${s.location}</div>
            <div style="font-size:12px;"><b>Status:</b> ${s.operationalStatus}</div>
            <div style="font-size:12px;"><b>Available:</b> ${s.availableSpaces} / ${s.totalCapacity}</div>
            <div style="font-size:12px;"><b>Distance:</b> ~${s.distanceKm} km</div>
          </div>
        `)
        .on('click', () => setSelected(s));

      markersRef.current.push(marker);
    });
  }, [shelters]);

  // ── Pan to selected shelter ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selected || !mapRef.current) return;
    mapRef.current.setView([selected.latitude, selected.longitude], 14, { animate: true });
  }, [selected]);

  // ── Get Route ───────────────────────────────────────────────────────────────
  const getRoute = async () => {
    if (!selected) return;
    setRouteLoading(true);
    try {
      const result = await RouteApi.getRoute(userLat, userLng, selected.latitude, selected.longitude, 'Your Location', selected.name);
      setRoute(result);

      // Draw polyline on map
      if (routeLayer && mapRef.current) { mapRef.current.removeLayer(routeLayer); }
      if (mapRef.current && result.waypoints.length) {
        const latlngs = result.waypoints.map(([lat, lng]: [number, number]) => [lat, lng] as [number, number]);
        const poly = L.polyline(latlngs, { color: '#2563eb', weight: 4, opacity: 0.8, dashArray: '10 5' }).addTo(mapRef.current);
        setRouteLayer(poly);
        mapRef.current.fitBounds(poly.getBounds(), { padding: [40, 40] });
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to calculate route', 'error');
    } finally {
      setRouteLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {ToastComponent}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Map &amp; Shelters</h1>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Nearest shelters, directions, and availability — based on real-time data</div>
        </div>
        <button className="btn btn-secondary" onClick={loadShelters}><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: 12,
              border: '1px solid',
              borderColor: activeFilter === f ? 'var(--color-blue-primary)' : 'var(--color-border)',
              background: activeFilter === f ? 'var(--color-blue-primary)' : 'var(--color-bg-card)',
              color: activeFilter === f ? '#fff' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-critical">
          <AlertTriangle size={16} />
          <div>{error} <button className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={loadShelters}>Retry</button></div>
        </div>
      )}

      {/* Main Layout: Map + Sidebar */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 520 }}>
        {/* Map */}
        <div style={{ flex: 1, position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)', minHeight: 480 }}>
          <div ref={mapElemRef} style={{ height: '100%', width: '100%' }} />
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9 }}>
              <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          )}
        </div>

        {/* Sidebar: Nearby List + Selected Shelter Panel */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>

          {/* Selected Shelter Details */}
          {selected ? (
            <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{selected.name}</div>
                <button className="btn-icon btn-sm" onClick={() => { setSelected(null); setRoute(null); if (routeLayer) routeLayer.remove(); }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{selected.location}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Status',    value: selected.operationalStatus },
                  { label: 'Available', value: `${selected.availableSpaces} spaces` },
                  { label: 'Distance',  value: `~${selected.distanceKm} km` },
                  { label: 'Est. Time', value: `~${selected.estimatedTravelMinutes} min` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--color-bg-page)', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
              {selected.facilities.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selected.facilities.map(f => (
                    <span key={f} style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-teal-soft)', color: 'var(--color-teal)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{f}</span>
                  ))}
                </div>
              )}

              {/* Route Info */}
              {route && (
                <div className="alert alert-info" style={{ flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{route.routeSummary}</div>
                  <a href={route.navigationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 4 }}>
                    <Navigation size={12} /> Open in Google Maps
                  </a>
                </div>
              )}

              <button className="btn btn-primary" onClick={getRoute} disabled={routeLoading}>
                {routeLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Calculating…</> : <><Navigation size={14} /> Get Directions</>}
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <MapPin size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>Select a shelter on the map or list to see details and directions.</div>
            </div>
          )}

          {/* Nearby Shelter List */}
          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <List size={14} /> Nearby Shelters ({shelters.length})
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" /></div>
              ) : shelters.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>No shelters match the current filter.</div>
              ) : (
                shelters.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border-light)',
                      background: selected?.id === s.id ? 'var(--color-blue-soft)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => { if (selected?.id !== s.id) (e.currentTarget).style.background = 'var(--color-bg-page)'; }}
                    onMouseLeave={e => { if (selected?.id !== s.id) (e.currentTarget).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.distanceKm} km</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>{s.location}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: s.operationalStatus === 'Open' ? 'var(--color-teal-soft)' : s.operationalStatus === 'Almost Full' ? 'var(--color-amber-soft)' : 'var(--color-red-soft)',
                        color: s.operationalStatus === 'Open' ? 'var(--color-teal)' : s.operationalStatus === 'Almost Full' ? 'var(--color-amber-dark)' : 'var(--color-red-text)',
                      }}>
                        {s.operationalStatus}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.availableSpaces} spaces</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
