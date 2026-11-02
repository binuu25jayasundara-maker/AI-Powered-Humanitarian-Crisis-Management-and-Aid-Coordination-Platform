import React, { useCallback, useEffect, useState } from 'react';
import {
  Droplets, Package, PlusCircle, Search, Edit2, Trash2,
  AlertTriangle, CheckCircle, XCircle, RefreshCw, Send,
} from 'lucide-react';
import type { Resource, ResourceSummary, ShortageAlert, ResourceAllocation, PartnerSupportRequest } from '../types/resourcesAndShelters';
import { ResourceApi, AllocationApi, SupportApi, ShelterApi } from '../services/resourceShelterApi';
import { useToast } from '../components/Toast';
import type { Shelter } from '../types/resourcesAndShelters';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string; value: number | string; sub: string; status: string; icon: React.ReactNode; unit?: string;
}> = ({ label, value, sub, status, icon, unit }) => {
  const statusStyles: Record<string, { bg: string; color: string; dot: string }> = {
    Normal:   { bg: 'var(--color-teal-soft)',  color: 'var(--color-teal)',          dot: 'var(--color-teal)' },
    Warning:  { bg: 'var(--color-amber-soft)', color: 'var(--color-amber-dark)',    dot: 'var(--color-amber-warning)' },
    Critical: { bg: 'var(--color-red-soft)',   color: 'var(--color-red-text)',      dot: 'var(--color-red-danger)' },
  };
  const s = statusStyles[status] ?? statusStyles['Normal'];

  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40,
            background: s.bg,
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: s.color,
          }}>
            {icon}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</span>
        </div>
        <span className="badge" style={{ background: s.bg, color: s.color }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
          {status}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: 4 }}>{unit}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls = status === 'Normal' ? 'badge-normal' : status === 'Warning' ? 'badge-warning' : 'badge-critical';
  return <span className={`badge ${cls}`}>{status}</span>;
};

// ─── Modal ─────────────────────────────────────────────────────────────────────
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

// ─── Resources & Logistics Page ───────────────────────────────────────────────
const CATEGORIES = ['All', 'Water', 'Food Packs', 'Medicine Kits', 'First Aid Kits', 'Essential Supplies'];
const STATUSES   = ['All', 'Normal', 'Warning', 'Critical'];

