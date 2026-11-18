import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigation, RefreshCw, AlertTriangle, Eye, EyeOff, X, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Shelter, EmergencyRequest, FloodZone, OperationalCoverage, RouteResult } from '../types/resourcesAndShelters';
import { MapApi, RouteApi } from '../services/resourceShelterApi';
import { useToast } from '../components/Toast';

// ─── Leaflet icon fix ─────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeSvgIcon(color: string, symbol: string, size = 30): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;background:${color};
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:${size * 0.45}px;font-weight:900;
      border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.3);">
      ${symbol}
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

const SHELTER_OPEN  = makeSvgIcon('#0d9488', '🏠');
const SHELTER_WARN  = makeSvgIcon('#f59e0b', '🏠');
const SHELTER_FULL  = makeSvgIcon('#dc2626', '🏠');
const EMRG_ICON     = makeSvgIcon('#ef4444', '⚡', 28);
const CENTER_LK: [number, number] = [6.9535, 79.9167];

// ─── Coverage KPI Card ────────────────────────────────────────────────────────
const CoverageKpi: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)',
    padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)',
  }}>
    <div style={{ fontSize: 22, fontWeight: 800, color: color ?? '#fff' }}>{value}</div>
    <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: 2 }}>{label}</div>
  </div>
);

export const OperationalMapPage: React.FC = () => {
  const { showToast, ToastComponent } = useToast();
  const mapRef      = useRef<L.Map | null>(null);
  const mapElemRef  = useRef<HTMLDivElement | null>(null);
  const layersRef   = useRef<{ shelters: L.LayerGroup; emergencies: L.LayerGroup; floodZones: L.LayerGroup }>({
    shelters:   L.layerGroup(),
    emergencies: L.layerGroup(),
    floodZones: L.layerGroup(),
  });

  const [coverage,      setCoverage]      = useState<OperationalCoverage | null>(null);
  const [shelters,      setShelters]      = useState<Shelter[]>([]);
  const [emergencies,   setEmergencies]   = useState<EmergencyRequest[]>([]);
  const [floodZones,    setFloodZones]    = useState<FloodZone[]>([]);
  const [selectedItem,  setSelectedItem]  = useState<{ type: 'shelter' | 'emergency'; data: Shelter | EmergencyRequest } | null>(null);
  const [route,         setRoute]         = useState<RouteResult | null>(null);
  const [routeLayer,    setRouteLayer]    = useState<L.Polyline | null>(null);
  const [routeLoading,  setRouteLoading]  = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  // Layer visibility toggles
  const [layerVis, setLayerVis] = useState({ shelters: true, emergencies: true, floodZones: true });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cov, sh, em, fz] = await Promise.all([
        MapApi.getCoverage(),
        MapApi.getShelters(),
        MapApi.getEmergencies(),
        MapApi.getFloodZones(),
      ]);
      setCoverage(cov);
      setShelters(sh);
      setEmergencies(em);
      setFloodZones(fz);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load operational map data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapElemRef.current || mapRef.current) return;
    const map = L.map(mapElemRef.current, { center: CENTER_LK, zoom: 12 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    layersRef.current.shelters.addTo(map);
    layersRef.current.emergencies.addTo(map);
    layersRef.current.floodZones.addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── Populate shelter layer ──────────────────────────────────────────────────
  useEffect(() => {
    const layer = layersRef.current.shelters;
    layer.clearLayers();
    shelters.forEach(s => {
      const icon = s.operationalStatus === 'Open' ? SHELTER_OPEN : s.operationalStatus === 'Full' ? SHELTER_FULL : SHELTER_WARN;
      L.marker([s.latitude, s.longitude], { icon })
        .bindPopup(`<b>${s.name}</b><br>${s.operationalStatus} — ${s.availableSpaces}/${s.totalCapacity} available`)
        .on('click', () => setSelectedItem({ type: 'shelter', data: s }))
        .addTo(layer);
    });
  }, [shelters]);

  // ── Populate emergency layer ────────────────────────────────────────────────
  useEffect(() => {
    const layer = layersRef.current.emergencies;
    layer.clearLayers();
    emergencies.forEach(e => {
      L.marker([e.latitude, e.longitude], { icon: EMRG_ICON })
        .bindPopup(`<b>${e.requestIdentifier}</b><br>${e.category}<br>Priority: ${e.priority}`)
        .on('click', () => setSelectedItem({ type: 'emergency', data: e }))
        .addTo(layer);
    });
  }, [emergencies]);

  // ── Populate flood zone layer ───────────────────────────────────────────────
  useEffect(() => {
    const layer = layersRef.current.floodZones;
    layer.clearLayers();
    floodZones.forEach(fz => {
      try {
        const coords: [number, number][] = JSON.parse(fz.polygonCoordinatesJson);
        const color = fz.severityLevel.includes('High') ? '#ef4444' : fz.severityLevel.includes('Severe') ? '#7c3aed' : '#f59e0b';
        L.polygon(coords, { color, fillColor: color, fillOpacity: 0.25, weight: 2, dashArray: '8 4' })
          .bindPopup(`<b>${fz.zoneName}</b><br>${fz.severityLevel}<br>Population: ${fz.estimatedAffectedPopulation.toLocaleString()}<br>${fz.evacuationStatus}`)
          .addTo(layer);
        L.circleMarker([fz.centerLatitude, fz.centerLongitude], { radius: 4, color, fillOpacity: 1 })
          .bindTooltip(fz.zoneName, { permanent: false, direction: 'top' })
          .addTo(layer);
      } catch { /* ignore parse errors */ }
    });
  }, [floodZones]);

  // ── Toggle layer visibility ─────────────────────────────────────────────────
  const toggleLayer = (key: keyof typeof layerVis) => {
    if (!mapRef.current) return;
    const layer = layersRef.current[key];
    if (layerVis[key]) {
      mapRef.current.removeLayer(layer);
    } else {
      layer.addTo(mapRef.current);
    }
    setLayerVis(v => ({ ...v, [key]: !v[key] }));
  };

  // ── Get Route ───────────────────────────────────────────────────────────────
  const getRoute = async () => {
    if (!selectedItem || selectedItem.type !== 'shelter') return;
    const s = selectedItem.data as Shelter;
    setRouteLoading(true);
    try {
      const result = await RouteApi.getRoute(CENTER_LK[0], CENTER_LK[1], s.latitude, s.longitude, 'Command Center', s.name);
      setRoute(result);
      if (routeLayer) routeLayer.remove();
      if (mapRef.current && result.waypoints.length) {
        const ll = result.waypoints.map(([lat, lng]: [number, number]) => [lat, lng] as [number, number]);
        const poly = L.polyline(ll, { color: '#2563eb', weight: 4, opacity: 0.85, dashArray: '10 6' }).addTo(mapRef.current);
        setRouteLayer(poly);
        mapRef.current.fitBounds(poly.getBounds(), { padding: [50, 50] });
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Route calculation failed', 'error');
    } finally {
      setRouteLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {ToastComponent}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Operational Map &amp; Coverage</h1>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Live overview of flood zones, shelters, and emergency requests</div>
        </div>
        <button className="btn btn-secondary" onClick={loadData}><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* ── Coverage Stats Bar ────────────────────────────────────────────────── */}
      {coverage && (
        <div style={{ background: 'var(--color-navy)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <CoverageKpi label="Total Shelters"       value={coverage.totalShelters} />
          <CoverageKpi label="Open Shelters"        value={coverage.openShelters}         color="#34d399" />
          <CoverageKpi label="Nearing Capacity"     value={coverage.sheltersNearingCapacity} color="#fbbf24" />
          <CoverageKpi label="Active Emergencies"   value={coverage.activeEmergencyRequests} color="#f87171" />
          <CoverageKpi label="Critical Requests"    value={coverage.criticalRequestsCount}   color="#ef4444" />
          <CoverageKpi label="Flood Zones Active"   value={coverage.floodZonesActiveCount}   color="#a78bfa" />
          <CoverageKpi label="Total Evacuees"       value={coverage.totalEvacueesSheltered.toLocaleString()} color="#38bdf8" />
          <CoverageKpi label="Capacity Use"         value={`${coverage.overallCapacityUsagePercent}%`} color={coverage.overallCapacityUsagePercent >= 85 ? '#f87171' : '#34d399'} />
        </div>
      )}

      {error && (
        <div className="alert alert-critical">
          <AlertTriangle size={16} />
          <div>{error} <button className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={loadData}>Retry</button></div>
        </div>
      )}

      {/* Map + Sidebar */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 500 }}>
        {/* Map */}
        <div style={{ flex: 1, position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)', minHeight: 480 }}>
          <div ref={mapElemRef} style={{ height: '100%', width: '100%' }} />
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9 }}>
              <div className="spinner" style={{ width: 36, height: 36 }} />
            </div>
          )}
          {/* Layer Toggle */}
          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 999,
            background: 'rgba(255,255,255,0.95)', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', minWidth: 170,
          }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Layers size={12} /> Layers
            </div>
            {([
              { key: 'floodZones', label: '🌊 Flood Zones', color: '#f59e0b' },
              { key: 'shelters',   label: '🏠 Shelters',    color: '#0d9488' },
              { key: 'emergencies',label: '⚡ Emergencies', color: '#ef4444' },
            ] as { key: keyof typeof layerVis; label: string; color: string }[]).map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  background: 'transparent', border: 'none', padding: '5px 0', cursor: 'pointer',
                  fontSize: 12, color: layerVis[key] ? 'var(--color-text-main)' : 'var(--color-text-faint)',
                  textDecoration: layerVis[key] ? 'none' : 'line-through',
                }}
              >
                {layerVis[key] ? <Eye size={13} color={color} /> : <EyeOff size={13} />}
                {label}
              </button>
            ))}
          </div>
          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12, zIndex: 999,
            background: 'rgba(255,255,255,0.95)', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)',
            fontSize: 11,
          }}>
            {[
              { dot: '#0d9488', label: 'Shelter — Open' },
              { dot: '#f59e0b', label: 'Shelter — Almost Full' },
              { dot: '#dc2626', label: 'Shelter — Full' },
              { dot: '#ef4444', label: 'Emergency Request' },
              { dot: '#f59e0b', label: 'Flood Zone (Moderate)' },
              { dot: '#ef4444', label: 'Flood Zone (High Risk)' },
            ].map(({ dot, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Selection Panel */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {selectedItem ? (
            <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  {selectedItem.type === 'shelter' ? '🏠 Shelter' : '⚡ Emergency'}
                </span>
                <button className="btn-icon" onClick={() => { setSelectedItem(null); setRoute(null); if (routeLayer) routeLayer.remove(); }}>
                  <X size={14} />
                </button>
              </div>

              {selectedItem.type === 'shelter' ? (() => {
                const s = selectedItem.data as Shelter;
                return (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.location}</div>
                    {[
                      { l: 'Occupancy', v: `${s.currentOccupancy} / ${s.totalCapacity}` },
                      { l: 'Available', v: `${s.availableSpaces} spaces` },
                      { l: 'Status',    v: s.operationalStatus },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{l}</span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                    {s.facilities.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {s.facilities.map((f: string) => <span key={f} style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-blue-soft)', color: 'var(--color-blue-primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{f}</span>)}
                      </div>
                    )}
                    {route && (
                      <div style={{ background: 'var(--color-blue-soft)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{route.routeSummary}</div>
                        <a href={route.navigationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                          <Navigation size={11} /> Open Navigation
                        </a>
                      </div>
                    )}
                    <button className="btn btn-primary" onClick={getRoute} disabled={routeLoading}>
                      {routeLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Calculating…</> : <><Navigation size={14} /> Get Route</>}
                    </button>
                  </>
                );
              })() : (() => {
                const e = selectedItem.data as EmergencyRequest;
                return (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{e.requestIdentifier}</div>
                    <span className={`badge ${e.priority === 'CRITICAL' ? 'badge-critical' : e.priority === 'HIGH' ? 'badge-warning' : 'badge-normal'}`}>{e.priority}</span>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{e.location}</div>
                    {[
                      { l: 'Category', v: e.category },
                      { l: 'Status',   v: e.currentStatus },
                      { l: 'People',   v: e.peopleCount },
                      { l: 'Reported', v: new Date(e.reportedAt).toLocaleTimeString() },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{l}</span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                    {e.description && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-main)', fontStyle: 'italic', background: 'var(--color-bg-page)', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
                        "{e.description}"
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="card" style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Layers size={28} style={{ opacity: 0.25, marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>Click any shelter or emergency marker on the map to view details.</div>
            </div>
          )}

          {/* Emergency List */}
          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 13 }}>
              ⚡ Active Emergencies ({emergencies.filter(e => e.currentStatus !== 'Resolved').length})
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
              {emergencies.map(e => (
                <button
                  key={e.id}
                  onClick={() => { setSelectedItem({ type: 'emergency', data: e }); mapRef.current?.setView([e.latitude, e.longitude], 15); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--color-border-light)', background: 'transparent', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{e.requestIdentifier}</span>
                    <span className={`badge ${e.priority === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}`} style={{ fontSize: 9 }}>{e.priority}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{e.category} — {e.location}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
