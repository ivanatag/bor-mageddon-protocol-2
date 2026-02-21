import Phaser from 'phaser';
import { eventBus } from '../EventBus';

export interface WeaponConfig {
  name: string;
  maxAmmo: number;
  fireRate: number;        // ms between shots
  projectileSpeed: number;
  projectileColor: number;
  muzzleFlashOffset: { x: number; y: number };
  damage: number;
}

export const WEAPON_PRESETS: Record<string, WeaponConfig> = {
  pistol: {
    name: 'Zastava M57',
    maxAmmo: 8,
    fireRate: 400,
    projectileSpeed: 700,
    projectileColor: 0xffff00,
    muzzleFlashOffset: { x: 24, y: -8 },
    damage: 1,
  },
  smg: {
    name: 'Zastava M56',
    maxAmmo: 32,
    fireRate: 120,
    projectileSpeed: 800,
    projectileColor: 0xffaa00,
    muzzleFlashOffset: { x: 30, y: -6 },
    damage: 1,
  },
  shotgun: {
    name: 'Pump-Action',
    maxAmmo: 6,
    fireRate: 800,
    projectileSpeed: 600,
    projectileColor: 0xff4400,
    muzzleFlashOffset: { x: 28, y: -10 },
    damage: 3,
  },
};

export class Weapon {
  private scene: Phaser.Scene;
  private config: WeaponConfig;
  private currentAmmo: number;
  private canFire: boolean = true;
  private facingRight: boolean = true;
  private muzzleFlash: Phaser.GameObjects.Ellipse | null = null;

  constructor(scene: Phaser.Scene, config: WeaponConfig) {
    this.scene = scene;
    this.config = config;
    this.currentAmmo = config.maxAmmo;
  }

  /**
   * Fires the weapon from the given world position.
   * Returns true if a shot was fired, false if empty or on cooldown.
   */
  fire(x: number, y: number, facingRight: boolean): boolean {
    if (!this.canFire || this.currentAmmo <= 0) {
      return false;
    }

    this.facingRight = facingRight;
    this.currentAmmo--;
    this.canFire = false;

    // Muzzle flash offset (flips with direction)
    const dirMult = facingRight ? 1 : -1;
    const flashX = x + this.config.muzzleFlashOffset.x * dirMult;
    const flashY = y + this.config.muzzleFlashOffset.y;

    // Show muzzle flash
    this.spawnMuzzleFlash(flashX, flashY);

    // Emit event so the scene can spawn the projectile
    eventBus.emit('spawn-projectile', {
      x: flashX,
      y: flashY,
      speed: this.config.projectileSpeed,
      directionX: dirMult,
      color: this.config.projectileColor,
      damage: this.config.damage,
    });

    // Cooldown
    this.scene.time.delayedCall(this.config.fireRate, () => {
      this.canFire = true;
    });

    return true;
  }

  private spawnMuzzleFlash(x: number, y: number): void {
    if (this.muzzleFlash) {
      this.muzzleFlash.destroy();
    }

    this.muzzleFlash = this.scene.add.ellipse(x, y, 16, 10, 0xffffcc);
    this.muzzleFlash.setAlpha(0.9);
    this.muzzleFlash.setDepth(999);

    this.scene.tweens.add({
      targets: this.muzzleFlash,
      alpha: 0,
      scaleX: 2,
      scaleY: 1.5,
      duration: 80,
      onComplete: () => {
        this.muzzleFlash?.destroy();
        this.muzzleFlash = null;
      },
    });
  }

  isEmpty(): boolean {
    return this.currentAmmo <= 0;
  }

  getAmmo(): number {
    return this.currentAmmo;
  }

  getMaxAmmo(): number {
    return this.config.maxAmmo;
  }

  getName(): string {
    return this.config.name;
  }

  getConfig(): WeaponConfig {
    return this.config;
  }

  destroy(): void {
    this.muzzleFlash?.destroy();
  }
}
