import React from 'react';

interface HUDProps {
  score: number;
  health: number;
  maxHealth: number;
  onPause: () => void;
}

const HUD: React.FC<HUDProps> = ({ score, health, maxHealth, onPause }) => {
  return (
    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
      <div className="flex flex-col">
        <span className="text-cyan-500 text-xs font-bold tracking-widest uppercase mb-1">Score</span>
        <span className="text-4xl font-mono text-white drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">
          {score.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-6 pointer-events-auto">
        {/* Health Bar */}
        <div className="flex gap-1">
          {Array.from({ length: maxHealth }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-2 skew-x-[-20deg] border border-cyan-500 transition-all duration-300 ${
                i < health 
                  ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]' 
                  : 'bg-transparent opacity-30'
              }`}
            />
          ))}
        </div>

        {/* Pause Button */}
        <button 
            onClick={onPause}
            className="p-2 rounded-full border border-gray-600 bg-black/30 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-400 text-gray-400 transition-all backdrop-blur-sm group"
            aria-label="Pause Game"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        </button>
      </div>
    </div>
  );
};

export default HUD;