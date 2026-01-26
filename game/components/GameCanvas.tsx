import React, { useEffect, useRef, useCallback } from 'react';
import { Player, Enemy, Particle, Vector2D, GameSettings } from '../types';
import { GAME_CONFIG, GAME_COLORS } from '../constants';
import { lerp, randomRange, checkCollision } from '../utils/math';
import { soundManager } from '../utils/audio';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onHealthUpdate?: (health: number) => void;
  settings: GameSettings;
  isPaused: boolean;
  onTogglePause: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
    onGameOver, 
    onScoreUpdate, 
    onHealthUpdate, 
    settings,
    isPaused,
    onTogglePause
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const framesRef = useRef<number>(0);
  const keysPressedRef = useRef<Set<string>>(new Set());
  const gridOffsetRef = useRef<number>(0);
  
  // Game State Refs
  const playerRef = useRef<Player>({
    id: 'player',
    pos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    velocity: { x: 0, y: 0 },
    radius: GAME_CONFIG.playerRadius,
    color: GAME_COLORS.player,
    health: GAME_CONFIG.playerMaxHealth,
    maxHealth: GAME_CONFIG.playerMaxHealth,
    invincibleUntil: 0,
    trail: [],
    rotation: 0,
    isShieldActive: false,
    shieldEndTime: 0,
    shieldNextAvailableTime: 0
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<{ pos: Vector2D; speed: number; size: number; alpha: number }[]>([]);
  const mouseRef = useRef<Vector2D>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const difficultyRef = useRef<number>(1);
  const screenShakeRef = useRef<number>(0);

  // Initialize Stars
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        pos: { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight },
        speed: randomRange(0.2, 3),
        size: randomRange(0.5, 2.5),
        alpha: randomRange(0.1, 0.6)
      });
    }
    starsRef.current = stars;
    
    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }, []);

  // Input Handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if(e.cancelable) e.preventDefault(); 
      mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Escape') {
            onTogglePause();
        }
        keysPressedRef.current.add(e.code);
        keysPressedRef.current.add(e.key); 
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
        keysPressedRef.current.delete(e.code);
        keysPressedRef.current.delete(e.key);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onTogglePause]);

  const createExplosion = (pos: Vector2D, color: string, count: number = 20) => {
    // Shockwave Ring
    particlesRef.current.push({
        id: Math.random().toString(),
        pos: { ...pos },
        velocity: { x: 0, y: 0 },
        radius: 5,
        color: color,
        life: 0.6,
        maxLife: 0.6,
        size: 2,
        decay: 0.03,
        drawType: 'stroke',
        expansionRate: 8
    });

    // High velocity sparks
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(3, 12);
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { ...pos },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        radius: randomRange(1.5, 4),
        color: color,
        life: randomRange(0.4, 0.8),
        maxLife: 0.8,
        size: randomRange(1, 3),
        decay: randomRange(0.02, 0.05),
        drawType: 'fill'
      });
    }
  };

  const spawnEnemy = () => {
    soundManager.playSpawn();
    const isHorizontal = Math.random() > 0.5;
    const side = Math.random() > 0.5 ? -1 : 1;
    let pos: Vector2D;
    let velocity: Vector2D;

    const baseSpeed = randomRange(2, 5);
    const speedMultiplier = settings.difficultyMultiplier || 1.0;
    const finalSpeed = baseSpeed * difficultyRef.current * speedMultiplier;

    if (isHorizontal) {
      pos = {
        x: side === -1 ? -50 : window.innerWidth + 50,
        y: Math.random() * window.innerHeight
      };
      velocity = {
        x: side * -1 * finalSpeed,
        y: randomRange(-1, 1) * speedMultiplier
      };
    } else {
      pos = {
        x: Math.random() * window.innerWidth,
        y: side === -1 ? -50 : window.innerHeight + 50
      };
      velocity = {
        x: randomRange(-1, 1) * speedMultiplier,
        y: side * -1 * finalSpeed
      };
    }

    const typeRoll = Math.random();
    let type: 'asteroid' | 'chaser' | 'pulsar' = 'asteroid';
    let color = GAME_COLORS.enemyAsteroid;
    let radius = randomRange(15, 25);

    if (typeRoll > 0.8 && scoreRef.current > 500) {
      type = 'chaser';
      color = GAME_COLORS.enemyChaser;
      radius = 12;
    } else if (typeRoll > 0.9 && scoreRef.current > 1000) {
      type = 'pulsar';
      color = GAME_COLORS.enemyPulsar;
      radius = 20;
    }

    enemiesRef.current.push({
      id: Math.random().toString(),
      pos,
      velocity,
      radius,
      color,
      type,
      pulsePhase: 0
    });
  };

  const update = (dt: number) => {
    framesRef.current++;
    scoreRef.current += 1;
    gridOffsetRef.current = (gridOffsetRef.current + (1 + scoreRef.current / 5000)) % 80;

    if (framesRef.current % 10 === 0) {
        onScoreUpdate(scoreRef.current);
    }

    difficultyRef.current = 1 + scoreRef.current / 5000;

    const player = playerRef.current;
    const now = Date.now();
    
    // Process Input
    const { up, down, left, right, shield } = settings.keyBindings;
    const keys = keysPressedRef.current;
    
    // Shield Activation
    if (keys.has(shield)) {
        if (!player.isShieldActive && now > player.shieldNextAvailableTime) {
            player.isShieldActive = true;
            player.shieldEndTime = now + GAME_CONFIG.shieldDuration;
            player.shieldNextAvailableTime = now + GAME_CONFIG.shieldCooldown;
            soundManager.playShieldActivate();
            
            // Visual burst for shield activation
             particlesRef.current.push({
                id: Math.random().toString(),
                pos: { ...player.pos },
                velocity: { x: 0, y: 0 },
                radius: 30,
                color: GAME_COLORS.shield,
                life: 0.5,
                maxLife: 0.5,
                size: 5,
                decay: 0.05,
                drawType: 'stroke',
                expansionRate: 2
            });
        }
    }

    // Shield Expiration
    if (player.isShieldActive && now > player.shieldEndTime) {
        player.isShieldActive = false;
    }

    // Movement
    const keyboardSpeed = 15;
    if (keys.has(up)) mouseRef.current.y -= keyboardSpeed;
    if (keys.has(down)) mouseRef.current.y += keyboardSpeed;
    if (keys.has(left)) mouseRef.current.x -= keyboardSpeed;
    if (keys.has(right)) mouseRef.current.x += keyboardSpeed;

    mouseRef.current.x = Math.max(0, Math.min(window.innerWidth, mouseRef.current.x));
    mouseRef.current.y = Math.max(0, Math.min(window.innerHeight, mouseRef.current.y));

    const dx = mouseRef.current.x - player.pos.x;
    const dy = mouseRef.current.y - player.pos.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        player.rotation = lerp(player.rotation || 0, Math.atan2(dy, dx), 0.1);
    }

    player.pos.x = lerp(player.pos.x, mouseRef.current.x, settings.sensitivity);
    player.pos.y = lerp(player.pos.y, mouseRef.current.y, settings.sensitivity);
    
    player.pos.x = Math.max(player.radius, Math.min(window.innerWidth - player.radius, player.pos.x));
    player.pos.y = Math.max(player.radius, Math.min(window.innerHeight - player.radius, player.pos.y));

    // Thruster Particles & Sound
    if (framesRef.current % 3 === 0) {
        soundManager.playThruster();
        const angle = (player.rotation || 0) + Math.PI;
        const spread = 0.4;
        const speed = randomRange(2, 5);
        particlesRef.current.push({
            id: Math.random().toString(),
            pos: { x: player.pos.x - Math.cos(player.rotation || 0) * 10, y: player.pos.y - Math.sin(player.rotation || 0) * 10 },
            velocity: { 
                x: Math.cos(angle + randomRange(-spread, spread)) * speed, 
                y: Math.sin(angle + randomRange(-spread, spread)) * speed 
            },
            radius: randomRange(2, 4),
            color: '#00ffff',
            life: 0.4,
            maxLife: 0.4,
            size: randomRange(1, 3),
            decay: 0.05,
            drawType: 'fill'
        });
    }

    // Trail
    if (framesRef.current % 2 === 0) {
        player.trail.push({ ...player.pos });
        if (player.trail.length > 12) player.trail.shift();
    }

    if (screenShakeRef.current > 0) {
      screenShakeRef.current *= 0.9;
      if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
    }

    if (framesRef.current % Math.max(20, Math.floor(GAME_CONFIG.spawnRate / difficultyRef.current)) === 0) {
      spawnEnemy();
    }

    // Update Enemies
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      
      if (enemy.type === 'chaser') {
         const angle = Math.atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
         const accel = 0.15 * (settings.difficultyMultiplier || 1);
         enemy.velocity.x += Math.cos(angle) * accel;
         enemy.velocity.y += Math.sin(angle) * accel;
         enemy.velocity.x *= 0.98;
         enemy.velocity.y *= 0.98;
      }

      if (enemy.type === 'pulsar' && enemy.pulsePhase !== undefined) {
          enemy.pulsePhase += 0.15;
          enemy.radius = 20 + Math.sin(enemy.pulsePhase) * 6;
      }

      enemy.pos.x += enemy.velocity.x;
      enemy.pos.y += enemy.velocity.y;

      if (
        enemy.pos.x < -100 || 
        enemy.pos.x > window.innerWidth + 100 || 
        enemy.pos.y < -100 || 
        enemy.pos.y > window.innerHeight + 100
      ) {
        enemiesRef.current.splice(i, 1);
        continue;
      }

      // Collision Logic
      if (checkCollision(player, enemy)) {
          // If shield is active, destroy enemy but protect player
          if (player.isShieldActive) {
             soundManager.playShieldDeflect();
             screenShakeRef.current = 10;
             createExplosion(enemy.pos, GAME_COLORS.shield, 15);
             // Push shield shockwave visual
             particlesRef.current.push({
                id: Math.random().toString(),
                pos: { ...player.pos },
                velocity: { x: 0, y: 0 },
                radius: player.radius + 15,
                color: '#ffffff',
                life: 0.3,
                maxLife: 0.3,
                size: 2,
                decay: 0.1,
                drawType: 'stroke',
                expansionRate: 5
             });
             enemiesRef.current.splice(i, 1);
          } 
          // Regular Damage Logic
          else if (Date.now() > player.invincibleUntil) {
            player.health -= 1;
            if (onHealthUpdate) onHealthUpdate(player.health);
            
            player.invincibleUntil = Date.now() + GAME_CONFIG.invincibilityDuration;
            screenShakeRef.current = 25;
            
            if (player.health <= 0) {
                soundManager.playExplosion();
            } else {
                soundManager.playHit();
                soundManager.playExplosion();
            }

            createExplosion(player.pos, GAME_COLORS.player, 30);
            createExplosion(enemy.pos, enemy.color, 15);
            
            enemiesRef.current.splice(i, 1);
            
            if (player.health <= 0) {
                onGameOver(scoreRef.current);
                return; 
            }
        }
      }
    }

    // Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.pos.x += p.velocity.x;
      p.pos.y += p.velocity.y;
      
      if (p.expansionRate) {
          p.radius += p.expansionRate;
      }

      p.life -= p.decay;
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }

    // Update Stars
    starsRef.current.forEach(star => {
      star.pos.y += star.speed * (1 + scoreRef.current / 10000); 
      if (star.pos.y > window.innerHeight) {
        star.pos.y = 0;
        star.pos.x = Math.random() * window.innerWidth;
      }
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // 1. Base Background
    ctx.fillStyle = GAME_COLORS.background;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    
    // Screen Shake
    if (screenShakeRef.current > 0) {
        const dx = (Math.random() - 0.5) * screenShakeRef.current;
        const dy = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(dx, dy);
    }

    // 2. Retro Grid
    ctx.beginPath();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    // Vertical lines
    const gridSpacing = 80;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    
    for (let x = 0; x <= w; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
    }
    // Horizontal scrolling lines
    for (let y = gridOffsetRef.current % gridSpacing; y <= h; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 3. Stars (Dim)
    starsRef.current.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.pos.x, star.pos.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. NEON BLOOM LAYER
    // "Lighter" blend mode makes overlapping colors add up to white (classic neon look)
    ctx.globalCompositeOperation = 'lighter';

    const player = playerRef.current;

    // Trail - Enhanced with core and outer glow
    if (player.trail.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Outer glow
        ctx.beginPath();
        ctx.moveTo(player.trail[0].x, player.trail[0].y);
        for (let i = 1; i < player.trail.length; i++) {
            ctx.lineTo(player.trail[i].x, player.trail[i].y);
        }
        ctx.strokeStyle = `rgba(0, 255, 255, 0.2)`;
        ctx.lineWidth = player.radius * 1.2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = GAME_COLORS.player;
        ctx.stroke();

        // Inner core
        ctx.beginPath();
        ctx.moveTo(player.trail[0].x, player.trail[0].y);
        for (let i = 1; i < player.trail.length; i++) {
            ctx.lineTo(player.trail[i].x, player.trail[i].y);
        }
        ctx.strokeStyle = `rgba(200, 255, 255, 0.5)`;
        ctx.lineWidth = player.radius * 0.4;
        ctx.shadowBlur = 0;
        ctx.stroke();
    }

    // Player - Multi-layer Glow
    const isInvincible = Date.now() < player.invincibleUntil;
    if (!isInvincible || Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.save();
        ctx.translate(player.pos.x, player.pos.y);
        
        // SHIELD RENDERING
        if (player.isShieldActive) {
            const timeRemaining = player.shieldEndTime - Date.now();
            const flicker = timeRemaining < 1000 ? Math.random() : 1;
            
            ctx.beginPath();
            ctx.arc(0, 0, player.radius + 12 + Math.sin(framesRef.current * 0.2) * 2, 0, Math.PI * 2);
            ctx.strokeStyle = GAME_COLORS.shield;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = GAME_COLORS.shield;
            ctx.globalAlpha = 0.8 * flicker;
            ctx.stroke();

            // Inner faint field
            ctx.fillStyle = GAME_COLORS.shield;
            ctx.globalAlpha = 0.2 * flicker;
            ctx.fill();
            
            ctx.globalAlpha = 1.0; // Reset for player
        } 
        
        // SHIELD COOLDOWN INDICATOR (If not active and not ready)
        else if (Date.now() < player.shieldNextAvailableTime) {
            const timeLeft = player.shieldNextAvailableTime - Date.now();
            const totalCooldown = GAME_CONFIG.shieldCooldown;
            const progress = 1 - (timeLeft / totalCooldown); // 0 to 1
            
            ctx.beginPath();
            ctx.arc(0, 0, player.radius + 15, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
            ctx.stroke();
        } else {
             // Shield Ready Indicator (Subtle ring)
            ctx.beginPath();
            ctx.arc(0, 0, player.radius + 15, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.rotate((player.rotation || 0) + Math.PI / 2);

        // Calculate pulse for idle "breathing" effect
        const breath = Math.sin(framesRef.current * 0.1) * 2; 

        const baseColor = isInvincible ? GAME_COLORS.playerInvincible : GAME_COLORS.player;
        
        // Path construction
        ctx.beginPath();
        ctx.moveTo(0, -player.radius * 1.5);
        ctx.lineTo(-player.radius, player.radius);
        ctx.lineTo(player.radius, player.radius);
        ctx.closePath();

        // Layer 1: Wide, soft ambient glow
        ctx.shadowBlur = 40 + breath;
        ctx.shadowColor = baseColor;
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.4;
        ctx.fill();

        // Layer 2: Tight, intense glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = baseColor;
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.8;
        ctx.fill();

        // Layer 3: Hot white core
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1.0;
        ctx.scale(0.6, 0.6); // Shrink for core
        ctx.fill();

        ctx.restore();
    }

    // Enemies - Dynamic Multi-layer Glow
    enemiesRef.current.forEach(enemy => {
        const pulse = Math.sin(framesRef.current * 0.15 + parseInt(enemy.id.slice(-3) || '0')) * 0.2 + 1; // Unique pulse offset

        ctx.save();
        ctx.translate(enemy.pos.x, enemy.pos.y);

        // Rotation logic
        if (enemy.type === 'asteroid') {
            ctx.rotate(framesRef.current * 0.02 + parseInt(enemy.id.slice(-2) || '0')); 
        } else if (enemy.type === 'chaser') {
            const angle = Math.atan2(enemy.velocity.y, enemy.velocity.x);
            ctx.rotate(angle + Math.PI / 2);
        }

        // Shape definition
        ctx.beginPath();
        if (enemy.type === 'asteroid') {
            ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        } else if (enemy.type === 'chaser') {
            ctx.moveTo(0, -enemy.radius);
            ctx.lineTo(enemy.radius, enemy.radius);
            ctx.lineTo(-enemy.radius, enemy.radius);
        } else if (enemy.type === 'pulsar') {
             ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        }
        ctx.closePath();

        // Layer 1: Outer Halo (Pulsing)
        ctx.shadowBlur = 30 * pulse;
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.color;
        ctx.globalAlpha = 0.5;
        ctx.fill();

        // Layer 2: Inner Body
        ctx.shadowBlur = 10;
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.color;
        ctx.globalAlpha = 0.9;
        ctx.fill();

        // Layer 3: Inner White Highlight (makes it look 3D/hot)
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.globalAlpha = 1.0;
        ctx.scale(0.5, 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2); // Simple circle core for all
        ctx.fill();

        ctx.restore();
    });

    // Particles - Hot Sparks
    particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        
        if (p.drawType === 'stroke') {
            // Shockwave
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size;
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Spark point
            // Draw colored glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw white hot center
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, p.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    });

    ctx.restore();
  };

  const loop = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Do not update game state if paused, but redraw the last frame to ensure it doesn't disappear if something clears it?
    // Actually, if we just return, the canvas remains as is. 
    // However, if we want to ensure the loop structure remains valid when resuming:
    // We already handle loop cancellation in useEffect.
    // So we just perform update/draw here.
    
    update(16); 
    draw(ctx);

    if (playerRef.current.health > 0) {
        requestRef.current = requestAnimationFrame(loop);
    }
  }, [onGameOver, onScoreUpdate, settings]); // loop doesn't strictly depend on isPaused because useEffect controls start/stop

  useEffect(() => {
    const resize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            // Redraw once on resize even if paused
            const ctx = canvasRef.current.getContext('2d');
            if(ctx) draw(ctx);
        }
    };
    window.addEventListener('resize', resize);
    resize();

    if (!isPaused) {
        requestRef.current = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop, isPaused]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-none"
    />
  );
};

export default GameCanvas;