import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Siren } from 'lucide-react';
import { EmergencyRequestForm } from '../../components/citizen/EmergencyRequestForm';
import { PageHeader } from '../../components/citizen/ui';
import { CATEGORIES, RequestCategory } from '../../types/citizen';

export const RequestPage: React.FC = () => {
  const [params] = useSearchParams();
  const raw = params.get('category');
  const initial = CATEGORIES.find((c) => c === raw) as RequestCategory | undefined;

  return (
    <div className="cz-page" style={{ maxWidth: 720 }}>
      <PageHeader
        title="Request Emergency Help"
        subtitle="Tell us what you need. A coordinator will review it right away."
        chips={<span className="badge badge-red"><Siren size={13} /> Emergency</span>}
      />
      <EmergencyRequestForm initialCategory={initial} showTrackLink />
    </div>
  );
};
