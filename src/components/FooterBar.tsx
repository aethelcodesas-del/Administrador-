import React from 'react';
import { Scale } from 'lucide-react';

export const FooterBar: React.FC = () => {
  return (
    <footer id="footer-bar" className="w-full max-w-7xl mx-auto mt-12 pt-4 border-t border-[#132238] text-slate-400 text-xs">
      <div className="text-center text-[11px] text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 py-2">
        <span>© 2026 Campaña Ganadora AI v4.0. Todos los derechos reservados.</span>
        <span className="flex items-center gap-1 text-slate-300">
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          Aviso de Privacidad y Hábeas Data según Ley 1581 de 2012
        </span>
      </div>
    </footer>
  );
};
