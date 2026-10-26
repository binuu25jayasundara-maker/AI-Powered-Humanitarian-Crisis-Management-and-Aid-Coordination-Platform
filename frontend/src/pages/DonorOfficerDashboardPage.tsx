import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Heart, ShieldCheck, Gift } from 'lucide-react';
import { DonationAndVolunteerOfficerDashboardContent } from './DonationAndVolunteerOfficerDashboardContent';

export const DonorOfficerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-green">
            <Gift size={13} /> Donation & Volunteer Operations
          </span>
          <span className="badge badge-blue">
            <ShieldCheck size={13} /> Financial Oversight
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
          Donation and Volunteering Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Welcome back, <strong>{user?.fullName || 'Donation and Volunteering'}</strong>!
          Submit personal monetary or goods aid donations, register as a volunteer, and track your request statuses.
        </p>
      </div>

      {/* Full Dashboard Content from Member 6 */}
      <DonationAndVolunteerOfficerDashboardContent currentUserEmail={user?.email} currentUserName={user?.fullName} />
    </div>
  );
};
