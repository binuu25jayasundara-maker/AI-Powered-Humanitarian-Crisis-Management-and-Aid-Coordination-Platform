import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DonorsCampaignsPage } from './pages/DonorsCampaignsPage';
import { VolunteerManagementPage } from './pages/VolunteerManagementPage';
import { CommunicationCenterPage } from './pages/CommunicationCenterPage';
import './styles/global.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
        <Header />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, overflowY: 'auto' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/campaigns" replace />} />
              <Route path="/overview" element={<Navigate to="/campaigns" replace />} />
              <Route path="/campaigns" element={<DonorsCampaignsPage />} />
              <Route path="/volunteers" element={<VolunteerManagementPage />} />
              <Route path="/communications" element={<CommunicationCenterPage />} />
              <Route path="*" element={<Navigate to="/campaigns" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
