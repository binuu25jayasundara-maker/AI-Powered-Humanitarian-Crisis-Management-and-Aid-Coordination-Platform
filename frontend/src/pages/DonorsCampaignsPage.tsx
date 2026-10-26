import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CampaignKpis, Donation } from '../types';
import { DollarSign, Package, AlertTriangle, Plus, Filter, CheckCircle2, X } from 'lucide-react';

export const DonorsCampaignsPage: React.FC = () => {
  const [kpis, setKpis] = useState<CampaignKpis | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('50000');
  const [itemCount, setItemCount] = useState('0');
  const [flag, setFlag] = useState('-');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiData, donationData] = await Promise.all([
        api.getCampaignKpis(),
        api.getDonations()
      ]);
      setKpis(kpiData);
      setDonations(donationData);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordDonation({
        donorName,
        amount: parseFloat(amount) || 0,
        itemCount: parseInt(itemCount) || 0,
        flag
      });
      setShowModal(false);
      setDonorName('');
      setAmount('50000');
      setItemCount('0');
      setFlag('-');
      setToastMessage('Donation successfully recorded and allocated! Confirmation observer triggered.');
      setTimeout(() => setToastMessage(null), 5000);
      await loadData();
    } catch {
      alert('Failed to record donation');
    }
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #10b981',
          color: '#065f46',
          padding: '14px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Donors & Campaigns
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Overview of fundraising campaigns, supply tracking, and donation logs
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#1d4ed8',
            color: '#ffffff',
            padding: '11px 20px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(29, 78, 216, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>New Donation</span>
        </button>
      </div>

      {/* 3 Metric KPI Cards (Exact Screenshot 10 layout) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Total Funds Raised */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Total Funds Raised</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={20} color="#1d4ed8" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
            LKR {kpis?.totalRaisedLkr.toLocaleString() ?? '4,200,000'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            Goal: LKR {kpis?.totalGoalLkr.toLocaleString() ?? '5,000,000'} ({kpis?.overallProgressPercent ?? 84}%)
          </div>
          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '999px',
            marginTop: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${kpis?.overallProgressPercent ?? 84}%`,
              height: '100%',
              backgroundColor: '#1d4ed8',
              borderRadius: '999px'
            }} />
          </div>
        </div>

        {/* Card 2: Supplies & Items */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Supplies & Items</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={20} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
            {kpis?.totalSuppliesAndItemsCount.toLocaleString() ?? '1,284'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            Medical & In-Kind Relief Packs Received
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
            ✓ Verified for dispatch & sorting
          </div>
        </div>

        {/* Card 3: Active Waste Flags */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Active Waste Flags</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={20} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
            {kpis?.activeWasteFlagsCount ?? 3}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            Supplies flagged for quality disposal review
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#d97706' }}>
            ⚠ Quarantine inspections ongoing
          </div>
        </div>
      </div>

      {/* Campaign Details Card: Flood Relief 2024 */}
      <div className="card" style={{ marginBottom: '28px', padding: '26px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Flood Relief 2024
            </h2>
            <span className="badge badge-green">Active Campaign</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1d4ed8' }}>
            LKR {kpis?.activeCampaign?.raisedAmount.toLocaleString() ?? '4,200,000'} / LKR {kpis?.activeCampaign?.goalAmount.toLocaleString() ?? '5,000,000'}
          </div>
        </div>

        {/* Overall Bar */}
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: '#e2e8f0',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <div style={{
            width: `${kpis?.activeCampaign?.progressPercent ?? 84}%`,
            height: '100%',
            backgroundColor: '#1d4ed8',
            borderRadius: '999px'
          }} />
        </div>

        {/* Resource Allocation Breakdown */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>
            Resource Allocation Distribution:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Food & Rations</span>
                <span style={{ fontWeight: 700, color: '#1d4ed8' }}>40%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', marginTop: '8px' }}>
                <div style={{ width: '40%', height: '100%', backgroundColor: '#1d4ed8', borderRadius: '999px' }} />
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Medical Supplies</span>
                <span style={{ fontWeight: 700, color: '#0d9488' }}>35%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', marginTop: '8px' }}>
                <div style={{ width: '35%', height: '100%', backgroundColor: '#0d9488', borderRadius: '999px' }} />
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Temporary Shelter</span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>25%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', marginTop: '8px' }}>
                <div style={{ width: '25%', height: '100%', backgroundColor: '#d97706', borderRadius: '999px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Donations Table (Screenshot 10) */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Recent Donations
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Financial and in-kind donor transactions logged in the system
            </p>
          </div>
          <button style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#475569',
            padding: '8px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Filter size={15} />
            <span>Filter</span>
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>Donor Name</th>
              <th style={{ padding: '12px 14px' }}>Type / Item Notes</th>
              <th style={{ padding: '12px 14px' }}>Amount (LKR)</th>
              <th style={{ padding: '12px 14px' }}>Campaign</th>
              <th style={{ padding: '12px 14px' }}>Flag</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {d.donorName}
                </td>
                <td style={{ padding: '14px', color: '#475569' }}>
                  {d.itemCount > 0 ? `In-Kind Supplies (${d.itemCount} items)` : 'Financial Transfer'}
                </td>
                <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>
                  LKR {d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '14px', color: '#64748b' }}>
                  {d.campaignTitle}
                </td>
                <td style={{ padding: '14px' }}>
                  {d.flag === 'Urgent' ? (
                    <span className="badge badge-amber" style={{ color: '#dc2626', backgroundColor: '#fee2e2' }}>
                      Urgent
                    </span>
                  ) : d.flag === 'Disposal' ? (
                    <span className="badge badge-amber">
                      Disposal
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '14px' }}>
                  <span className="badge badge-green">Received</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Record New Donation */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '480px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Record New Donation</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleCreateDonation}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Donor / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Red Cross Colombo / C. Wickramasinghe"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Amount (LKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    In-Kind Items (units)
                  </label>
                  <input
                    type="number"
                    value={itemCount}
                    onChange={(e) => setItemCount(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Priority / Triage Flag
                </label>
                <select value={flag} onChange={(e) => setFlag(e.target.value)}>
                  <option value="-">Normal (-)</option>
                  <option value="Urgent">Urgent Priority</option>
                  <option value="Disposal">Flag for Waste Inspection</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '10px 18px',
                    borderRadius: '8px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#1d4ed8',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 700
                  }}
                >
                  Save & Dispatch Observer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
