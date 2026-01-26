import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onQuit }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <h2 className="text-5xl font-bold text-white mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">PAUSED</h2>
      <div className="flex flex-col gap-4 min-w-[200px]">
        <button 
            onClick={onResume} 
            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all hover:scale-105"
        >
          RESUME
        </button>
        <button 
            onClick={onQuit} 
            className="px-8 py-3 border border-gray-500 text-gray-300 hover:text-white hover:border-white rounded transition-all hover:bg-white/10"
        >
          QUIT TO MENU
        </button>
      </div>
    </div>
  );
};

export default PauseMenu;