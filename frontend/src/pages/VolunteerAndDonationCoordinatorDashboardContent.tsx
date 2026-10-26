import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  MonetaryDonation,
  GoodsDonationRequest,
  VolunteerRegistration,
  VolunteerSchedule,
  InAppNotification,
  Volunteer
} from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Package,
  Users,
  Calendar,
  AlertTriangle,
  Bell,
  BarChart3,
  Search,
  Plus,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileCheck,
  CalendarCheck
} from 'lucide-react';

export const VolunteerAndDonationCoordinatorDashboardContent: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'all-requests' | 'monetary' | 'goods' | 'volunteer-apps' | 'volunteer-roster' | 'scheduling' | 'handovers' | 'notifications' | 'reports'
  >('overview');

  // Datasets
  const [monetaryDonations, setMonetaryDonations] = useState<MonetaryDonation[]>([]);
  const [goodsDonations, setGoodsDonations] = useState<GoodsDonationRequest[]>([]);
  const [volunteerRegistrations, setVolunteerRegistrations] = useState<VolunteerRegistration[]>([]);
  const [volunteerSchedules, setVolunteerSchedules] = useState<VolunteerSchedule[]>([]);
  const [volunteersRoster, setVolunteersRoster] = useState<Volunteer[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Expanded goods rows
  const [expandedGoods, setExpandedGoods] = useState<Record<string, boolean>>({});

  // Modals
  const [approveGoodsModal, setApproveGoodsModal] = useState<{
    request: GoodsDonationRequest | null;
    earliestDate: string;
    latestDate: string;
    location: string;
    slots: string;
    error: string | null;
  }>({
    request: null,
    earliestDate: '2026-11-01',
    latestDate: '2026-11-07',
    location: 'Rivagama Central Relief Warehouse',
    slots: '09:00 AM - 12:00 PM, 02:00 PM - 05:00 PM',
    error: null
  });

  const [rejectModal, setRejectModal] = useState<{
    type: 'goods' | 'monetary' | 'volunteer';
    id: string;
    reference: string;
    reason: string;
  } | null>(null);

  const [newScheduleModal, setNewScheduleModal] = useState<{
    show: boolean;
    volunteerId: string;
    volunteerName: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    activity: string;
    conflictWarning: string | null;
    error: string | null;
  }>({
    show: false,
    volunteerId: '',
    volunteerName: '',
    date: '2026-11-04',
    startTime: '09:00',
    endTime: '13:00',
    location: 'Rivagama Relief Center',
    activity: 'Meal Distribution',
    conflictWarning: null,
    error: null
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const [mon, gds, vreg, sch, rost, notif] = await Promise.all([
      api.getMonetaryDonations(),
      api.getGoodsDonations(),
      api.getVolunteerRegistrations(),
      api.getVolunteerSchedules(),
      api.getVolunteers(),
      api.getInAppNotifications('Coordinator')
    ]);
    setMonetaryDonations(mon);
    setGoodsDonations(gds);
    setVolunteerRegistrations(vreg);
    setVolunteerSchedules(sch);
    setVolunteersRoster(rost);
    setNotifications(notif);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // ------------------------------------------
  // Monetary Verification Handlers
  // ------------------------------------------
  const handleVerifyMonetary = async (id: string, isApproved: boolean) => {
    if (!isApproved) {
      const mon = monetaryDonations.find(m => m.id === id);
      setRejectModal({
        type: 'monetary',
        id: id,
        reference: mon?.donationReference || id,
        reason: ''
      });
      return;
    }

    try {
      await api.verifyMonetaryDonation(id, true);
      showToast('Monetary donation verified and confirmed.');
      loadAllData();
    } catch (err: any) {
      alert(err?.message || 'Failed to verify payment.');
    }
  };

  // ------------------------------------------
  // Goods Approval Handlers
  // ------------------------------------------
  const openApproveGoods = (req: GoodsDonationRequest) => {
    setApproveGoodsModal({
      request: req,
      earliestDate: '2026-11-01',
      latestDate: '2026-11-07',
      location: 'Rivagama Central Relief Warehouse',
      slots: '09:00 AM - 12:00 PM, 02:00 PM - 05:00 PM',
      error: null
    });
  };

  const submitApproveGoods = async () => {
    if (!approveGoodsModal.request) return;
    if (approveGoodsModal.earliestDate > approveGoodsModal.latestDate) {
      setApproveGoodsModal(prev => ({ ...prev, error: 'Earliest date cannot be after latest date.' }));
      return;
    }

    const slotArray = approveGoodsModal.slots.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await api.approveGoodsDonation(
        approveGoodsModal.request.id,
        approveGoodsModal.earliestDate,
        approveGoodsModal.latestDate,
        approveGoodsModal.location,
        slotArray
      );
      showToast(`Goods request ${approveGoodsModal.request.requestReference} approved with handover range.`);
      setApproveGoodsModal({ request: null, earliestDate: '', latestDate: '', location: '', slots: '', error: null });
      loadAllData();
    } catch (err: any) {
      setApproveGoodsModal(prev => ({ ...prev, error: err?.message || 'Approval failed.' }));
    }
  };

  const handleConfirmGoodsReceived = async (reqId: string) => {
    try {
      await api.confirmGoodsReceived(reqId, 'Coordinator (Officer Duty)');
      showToast('Goods formally received into disaster inventory!');
      loadAllData();
    } catch (err: any) {
      alert(err?.message || 'Error updating status.');
    }
  };

  // ------------------------------------------
  // Volunteer Registration Approval Handlers
  // ------------------------------------------
  const handleApproveVolunteer = async (id: string) => {
    try {
      await api.approveVolunteerRegistration(id);
      showToast('Volunteer registration approved.');
      loadAllData();
    } catch (err: any) {
      alert(err?.message || 'Failed to approve volunteer.');
    }
  };

  // Rejection Submission
  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    const { type, id, reason } = rejectModal;
    const defaultReason = reason.trim() || 'Criteria not met.';

    try {
      if (type === 'monetary') {
        await api.verifyMonetaryDonation(id, false, defaultReason);
        showToast('Payment rejected.');
      } else if (type === 'goods') {
        await api.rejectGoodsDonation(id, defaultReason);
        showToast('Goods request declined.');
      } else if (type === 'volunteer') {
        await api.rejectVolunteerRegistration(id, defaultReason);
        showToast('Volunteer application rejected.');
      }
      setRejectModal(null);
      loadAllData();
    } catch (err: any) {
      alert(err?.message || 'Rejection failed.');
    }
  };

  // ------------------------------------------
  // Volunteer Scheduling Handlers
  // ------------------------------------------
  const openNewScheduleModal = () => {
    const approvedVols = volunteersRoster.filter(v => v.status !== 'On Leave');
    const firstVol = approvedVols[0];
    setNewScheduleModal({
      show: true,
      volunteerId: firstVol?.volunteerId || firstVol?.id || 'VOL-0001',
      volunteerName: firstVol?.fullName || 'Ruwan D.',
      date: '2026-11-04',
      startTime: '09:00',
      endTime: '13:00',
      location: 'Rivagama Relief Center',
      activity: 'Meal Distribution',
      conflictWarning: null,
      error: null
    });
  };

  const submitCreateSchedule = async () => {
    if (newScheduleModal.startTime >= newScheduleModal.endTime) {
      setNewScheduleModal(prev => ({ ...prev, error: 'Shift end time must be later than start time.' }));
      return;
    }

    try {
      const res = await api.createVolunteerSchedule({
        volunteerId: newScheduleModal.volunteerId,
        volunteerName: newScheduleModal.volunteerName,
        date: newScheduleModal.date,
        startTime: newScheduleModal.startTime,
        endTime: newScheduleModal.endTime,
        location: newScheduleModal.location,
        activity: newScheduleModal.activity
      });

      if (res.hasConflictWarning) {
        showToast(`Warning: Volunteer already had an overlapping shift on ${newScheduleModal.date}! Shift created with alert.`);
      } else {
        showToast(`Volunteer shift created for ${newScheduleModal.volunteerName} on ${newScheduleModal.date}.`);
      }

      setNewScheduleModal(prev => ({ ...prev, show: false }));
      loadAllData();
    } catch (err: any) {
      setNewScheduleModal(prev => ({ ...prev, error: err?.message || 'Failed to create schedule.' }));
    }
  };

  const handleCancelSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this shift?')) return;
    await api.cancelVolunteerSchedule(id);
    showToast('Shift cancelled.');
    loadAllData();
  };

  // Calculations for KPI Summary
  const pendingMonetary = monetaryDonations.filter(m => m.status === 'Payment Verification').length;
  const pendingGoods = goodsDonations.filter(g => g.status === 'Pending Approval').length;
  const pendingVols = volunteerRegistrations.filter(v => v.status === 'Pending Approval').length;
  const activeSchedules = volunteerSchedules.filter(s => s.status !== 'Cancelled').length;
  const confirmedHandovers = goodsDonations.filter(g => g.status === 'Handover Scheduled').length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          backgroundColor: '#065f46',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#a7f3d0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldCheck size={14} /> Volunteer and Donation Coordinator
          </span>
          <span style={{
            backgroundColor: '#fef3c7',
            color: '#b45309',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            {pendingMonetary + pendingGoods + pendingVols} Pending Action Items
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
          Volunteer and Donation Coordinator Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Comprehensive operational governance for reviewing donation requests, verifying bank payments, scheduling physical goods handovers, and managing volunteer rosters.
        </p>
      </div>

      {/* Section Navigation Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '8px',
        marginBottom: '24px',
        overflowX: 'auto',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'overview', label: '1. Dashboard Overview', icon: BarChart3 },
          { id: 'all-requests', label: '2. Donation Requests', icon: Clock },
          { id: 'monetary', label: `3. Monetary (${pendingMonetary})`, icon: DollarSign },
          { id: 'goods', label: `4. Goods (${pendingGoods})`, icon: Package },
          { id: 'volunteer-apps', label: `5. Vol. Apps (${pendingVols})`, icon: Users },
          { id: 'volunteer-roster', label: '6. Vol. Management', icon: Users },
          { id: 'scheduling', label: '7. Vol. Scheduling', icon: Calendar },
          { id: 'handovers', label: `8. Handovers (${confirmedHandovers})`, icon: CalendarCheck },
          { id: 'notifications', label: `9. Notifications (${notifications.length})`, icon: Bell },
          { id: 'reports', label: '10. Reports / Summary', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: isSelected ? '#1d4ed8' : '#ffffff',
                color: isSelected ? '#ffffff' : '#475569',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD OVERVIEW */}
      {/* ========================================================================= */}
      {activeSection === 'overview' && (
        <div>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pending Goods</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>{pendingGoods}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Awaiting date range approval</div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pending Bank Transfers</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '6px' }}>{pendingMonetary}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Awaiting slip verification</div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Volunteer Applications</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed', marginTop: '6px' }}>{pendingVols}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>New intake applications</div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Scheduled Handovers</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0d9488', marginTop: '6px' }}>{confirmedHandovers}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Ready for warehouse receipt</div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active Volunteers</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>{volunteersRoster.length}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{activeSchedules} confirmed shifts</div>
            </div>
          </div>

          {/* Quick Action Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
                Coordinator Urgent Triage Queue
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {goodsDonations.filter(g => g.status === 'Pending Approval').map(g => (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#9a3412' }}>Physical Goods: {g.requestReference}</strong>
                      <div style={{ fontSize: '12px', color: '#475569' }}>From {g.donorName} ({g.donorId}) · {g.items.length} goods categories</div>
                    </div>
                    <button
                      onClick={() => openApproveGoods(g)}
                      style={{ backgroundColor: '#2563eb', color: '#fff', padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                    >
                      Set Handover Range
                    </button>
                  </div>
                ))}

                {monetaryDonations.filter(m => m.status === 'Payment Verification').map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#1e40af' }}>Bank Transfer: {m.donationReference}</strong>
                      <div style={{ fontSize: '12px', color: '#475569' }}>{m.donorName} · {m.currency} {m.amount.toLocaleString()} · Slip: {m.bankReference}</div>
                    </div>
                    <button
                      onClick={() => handleVerifyMonetary(m.id, true)}
                      style={{ backgroundColor: '#059669', color: '#fff', padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                    >
                      Verify Payment
                    </button>
                  </div>
                ))}

                {volunteerRegistrations.filter(v => v.status === 'Pending Approval').map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#6b21a8' }}>Volunteer Application: {v.registrationReference}</strong>
                      <div style={{ fontSize: '12px', color: '#475569' }}>{v.fullName} ({v.volunteerId}) · {v.activityTypes.join(', ')}</div>
                    </div>
                    <button
                      onClick={() => handleApproveVolunteer(v.id)}
                      style={{ backgroundColor: '#7c3aed', color: '#fff', padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                    >
                      Approve Volunteer
                    </button>
                  </div>
                ))}

                {pendingMonetary === 0 && pendingGoods === 0 && pendingVols === 0 && (
                  <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '24px 0' }}>
                    All donation and volunteer requests are currently processed and up to date!
                  </p>
                )}
              </div>
            </div>

            {/* Shift Scheduler Shortcut Card */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                Volunteer Dispatch Controls
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
                Assign verified volunteers to emergency relief locations, schedule meal distributions, and dispatch aid teams.
              </p>
              <button
                onClick={openNewScheduleModal}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <Plus size={16} /> Create New Shift Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ALL DONATION REQUESTS (COMBINED) */}
      {/* ========================================================================= */}
      {activeSection === 'all-requests' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Unified Donation Requests Overview
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Reference</th>
                <th style={{ padding: '10px 12px' }}>Donor ID</th>
                <th style={{ padding: '10px 12px' }}>Donor Name</th>
                <th style={{ padding: '10px 12px' }}>Details / Volume</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {monetaryDonations.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-blue">Monetary</span></td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{m.donationReference}</td>
                  <td style={{ padding: '10px 12px' }}>{m.donorId}</td>
                  <td style={{ padding: '10px 12px' }}>{m.donorName}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.currency} {m.amount.toLocaleString()} ({m.paymentMethod})</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="badge badge-green">{m.status}</span>
                  </td>
                </tr>
              ))}
              {goodsDonations.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-amber">Goods</span></td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{g.requestReference}</td>
                  <td style={{ padding: '10px 12px' }}>{g.donorId}</td>
                  <td style={{ padding: '10px 12px' }}>{g.donorName}</td>
                  <td style={{ padding: '10px 12px' }}>{g.items.length} goods items manifest</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="badge badge-blue">{g.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MONETARY DONATIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSection === 'monetary' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Monetary Donation Verification & Audit Table
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Reference</th>
                  <th style={{ padding: '10px 12px' }}>Donor ID</th>
                  <th style={{ padding: '10px 12px' }}>Donor Name</th>
                  <th style={{ padding: '10px 12px' }}>Amount</th>
                  <th style={{ padding: '10px 12px' }}>Method</th>
                  <th style={{ padding: '10px 12px' }}>Bank Slip Ref</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Coordinator Action</th>
                </tr>
              </thead>
              <tbody>
                {monetaryDonations.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{m.donationReference}</td>
                    <td style={{ padding: '10px 12px' }}><span className="badge badge-blue">{m.donorId}</span></td>
                    <td style={{ padding: '10px 12px' }}>{m.donorName}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{m.currency} {m.amount.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>{m.paymentMethod}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{m.bankReference || 'N/A (Card Token)'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="badge badge-green">{m.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {m.status === 'Payment Verification' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleVerifyMonetary(m.id, true)}
                            style={{ backgroundColor: '#059669', color: '#fff', padding: '6px 10px', fontSize: '11px', borderRadius: '4px' }}
                          >
                            Verify & Confirm
                          </button>
                          <button
                            onClick={() => handleVerifyMonetary(m.id, false)}
                            style={{ backgroundColor: '#dc2626', color: '#fff', padding: '6px 10px', fontSize: '11px', borderRadius: '4px' }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {m.status === 'Confirmed' ? `Verified by ${m.verifiedBy || 'System'}` : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PHYSICAL GOODS DONATIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSection === 'goods' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Physical Goods Donation Requests & Handover Approvals
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {goodsDonations.map(req => {
              const isExpanded = expandedGoods[req.id];
              return (
                <div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>{req.requestReference}</strong>
                        <span className="badge badge-blue">{req.donorId}</span>
                        <span className="badge badge-green">{req.status}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                        Donor: <strong>{req.donorName}</strong> ({req.contactNumber}) · Location: {req.address}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => setExpandedGoods({ ...expandedGoods, [req.id]: !isExpanded })}
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {req.items.length} Items Manifest
                      </button>

                      {req.status === 'Pending Approval' && (
                        <>
                          <button
                            onClick={() => openApproveGoods(req)}
                            style={{ backgroundColor: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}
                          >
                            Approve Handover Window
                          </button>
                          <button
                            onClick={() => setRejectModal({ type: 'goods', id: req.id, reference: req.requestReference, reason: '' })}
                            style={{ backgroundColor: '#dc2626', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {req.status === 'Handover Scheduled' && (
                        <button
                          onClick={() => handleConfirmGoodsReceived(req.id)}
                          style={{ backgroundColor: '#059669', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}
                        >
                          Confirm Goods Received at Handover
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Manifest Table */}
                  {isExpanded && (
                    <div style={{ marginTop: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Detailed Items List:</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                            <th style={{ padding: '6px' }}>Category</th>
                            <th style={{ padding: '6px' }}>Description</th>
                            <th style={{ padding: '6px' }}>Quantity</th>
                            <th style={{ padding: '6px' }}>Condition</th>
                            <th style={{ padding: '6px' }}>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {req.items.map((it, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '6px' }}>{it.category}</td>
                              <td style={{ padding: '6px', fontWeight: 600 }}>{it.itemName}</td>
                              <td style={{ padding: '6px' }}>{it.quantity} {it.unit}</td>
                              <td style={{ padding: '6px' }}>{it.condition}</td>
                              <td style={{ padding: '6px', color: '#64748b' }}>{it.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Approved Handover Window Information */}
                  {req.earliestHandoverDate && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#334155', backgroundColor: '#eff6ff', padding: '8px 12px', borderRadius: '6px' }}>
                      <strong>Approved Handover Range:</strong> {req.earliestHandoverDate} to {req.latestHandoverDate} · <strong>Location:</strong> {req.handoverLocation}
                      {req.selectedHandoverDate && (
                        <div style={{ color: '#0d9488', fontWeight: 700, marginTop: '2px' }}>
                          Agreed Appointment: {req.selectedHandoverDate} ({req.selectedTimeSlot})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VOLUNTEER REGISTRATIONS (APPROVALS) */}
      {/* ========================================================================= */}
      {activeSection === 'volunteer-apps' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Volunteer Applications Review & Approval Queue
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {volunteerRegistrations.map(v => (
              <div key={v.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '15px' }}>{v.fullName}</strong>
                    <span className="badge badge-blue">{v.volunteerId}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Ref: {v.registrationReference}</span>
                    <span className="badge badge-green">{v.status}</span>
                  </div>
                  {v.status === 'Pending Approval' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApproveVolunteer(v.id)}
                        style={{ backgroundColor: '#059669', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}
                      >
                        Approve Application
                      </button>
                      <button
                        onClick={() => setRejectModal({ type: 'volunteer', id: v.id, reference: v.registrationReference, reason: '' })}
                        style={{ backgroundColor: '#dc2626', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: '#475569', marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div><strong>Email:</strong> {v.email} | <strong>Phone:</strong> {v.phoneNumber}</div>
                  <div><strong>Address:</strong> {v.address}</div>
                  <div><strong>Preferred Locations:</strong> {v.preferredLocations.join(', ')}</div>
                  <div><strong>Availability:</strong> {v.availableStartTime} - {v.availableEndTime} ({v.preferredDaysOfWeek.join(', ')})</div>
                  <div><strong>Interests:</strong> {v.activityTypes.join(', ')}</div>
                  <div><strong>Skills:</strong> {v.skills}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VOLUNTEER MANAGEMENT (ROSTER) */}
      {/* ========================================================================= */}
      {activeSection === 'volunteer-roster' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Active Volunteer Personnel Roster
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                All registered volunteers, skills profile, availability status, and accumulated service hours.
              </p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Volunteer ID</th>
                <th style={{ padding: '10px 12px' }}>Name</th>
                <th style={{ padding: '10px 12px' }}>Contact</th>
                <th style={{ padding: '10px 12px' }}>Skills</th>
                <th style={{ padding: '10px 12px' }}>Weekly Days</th>
                <th style={{ padding: '10px 12px' }}>Logged Hours</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {volunteersRoster.map(vol => (
                <tr key={vol.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-blue">{vol.volunteerId || 'VOL-0001'}</span></td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{vol.fullName}</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>{vol.email}</td>
                  <td style={{ padding: '10px 12px' }}>{vol.skills}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{vol.weeklyAvailability.join(', ')}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{vol.totalHours} hrs</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="badge badge-green">{vol.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. VOLUNTEER SCHEDULING INTERFACE */}
      {/* ========================================================================= */}
      {activeSection === 'scheduling' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#2563eb" /> Volunteer Shift Scheduling Management
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Create, manage, and synchronize operational relief shift assignments across all field locations.
              </p>
            </div>
            <button
              onClick={openNewScheduleModal}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} /> New Shift Assignment
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Volunteer Name</th>
                <th style={{ padding: '10px 12px' }}>Volunteer ID</th>
                <th style={{ padding: '10px 12px' }}>Date</th>
                <th style={{ padding: '10px 12px' }}>Start Time</th>
                <th style={{ padding: '10px 12px' }}>End Time</th>
                <th style={{ padding: '10px 12px' }}>Location</th>
                <th style={{ padding: '10px 12px' }}>Assignment / Activity</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {volunteerSchedules.filter(s => s.status !== 'Cancelled').map(sch => (
                <tr key={sch.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{sch.volunteerName}</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-blue">{sch.volunteerId}</span></td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{sch.date}</td>
                  <td style={{ padding: '10px 12px' }}>{sch.startTime}</td>
                  <td style={{ padding: '10px 12px' }}>{sch.endTime}</td>
                  <td style={{ padding: '10px 12px', color: '#1e40af', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {sch.location}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{sch.activity}</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-green">{sch.status}</span></td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      onClick={() => handleCancelSchedule(sch.id)}
                      style={{
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      Cancel Shift
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. HANDOVER SCHEDULING & RECEIPT */}
      {/* ========================================================================= */}
      {activeSection === 'handovers' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Goods Delivery & Handover Scheduling Center
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Request Ref</th>
                <th style={{ padding: '10px 12px' }}>Donor ID</th>
                <th style={{ padding: '10px 12px' }}>Donor Name</th>
                <th style={{ padding: '10px 12px' }}>Handover Date</th>
                <th style={{ padding: '10px 12px' }}>Time Slot</th>
                <th style={{ padding: '10px 12px' }}>Designated Depot</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Warehouse Action</th>
              </tr>
            </thead>
            <tbody>
              {goodsDonations.filter(g => g.selectedHandoverDate || g.status === 'Approved').map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{g.requestReference}</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-blue">{g.donorId}</span></td>
                  <td style={{ padding: '10px 12px' }}>{g.donorName}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{g.selectedHandoverDate || 'Awaiting Donor Selection'}</td>
                  <td style={{ padding: '10px 12px' }}>{g.selectedTimeSlot || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>{g.handoverLocation}</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-green">{g.status}</span></td>
                  <td style={{ padding: '10px 12px' }}>
                    {g.status === 'Handover Scheduled' ? (
                      <button
                        onClick={() => handleConfirmGoodsReceived(g.id)}
                        style={{ backgroundColor: '#059669', color: '#fff', padding: '6px 12px', fontSize: '11px', borderRadius: '4px', fontWeight: 700 }}
                      >
                        Confirm Received
                      </button>
                    ) : g.status === 'Received' ? (
                      <span style={{ color: '#059669', fontWeight: 700, fontSize: '11px' }}>Received & Shelved</span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Pending Schedule</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. NOTIFICATIONS STREAM */}
      {/* ========================================================================= */}
      {activeSection === 'notifications' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Coordinator In-App Dispatch & Notification Center
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: n.isRead ? '#f8fafc' : '#eff6ff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{n.title}</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{n.message}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    {new Date(n.timestamp).toLocaleString()}
                  </div>
                </div>
                {!n.isRead && (
                  <button
                    onClick={async () => {
                      await api.markNotificationRead(n.id);
                      loadAllData();
                    }}
                    style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. REPORTS OR SUMMARY */}
      {/* ========================================================================= */}
      {activeSection === 'reports' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Operational Summary & Relief Resource Metrics
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 700 }}>Total Verified Monetary Aid</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e3a8a', marginTop: '6px' }}>
                LKR {monetaryDonations.filter(m => m.status === 'Confirmed').reduce((s, m) => s + m.amount, 0).toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 700 }}>Total Physical Relief Packs</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#047857', marginTop: '6px' }}>
                {goodsDonations.reduce((acc, curr) => acc + curr.items.reduce((sum, it) => sum + it.quantity, 0), 0)} items
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
              <div style={{ fontSize: '12px', color: '#6b21a8', fontWeight: 700 }}>Mobilized Volunteers</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#581c87', marginTop: '6px' }}>
                {volunteersRoster.length} active personnel
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPROVE GOODS DONATION & SET HANDOVER WINDOW */}
      {/* ========================================================================= */}
      {approveGoodsModal.request && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Approve Goods Request & Set Handover Range
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Set acceptable handover dates and delivery location for <strong>{approveGoodsModal.request.requestReference}</strong> ({approveGoodsModal.request.donorName}).
            </p>

            {approveGoodsModal.error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {approveGoodsModal.error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Earliest Acceptable Date *
                </label>
                <input
                  type="date"
                  required
                  value={approveGoodsModal.earliestDate}
                  onChange={e => setApproveGoodsModal({ ...approveGoodsModal, earliestDate: e.target.value, error: null })}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Latest Acceptable Date *
                </label>
                <input
                  type="date"
                  required
                  value={approveGoodsModal.latestDate}
                  onChange={e => setApproveGoodsModal({ ...approveGoodsModal, latestDate: e.target.value, error: null })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Handover Depot / Warehouse Location *
              </label>
              <input
                type="text"
                required
                value={approveGoodsModal.location}
                onChange={e => setApproveGoodsModal({ ...approveGoodsModal, location: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Available Time Slots (Comma-separated) *
              </label>
              <input
                type="text"
                required
                value={approveGoodsModal.slots}
                onChange={e => setApproveGoodsModal({ ...approveGoodsModal, slots: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setApproveGoodsModal({ request: null, earliestDate: '', latestDate: '', location: '', slots: '', error: null })}
                style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitApproveGoods}
                style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}
              >
                Approve & Notify Donor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECTION REASON */}
      {/* ========================================================================= */}
      {rejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '460px', width: '100%' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#b91c1c', marginBottom: '6px' }}>
              Decline Request: {rejectModal.reference}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
              Please provide a specific reason for declining this request. The applicant will be notified immediately.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Unverified bank slip, warehouse at max capacity, or outside triage zone..."
              value={rejectModal.reason}
              onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
              style={{ marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                style={{ backgroundColor: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE VOLUNTEER SHIFT ASSIGNMENT */}
      {/* ========================================================================= */}
      {newScheduleModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', maxWidth: '520px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Assign Volunteer Shift
            </h3>

            {newScheduleModal.error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {newScheduleModal.error}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Select Volunteer (Approved Roster) *
              </label>
              <select
                value={newScheduleModal.volunteerId}
                onChange={e => {
                  const sel = volunteersRoster.find(v => (v.volunteerId || v.id) === e.target.value);
                  setNewScheduleModal({
                    ...newScheduleModal,
                    volunteerId: e.target.value,
                    volunteerName: sel ? sel.fullName : 'Volunteer'
                  });
                }}
              >
                {volunteersRoster.map(v => (
                  <option key={v.id} value={v.volunteerId || v.id}>
                    {v.fullName} ({v.volunteerId || 'VOL-0001'}) - {v.skills}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Shift Date *
                </label>
                <input
                  type="date"
                  required
                  value={newScheduleModal.date}
                  onChange={e => setNewScheduleModal({ ...newScheduleModal, date: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Relief Location *
                </label>
                <input
                  type="text"
                  required
                  value={newScheduleModal.location}
                  onChange={e => setNewScheduleModal({ ...newScheduleModal, location: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Shift Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={newScheduleModal.startTime}
                  onChange={e => setNewScheduleModal({ ...newScheduleModal, startTime: e.target.value, error: null })}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Shift End Time *
                </label>
                <input
                  type="time"
                  required
                  value={newScheduleModal.endTime}
                  onChange={e => setNewScheduleModal({ ...newScheduleModal, endTime: e.target.value, error: null })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Assigned Activity / Relief Duty *
              </label>
              <input
                type="text"
                required
                value={newScheduleModal.activity}
                onChange={e => setNewScheduleModal({ ...newScheduleModal, activity: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setNewScheduleModal(prev => ({ ...prev, show: false }))}
                style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCreateSchedule}
                style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}
              >
                Confirm & Publish Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
