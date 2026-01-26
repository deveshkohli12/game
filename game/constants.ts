import { GameSettings } from './types';

export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

export const GAME_COLORS = {
  background: '#050505',
  player: '#00ffff', // Cyan
  playerInvincible: '#ffffff',
  shield: '#00ccff',
  enemyAsteroid: '#ff0055', // Pinkish Red
  enemyChaser: '#ffcc00', // Yellow
  enemyPulsar: '#aa00ff', // Purple
  particle: '#ffffff',
  uiText: '#ffffff',
  uiAccent: '#00ffff'
};

export const GAME_CONFIG = {
  fps: 60,
  playerSpeed: 0.15, // Default Lerp factor
  playerRadius: 12,
  playerMaxHealth: 3,
  enemyBaseSpeed: 2,
  spawnRate: 60, // Frames between spawns
  particleDecay: 0.02,
  invincibilityDuration: 2000, // ms
  shieldDuration: 3000, // ms
  shieldCooldown: 10000, // ms
};

export const DEFAULT_SETTINGS: GameSettings = {
  sensitivity: 0.15,
  difficultyMultiplier: 1.0,
  masterVolume: 0.5,
  isMuted: false,
  keyBindings: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    shield: 'Space'
  }
};