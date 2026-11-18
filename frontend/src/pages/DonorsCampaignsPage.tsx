import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CampaignKpis, Donation } from '../types';
import { DollarSign, Package, AlertTriangle, Plus, Filter, CheckCircle2, X, FileText } from 'lucide-react';

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
    <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#EDF6FF', minHeight: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          backgroundColor: '#E8F9F2',
          border: '1px solid #12A86B',
          color: '#0D9665',
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          <CheckCircle2 size={18} color="#12A86B" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Breadcrumb style header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              backgroundColor: '#0866C6',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              10
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#526784', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Donors &amp; Campaigns
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#102B5C', letterSpacing: '-0.02em', margin: 0 }}>
            Campaigns &amp; Aid Distribution
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#12A86B',
            color: '#ffffff',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(18, 168, 107, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>New Donation</span>
        </button>
      </div>

      {/* 3 Metric KPI Cards (Matching Screenshot 10) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Funds */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #D5E4F3',
          padding: '20px 24px',
          boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '18px'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            backgroundColor: '#12A86B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0
          }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#526784' }}>Total</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#102B5C', marginTop: '2px' }}>
              LKR 4.2M
            </div>
          </div>
        </div>

        {/* Card 2: Medical Items */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #D5E4F3',
          padding: '20px 24px',
          boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '18px'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            backgroundColor: '#0866C6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0
          }}>
            <Package size={28} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#526784' }}>Medical items</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#102B5C', marginTop: '2px' }}>
              {kpis?.totalSuppliesAndItemsCount ? kpis.totalSuppliesAndItemsCount.toLocaleString() : '1,284'}
            </div>
          </div>
        </div>

        {/* Card 3: Disposal */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #D5E4F3',
          padding: '20px 24px',
          boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '18px'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            backgroundColor: '#FFB51B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0
          }}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#526784' }}>Disposal</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#102B5C', marginTop: '2px' }}>
              {kpis?.activeWasteFlagsCount ?? 3}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Details & Recent Donations in Grid (Matching Screenshot 10) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Campaign Flood Relief 2024 */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #D5E4F3',
          padding: '24px 28px',
          boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#102B5C', margin: '0 0 8px' }}>
            Campaign: Flood Relief 2024
          </h2>
          <div style={{ fontSize: '13px', color: '#526784', marginBottom: '14px' }}>
            Goal: LKR 5M
          </div>

          {/* Progress bar with primary blue */}
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#EDF6FF',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '84%',
              height: '100%',
              backgroundColor: '#0866C6',
              borderRadius: '9999px'
            }} />
          </div>

          {/* Breakdown percentages */}
          <div style={{ fontSize: '13px', color: '#526784', fontWeight: 600, marginBottom: '24px' }}>
            Food 40% · Medical 35% · Shelter 25%
          </div>

          <button
            onClick={() => alert('Generating Comprehensive Campaign Audit Report...')}
            style={{
              backgroundColor: '#12A86B',
              color: '#ffffff',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 4px 10px rgba(18, 168, 107, 0.2)'
            }}
          >
            <FileText size={18} />
            <span>Generate report</span>
          </button>
        </div>

        {/* Right: Recent Donations Preview Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #D5E4F3',
          padding: '24px 28px',
          boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#102B5C', margin: '0 0 16px' }}>
            Recent donations
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #EDF6FF', color: '#526784', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Donor</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Flag</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #EDF6FF', fontSize: '13px' }}>
                <td style={{ padding: '12px 10px', color: '#102B5C', fontWeight: 600 }}>A. Silva</td>
                <td style={{ padding: '12px 10px', color: '#102B5C' }}>25,000</td>
                <td style={{ padding: '12px 10px', color: '#526784' }}>-</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #EDF6FF', fontSize: '13px' }}>
                <td style={{ padding: '12px 10px', color: '#102B5C', fontWeight: 600 }}>Org X</td>
                <td style={{ padding: '12px 10px', color: '#102B5C' }}>300,000</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    backgroundColor: '#FFB51B',
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    Urgent
                  </span>
                </td>
              </tr>
              <tr style={{ fontSize: '13px' }}>
                <td style={{ padding: '12px 10px', color: '#102B5C', fontWeight: 600 }}>K. Perera</td>
                <td style={{ padding: '12px 10px', color: '#102B5C' }}>5,000</td>
                <td style={{ padding: '12px 10px', color: '#526784' }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Donations Log Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #D5E4F3',
        padding: '24px 28px',
        boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#102B5C', margin: 0 }}>
              All Logged Donations
            </h3>
            <p style={{ fontSize: '13px', color: '#526784', margin: '4px 0 0' }}>
              Complete audit ledger of inbound relief contributions
            </p>
          </div>
          <button style={{
            backgroundColor: '#EDF6FF',
            border: '1px solid #D5E4F3',
            color: '#0866C6',
            padding: '8px 14px',
            fontSize: '13px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontWeight: 600
          }}>
            <Filter size={15} />
            <span>Filter</span>
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #EDF6FF', color: '#526784', fontSize: '12px', textTransform: 'uppercase' }}>
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
              <tr key={d.id} style={{ borderBottom: '1px solid #EDF6FF', fontSize: '13px' }}>
                <td style={{ padding: '14px', fontWeight: 700, color: '#102B5C' }}>
                  {d.donorName}
                </td>
                <td style={{ padding: '14px', color: '#526784' }}>
                  {d.itemCount > 0 ? `In-Kind Supplies (${d.itemCount} items)` : 'Financial Transfer'}
                </td>
                <td style={{ padding: '14px', fontWeight: 700, color: '#102B5C' }}>
                  LKR {d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '14px', color: '#526784' }}>
                  {d.campaignTitle}
                </td>
                <td style={{ padding: '14px' }}>
                  {d.flag === 'Urgent' ? (
                    <span style={{
                      backgroundColor: '#FFB51B',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      Urgent
                    </span>
                  ) : d.flag === 'Disposal' ? (
                    <span style={{
                      backgroundColor: '#FFF8E6',
                      color: '#FFB51B',
                      border: '1px solid rgba(255,181,27,0.4)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      Disposal
                    </span>
                  ) : (
                    <span style={{ color: '#526784' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '14px' }}>
                  <span style={{
                    backgroundColor: '#E8F9F2',
                    color: '#0D9665',
                    border: '1px solid rgba(18,168,107,0.3)',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    Received
                  </span>
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
          backgroundColor: 'rgba(11, 59, 112, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '480px',
            padding: '28px',
            boxShadow: '0 20px 30px rgba(11, 59, 112, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#102B5C', margin: 0 }}>Record New Donation</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#526784" />
              </button>
            </div>

            <form onSubmit={handleCreateDonation}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#102B5C', marginBottom: '6px' }}>
                  Donor / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Red Cross Colombo / C. Wickramasinghe"
                  style={{ borderColor: '#D5E4F3' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#102B5C', marginBottom: '6px' }}>
                    Amount (LKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ borderColor: '#D5E4F3' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#102B5C', marginBottom: '6px' }}>
                    In-Kind Items (units)
                  </label>
                  <input
                    type="number"
                    value={itemCount}
                    onChange={(e) => setItemCount(e.target.value)}
                    style={{ borderColor: '#D5E4F3' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#102B5C', marginBottom: '6px' }}>
                  Priority / Triage Flag
                </label>
                <select value={flag} onChange={(e) => setFlag(e.target.value)} style={{ borderColor: '#D5E4F3', color: '#102B5C' }}>
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
                    backgroundColor: '#EDF6FF',
                    color: '#526784',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #D5E4F3',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#12A86B',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(18, 168, 107, 0.25)'
                  }}
                >
                  Save &amp; Dispatch Observer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
