import Phaser from 'phaser';

export interface GoreParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: number;
  life: number;
  maxLife: number;
}

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
    if (!enabled) {
      this.clear();
    }
  }

  spawnBloodSplatter(x: number, y: number, intensity: number = 1): void {
    if (!this.enabled) return;

    const particleCount = Math.floor(15 * intensity);
    const colors = [0xcc0000, 0x990000, 0x660000, 0xff0000, 0x800000];

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
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        maxLife: 0.5 + Math.random() * 1
      });
    }
  }

  spawnDinarExplosion(x: number, y: number): void {
    if (!this.enabled) return;

    const particleCount = 20;
    const colors = [0x228B22, 0x32CD32, 0x006400, 0x00FF00];

    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 100;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        maxLife: 0.8 + Math.random() * 0.5
      });
    }
  }

  update(delta: number): void {
    const dt = delta / 1000;
    this.graphics.clear();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Apply gravity
      p.vy += 400 * dt;

      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Decrease life
      p.life -= dt / p.maxLife;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Draw particle
      const alpha = Math.max(0, p.life);
      this.graphics.fillStyle(p.color, alpha);
      this.graphics.fillCircle(p.x, p.y, p.size * p.life);
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
