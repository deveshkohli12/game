import React, { useState, useEffect } from 'react';
import { GameSettings, KeyBindings } from '../types';
import { soundManager } from '../utils/audio';

interface SettingsMenuProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onBack: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onSave, onBack }) => {
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);
  const [listeningFor, setListeningFor] = useState<keyof KeyBindings | null>(null);

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings({
      ...localSettings,
      sensitivity: parseFloat(e.target.value)
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setLocalSettings({
      ...localSettings,
      masterVolume: vol
    });
    // Live preview
    if (!localSettings.isMuted) {
        soundManager.setVolume(vol);
    }
  };

  const handleMuteToggle = () => {
    const newMuted = !localSettings.isMuted;
    setLocalSettings({ ...localSettings, isMuted: newMuted });
    // Live preview
    soundManager.setMute(newMuted);
    if (!newMuted) {
        soundManager.setVolume(localSettings.masterVolume);
    }
  };

  const handleDifficultyChange = (multiplier: number) => {
    setLocalSettings({
        ...localSettings,
        difficultyMultiplier: multiplier
    });
  };
  
  const handleDifficultySliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSettings({
          ...localSettings,
          difficultyMultiplier: parseFloat(e.target.value)
      });
  };

  const handleKeyClick = (action: keyof KeyBindings) => {
    setListeningFor(action);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (listeningFor) {
        e.preventDefault();
        setLocalSettings(prev => ({
          ...prev,
          keyBindings: {
            ...prev.keyBindings,
            [listeningFor]: e.code // Use e.code for layout independence (e.g. KeyW, ArrowUp)
          }
        }));
        setListeningFor(null);
      }
    };

    if (listeningFor) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [listeningFor]);

  const handleSaveAndExit = () => {
    onSave(localSettings);
    onBack();
  };

  // Helper to display key names nicely
  const formatKey = (code: string) => {
    return code.replace('Key', '').replace('Arrow', '').replace('Space', 'Spacebar');
  };

  const difficulties = [
      { label: 'SCOUT', value: 0.8, color: 'text-green-400', border: 'border-green-500' },
      { label: 'FIGHTER', value: 1.0, color: 'text-cyan-400', border: 'border-cyan-500' },
      { label: 'ACE', value: 1.5, color: 'text-yellow-400', border: 'border-yellow-500' },
      { label: 'VOID', value: 2.0, color: 'text-red-500', border: 'border-red-600' },
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-30 backdrop-blur-md">
      <h2 className="text-4xl font-bold mb-6 text-cyan-400 tracking-widest uppercase">System Config</h2>
      
      <div className="w-full max-w-lg bg-gray-900/50 p-8 rounded-xl border border-cyan-500/30 overflow-y-auto max-h-[85vh]">
        
        {/* Difficulty Control */}
        <div className="mb-6">
            <h3 className="text-gray-300 font-mono mb-4 border-b border-gray-700 pb-2">Enemy Velocity Protocol</h3>
            
            {/* Presets */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {difficulties.map((diff) => (
                    <button
                        key={diff.label}
                        onClick={() => handleDifficultyChange(diff.value)}
                        className={`py-2 text-xs font-bold border rounded transition-all ${
                            Math.abs(localSettings.difficultyMultiplier - diff.value) < 0.05
                            ? `bg-gray-800 ${diff.color} ${diff.border} shadow-[0_0_10px_rgba(0,0,0,0.5)] scale-105`
                            : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'
                        }`}
                    >
                        {diff.label}
                    </button>
                ))}
            </div>

            {/* Slider */}
            <div className="flex justify-between mb-2">
                <label className="text-gray-400 text-sm font-mono">Manual Velocity Override</label>
                <span className="text-red-400 font-mono font-bold">{localSettings.difficultyMultiplier.toFixed(1)}x</span>
            </div>
            <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={localSettings.difficultyMultiplier}
                onChange={handleDifficultySliderChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
        </div>

        {/* Volume Control */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <label className="text-gray-300 font-mono">Audio System</label>
            <button
                onClick={handleMuteToggle}
                className={`px-4 py-1 rounded text-xs font-bold border transition-all ${
                    !localSettings.isMuted
                        ? 'bg-purple-900/50 text-purple-300 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                        : 'bg-gray-800 text-gray-500 border-gray-600'
                }`}
            >
                {localSettings.isMuted ? 'MUTED' : 'ACTIVE'}
            </button>
          </div>
          
          <div className={`transition-opacity duration-300 ${localSettings.isMuted ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex justify-between mb-2">
                <label className="text-gray-400 text-xs font-mono">Master Amplitude</label>
                <span className="text-purple-400 font-bold text-xs">{Math.round(localSettings.masterVolume * 100)}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.masterVolume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* Sensitivity Control */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <label className="text-gray-300 font-mono">Player Response Speed</label>
            <span className="text-cyan-400 font-bold">{localSettings.sensitivity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.30"
            step="0.01"
            value={localSettings.sensitivity}
            onChange={handleSensitivityChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Key Bindings */}
        <div className="mb-6">
            <h3 className="text-gray-300 font-mono mb-4 border-b border-gray-700 pb-2">Controls Protocol</h3>
            <div className="grid grid-cols-2 gap-4">
                {(Object.keys(localSettings.keyBindings) as Array<keyof KeyBindings>).map((action) => (
                    <div key={action} className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase mb-1">{action}</span>
                        <button
                            onClick={() => handleKeyClick(action)}
                            className={`px-4 py-2 rounded font-mono text-sm border transition-all ${
                                listeningFor === action 
                                    ? 'bg-cyan-500 text-black border-cyan-400 animate-pulse' 
                                    : 'bg-black border-gray-600 hover:border-cyan-500 text-cyan-400'
                            }`}
                        >
                            {listeningFor === action ? 'PRESS KEY...' : formatKey(localSettings.keyBindings[action])}
                        </button>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex gap-4 pt-4">
            <button
                onClick={onBack}
                className="flex-1 py-3 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors rounded"
            >
                CANCEL
            </button>
            <button
                onClick={handleSaveAndExit}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all"
            >
                CONFIRM
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsMenu;