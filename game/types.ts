export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2D;
  velocity: Vector2D;
  radius: number;
  color: string;
  rotation?: number;
}

export interface Player extends Entity {
  invincibleUntil: number;
  health: number;
  maxHealth: number;
  trail: Vector2D[]; // For tail effect
  isShieldActive: boolean;
  shieldEndTime: number;
  shieldNextAvailableTime: number;
}

export interface Enemy extends Entity {
  type: 'asteroid' | 'chaser' | 'pulsar';
  pulsePhase?: number;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  size: number;
  decay: number;
  drawType?: 'fill' | 'stroke';
  expansionRate?: number;
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  difficultyMultiplier: number;
}

export enum GameScene {
  MENU = 'MENU',
  GAME = 'GAME',
  GAME_OVER = 'GAME_OVER',
  SETTINGS = 'SETTINGS'
}

export interface KeyBindings {
  up: string;
  down: string;
  left: string;
  right: string;
  shield: string;
}

export interface GameSettings {
  sensitivity: number; // 0.01 to 0.5
  difficultyMultiplier: number; // 0.5 to 2.0
  masterVolume: number; // 0.0 to 1.0
  isMuted: boolean;
  keyBindings: KeyBindings;
}