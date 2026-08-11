import React, { useState } from 'react';
import { RedSunBeeCampaignLanding } from './components/RedSunBeeCampaignLanding';
import { ModuleSelectPage } from './components/ModuleSelectPage';

type View = 'landing' | 'modules';

export default function App() {
  const [view, setView] = useState<View>('landing');

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-500 selection:text-white font-sans antialiased overflow-x-clip">

      {/* Main Content View */}
      <div className="relative z-10">
        {view === 'landing' && (
          <RedSunBeeCampaignLanding onLogin={() => setView('modules')} />
        )}
        {view === 'modules' && (
          <ModuleSelectPage onBack={() => setView('landing')} />
        )}
      </div>

    </div>
  );
}


