import Phaser from 'phaser';

export type BanknoteType = '500B' | '50B' | '5M' | 'STAR';

export interface BanknoteConfig {
  type: BanknoteType;
  size: number;
  color: number;
  scoreValue: number;
  splitInto: BanknoteType | null;
  splitCount: number;
}

export const BANKNOTE_CONFIGS: Record<BanknoteType, BanknoteConfig> = {
  '500B': {
    type: '500B',
    size: 60,
    color: 0x228B22,
    scoreValue: 500000000000,
    splitInto: '50B',
    splitCount: 2
  },
  '50B': {
    type: '50B',
    size: 45,
    color: 0x32CD32,
    scoreValue: 50000000000,
    splitInto: '5M',
    splitCount: 2
  },
  '5M': {
    type: '5M',
    size: 30,
    color: 0x90EE90,
    scoreValue: 5000000,
    splitInto: 'STAR',
    splitCount: 5
  },
  'STAR': {
    type: 'STAR',
    size: 15,
    color: 0xff0000,
    scoreValue: 1000,
    splitInto: null,
    splitCount: 0
  }
};

export class Enemy extends Phaser.GameObjects.Container {
  private banknoteType: BanknoteType;
  private config: BanknoteConfig;
  private mainShape: Phaser.GameObjects.Ellipse | Phaser.GameObjects.Star;
  private velocityX: number;
  private velocityY: number;
  private bounceSpeed: number = 200;
  private isFading: boolean = false;
  private fadeTimer: number = 0;
  private flickerTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: BanknoteType, velocityX?: number) {
    super(scene, x, y);

    this.banknoteType = type;
    this.config = BANKNOTE_CONFIGS[type];
    this.velocityX = velocityX ?? (Math.random() > 0.5 ? 100 : -100);
    this.velocityY = 0;

    if (type === 'STAR') {
      // Create red star
      this.mainShape = scene.add.star(0, 0, 5, this.config.size / 2, this.config.size, this.config.color);
      this.mainShape.setStrokeStyle(2, 0xffff00);
    } else {
      // Create banknote bubble
      this.mainShape = scene.add.ellipse(0, 0, this.config.size, this.config.size * 0.7, this.config.color);
      this.mainShape.setStrokeStyle(3, 0x006400);

      // Add denomination text
      const text = scene.add.text(0, 0, type, {
        fontFamily: 'VT323',
        fontSize: '12px',
        color: '#000000'
      });
      text.setOrigin(0.5);
      this.add(text);
    }

    this.add(this.mainShape);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.config.size, this.config.size * 0.8);
    body.setOffset(-this.config.size / 2, -this.config.size * 0.4);
  }

  update(delta: number): void {
    const dt = delta / 1000;
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Apply gravity
    this.velocityY += 300 * dt;

    // Bounce off floor
    if (this.y >= this.scene.scale.height - 80) {
      this.velocityY = -this.bounceSpeed - Math.random() * 50;
      this.y = this.scene.scale.height - 80;
    }

    // Bounce off walls
    if (this.x <= this.config.size / 2) {
      this.velocityX = Math.abs(this.velocityX);
      this.x = this.config.size / 2;
    } else if (this.x >= this.scene.scale.width - this.config.size / 2) {
      this.velocityX = -Math.abs(this.velocityX);
      this.x = this.scene.scale.width - this.config.size / 2;
    }

    // Apply velocity
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // Handle star fading
    if (this.banknoteType === 'STAR' && this.isFading) {
      this.fadeTimer += dt;
      this.flickerTimer += dt;

      // Flicker effect
      if (this.flickerTimer > 0.1) {
        this.flickerTimer = 0;
        this.mainShape.setAlpha(this.mainShape.alpha > 0.5 ? 0.3 : 1);
      }

      // Complete fade after 2 seconds
      if (this.fadeTimer >= 2) {
        this.destroy();
      }
    }
  }

  startFade(): void {
    if (this.banknoteType === 'STAR') {
      this.isFading = true;
    }
  }

  getBanknoteType(): BanknoteType {
    return this.banknoteType;
  }

  getConfig(): BanknoteConfig {
    return this.config;
  }

  getVelocityX(): number {
    return this.velocityX;
  }

  split(): { type: BanknoteType; velocityX: number }[] {
    if (!this.config.splitInto) return [];

    const result: { type: BanknoteType; velocityX: number }[] = [];
    for (let i = 0; i < this.config.splitCount; i++) {
      const angle = (i / this.config.splitCount) * Math.PI - Math.PI / 2;
      const vx = Math.cos(angle) * 150;
      result.push({
        type: this.config.splitInto,
        velocityX: vx
      });
    }
    return result;
  }
}
