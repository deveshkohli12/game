import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import GameOver from './components/GameOver';
import SettingsMenu from './components/SettingsMenu';
import PauseMenu from './components/PauseMenu';
import HUD from './components/HUD';
import { GameScene, GameSettings } from './types';
import { GAME_CONFIG, DEFAULT_SETTINGS } from './constants';
import { soundManager } from './utils/audio';

const App: React.FC = () => {
  const [scene, setScene] = useState<GameScene>(GameScene.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [health, setHealth] = useState(GAME_CONFIG.playerMaxHealth);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const storedScore = localStorage.getItem('void-glider-highscore');
    if (storedScore) setHighScore(parseInt(storedScore, 10));

    const storedSettings = localStorage.getItem('void-glider-settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        // Ensure merged with defaults to handle new fields like masterVolume and nested objects like keyBindings
        const mergedSettings = { 
            ...DEFAULT_SETTINGS, 
            ...parsed,
            keyBindings: {
                ...DEFAULT_SETTINGS.keyBindings,
                ...(parsed.keyBindings || {})
            }
        };
        setSettings(mergedSettings);
        soundManager.setVolume(mergedSettings.masterVolume);
        soundManager.setMute(mergedSettings.isMuted);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    } else {
        soundManager.setVolume(DEFAULT_SETTINGS.masterVolume);
        soundManager.setMute(DEFAULT_SETTINGS.isMuted);
    }
  }, []);

  const handleStartGame = () => {
    soundManager.init();
    soundManager.playUIClick();
    setScore(0);
    setHealth(GAME_CONFIG.playerMaxHealth);
    setIsPaused(false);
    setScene(GameScene.GAME);
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('void-glider-highscore', finalScore.toString());
    }
    setScene(GameScene.GAME_OVER);
  };

  const handleMenu = () => {
    soundManager.playUIClick();
    setScene(GameScene.MENU);
  };

  const handleOpenSettings = () => {
    soundManager.init();
    soundManager.playUIClick();
    setScene(GameScene.SETTINGS);
  };

  const handleSaveSettings = (newSettings: GameSettings) => {
    soundManager.playUIClick();
    setSettings(newSettings);
    soundManager.setVolume(newSettings.masterVolume);
    soundManager.setMute(newSettings.isMuted);
    localStorage.setItem('void-glider-settings', JSON.stringify(newSettings));
  };
  
  const handleTogglePause = useCallback(() => {
      if (scene === GameScene.GAME) {
          setIsPaused(prev => !prev);
          soundManager.playUIClick();
      }
  }, [scene]);

  const handleQuitToMenu = () => {
      setIsPaused(false);
      handleMenu();
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
      {scene === GameScene.MENU && (
        <MainMenu 
          onStart={handleStartGame} 
          onSettings={handleOpenSettings}
          highScore={highScore} 
        />
      )}

      {scene === GameScene.SETTINGS && (
        <SettingsMenu
          settings={settings}
          onSave={handleSaveSettings}
          onBack={handleMenu}
        />
      )}

      {scene === GameScene.GAME && (
        <>
          <HUD 
            score={score} 
            health={health} 
            maxHealth={GAME_CONFIG.playerMaxHealth} 
            onPause={handleTogglePause}
          />
          <GameCanvas
            onGameOver={handleGameOver}
            onScoreUpdate={setScore}
            onHealthUpdate={setHealth}
            settings={settings}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
          />
          {isPaused && (
              <PauseMenu 
                  onResume={handleTogglePause}
                  onQuit={handleQuitToMenu}
              />
          )}
        </>
      )}

      {scene === GameScene.GAME_OVER && (
        <GameOver
          score={score}
          highScore={highScore}
          onRestart={handleStartGame}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
};

export default App;