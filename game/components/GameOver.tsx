import React from 'react';

interface GameOverProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, highScore, onRestart, onMenu }) => {
  const isNewRecord = score > highScore;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-md text-white z-20">
      <h2 className="text-6xl font-bold mb-4 text-red-500 tracking-widest animate-pulse">CRITICAL FAILURE</h2>
      
      <div className="bg-black/50 p-8 rounded-xl border border-red-500/30 backdrop-blur-xl mb-8 text-center min-w-[300px]">
        <p className="text-gray-400 uppercase text-sm mb-2">Mission Score</p>
        <p className="text-5xl font-mono mb-6 text-white">{score.toLocaleString()}</p>
        
        {isNewRecord && (
          <div className="mb-4 px-4 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm inline-block font-bold border border-yellow-500/50">
            NEW RECORD!
          </div>
        )}

        <p className="text-gray-500 text-xs">Best: {Math.max(score, highScore).toLocaleString()}</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onMenu}
          className="px-6 py-3 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors rounded"
        >
          MENU
        </button>
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg shadow-red-600/30 transition-all hover:scale-105"
        >
          RETRY MISSION
        </button>
      </div>
    </div>
  );
};

export default GameOver;