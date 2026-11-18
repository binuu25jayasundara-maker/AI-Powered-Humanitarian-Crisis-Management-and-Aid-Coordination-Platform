import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2, PlusCircle, Search, Edit2, Users, CheckCircle,
  XCircle, RefreshCw, AlertTriangle, Package,
} from 'lucide-react';
import type { Shelter, ShelterSupplyRequest } from '../types/resourcesAndShelters';
import { ShelterApi, ShelterSupplyApi } from '../services/resourceShelterApi';
import { useToast } from '../components/Toast';

// ─── Occupancy Bar ──────────────────────────────────────────────────────────
const OccupancyBar: React.FC<{ pct: number; status: string }> = ({ pct, status }) => {
  const fill = status === 'Full' ? 'critical' : pct >= 85 ? 'warning' : 'normal';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>
        <span style={{ color: fill === 'critical' ? 'var(--color-red-danger)' : fill === 'warning' ? 'var(--color-amber-dark)' : 'var(--color-teal)' }}>
          {pct.toFixed(0)}% occupied
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>{status}</span>
      </div>
      <div className="progress-bar-track">
        <div className={`progress-bar-fill ${fill}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
};

// ─── Facility Tag ────────────────────────────────────────────────────────────
const FacilityTag: React.FC<{ label: string }> = ({ label }) => (
  <span style={{
    background: 'var(--color-blue-soft)',
    color: 'var(--color-blue-primary)',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-blue-light)',
    letterSpacing: '0.02em',
  }}>
    {label}
  </span>
);

// ─── Status Badge ────────────────────────────────────────────────────────────
const ShelterStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls = status === 'Open' ? 'badge-open' : status === 'Almost Full' ? 'badge-warning' : status === 'Full' ? 'badge-critical' : 'badge-closed';
  return <span className={`badge ${cls}`}>{status}</span>;
};

// ─── Modal ───────────────────────────────────────────────────────────────────
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>{title}</h3>
        <button className="btn-icon" onClick={onClose}><XCircle size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

const STATUSES = ['All', 'Open', 'Almost Full', 'Full', 'Closed'];
const FACILITIES_OPTS = ['Accessible', 'Meals', 'Medical', 'Drinking Water', 'Sanitation'];

export const SheltersPage: React.FC = () => {
  const { showToast, ToastComponent } = useToast();

  const [shelters,      setShelters]      = useState<Shelter[]>([]);
  const [supplyReqs,    setSupplyReqs]    = useState<ShelterSupplyRequest[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('All');

  // Modal states
  const [showAddModal,       setShowAddModal]       = useState(false);
  const [showEditModal,      setShowEditModal]       = useState(false);
  const [showAllocModal,     setShowAllocModal]     = useState(false);
  const [showSupplyModal,    setShowSupplyModal]    = useState(false);
  const [selectedShelter,    setSelectedShelter]   = useState<Shelter | null>(null);
  const [submitting,         setSubmitting]         = useState(false);

  // Add/Edit shelter form
  const [shelterForm, setShelterForm] = useState({
    name: '', location: '', latitude: 0, longitude: 0,
    totalCapacity: 100, currentOccupancy: 0, operationalStatus: 'Open',
    facilities: [] as string[], contactPerson: '', contactPhone: '',
  });

  // Household alloc form
  const [householdForm, setHouseholdForm] = useState({
    householdHeadName: '', caseReferenceId: '', numberOfPeople: 1, specialNeeds: '', allocatedBy: 'Shelter Admin',
  });

  // Supply request form
  const [supplyForm, setSupplyForm] = useState({
    shelterId: 0, requestedResource: '', quantity: 1, priority: 'High', reason: '',
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sv, sr] = await Promise.all([
        ShelterApi.getAll(search || undefined, statusFilter === 'All' ? undefined : statusFilter),
        ShelterSupplyApi.getAll(),
      ]);
      setShelters(sv);
      setSupplyReqs(sr);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load shelter data');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Add shelter ─────────────────────────────────────────────────────────────
  const handleAddShelter = async () => {
    if (!shelterForm.name.trim()) { showToast('Shelter name is required.', 'error'); return; }
    if (!shelterForm.location.trim()) { showToast('Location is required.', 'error'); return; }
    if (shelterForm.totalCapacity <= 0) { showToast('Total capacity must be greater than zero.', 'error'); return; }
    setSubmitting(true);
    try {
      await ShelterApi.create(shelterForm as any);
      setShowAddModal(false);
      showToast('Shelter added successfully.', 'success');
      await loadAll();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to add shelter', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit shelter ────────────────────────────────────────────────────────────
  const handleEditShelter = async () => {
    if (!selectedShelter) return;
    setSubmitting(true);
    try {
      await ShelterApi.update(selectedShelter.id, shelterForm as any);
      setShowEditModal(false);
      showToast('Shelter updated.', 'success');
      await loadAll();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Allocate household ──────────────────────────────────────────────────────
  const handleAllocateHousehold = async () => {
    if (!selectedShelter) return;
    if (!householdForm.householdHeadName.trim()) { showToast('Household head name is required.', 'error'); return; }
    if (householdForm.numberOfPeople <= 0) { showToast('Number of people must be at least 1.', 'error'); return; }
    if (householdForm.numberOfPeople > selectedShelter.availableSpaces) {
      showToast(`Insufficient shelter capacity. Only ${selectedShelter.availableSpaces} spaces available in ${selectedShelter.name}.`, 'error');
      return;
    }
    setSubmitting(true);
    try {
      await ShelterApi.allocateHousehold(selectedShelter.id, householdForm);
      setShowAllocModal(false);
      showToast(`Household allocated to ${selectedShelter.name}.`, 'success');
      await loadAll();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Allocation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Supply request ──────────────────────────────────────────────────────────
  const handleSupplyRequest = async () => {
    if (!supplyForm.requestedResource.trim()) { showToast('Resource name is required.', 'error'); return; }
    if (supplyForm.quantity <= 0) { showToast('Quantity must be at least 1.', 'error'); return; }
    setSubmitting(true);
    try {
      await ShelterSupplyApi.create(supplyForm);
      setShowSupplyModal(false);
      showToast('Supply request submitted.', 'success');
      await loadAll();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Request failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <div style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Loading Shelter Management…</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 40 }}>
      <div className="alert alert-critical">
        <AlertTriangle size={18} />
        <div>
          <div style={{ fontWeight: 700 }}>Connection Error</div>
          <div>{error}</div>
          <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }} onClick={loadAll}><RefreshCw size={12} /> Retry</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {ToastComponent}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Shelter Management</h1>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Manage shelters, occupancy, household allocations & supplies</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={loadAll}><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => {
            setShelterForm({ name: '', location: '', latitude: 0, longitude: 0, totalCapacity: 100, currentOccupancy: 0, operationalStatus: 'Open', facilities: [], contactPerson: '', contactPhone: '' });
            setShowAddModal(true);
          }}>
            <PlusCircle size={15} /> Add Shelter
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-control" placeholder="Search shelters by name or location…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* ── A. Shelter Cards ──────────────────────────────────────────────────── */}
      {shelters.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Building2 size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
          <div style={{ fontWeight: 600 }}>No shelters found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {shelters.map(s => (
            <div key={s.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-text-main)' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{s.location}</div>
                </div>
                <ShelterStatusBadge status={s.operationalStatus} />
              </div>

              {/* Capacity Bar */}
              <OccupancyBar pct={s.occupancyPercentage} status={s.operationalStatus} />

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Capacity', value: s.totalCapacity },
                  { label: 'Occupied', value: s.currentOccupancy },
                  { label: 'Available', value: s.availableSpaces, highlight: s.availableSpaces > 0 },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', padding: '8px 0', background: 'var(--color-bg-page)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: stat.highlight ? 'var(--color-teal)' : 'var(--color-text-main)' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Facilities */}
              {s.facilities.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {s.facilities.map(f => <FacilityTag key={f} label={f} />)}
                </div>
              )}

              {/* Over-allocation warning */}
              {s.operationalStatus === 'Full' && (
                <div className="alert alert-critical" style={{ padding: '8px 12px', fontSize: 12 }}>
                  <AlertTriangle size={13} />
                  No available spaces — household allocation blocked.
                </div>
              )}
              {s.operationalStatus === 'Almost Full' && (
                <div className="alert alert-warning" style={{ padding: '8px 12px', fontSize: 12 }}>
                  <AlertTriangle size={13} />
                  Nearing capacity ({s.availableSpaces} spaces left).
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-teal btn-sm"
                  disabled={s.availableSpaces <= 0 || s.operationalStatus === 'Closed'}
                  onClick={() => {
                    setSelectedShelter(s);
                    setHouseholdForm({ householdHeadName: '', caseReferenceId: '', numberOfPeople: 1, specialNeeds: '', allocatedBy: 'Shelter Admin' });
                    setShowAllocModal(true);
                  }}
                >
                  <Users size={12} /> Allocate Household
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedShelter(s);
                    setSupplyForm({ shelterId: s.id, requestedResource: '', quantity: 1, priority: 'High', reason: '' });
                    setShowSupplyModal(true);
                  }}
                >
                  <Package size={12} /> Request Supplies
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedShelter(s);
                    setShelterForm({
                      name: s.name, location: s.location, latitude: s.latitude, longitude: s.longitude,
                      totalCapacity: s.totalCapacity, currentOccupancy: s.currentOccupancy,
                      operationalStatus: s.operationalStatus, facilities: s.facilities,
                      contactPerson: s.contactPerson, contactPhone: s.contactPhone,
                    });
                    setShowEditModal(true);
                  }}
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>

              {/* Contact */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
                <span>📋 {s.contactPerson}</span>
                <span>📞 {s.contactPhone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Supply Requests Panel ─────────────────────────────────────────────── */}
      {supplyReqs.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} /> Shelter Supply Requests
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Shelter</th><th>Resource</th><th>Qty</th><th>Priority</th><th>Status</th><th>Reason</th><th>Submitted</th></tr>
              </thead>
              <tbody>
                {supplyReqs.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.shelterName}</td>
                    <td>{r.requestedResource}</td>
                    <td>{r.quantity.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${r.priority === 'Critical' ? 'badge-critical' : r.priority === 'High' ? 'badge-warning' : 'badge-normal'}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'Delivered' ? 'badge-normal' : r.status === 'Dispatched' ? 'badge-open' : r.status === 'Approved' ? 'badge-blue' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: 12 }}>{r.reason}</td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────────── */}

      {/* Add Shelter */}
      {showAddModal && (
        <Modal title="Add New Shelter" onClose={() => setShowAddModal(false)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Shelter Name *</label>
              <input className="form-control" value={shelterForm.name} onChange={e => setShelterForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kelaniya Maha Vidyalaya" />
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <input className="form-control" value={shelterForm.location} onChange={e => setShelterForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Station Road, Kelaniya" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input type="number" className="form-control" value={shelterForm.latitude} onChange={e => setShelterForm(f => ({ ...f, latitude: +e.target.value }))} step={0.0001} />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input type="number" className="form-control" value={shelterForm.longitude} onChange={e => setShelterForm(f => ({ ...f, longitude: +e.target.value }))} step={0.0001} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Capacity *</label>
                <input type="number" min={1} className="form-control" value={shelterForm.totalCapacity} onChange={e => setShelterForm(f => ({ ...f, totalCapacity: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input className="form-control" value={shelterForm.contactPerson} onChange={e => setShelterForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="Site Coordinator" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Facilities</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FACILITIES_OPTS.map(f => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={shelterForm.facilities.includes(f)} onChange={e => setShelterForm(sf => ({
                      ...sf, facilities: e.target.checked ? [...sf.facilities, f] : sf.facilities.filter(x => x !== f),
                    }))} />
                    {f}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddShelter} disabled={submitting}>
              {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><CheckCircle size={14} /> Add Shelter</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Shelter */}
      {showEditModal && selectedShelter && (
        <Modal title={`Edit: ${selectedShelter.name}`} onClose={() => setShowEditModal(false)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Shelter Name *</label>
              <input className="form-control" value={shelterForm.name} onChange={e => setShelterForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <input className="form-control" value={shelterForm.location} onChange={e => setShelterForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Total Capacity *</label>
                <input type="number" min={1} className="form-control" value={shelterForm.totalCapacity} onChange={e => setShelterForm(f => ({ ...f, totalCapacity: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Current Occupancy</label>
                <input type="number" min={0} className="form-control" value={shelterForm.currentOccupancy} onChange={e => setShelterForm(f => ({ ...f, currentOccupancy: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Operational Status</label>
                <select className="form-control" value={shelterForm.operationalStatus} onChange={e => setShelterForm(f => ({ ...f, operationalStatus: e.target.value }))}>
                  <option>Open</option><option>Almost Full</option><option>Full</option><option>Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input className="form-control" value={shelterForm.contactPhone} onChange={e => setShelterForm(f => ({ ...f, contactPhone: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Facilities</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FACILITIES_OPTS.map(f => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={shelterForm.facilities.includes(f)} onChange={e => setShelterForm(sf => ({
                      ...sf, facilities: e.target.checked ? [...sf.facilities, f] : sf.facilities.filter(x => x !== f),
                    }))} />
                    {f}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditShelter} disabled={submitting}>
              {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><CheckCircle size={14} /> Save</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Allocate Household */}
      {showAllocModal && selectedShelter && (
        <Modal title={`Allocate Household → ${selectedShelter.name}`} onClose={() => setShowAllocModal(false)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Capacity status bar */}
            <div style={{ background: 'var(--color-bg-page)', borderRadius: 'var(--radius-md)', padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-muted)' }}>Shelter Capacity</div>
              <OccupancyBar pct={selectedShelter.occupancyPercentage} status={selectedShelter.operationalStatus} />
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                {selectedShelter.availableSpaces} spaces available of {selectedShelter.totalCapacity} total
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Household Head Name *</label>
              <input className="form-control" value={householdForm.householdHeadName} onChange={e => setHouseholdForm(f => ({ ...f, householdHeadName: e.target.value }))} placeholder="e.g. Perera Family" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Case Reference ID</label>
                <input className="form-control" value={householdForm.caseReferenceId} onChange={e => setHouseholdForm(f => ({ ...f, caseReferenceId: e.target.value }))} placeholder="e.g. RQ-2041 (optional)" />
              </div>
              <div className="form-group">
                <label className="form-label">Number of People *</label>
                <input type="number" min={1} max={selectedShelter.availableSpaces} className="form-control" value={householdForm.numberOfPeople}
                  onChange={e => setHouseholdForm(f => ({ ...f, numberOfPeople: +e.target.value }))} />
              </div>
            </div>

            {householdForm.numberOfPeople > selectedShelter.availableSpaces && (
              <div className="alert alert-critical">
                <AlertTriangle size={15} />
                <strong>Insufficient shelter capacity.</strong> This allocation ({householdForm.numberOfPeople} people) exceeds the available spaces ({selectedShelter.availableSpaces}).
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Special Needs</label>
              <input className="form-control" value={householdForm.specialNeeds} onChange={e => setHouseholdForm(f => ({ ...f, specialNeeds: e.target.value }))} placeholder="e.g. Wheelchair, Infant, Medication" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowAllocModal(false)}>Cancel</button>
            <button className="btn btn-primary"
              onClick={handleAllocateHousehold}
              disabled={submitting || householdForm.numberOfPeople > selectedShelter.availableSpaces}>
              {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Allocating…</> : <><Users size={14} /> Confirm Allocation</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Shelter Supply Request */}
      {showSupplyModal && selectedShelter && (
        <Modal title={`Request Supplies — ${selectedShelter.name}`} onClose={() => setShowSupplyModal(false)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Requested Resource *</label>
              <input className="form-control" value={supplyForm.requestedResource} onChange={e => setSupplyForm(f => ({ ...f, requestedResource: e.target.value }))} placeholder="e.g. Water Purification Tablets, Blankets" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input type="number" min={1} className="form-control" value={supplyForm.quantity} onChange={e => setSupplyForm(f => ({ ...f, quantity: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={supplyForm.priority} onChange={e => setSupplyForm(f => ({ ...f, priority: e.target.value }))}>
                  <option>Critical</option><option>High</option><option>Normal</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea rows={3} className="form-control" value={supplyForm.reason} onChange={e => setSupplyForm(f => ({ ...f, reason: e.target.value }))} placeholder="Explain urgency and reason for this request…" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowSupplyModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSupplyRequest} disabled={submitting}>
              {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Sending…</> : <><Package size={14} /> Submit Request</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
