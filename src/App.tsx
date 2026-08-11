import React from 'react';
import { RedSunBeeCampaignLanding } from './components/RedSunBeeCampaignLanding';

const LOGIN_URL = 'https://softwareelectoral.netlify.app/';

export default function App() {
  const handleLogin = () => {
    window.location.href = LOGIN_URL;
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-500 selection:text-white font-sans antialiased overflow-x-clip">

      {/* Main Content View */}
      <div className="relative z-10">
        <RedSunBeeCampaignLanding onLogin={handleLogin} />
      </div>

    </div>
  );
}


