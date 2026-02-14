import Phaser from 'phaser';
import { Enemy, BanknoteType } from './Enemy';
import { SlobodanCEO } from './SlobodanCEO';
import { CorruptedMiner } from './CorruptedMiner';
import { Dizelcic } from './Dizelcic';
import { MechaTito } from './MechaTito';
import { VampirChetnik } from './VampirChetnik';
import { ZombiePartisan } from './ZombiePartisan';
import { GestapoGhoul } from './GestapoGhoul';
import { BIABoss } from './BIABoss';
import { HologramThug } from './HologramThug';
import { TheAlgorithm } from './TheAlgorithm';
import { BioMetricEnforcer } from './BioMetricEnforcer';
import { DroneSmederevac } from './DroneSmederevac';

export type EraType = 'bor_1993' | 'yugoslavia_1944' | 'neo_belgrade_2090';

export interface EraEnemy {
  entity: Phaser.GameObjects.Container;
  type: string;
}

export class EnemyManager {
  private scene: Phaser.Scene;
  private enemies: Enemy[] = [];
  private eraEnemies: EraEnemy[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 3000;
  private maxEnemies: number = 10;
  private difficulty: number = 1;
  private currentEra: EraType = 'bor_1993';
  private waveNumber: number = 0;
  private bossSpawned: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setEra(era: EraType): void {
    this.currentEra = era;
    this.bossSpawned = false;
    this.waveNumber = 0;
  }

  // ── Pang-mode spawning (banknote bubbles) ──

  spawnEnemy(x?: number, y?: number, type?: BanknoteType, velocityX?: number): Enemy {
    const spawnX = x ?? 100 + Math.random() * (this.scene.scale.width - 200);
    const spawnY = y ?? 100;
    const banknoteType = type ?? '500B';

    const enemy = new Enemy(this.scene, spawnX, spawnY, banknoteType, velocityX);
    this.enemies.push(enemy);
    return enemy;
  }

  spawnWave(count: number = 3): void {
    for (let i = 0; i < count; i++) {
      const x = 100 + (i / count) * (this.scene.scale.width - 200);
      this.spawnEnemy(x, 80 + Math.random() * 50);
    }
  }

  // ── Era-based wave dispatcher ──

  spawnEraWave(): void {
    this.waveNumber++;

    switch (this.currentEra) {
      case 'bor_1993': this.spawnBor1993Wave(); break;
      case 'yugoslavia_1944': this.spawnYugoslavia1944Wave(); break;
      case 'neo_belgrade_2090': this.spawnNeoBelgrade2090Wave(); break;
    }
  }

  private spawnBor1993Wave(): void {
    const w = this.scene.scale.width;
    const baseY = this.scene.scale.height - 150;
    const count = Math.min(2 + this.waveNumber, 6);

    for (let i = 0; i < count; i++) {
      const x = 50 + Math.random() * (w - 100);
      const y = baseY + Math.random() * 100 - 50;
      const roll = Math.random();

      if (roll < 0.4) {
        const miner = new CorruptedMiner(this.scene, x, y);
        this.eraEnemies.push({ entity: miner, type: 'CorruptedMiner' });
      } else {
        const dizel = new Dizelcic(this.scene, x, y);
        this.eraEnemies.push({ entity: dizel, type: 'Dizelcic' });
      }
    }

    // Boss wave
    if (this.waveNumber >= 5 && !this.bossSpawned) {
      const boss = new SlobodanCEO(this.scene, w / 2, baseY - 40);
      this.eraEnemies.push({ entity: boss, type: 'SlobodanCEO' });
      this.bossSpawned = true;
    }
  }

  private spawnYugoslavia1944Wave(): void {
    const w = this.scene.scale.width;
    const baseY = this.scene.scale.height - 150;
    const count = Math.min(3 + this.waveNumber, 8);

    for (let i = 0; i < count; i++) {
      const x = 50 + Math.random() * (w - 100);
      const y = baseY + Math.random() * 100 - 50;
      const roll = Math.random();

      if (roll < 0.4) {
        this.eraEnemies.push({ entity: new ZombiePartisan(this.scene, x, y), type: 'ZombiePartisan' });
      } else if (roll < 0.65) {
        this.eraEnemies.push({ entity: new VampirChetnik(this.scene, x, y), type: 'VampirChetnik' });
      } else {
        this.eraEnemies.push({ entity: new GestapoGhoul(this.scene, x, y), type: 'GestapoGhoul' });
      }
    }

    if (this.waveNumber >= 5 && !this.bossSpawned) {
      const boss = new MechaTito(this.scene, w / 2, baseY - 60);
      boss.setSummonCallback((sx, sy) => {
        const partisan = new ZombiePartisan(this.scene, sx, sy);
        this.eraEnemies.push({ entity: partisan, type: 'ZombiePartisan' });
      });
      this.eraEnemies.push({ entity: boss, type: 'MechaTito' });
      this.bossSpawned = true;
    }
  }

  private spawnNeoBelgrade2090Wave(): void {
    const w = this.scene.scale.width;
    const baseY = this.scene.scale.height - 150;
    const count = Math.min(2 + this.waveNumber, 7);

    for (let i = 0; i < count; i++) {
      const x = 50 + Math.random() * (w - 100);
      const y = baseY + Math.random() * 100 - 50;
      const roll = Math.random();

      if (roll < 0.25) {
        this.eraEnemies.push({ entity: new HologramThug(this.scene, x, y), type: 'HologramThug' });
      } else if (roll < 0.45) {
        this.eraEnemies.push({ entity: new TheAlgorithm(this.scene, x, y), type: 'TheAlgorithm' });
      } else if (roll < 0.65) {
        this.eraEnemies.push({ entity: new BioMetricEnforcer(this.scene, x, y), type: 'BioMetricEnforcer' });
      } else {
        this.eraEnemies.push({ entity: new DroneSmederevac(this.scene, x, y - 80), type: 'DroneSmederevac' });
      }
    }

    if (this.waveNumber >= 5 && !this.bossSpawned) {
      const boss = new BIABoss(this.scene, w / 2, baseY - 100);
      this.eraEnemies.push({ entity: boss, type: 'BIABoss' });
      this.bossSpawned = true;
    }
  }

  // ── Update loops ──

  update(delta: number): void {
    // Update spawn timer
    this.spawnTimer += delta;

    // Auto-spawn based on difficulty (Pang mode)
    if (this.spawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Update Pang enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active) {
        this.enemies.splice(i, 1);
        continue;
      }
      enemy.update(delta);
    }
  }

