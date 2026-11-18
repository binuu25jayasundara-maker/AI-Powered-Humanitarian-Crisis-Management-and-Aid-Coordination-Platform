import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, ShieldCheck, HeartHandshake } from 'lucide-react';
import { VolunteerAndDonationCoordinatorDashboardContent } from './VolunteerAndDonationCoordinatorDashboardContent';

export const VolunteerCoordinatorDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-blue">
            <Users size={13} /> Volunteer & Donation Coordination
          </span>
          <span className="badge badge-green">
            <ShieldCheck size={13} /> Mobilization Coordinator
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
          Volunteer and Donation Coordinator Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Welcome back, <strong>{user?.fullName || 'Volunteer and Donation Coordinator'}</strong>!
          Review donation requests, manage volunteers, approve registrations, schedule shifts, and confirm handovers.
        </p>
      </div>

      {/* Full Dashboard Content from Member 6 */}
      <VolunteerAndDonationCoordinatorDashboardContent />
    </div>
  );
};
