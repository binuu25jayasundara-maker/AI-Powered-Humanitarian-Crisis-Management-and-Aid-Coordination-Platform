import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  MonetaryDonation,
  GoodsDonationRequest,
  GoodsItem,
  GoodsCategory,
  GoodsCondition,
  VolunteerRegistration,
  VolunteerSchedule,
  InAppNotification
} from '../types';
import {
  Heart,
  DollarSign,
  Package,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  CreditCard,
  Plus,
  Trash2,
  Bell,
  Search,
  MapPin,
  ShieldCheck,
  Send,
  CalendarCheck
} from 'lucide-react';
import { BrowserStyleTabs, TabItem } from '../components/BrowserStyleTabs';

interface DashboardProps {
  currentUserEmail?: string;
  currentUserName?: string;
}

export const DonationAndVolunteerOfficerDashboardContent: React.FC<DashboardProps> = ({
  currentUserEmail,
  currentUserName
}) => {
  const [activeTab, setActiveTab] = useState<'monetary' | 'goods' | 'volunteer' | 'my-donations' | 'my-volunteers' | 'notifications'>('monetary');

  // Resolve current authenticated user identity
  const userEmail = currentUserEmail || (() => {
    try {
      const raw = localStorage.getItem('resqnet_user') || localStorage.getItem('resqnet_current_user');
      if (raw) return JSON.parse(raw).email || 'citizen@resqnet.org';
    } catch {}
    return 'citizen@resqnet.org';
  })();

  const userName = currentUserName || (() => {
    try {
      const raw = localStorage.getItem('resqnet_user') || localStorage.getItem('resqnet_current_user');
      if (raw) return JSON.parse(raw).fullName || 'Sunil Weerasinghe';
    } catch {}
    return 'Sunil Weerasinghe';
  })();

  // Data states (scoped strictly to logged-in user)
  const [monetaryDonations, setMonetaryDonations] = useState<MonetaryDonation[]>([]);
  const [goodsDonations, setGoodsDonations] = useState<GoodsDonationRequest[]>([]);
  const [volunteerRegistrations, setVolunteerRegistrations] = useState<VolunteerRegistration[]>([]);
  const [volunteerSchedules, setVolunteerSchedules] = useState<VolunteerSchedule[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Monetary form state
  const [monetaryForm, setMonetaryForm] = useState({
    fullName: userName,
    contactNumber: '+94 77 678 9012',
    email: userEmail,
    amount: '25000',
    currency: 'LKR' as 'LKR' | 'USD',
    purpose: 'Flood Relief 2024 - Emergency Provisions',
    paymentMethod: 'Bank Transfer' as 'Bank Transfer' | 'Online Card Payment',
    bankReference: 'BOC-TXN-998231',
    cardHolderName: userName,
    cardNumber: '•••• •••• •••• 4242',
    expiry: '12/28',
    cvc: '•••'
  });

  // Goods form state
  const [goodsDonor, setGoodsDonor] = useState({
    fullName: userName,
    contactNumber: '+94 77 678 9012',
    email: userEmail,
    address: '15 Havelock Road, Colombo 05',
    notes: 'Items packed in weather-resistant containers.'
  });

  const [goodsItems, setGoodsItems] = useState<Array<Omit<GoodsItem, 'id'>>>([
    {
      category: 'Food and water',
      itemName: 'Clean Drinking Water Bottles (5L)',
      quantity: 50,
      unit: 'bottles',
      condition: 'New',
      notes: 'Sealed factory packs'
    },
    {
      category: 'Medical supplies',
      itemName: 'Antiseptic Solution & Sterile Bandages',
      quantity: 40,
      unit: 'packs',
      condition: 'New',
      notes: 'First aid emergency triage'
    }
  ]);

  // Volunteer registration state
  const [volunteerForm, setVolunteerForm] = useState({
    fullName: userName,
    contactNumber: '+94 77 678 9012',
    email: userEmail,
    address: '15 Havelock Road, Colombo 05',
    preferredLocations: ['Western Province', 'Rivagama Relief Center'],
    preferredDates: ['2026-11-04', '2026-11-08'],
    availableStartTime: '09:00',
    availableEndTime: '15:00',
    preferredDaysOfWeek: ['Mon', 'Wed', 'Sat'],
    activityTypes: ['Meal Distribution', 'Logistics'],
    skills: 'Logistics handling, warehouse organization, light driving',
    additionalNotes: 'Available on short notice for crisis response.'
  });
  const [volunteerTimeError, setVolunteerTimeError] = useState<string | null>(null);

  // Handover selection modal state
  const [handoverModal, setHandoverModal] = useState<{
    request: GoodsDonationRequest | null;
    selectedDate: string;
    selectedSlot: string;
    error: string | null;
  }>({
    request: null,
    selectedDate: '',
    selectedSlot: '',
    error: null
  });

  useEffect(() => {
    loadAllData();
  }, [userEmail]);

  const loadAllData = async () => {
    const [mon, gds, vreg, sch, notif] = await Promise.all([
      api.getMonetaryDonations(),
      api.getGoodsDonations(),
      api.getVolunteerRegistrations(),
      api.getVolunteerSchedules(),
      api.getInAppNotifications('Officer')
    ]);

    // Privacy filter: Return ONLY records belonging to currently authenticated user!
    const myMon = mon.filter(m =>
      (m.email && m.email.toLowerCase() === userEmail.toLowerCase()) ||
      (m.donorName && m.donorName.toLowerCase() === userName.toLowerCase())
    );
    const myGds = gds.filter(g =>
      (g.email && g.email.toLowerCase() === userEmail.toLowerCase()) ||
      (g.donorName && g.donorName.toLowerCase() === userName.toLowerCase())
    );
    const myVreg = vreg.filter(v =>
      (v.email && v.email.toLowerCase() === userEmail.toLowerCase()) ||
      (v.fullName && v.fullName.toLowerCase() === userName.toLowerCase())
    );

    // Personal volunteer assignments (if this user was assigned shifts)
    const myVolunteerIds = new Set(myVreg.map(v => v.volunteerId).filter(Boolean));
    const mySch = sch.filter(s =>
      (s.volunteerName && s.volunteerName.toLowerCase() === userName.toLowerCase()) ||
      (s.volunteerId && myVolunteerIds.has(s.volunteerId))
    );

    // Personal in-app notifications
    const myNotif = notif.filter(n =>
      !n.recipientEmail || n.recipientEmail.toLowerCase() === userEmail.toLowerCase()
    );

    setMonetaryDonations(myMon);
    setGoodsDonations(myGds);
    setVolunteerRegistrations(myVreg);
    setVolunteerSchedules(mySch);
    setNotifications(myNotif);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // ------------------------------------------
  // Handlers: Monetary Donation
  // ------------------------------------------
  const handleMonetarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(monetaryForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }

    try {
      const created = await api.submitMonetaryDonation({
        fullName: monetaryForm.fullName,
        contactNumber: monetaryForm.contactNumber,
        email: monetaryForm.email,
        amount: amt,
        currency: monetaryForm.currency,
        purpose: monetaryForm.purpose,
        paymentMethod: monetaryForm.paymentMethod,
        bankReference: monetaryForm.paymentMethod === 'Bank Transfer' ? monetaryForm.bankReference : undefined
      });

      showToast(`Thank you! Monetary donation submitted successfully (Ref: ${created.donationReference}, Donor ID: ${created.donorId}).`);
      loadAllData();
      setActiveTab('my-donations');
    } catch (err: any) {
      alert(err?.message || 'Error submitting monetary donation.');
    }
  };

  // ------------------------------------------
  // Handlers: Physical Goods Donation
  // ------------------------------------------
  const handleAddGoodsRow = () => {
    setGoodsItems([
      ...goodsItems,
      {
        category: 'Food and water',
        itemName: '',
        quantity: 1,
        unit: 'units',
        condition: 'New',
        notes: ''
      }
    ]);
  };

  const handleRemoveGoodsRow = (index: number) => {
    if (goodsItems.length <= 1) {
      alert('A goods donation must contain at least one item.');
      return;
    }
    setGoodsItems(goodsItems.filter((_, i) => i !== index));
  };

  const handleGoodsItemChange = (index: number, field: keyof Omit<GoodsItem, 'id'>, val: any) => {
    const updated = [...goodsItems];
    updated[index] = { ...updated[index], [field]: val };
    setGoodsItems(updated);
  };

  const handleGoodsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const item of goodsItems) {
      if (!item.itemName.trim()) {
        alert('Please provide an item description for all rows.');
        return;
      }
      if (item.quantity <= 0) {
        alert('Quantity must be greater than zero for all items.');
        return;
      }
    }

    try {
      const itemsWithId: GoodsItem[] = goodsItems.map((item, idx) => ({
        ...item,
        id: `gitem-${Date.now()}-${idx}`
      }));

      const created = await api.submitGoodsDonation({
        fullName: goodsDonor.fullName,
        contactNumber: goodsDonor.contactNumber,
        email: goodsDonor.email,
        address: goodsDonor.address,
        notes: goodsDonor.notes,
        items: itemsWithId
      });

      showToast(`Physical goods request submitted (Ref: ${created.requestReference}, Donor ID: ${created.donorId}). Pending coordinator review.`);
      loadAllData();
      setActiveTab('my-donations');
    } catch (err: any) {
      alert(err?.message || 'Failed to submit physical goods request.');
    }
  };

  // Handover confirmation by donor
  const openHandoverPicker = (req: GoodsDonationRequest) => {
    setHandoverModal({
      request: req,
      selectedDate: req.earliestHandoverDate || '',
      selectedSlot: req.availableTimeSlots && req.availableTimeSlots.length > 0 ? req.availableTimeSlots[0] : '09:00 AM - 12:00 PM',
      error: null
    });
  };

  const handleConfirmHandover = async () => {
    if (!handoverModal.request) return;
    const req = handoverModal.request;

    if (!handoverModal.selectedDate) {
      setHandoverModal(prev => ({ ...prev, error: 'Please choose a handover date.' }));
      return;
    }

    if (req.earliestHandoverDate && req.latestHandoverDate) {
      if (handoverModal.selectedDate < req.earliestHandoverDate || handoverModal.selectedDate > req.latestHandoverDate) {
        setHandoverModal(prev => ({
          ...prev,
          error: `Handover date must be within approved range (${req.earliestHandoverDate} to ${req.latestHandoverDate}).`
        }));
        return;
      }
    }

    try {
      await api.scheduleGoodsHandover(req.id, handoverModal.selectedDate, handoverModal.selectedSlot);
      showToast(`Handover appointment confirmed for ${handoverModal.selectedDate} (${handoverModal.selectedSlot})!`);
      setHandoverModal({ request: null, selectedDate: '', selectedSlot: '', error: null });
      loadAllData();
    } catch (err: any) {
      setHandoverModal(prev => ({ ...prev, error: err?.message || 'Failed to confirm handover.' }));
    }
  };

  // ------------------------------------------
  // Handlers: Volunteer Registration
  // ------------------------------------------
  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVolunteerTimeError(null);

    if (volunteerForm.availableStartTime >= volunteerForm.availableEndTime) {
      setVolunteerTimeError('Available end time must be later than start time.');
      return;
    }

    if (volunteerForm.activityTypes.length === 0) {
      alert('Please select at least one activity type.');
      return;
    }

    try {
      const created = await api.submitVolunteerRegistration({
        fullName: volunteerForm.fullName,
        email: volunteerForm.email,
        phoneNumber: volunteerForm.contactNumber,
        address: volunteerForm.address,
        preferredLocations: volunteerForm.preferredLocations,
        preferredDates: volunteerForm.preferredDates,
        availableStartTime: volunteerForm.availableStartTime,
        availableEndTime: volunteerForm.availableEndTime,
        preferredDaysOfWeek: volunteerForm.preferredDaysOfWeek,
        activityTypes: volunteerForm.activityTypes,
        skills: volunteerForm.skills,
        additionalNotes: volunteerForm.additionalNotes
      });

      showToast(`Volunteer application submitted (Ref: ${created.registrationReference}, Volunteer ID: ${created.volunteerId}).`);
      loadAllData();
      setActiveTab('my-volunteers');
    } catch (err: any) {
      alert(err?.message || 'Error submitting volunteer registration.');
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Toast Alert */}
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

      {/* Main Tab Navigation with Connected Content */}
      <BrowserStyleTabs<'monetary' | 'goods' | 'volunteer' | 'my-donations' | 'my-volunteers' | 'notifications'>
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ariaLabel="Donation & Volunteering Tabs"
        tabs={[
          { id: 'monetary', label: 'Monetary Donations', icon: DollarSign },
          { id: 'goods', label: 'Goods Donations', icon: Package },
          { id: 'volunteer', label: 'Volunteer Registration', icon: UserPlus },
          { id: 'my-donations', label: 'My Donation Requests', count: monetaryDonations.length + goodsDonations.length, icon: Clock },
          { id: 'my-volunteers', label: 'My Volunteer Requests', count: volunteerRegistrations.length, icon: Calendar },
          { id: 'notifications', label: 'Request Status & Notifications', count: notifications.length, icon: Bell }
        ]}
      >
        {/* ========================================================================= */}
        {/* TAB 1: MONETARY DONATION FORM */}
        {/* ========================================================================= */}
        {activeTab === 'monetary' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
            <div style={{ padding: '0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} color="#2563eb" /> Online Monetary Donation Form
              </h2>

            <form onSubmit={handleMonetarySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Donor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={monetaryForm.fullName}
                    onChange={e => setMonetaryForm({ ...monetaryForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={monetaryForm.email}
                    onChange={e => setMonetaryForm({ ...monetaryForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={monetaryForm.contactNumber}
                    onChange={e => setMonetaryForm({ ...monetaryForm, contactNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Donation Purpose / Campaign
                  </label>
                  <input
                    type="text"
                    value={monetaryForm.purpose}
                    onChange={e => setMonetaryForm({ ...monetaryForm, purpose: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Currency
                  </label>
                  <select
                    value={monetaryForm.currency}
                    onChange={e => setMonetaryForm({ ...monetaryForm, currency: e.target.value as any })}
                  >
                    <option value="LKR">LKR (Sri Lankan Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Donation Amount *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={monetaryForm.amount}
                    onChange={e => setMonetaryForm({ ...monetaryForm, amount: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Select Payment Method *
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    border: monetaryForm.paymentMethod === 'Bank Transfer' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: monetaryForm.paymentMethod === 'Bank Transfer' ? '#eff6ff' : '#ffffff'
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={monetaryForm.paymentMethod === 'Bank Transfer'}
                      onChange={() => setMonetaryForm({ ...monetaryForm, paymentMethod: 'Bank Transfer' })}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Direct Bank Transfer</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Deposit to BOC relief account</div>
                    </div>
                  </label>

                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    border: monetaryForm.paymentMethod === 'Online Card Payment' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: monetaryForm.paymentMethod === 'Online Card Payment' ? '#eff6ff' : '#ffffff'
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={monetaryForm.paymentMethod === 'Online Card Payment'}
                      onChange={() => setMonetaryForm({ ...monetaryForm, paymentMethod: 'Online Card Payment' })}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Credit / Debit Card</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Secure payment gateway</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conditional Bank Details vs Card Fields */}
              {monetaryForm.paymentMethod === 'Bank Transfer' ? (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '6px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={16} /> Organization Bank Account Details:
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Bank:</strong> Bank of Ceylon (BOC)</div>
                    <div><strong>Account Name:</strong> ResQnet Relief Trust</div>
                    <div><strong>Account No:</strong> 0089 2341 9012</div>
                    <div><strong>Branch:</strong> Corporate Branch, Colombo Fort</div>
                    <div><strong>SWIFT Code:</strong> BCEYLKLX</div>
                    <div><strong>Reference Format:</strong> Donor Name / Tel</div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                      Bank Slip / Transaction Reference Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BOC-TXN-882910 or Slip ID"
                      value={monetaryForm.bankReference}
                      onChange={e => setMonetaryForm({ ...monetaryForm, bankReference: e.target.value })}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                      * Note: Bank transfers are marked as "Payment Verification" until verified by the Coordinator.
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '6px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} /> Online Payment Gateway Interface:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Cardholder Name</label>
                      <input
                        type="text"
                        value={monetaryForm.cardHolderName}
                        onChange={e => setMonetaryForm({ ...monetaryForm, cardHolderName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Card Number</label>
                      <input
                        type="text"
                        value={monetaryForm.cardNumber}
                        onChange={e => setMonetaryForm({ ...monetaryForm, cardNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Expiration Date</label>
                      <input
                        type="text"
                        value={monetaryForm.expiry}
                        onChange={e => setMonetaryForm({ ...monetaryForm, expiry: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Security Code (CVV)</label>
                      <input
                        type="password"
                        value={monetaryForm.cvc}
                        onChange={e => setMonetaryForm({ ...monetaryForm, cvc: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    marginTop: '10px',
                    fontSize: '11px',
                    color: '#92400e'
                  }}>
                    <strong>Security Notice:</strong> Sensitive credentials (full PAN/CVV) are never stored in the database. Production processing requires live gateway API keys.
                  </div>
                </div>
              )}

              <button
                type="submit"
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  marginTop: '10px'
                }}
              >
                Submit Monetary Donation ({monetaryForm.currency} {parseFloat(monetaryForm.amount || '0').toLocaleString()})
              </button>
            </form>
          </div>

          {/* Right Info Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Unique Donor Identifier System
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                Every donor is automatically assigned a unique persistent <strong>DON-XXXX</strong> ID (e.g. <code>DON-0001</code>). Subsequent donations by the same email retain their existing identifier.
              </p>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Monetary Status Lifecycle
              </h3>
              <ul style={{ fontSize: '12px', color: '#475569', paddingLeft: '16px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#d97706' }}>Payment Verification:</strong> Submitted bank transfers awaiting coordinator verification.</li>
                <li><strong style={{ color: '#059669' }}>Confirmed:</strong> Verified donation credited towards active crisis appeal.</li>
                <li><strong style={{ color: '#dc2626' }}>Rejected:</strong> Invalid or unverified transaction receipts.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PHYSICAL GOODS DONATION FORM */}
      {/* ========================================================================= */}
      {activeTab === 'goods' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="#2563eb" /> Physical Goods Donation Registration
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Donate multiple relief goods items in a single request. Upon approval, you will receive an approved handover schedule window.
              </p>
            </div>
          </div>

          <form onSubmit={handleGoodsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Donor Personal Information */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Donor & Collection Location Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Donor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={goodsDonor.fullName}
                    onChange={e => setGoodsDonor({ ...goodsDonor, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={goodsDonor.email}
                    onChange={e => setGoodsDonor({ ...goodsDonor, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={goodsDonor.contactNumber}
                    onChange={e => setGoodsDonor({ ...goodsDonor, contactNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Collection Address / Handover Origin *
                  </label>
                  <input
                    type="text"
                    required
                    value={goodsDonor.address}
                    onChange={e => setGoodsDonor({ ...goodsDonor, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Items Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Goods Items Manifest ({goodsItems.length} items)
                </h3>
                <button
                  type="button"
                  onClick={handleAddGoodsRow}
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={14} /> Add Another Item Row
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 12px', width: '22%' }}>Category *</th>
                      <th style={{ padding: '10px 12px', width: '28%' }}>Item Description *</th>
                      <th style={{ padding: '10px 12px', width: '12%' }}>Quantity *</th>
                      <th style={{ padding: '10px 12px', width: '12%' }}>Unit</th>
                      <th style={{ padding: '10px 12px', width: '14%' }}>Condition</th>
                      <th style={{ padding: '10px 12px', width: '12%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goodsItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <select
                            value={item.category}
                            onChange={e => handleGoodsItemChange(idx, 'category', e.target.value as GoodsCategory)}
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                          >
                            <option value="Food and water">Food and water</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Medical supplies">Medical supplies</option>
                            <option value="Hygiene products">Hygiene products</option>
                            <option value="Household items">Household items</option>
                            <option value="Educational supplies">Educational supplies</option>
                            <option value="Other essential goods">Other essential goods</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rice 10kg bags, Antiseptic"
                            value={item.itemName}
                            onChange={e => handleGoodsItemChange(idx, 'itemName', e.target.value)}
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={e => handleGoodsItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <select
                            value={item.unit}
                            onChange={e => handleGoodsItemChange(idx, 'unit', e.target.value)}
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                          >
                            <option value="units">units</option>
                            <option value="kg">kg</option>
                            <option value="boxes">boxes</option>
                            <option value="packs">packs</option>
                            <option value="liters">liters</option>
                            <option value="cartons">cartons</option>
                            <option value="pairs">pairs</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <select
                            value={item.condition}
                            onChange={e => handleGoodsItemChange(idx, 'condition', e.target.value as GoodsCondition)}
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                          >
                            <option value="New">New</option>
                            <option value="Like New">Like New</option>
                            <option value="Gently Used">Gently Used</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveGoodsRow(idx)}
                            style={{
                              backgroundColor: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Additional Notes or Special Handling Instructions
              </label>
              <textarea
                rows={2}
                value={goodsDonor.notes}
                onChange={e => setGoodsDonor({ ...goodsDonor, notes: e.target.value })}
                placeholder="Mention storage needs, perishable details, or handover assistance requirements..."
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700
              }}
            >
              Submit Physical Goods Donation Request
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VOLUNTEER REGISTRATION FORM */}
      {/* ========================================================================= */}
      {activeTab === 'volunteer' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="#2563eb" /> Volunteer Intake & Skills Registration Form
          </h2>

          <form onSubmit={handleVolunteerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Personal Information */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Personal Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={volunteerForm.fullName}
                    onChange={e => setVolunteerForm({ ...volunteerForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={volunteerForm.email}
                    onChange={e => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={volunteerForm.contactNumber}
                    onChange={e => setVolunteerForm({ ...volunteerForm, contactNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Residential Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={volunteerForm.address}
                    onChange={e => setVolunteerForm({ ...volunteerForm, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Availability & Skills */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Availability, Locations & Skills
              </h3>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Preferred Operational Locations (Select all that apply) *
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {['Western Province', 'Colombo Central', 'Rivagama Relief Center', 'Galle Outpost', 'Kalutara Depot', 'Kandy Logistics'].map(loc => {
                    const checked = volunteerForm.preferredLocations.includes(loc);
                    return (
                      <label key={loc} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        backgroundColor: checked ? '#eff6ff' : '#ffffff',
                        border: checked ? '1px solid #2563eb' : '1px solid #cbd5e1',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setVolunteerForm({ ...volunteerForm, preferredLocations: volunteerForm.preferredLocations.filter(l => l !== loc) });
                            } else {
                              setVolunteerForm({ ...volunteerForm, preferredLocations: [...volunteerForm.preferredLocations, loc] });
                            }
                          }}
                        />
                        <span>{loc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Time Window with Validation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Available Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={volunteerForm.availableStartTime}
                    onChange={e => setVolunteerForm({ ...volunteerForm, availableStartTime: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Available End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={volunteerForm.availableEndTime}
                    onChange={e => setVolunteerForm({ ...volunteerForm, availableEndTime: e.target.value })}
                  />
                </div>
              </div>

              {volunteerTimeError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={16} /> {volunteerTimeError}
                </div>
              )}

              {/* Days of Week */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Available Days of Week *
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                    const checked = volunteerForm.preferredDaysOfWeek.includes(day);
                    return (
                      <label key={day} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        backgroundColor: checked ? '#eff6ff' : '#ffffff',
                        border: checked ? '1px solid #2563eb' : '1px solid #cbd5e1',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setVolunteerForm({ ...volunteerForm, preferredDaysOfWeek: volunteerForm.preferredDaysOfWeek.filter(d => d !== day) });
                            } else {
                              setVolunteerForm({ ...volunteerForm, preferredDaysOfWeek: [...volunteerForm.preferredDaysOfWeek, day] });
                            }
                          }}
                        />
                        <span>{day}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Activity Types */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Volunteer Activity Interests *
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Meal Distribution', 'Medical & First Aid', 'Logistics', 'Translation', 'Shelter Support', 'Inventory Sorting'].map(act => {
                    const checked = volunteerForm.activityTypes.includes(act);
                    return (
                      <label key={act} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        backgroundColor: checked ? '#eff6ff' : '#ffffff',
                        border: checked ? '1px solid #2563eb' : '1px solid #cbd5e1',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setVolunteerForm({ ...volunteerForm, activityTypes: volunteerForm.activityTypes.filter(a => a !== act) });
                            } else {
                              setVolunteerForm({ ...volunteerForm, activityTypes: [...volunteerForm.activityTypes, act] });
                            }
                          }}
                        />
                        <span>{act}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Relevant Skills & Experience
                </label>
                <textarea
                  rows={2}
                  value={volunteerForm.skills}
                  onChange={e => setVolunteerForm({ ...volunteerForm, skills: e.target.value })}
                  placeholder="e.g. Certified first aider, heavy vehicle driver, fluent in Tamil/English..."
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700
              }}
            >
              Submit Volunteer Application
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MY DONATION REQUESTS & HANDOVER SCHEDULING */}
      {/* ========================================================================= */}
      {activeTab === 'my-donations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Physical Goods Requests */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="#2563eb" /> Physical Goods Donation Requests ({goodsDonations.length})
            </h3>

            {goodsDonations.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748b' }}>No physical goods donations submitted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {goodsDonations.map(req => {
                  const isApproved = req.status === 'Approved';
                  const isScheduled = req.status === 'Handover Scheduled';
                  const isReceived = req.status === 'Received';
                  const isRejected = req.status === 'Rejected';

                  return (
                    <div
                      key={req.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '15px', color: '#0f172a' }}>{req.requestReference}</strong>
                            <span style={{ fontSize: '11px', color: '#1d4ed8', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              Donor: {req.donorId}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor:
                                req.status === 'Approved' ? '#eff6ff' :
                                req.status === 'Handover Scheduled' ? '#f0fdfa' :
                                req.status === 'Received' ? '#ecfdf5' :
                                req.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                              color:
                                req.status === 'Approved' ? '#1d4ed8' :
                                req.status === 'Handover Scheduled' ? '#0d9488' :
                                req.status === 'Received' ? '#059669' :
                                req.status === 'Rejected' ? '#b91c1c' : '#d97706'
                            }}>
                              {req.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Submitted by {req.donorName} ({req.email}) · Origin: {req.address}
                          </div>
                        </div>

                        {/* Handover scheduling button if Approved */}
                        {isApproved && (
                          <button
                            onClick={() => openHandoverPicker(req)}
                            style={{
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Calendar size={14} /> Schedule Handover Date
                          </button>
                        )}
                      </div>

                      {/* Items Pill Summary */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {req.items.map((it, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              color: '#334155'
                            }}
                          >
                            <strong>{it.itemName}</strong>: {it.quantity} {it.unit} ({it.category} · {it.condition})
                          </span>
                        ))}
                      </div>

                      {/* Approved Date Range Info */}
                      {req.earliestHandoverDate && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          fontSize: '12px',
                          color: '#1e293b'
                        }}>
                          <div>
                            <strong>Approved Handover Range:</strong> {req.earliestHandoverDate} to {req.latestHandoverDate}
                          </div>
                          <div>
                            <strong>Handover Location:</strong> {req.handoverLocation}
                          </div>
                          {isScheduled && (
                            <div style={{ color: '#0d9488', fontWeight: 700, marginTop: '4px' }}>
                              Confirmed Appointment: {req.selectedHandoverDate} ({req.selectedTimeSlot})
                            </div>
                          )}
                          {isReceived && (
                            <div style={{ color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                              Goods Received & Verified by: {req.receivedBy} on {new Date(req.receivedAt || '').toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}

                      {isRejected && req.rejectionReason && (
                        <div style={{ fontSize: '12px', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                          <strong>Rejection Reason:</strong> {req.rejectionReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monetary Donations Table */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="#2563eb" /> Monetary Donations ({monetaryDonations.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Reference</th>
                    <th style={{ padding: '10px 12px' }}>Donor ID</th>
                    <th style={{ padding: '10px 12px' }}>Donor Name</th>
                    <th style={{ padding: '10px 12px' }}>Amount</th>
                    <th style={{ padding: '10px 12px' }}>Payment Method</th>
                    <th style={{ padding: '10px 12px' }}>Bank Ref / Gateway</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monetaryDonations.map(mon => (
                    <tr key={mon.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{mon.donationReference}</td>
                      <td style={{ padding: '10px 12px' }}><span className="badge badge-blue">{mon.donorId}</span></td>
                      <td style={{ padding: '10px 12px' }}>{mon.donorName}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{mon.currency} {mon.amount.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>{mon.paymentMethod}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{mon.bankReference || mon.paymentGatewayStatus}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            mon.status === 'Confirmed' ? '#ecfdf5' :
                            mon.status === 'Payment Verification' ? '#fffbeb' :
                            mon.status === 'Rejected' ? '#fef2f2' : '#eff6ff',
                          color:
                            mon.status === 'Confirmed' ? '#059669' :
                            mon.status === 'Payment Verification' ? '#d97706' :
                            mon.status === 'Rejected' ? '#b91c1c' : '#1d4ed8'
                        }}>
                          {mon.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MY VOLUNTEER REQUESTS */}
      {/* ========================================================================= */}
      {activeTab === 'my-volunteers' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            My Volunteer Registration ({volunteerRegistrations.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {volunteerRegistrations.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                You have not registered as a volunteer yet. Use the <strong>Volunteer Registration</strong> tab to apply.
              </p>
            ) : (
              volunteerRegistrations.map(v => (
                <div
                  key={v.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{v.fullName}</strong>
                      <span className="badge badge-blue">{v.volunteerId}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Ref: {v.registrationReference}</span>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '4px',
                      backgroundColor:
                        v.status === 'Approved' ? '#ecfdf5' :
                        v.status === 'Pending Approval' ? '#fffbeb' : '#fef2f2',
                      color:
                        v.status === 'Approved' ? '#059669' :
                        v.status === 'Pending Approval' ? '#d97706' : '#b91c1c'
                    }}>
                      {v.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Preferred Locations:</strong> {v.preferredLocations.join(', ')}</div>
                    <div><strong>Time Window:</strong> {v.availableStartTime} - {v.availableEndTime}</div>
                    <div><strong>Preferred Days:</strong> {v.preferredDaysOfWeek.join(', ')}</div>
                    <div><strong>Activities:</strong> {v.activityTypes.join(', ')}</div>
                  </div>

                  {v.skills && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      <strong>Skills:</strong> {v.skills}
                    </div>
                  )}

                  {/* Personal Assigned Volunteering Shifts */}
                  {volunteerSchedules.filter(s => s.status !== 'Cancelled').length > 0 && (
                    <div style={{ marginTop: '16px', borderTop: '1px dashed #cbd5e1', paddingTop: '14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarCheck size={16} /> My Confirmed Volunteering Assignments
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {volunteerSchedules.filter(s => s.status !== 'Cancelled').map(sch => (
                          <div key={sch.id} style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#065f46', fontSize: '13px' }}>{sch.activity}</div>
                              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                                <span>{sch.date}</span> · <span>{sch.startTime} - {sch.endTime}</span> · <span style={{ color: '#1e40af' }}>{sch.location}</span>
                              </div>
                            </div>
                            <span className="badge badge-green">Confirmed</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: REQUEST STATUS & NOTIFICATIONS INBOX */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#2563eb" /> Request Status & Notification Inbox
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748b' }}>No notifications received yet.</p>
            ) : (
              notifications.map(n => (
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
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      {new Date(n.timestamp).toLocaleTimeString()} · {new Date(n.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={async () => {
                        await api.markNotificationRead(n.id);
                        loadAllData();
                      }}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </BrowserStyleTabs>

      {/* ========================================================================= */}
      {/* HANDOVER DATE RANGE SELECTION MODAL */}
      {/* ========================================================================= */}
      {handoverModal.request && (
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
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Select Goods Handover Date
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Your goods donation (<strong>{handoverModal.request.requestReference}</strong>) was approved by the coordinator. Choose a date within the authorized range:
            </p>

            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              <div><strong>Approved Range:</strong> {handoverModal.request.earliestHandoverDate} to {handoverModal.request.latestHandoverDate}</div>
              <div><strong>Designated Depot:</strong> {handoverModal.request.handoverLocation}</div>
            </div>

            {handoverModal.error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                {handoverModal.error}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Choose Date (Within Range) *
              </label>
              <input
                type="date"
                required
                min={handoverModal.request.earliestHandoverDate}
                max={handoverModal.request.latestHandoverDate}
                value={handoverModal.selectedDate}
                onChange={e => setHandoverModal({ ...handoverModal, selectedDate: e.target.value, error: null })}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Available Handover Time Slot *
              </label>
              <select
                value={handoverModal.selectedSlot}
                onChange={e => setHandoverModal({ ...handoverModal, selectedSlot: e.target.value })}
              >
                {(handoverModal.request.availableTimeSlots && handoverModal.request.availableTimeSlots.length > 0
                  ? handoverModal.request.availableTimeSlots
                  : ['09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM']
                ).map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setHandoverModal({ request: null, selectedDate: '', selectedSlot: '', error: null })}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHandover}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                Confirm Agreed Handover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