export const ResourcesPage: React.FC = () => {
  const { showToast, ToastComponent } = useToast();

  const [summary,      setSummary]      = useState<ResourceSummary | null>(null);
  const [resources,    setResources]    = useState<Resource[]>([]);
  const [shortages,    setShortages]    = useState<ShortageAlert[]>([]);
  const [allocations,  setAllocations]  = useState<ResourceAllocation[]>([]);
  const [partnerReqs,  setPartnerReqs]  = useState<PartnerSupportRequest[]>([]);
  const [shelters,     setShelters]     = useState<Shelter[]>([]);

  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [showEditModal,    setShowEditModal]     = useState(false);
  const [showAllocModal,   setShowAllocModal]   = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [editingResource,  setEditingResource]  = useState<Resource | null>(null);

  // Form states
  const [resourceForm, setResourceForm] = useState({ name: '', category: 'Water', availableQuantity: 0, minimumStockLevel: 0, unit: 'units' });
  const [allocForm,    setAllocForm]    = useState({ resourceId: 0, destinationType: 'Shelter', destinationShelterId: undefined as number | undefined, destinationShelterName: '', emergencyRequestId: '', quantity: 0, notes: '' });
  const [supportForm,  setSupportForm]  = useState({ requiredResource: '', quantityRequired: 0, requestingLocation: '', priority: 'High', reason: '', partnerOrganization: 'Sri Lanka Red Cross' });

  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, r, sh, al, pr, sv] = await Promise.all([
        ResourceApi.getSummary(),
        ResourceApi.getAll(catFilter === 'All' ? undefined : catFilter, statusFilter === 'All' ? undefined : statusFilter, search || undefined),
        ResourceApi.getShortages(),
        AllocationApi.getAll(),
        SupportApi.getAll(),
        ShelterApi.getAll(),
      ]);
      setSummary(s);
      setResources(r);
      setShortages(sh);
      setAllocations(al);
      setPartnerReqs(pr);
      setShelters(sv);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [catFilter, statusFilter, search]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Add Resource ────────────────────────────────────────────────────────────
  const handleAddResource = async () => {
    if (!resourceForm.name.trim()) { showToast('Resource name is required.', 'error'); return; }
    setSubmitting(true);
    try {
      await ResourceApi.create(resourceForm);
      setShowAddModal(false);
      setResourceForm({ name: '', category: 'Water', availableQuantity: 0, minimumStockLevel: 0, unit: 'units' });
      showToast('Resource added successfully.', 'success');
      await loadAll();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to add resource', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit Resource ───────────────────────────────────────────────────────────
  const handleEditResource = async () => {
    if (!editingResource) return;
    setSubmitting(true);
    try {
      await ResourceApi.update(editingResource.id, resourceForm);
      setShowEditModal(false);
      setEditingResource(null);
      showToast('Resource updated successfully.', 'success');
      await loadAll();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Resource ─────────────────────────────────────────────────────────
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await ResourceApi.delete(id);
      showToast(`"${name}" removed from inventory.`, 'success');
      await loadAll();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  // ── Allocate Resource ───────────────────────────────────────────────────────
  const handleAllocate = async () => {
    if (!allocForm.resourceId) { showToast('Please select a resource.', 'error'); return; }
    if (allocForm.quantity <= 0) { showToast('Quantity must be greater than zero.', 'error'); return; }
    const selectedResource = resources.find(r => r.id === allocForm.resourceId);
    if (selectedResource && allocForm.quantity > selectedResource.availableQuantity) {
      showToast(`Cannot allocate ${allocForm.quantity} — only ${selectedResource.availableQuantity} ${selectedResource.unit} available.`, 'error');
      return;
    }
    setSubmitting(true);
    try {
      await AllocationApi.create({
        resourceId: allocForm.resourceId,
        destinationType: allocForm.destinationType,
        destinationShelterId: allocForm.destinationType === 'Shelter' ? allocForm.destinationShelterId : undefined,
        destinationShelterName: allocForm.destinationType === 'Shelter' ? allocForm.destinationShelterName : undefined,
        emergencyRequestId: allocForm.destinationType === 'EmergencyRequest' ? allocForm.emergencyRequestId : undefined,
        quantity: allocForm.quantity,
        notes: allocForm.notes,
      });
      setShowAllocModal(false);
      showToast('Resource allocated successfully.', 'success');
      await loadAll();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Allocation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Partner Support Request ─────────────────────────────────────────────────
  const handlePartnerRequest = async () => {
    if (!supportForm.requiredResource.trim()) { showToast('Required resource is needed.', 'error'); return; }
    if (supportForm.quantityRequired <= 0) { showToast('Quantity must be at least 1.', 'error'); return; }
    setSubmitting(true);
    try {
      await SupportApi.create(supportForm);
      setShowSupportModal(false);
      setSupportForm({ requiredResource: '', quantityRequired: 0, requestingLocation: '', priority: 'High', reason: '', partnerOrganization: 'Sri Lanka Red Cross' });
      showToast('Partner support request submitted.', 'success');
      await loadAll();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to send request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <div style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Loading Resources & Logistics…</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <div className="alert alert-critical">
        <AlertTriangle size={18} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Connection Error</div>
          <div>{error}</div>
          <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }} onClick={loadAll}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {ToastComponent}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-main)' }}>Resource &amp; Logistics Management</h1>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Real-time inventory control, allocation, and shortage management
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={loadAll}><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setResourceForm({ name: '', category: 'Water', availableQuantity: 0, minimumStockLevel: 0, unit: 'units' }); }}>
            <PlusCircle size={15} /> Add Resource
          </button>
        </div>
      </div>

      {/* ── A. KPI Summary Cards ─────────────────────────────────────────────── */}
      {summary && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Water Stock" value={summary.totalWaterAvailable} unit="L"
            sub={`Allocated: ${summary.totalWaterAllocated.toLocaleString()} L`}
            status={summary.waterStatus} icon={<Droplets size={18} />} />
          <KpiCard label="Food Packs" value={summary.totalFoodPacksAvailable} unit="packs"
            sub={`Allocated: ${summary.totalFoodPacksAllocated.toLocaleString()} packs`}
            status={summary.foodPacksStatus} icon={<Package size={18} />} />
          <KpiCard label="Medicine Kits" value={summary.totalMedicineKitsAvailable} unit="kits"
            sub={`Allocated: ${summary.totalMedicineKitsAllocated.toLocaleString()} kits`}
            status={summary.medicineKitsStatus} icon={<Package size={18} />} />
          <div className="card" style={{ padding: 20, flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Stock Health</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-green-text)', fontWeight: 700 }}>● Normal</span>
                <span>{summary.normalStockCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-amber-text)', fontWeight: 700 }}>● Warning</span>
                <span>{summary.warningStockCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-red-text)', fontWeight: 700 }}>● Critical</span>
                <span>{summary.criticalStockCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── D. Shortage Alert Banner ──────────────────────────────────────────── */}
      {shortages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: 'var(--color-red-text)' }}>
              <AlertTriangle size={16} />
              Shortage &amp; Conflict Alerts ({shortages.length})
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => setShowSupportModal(true)}>
              <Send size={13} /> Request Partner Support
            </button>
          </div>
          {shortages.map(s => (
            <div key={s.resourceId} className="alert alert-critical" style={{ gap: 14 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  <span className={`badge ${s.priority === 'Critical' ? 'badge-critical' : 'badge-warning'}`} style={{ marginRight: 8 }}>{s.priority}</span>
                  {s.resourceName} — Shortage of {s.shortageAmount.toLocaleString()} units
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Available: <strong>{s.availableQuantity.toLocaleString()}</strong> | Required: <strong>{s.requiredQuantity.toLocaleString()}</strong> | Affected: {s.affectedShelterOrRequest}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-red-text)', marginTop: 4, fontStyle: 'italic' }}>{s.suggestedResolution}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── B. Inventory Table ────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Search + Filter bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-control" placeholder="Search resources…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
          </div>
          <select className="form-control" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-teal" onClick={() => setShowAllocModal(true)}>
            <Package size={14} /> Allocate Resource
          </button>
        </div>

        {/* Table */}
        {resources.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Package size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontWeight: 600 }}>No resources found</div>
            <div style={{ fontSize: 13 }}>Try adjusting your filters or add a new resource.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Category</th>
                  <th>Available</th>
                  <th>Allocated</th>
                  <th>Min. Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td><span className="badge badge-blue">{r.category}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, color: r.status === 'Critical' ? 'var(--color-red-danger)' : r.status === 'Warning' ? 'var(--color-amber-dark)' : 'var(--color-green-success)' }}>
                        {r.availableQuantity.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 4 }}>{r.unit}</span>
                    </td>
                    <td>{r.allocatedQuantity.toLocaleString()} <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{r.unit}</span></td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{r.minimumStockLevel.toLocaleString()}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          setEditingResource(r);
                          setResourceForm({ name: r.name, category: r.category, availableQuantity: r.availableQuantity, minimumStockLevel: r.minimumStockLevel, unit: r.unit });
                          setShowEditModal(true);
                        }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id, r.name)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── C. Allocation History ─────────────────────────────────────────────── */}
      {allocations.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 14 }}>
            Recent Allocations
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Destination</th>
                  <th>Quantity</th>
                  <th>By</th>
                  <th>Status</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {allocations.slice(0, 8).map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.resourceName}</td>
                    <td>{a.destinationShelterName ?? a.emergencyRequestId ?? a.destinationType}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-blue-primary)' }}>{a.quantity.toLocaleString()}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{a.allocatedBy}</td>
                    <td>
                      <span className={`badge ${a.status === 'Delivered' ? 'badge-normal' : a.status === 'InTransit' ? 'badge-warning' : 'badge-blue'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {a.allocatedAt ? new Date(a.allocatedAt).toLocaleString() : "�"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── E. Partner Requests ───────────────────────────────────────────────── */}
      {partnerReqs.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 14 }}>
            Partner Support Requests
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Resource</th><th>Qty</th><th>Location</th><th>Priority</th><th>Partner</th><th>Status</th><th>Submitted</th></tr>
              </thead>
              <tbody>
                {partnerReqs.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.requiredResource}</td>
                    <td>{p.quantityRequired.toLocaleString()}</td>
                    <td>{p.requestingLocation}</td>
                    <td><StatusBadge status={p.priority === 'Critical' ? 'Critical' : p.priority === 'High' ? 'Warning' : 'Normal'} /></td>
                    <td>{p.partnerOrganization ?? '—'}</td>
                    <td>
                      <span className={`badge ${p.status === 'Fulfilled' ? 'badge-normal' : p.status === 'Approved' ? 'badge-blue' : p.status === 'Dispatched' ? 'badge-open' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────────── */}

      {/* Add Resource Modal */}
      {showAddModal && (
        <Modal title="Add New Resource" onClose={() => setShowAddModal(false)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Resource Name *</label>
              <input className="form-control" value={resourceForm.name} onChange={e => setResourceForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Water (L), Food packs, Medicine Kits" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-control" value={resourceForm.category} onChange={e => setResourceForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input className="form-control" value={resourceForm.unit} onChange={e => setResourceForm(f => ({ ...f, unit: e.target.value }))} placeholder="L, packs, kits, units" />
              </div>
              <div className="form-group">
                <label className="form-label">Available Quantity *</label>
                <input type="number" min={0} className="form-control" value={resourceForm.availableQuantity} onChange={e => setResourceForm(f => ({ ...f, availableQuantity: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Stock Level</label>
                <input type="number" min={0} className="form-control" value={resourceForm.minimumStockLevel} onChange={e => setResourceForm(f => ({ ...f, minimumStockLevel: +e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddResource} disabled={submitting}>
              {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><CheckCircle size={14} /> Add Resource</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Resource Modal */}
      {showEditModal && editingResource && (
        <Modal title={`Edit: ${editingResource.name}`} onClose={() => setShowEditModal(false)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Resource Name *</label>
              <input className="form-control" value={resourceForm.name} onChange={e => setResourceForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={resourceForm.category} onChange={e => setResourceForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input className="form-control" value={resourceForm.unit} onChange={e => setResourceForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Available Quantity</label>
                <input type="number" min={0} className="form-control" value={resourceForm.availableQuantity} onChange={e => setResourceForm(f => ({ ...f, availableQuantity: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Stock Level</label>
                <input type="number" min={0} className="form-control" value={resourceForm.minimumStockLevel} onChange={e => setResourceForm(f => ({ ...f, minimumStockLevel: +e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditResource} disabled={submitting}>
              {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><CheckCircle size={14} /> Save Changes</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Allocate Resource Modal */}
      {showAllocModal && (
        <Modal title="Allocate Resource" onClose={() => setShowAllocModal(false)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Resource *</label>
              <select className="form-control" value={allocForm.resourceId} onChange={e => setAllocForm(f => ({ ...f, resourceId: +e.target.value }))}>
                <option value={0}>— Select resource —</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.availableQuantity.toLocaleString()} {r.unit} available)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Type</label>
              <select className="form-control" value={allocForm.destinationType} onChange={e => setAllocForm(f => ({ ...f, destinationType: e.target.value }))}>
                <option value="Shelter">Shelter</option>
                <option value="EmergencyRequest">Emergency Request</option>
              </select>
            </div>
            {allocForm.destinationType === 'Shelter' ? (
              <div className="form-group">
                <label className="form-label">Destination Shelter</label>
                <select className="form-control" value={allocForm.destinationShelterId ?? ''} onChange={e => {
                  const s = shelters.find(sh => sh.id === +e.target.value);
                  setAllocForm(f => ({ ...f, destinationShelterId: s?.id, destinationShelterName: s?.name ?? '' }));
                }}>
                  <option value="">— Select shelter —</option>
                  {shelters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.availableSpaces} spaces)</option>)}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Emergency Request ID</label>
                <input className="form-control" value={allocForm.emergencyRequestId} onChange={e => setAllocForm(f => ({ ...f, emergencyRequestId: e.target.value }))} placeholder="e.g. RQ-2041" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Quantity to Allocate *</label>
              <input type="number" min={1} className="form-control" value={allocForm.quantity} onChange={e => setAllocForm(f => ({ ...f, quantity: +e.target.value }))} />
              {allocForm.resourceId > 0 && (() => {
                const r = resources.find(x => x.id === allocForm.resourceId);
                if (!r) return null;
                const exceeded = allocForm.quantity > r.availableQuantity;
                return (
                  <div style={{ fontSize: 12, marginTop: 4, color: exceeded ? 'var(--color-red-danger)' : 'var(--color-text-muted)' }}>
                    {exceeded
                      ? `⚠ Exceeds available stock (${r.availableQuantity.toLocaleString()} ${r.unit})`
                      : `Available: ${r.availableQuantity.toLocaleString()} ${r.unit}`}
                  </div>
                );
              })()}
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-control" value={allocForm.notes} onChange={e => setAllocForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional allocation notes" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowAllocModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAllocate} disabled={submitting}>
              {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Allocating…</> : <><Package size={14} /> Confirm Allocation</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Partner Support Modal */}
      {showSupportModal && (
        <Modal title="Request Partner Support" onClose={() => setShowSupportModal(false)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="alert alert-warning">
              <AlertTriangle size={15} />
              <span>This will create a formal support request to an external partner organization.</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Required Resource *</label>
                <input className="form-control" value={supportForm.requiredResource} onChange={e => setSupportForm(f => ({ ...f, requiredResource: e.target.value }))} placeholder="e.g. Water (L), Medicine Kits" />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity Required *</label>
                <input type="number" min={1} className="form-control" value={supportForm.quantityRequired} onChange={e => setSupportForm(f => ({ ...f, quantityRequired: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={supportForm.priority} onChange={e => setSupportForm(f => ({ ...f, priority: e.target.value }))}>
                  <option>Critical</option><option>High</option><option>Normal</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Requesting Location</label>
                <input className="form-control" value={supportForm.requestingLocation} onChange={e => setSupportForm(f => ({ ...f, requestingLocation: e.target.value }))} placeholder="e.g. Kelaniya Relief Hub" />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Partner Organization</label>
                <input className="form-control" value={supportForm.partnerOrganization} onChange={e => setSupportForm(f => ({ ...f, partnerOrganization: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Reason for Request</label>
                <textarea className="form-control" rows={3} value={supportForm.reason} onChange={e => setSupportForm(f => ({ ...f, reason: e.target.value }))} placeholder="Explain the shortage context and urgency…" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowSupportModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePartnerRequest} disabled={submitting}>
              {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Sending…</> : <><Send size={14} /> Submit Request</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
