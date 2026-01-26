import { Vector2D } from '../types';

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const distance = (p1: Vector2D, p2: Vector2D): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomColor = (colors: string[]): string => {
  return colors[Math.floor(Math.random() * colors.length)];
};

export const checkCollision = (c1: { pos: Vector2D, radius: number }, c2: { pos: Vector2D, radius: number }): boolean => {
  const dist = distance(c1.pos, c2.pos);
  return dist < c1.radius + c2.radius;
};