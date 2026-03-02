import Phaser from 'phaser';

export type GoreType = 'CLASSIC' | 'BUREAUCRATIC' | 'INDUSTRIAL';

export interface GoreParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'rect'; // rect for shredded paper
}

const GORE_PALETTES: Record<GoreType, number[]> = {
  CLASSIC: [0xcc0000, 0x990000, 0x660000, 0xff0000, 0x800000],
  BUREAUCRATIC: [0xf5f5dc, 0xe8e0c8, 0xccccaa, 0xddddbb, 0xaaaaaa],
  INDUSTRIAL: [0x1a1a1a, 0x2d2d2d, 0x0a0a0a, 0x333333, 0x111111],
};

export class GoreManager {
  private scene: Phaser.Scene;
  private particles: GoreParticle[] = [];
  private graphics: Phaser.GameObjects.Graphics;
  private maxParticles: number = 200;
  private enabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(100);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }

  /**
   * Universal gore emitter. Type determines palette and particle shape.
   * CLASSIC = red blood circles
   * BUREAUCRATIC = shredded tax form rectangles (beige/white)
   * INDUSTRIAL = black sludge circles
   */
  spawnGore(x: number, y: number, type: GoreType, intensity: number = 1): void {
    if (!this.enabled) return;

    const particleCount = Math.floor(15 * intensity);
    const colors = GORE_PALETTES[type];
    const shape: 'circle' | 'rect' = type === 'BUREAUCRATIC' ? 'rect' : 'circle';

    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150 * intensity;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        size: type === 'BUREAUCRATIC' ? 3 + Math.random() * 6 : 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        maxLife: 0.5 + Math.random() * 1,
        shape,
      });
    }
  }

  /** Convenience aliases */
  spawnBloodSplatter(x: number, y: number, intensity: number = 1): void {
    this.spawnGore(x, y, 'CLASSIC', intensity);
  }

  spawnDinarExplosion(x: number, y: number): void {
    this.spawnGore(x, y, 'BUREAUCRATIC', 1.5);
  }

  spawnSludgeBurst(x: number, y: number, intensity: number = 1): void {
    this.spawnGore(x, y, 'INDUSTRIAL', intensity);
  }

  update(delta: number): void {
    const dt = delta / 1000;
    this.graphics.clear();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.vy += 400 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt / p.maxLife;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, p.life);
      this.graphics.fillStyle(p.color, alpha);

      if (p.shape === 'rect') {
        // Shredded paper rectangles (BUREAUCRATIC)
        this.graphics.fillRect(p.x - p.size / 2, p.y - p.size / 4, p.size * p.life, p.size * 0.4 * p.life);
      } else {
        this.graphics.fillCircle(p.x, p.y, p.size * p.life);
      }
    }
  }

  clear(): void {
    this.particles = [];
    this.graphics.clear();
  }

  destroy(): void {
    this.clear();
    this.graphics.destroy();
  }
}
