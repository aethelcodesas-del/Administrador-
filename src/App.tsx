import React from 'react';
import { RedSunBeeCampaignLanding } from './components/RedSunBeeCampaignLanding';

export default function App() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-500 selection:text-white font-sans antialiased overflow-x-clip">

      {/* GPU-Accelerated Static Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-[90px] pointer-events-none opacity-60" />
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none opacity-50" />
        <div className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] bg-orange-600/10 rounded-full blur-[90px] pointer-events-none opacity-50" />
      </div>

      {/* Main Content View */}
      <div className="relative z-10">
        <RedSunBeeCampaignLanding />
      </div>

    </div>
  );
}


