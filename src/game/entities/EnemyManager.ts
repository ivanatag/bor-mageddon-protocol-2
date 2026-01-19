import Phaser from 'phaser';
import { Enemy, BanknoteType } from './Enemy';

export class EnemyManager {
  private scene: Phaser.Scene;
  private enemies: Enemy[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 3000;
  private maxEnemies: number = 10;
  private difficulty: number = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

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

  update(delta: number): void {
    // Update spawn timer
    this.spawnTimer += delta;

    // Auto-spawn based on difficulty
    if (this.spawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Update all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (!enemy.active) {
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(delta);
    }
  }

  handleHit(enemy: Enemy): Enemy[] {
    const newEnemies: Enemy[] = [];
    const splitData = enemy.split();
    const x = enemy.x;
    const y = enemy.y;

    // Remove hit enemy
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
    enemy.destroy();

    // Spawn split enemies
    for (const data of splitData) {
      const newEnemy = this.spawnEnemy(x, y, data.type, data.velocityX);
      newEnemies.push(newEnemy);

      // Start fade for stars
      if (data.type === 'STAR') {
        newEnemy.startFade();
      }
    }

    return newEnemies;
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  getEnemyCount(): number {
    return this.enemies.length;
  }

  increaseDifficulty(): void {
    this.difficulty += 0.2;
    this.spawnInterval = Math.max(1500, this.spawnInterval - 100);
    this.maxEnemies = Math.min(15, this.maxEnemies + 1);
  }

  reset(): void {
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.spawnTimer = 0;
    this.difficulty = 1;
    this.spawnInterval = 3000;
    this.maxEnemies = 10;
  }

  destroy(): void {
    this.reset();
  }
}