  updateEraEnemies(delta: number, playerX: number, playerY: number): void {
    for (let i = this.eraEnemies.length - 1; i >= 0; i--) {
      const entry = this.eraEnemies[i];
      if (!entry.entity.active) {
        this.eraEnemies.splice(i, 1);
        continue;
      }

      // Call update with player position for AI-driven enemies
      const e = entry.entity as any;
      if (typeof e.update === 'function') {
        if (entry.type === 'DroneSmederevac') {
          e.update(delta, playerX, playerY);
        } else {
          e.update(delta, playerX, playerY);
        }
      }
    }
  }

  // ── Pang hit handling ──

  handleHit(enemy: Enemy): Enemy[] {
    const newEnemies: Enemy[] = [];
    const splitData = enemy.split();
    const x = enemy.x;
    const y = enemy.y;

    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
    enemy.destroy();

    for (const data of splitData) {
      const newEnemy = this.spawnEnemy(x, y, data.type, data.velocityX);
      newEnemies.push(newEnemy);
      if (data.type === 'STAR') {
        newEnemy.startFade();
      }
    }

    return newEnemies;
  }

  // ── Getters ──

  getEnemies(): Enemy[] { return this.enemies; }
  getEraEnemies(): EraEnemy[] { return this.eraEnemies; }
  getEnemyCount(): number { return this.enemies.length + this.eraEnemies.length; }
  getWaveNumber(): number { return this.waveNumber; }
  isBossActive(): boolean { return this.bossSpawned && this.eraEnemies.some(e => 
    ['SlobodanCEO', 'MechaTito', 'BIABoss'].includes(e.type) && e.entity.active
  ); }

  // ── Difficulty ──

  increaseDifficulty(): void {
    this.difficulty += 0.2;
    this.spawnInterval = Math.max(1500, this.spawnInterval - 100);
    this.maxEnemies = Math.min(15, this.maxEnemies + 1);
  }

  // ── Cleanup ──

  reset(): void {
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.eraEnemies.forEach(e => e.entity.destroy());
    this.eraEnemies = [];
    this.spawnTimer = 0;
    this.difficulty = 1;
    this.spawnInterval = 3000;
    this.maxEnemies = 10;
    this.waveNumber = 0;
    this.bossSpawned = false;
  }

  destroy(): void {
    this.reset();
  }
}
