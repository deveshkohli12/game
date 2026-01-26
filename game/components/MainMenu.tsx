import React from 'react';

interface MainMenuProps {
  onStart: () => void;
  onSettings: () => void;
  highScore: number;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, onSettings, highScore }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10 backdrop-blur-sm">
      <div className="relative group cursor-pointer" onClick={onStart}>
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <h1 className="relative text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-8 transform group-hover:scale-105 transition-transform">
          NEON VOID
        </h1>
      </div>
      
      <p className="mb-12 text-gray-400 text-lg">Use your mouse or finger to dodge the void entities.</p>

      <div className="flex flex-col gap-4">
        <button
            onClick={onStart}
            className="px-12 py-4 bg-transparent border-2 border-cyan-500 text-cyan-400 font-bold text-xl rounded hover:bg-cyan-500 hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)]"
        >
            INITIATE LAUNCH
        </button>
        
        <button
            onClick={onSettings}
            className="px-12 py-3 bg-transparent border border-gray-600 text-gray-400 font-bold text-lg rounded hover:border-purple-500 hover:text-purple-400 transition-all duration-300"
        >
            SYSTEM CONFIG
        </button>
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">High Score</p>
        <p className="text-3xl font-mono text-purple-400">{highScore.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default MainMenu;