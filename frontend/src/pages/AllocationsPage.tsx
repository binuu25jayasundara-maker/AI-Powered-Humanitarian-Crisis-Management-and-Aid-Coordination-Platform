import React, { useEffect, useState, useCallback } from 'react';
import { Package, RefreshCw, AlertCircle, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { AllocationApi } from '../services/resourceShelterApi';
import type { ResourceAllocation } from '../types/resourcesAndShelters';
import { useToast } from '../components/Toast';

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  Fulfilled: { label: 'Fulfilled', cls: 'badge-success', icon: <CheckCircle size={12} /> },
  Pending:   { label: 'Pending',   cls: 'badge-warning', icon: <Clock size={12} /> },
  Failed:    { label: 'Failed',    cls: 'badge-danger',  icon: <XCircle size={12} /> },
  Cancelled: { label: 'Cancelled', cls: 'badge-neutral', icon: <XCircle size={12} /> },
};

export const AllocationsPage: React.FC = () => {
  const { showToast, ToastComponent } = useToast();

  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await AllocationApi.getAll();
      setAllocations(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load allocations.';
      setError(msg);
      if (quiet) showToast(msg, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = allocations.filter(a => {
    const q = search.toLowerCase();
    const matchSearch =
      a.resourceName?.toLowerCase().includes(q) ||
      a.destinationName?.toLowerCase().includes(q) ||
      a.allocatedBy?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalFulfilled = allocations.filter(a => a.status === 'Fulfilled').length;
  const totalPending   = allocations.filter(a => a.status === 'Pending').length;
  const totalQty       = allocations.filter(a => a.status === 'Fulfilled').reduce((s, a) => s + a.quantity, 0);

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="page-container">
      {ToastComponent}

      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={22} style={{ color: 'var(--color-brand-blue)' }} />
            Allocation History
          </h1>
          <p className="page-subtitle">Track all resource allocations across shelters and emergency requests.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--color-brand-blue)' }}>{allocations.length}</div>
          <div className="kpi-label">Total Records</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{totalFulfilled}</div>
          <div className="kpi-label">Fulfilled</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>{totalPending}</div>
          <div className="kpi-label">Pending</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--color-brand-blue)' }}>{totalQty.toLocaleString()}</div>
          <div className="kpi-label">Units Fulfilled</div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <input
              className="form-input"
              placeholder="Search by resource, destination, or staff…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.25rem' }}
            />
            <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}>
              🔍
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} style={{ color: 'var(--color-text-secondary)' }} />
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: '130px' }}>
              <option value="All">All Statuses</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          {(search || statusFilter !== 'All') && (
            <button className="btn btn-ghost" onClick={() => { setSearch(''); setStatusFilter('All'); }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table / states */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading allocations…</p>
        </div>
      ) : error ? (
        <div className="error-state card">
          <AlertCircle size={32} style={{ color: 'var(--color-danger)' }} />
          <p style={{ margin: '0.5rem 0' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => load()}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <Package size={40} style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>No allocations found</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {search || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'No allocations have been recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Resource</th>
                  <th>Category</th>
                  <th>Destination</th>
                  <th>Quantity</th>
                  <th>Allocated By</th>
                  <th>Date &amp; Time</th>
                  <th>Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((alloc, idx) => {
                  const sc = STATUS_CONFIG[alloc.status] ?? STATUS_CONFIG['Pending'];
                  return (
                    <tr key={alloc.id}>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{idx + 1}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {alloc.resourceName ?? `Resource #${alloc.resourceId}`}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{alloc.resourceCategory ?? '—'}</span>
                      </td>
                      <td>{alloc.destinationName ?? '—'}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--color-brand-blue)' }}>
                          {alloc.quantity.toLocaleString()}
                        </span>
                        {alloc.unit ? <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.25rem', fontSize: '0.8rem' }}>{alloc.unit}</span> : null}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{alloc.allocatedBy ?? '—'}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {formatDate(alloc.allocatedAt)}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                        {alloc.notes ?? '—'}
                      </td>
                      <td>
                        <span className={`badge ${sc.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
            Showing {filtered.length} of {allocations.length} records
            {(search || statusFilter !== 'All') && ' (filtered)'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationsPage;
