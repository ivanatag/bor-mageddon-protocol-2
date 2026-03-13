import Phaser from 'phaser';
import { GoreManager } from '../systems/GoreManager';

/**
 * BreakableObject: Handles environmental hazards and loot containers.
 * Examples: K67 Kiosks, Trash Containers (Kontejneri), and crates.
 */
export class BreakableObject extends Phaser.Physics.Arcade.Sprite {
  private objectType: 'crate' | 'barrel' | 'locker' | 'kiosk' | 'container';
  private health: number;
  private dropPool: any[];
  private goreManager: GoreManager;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    type: 'crate' | 'barrel' | 'locker' | 'kiosk' | 'container', 
    dropPool: any[],
    goreManager: GoreManager
  ) {
    super(scene, x, y, `obj_${type}`);
    this.objectType = type;
    this.dropPool = dropPool;
    this.goreManager = goreManager;

    // Scale health based on PRD: Standard = 2 hits, Heavy (Kiosk/Stove) = 4 hits [cite: 2116-2117]
    this.health = (type === 'kiosk' || type === 'container') ? 4 : 2;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Grounded for belt-scroller depth [cite: 2157-2158]
    this.setOrigin(0.5, 1);
    this.body.setImmovable(true); 
    this.setDepth(this.y); // Dynamic depth sorting [cite: 2159]
  }

  /**
   * Called when a player hitbox overlaps with the object.
   * Heavy weapons (isWeapon = true) deal 2x damage [cite: 2161-2162].
   */
  public takeDamage(isWeapon: boolean = false) {
    if (this.health <= 0) return;

    this.health -= isWeapon ? 2 : 1;

    // Shake effect on hit [cite: 2162]
    this.scene.tweens.add({
      targets: this,
      x: this.x + Phaser.Math.Between(-3, 3),
      duration: 50,
      yoyo: true,
      repeat: 2
    });

    if (this.health <= 0) {
      this.shatter();
    }
  }

  private shatter() {
    // Play era-appropriate destruction sound [cite: 2164]
    this.scene.sound.play(`sfx_break_${this.objectType}`);

    // Trigger visual debris particles via GoreManager [cite: 2166]
    // Uses 'BUREAUCRATIC' for paper-filled kiosks or 'INDUSTRIAL' for metal bins
    const goreType = (this.objectType === 'kiosk') ? 'BUREAUCRATIC' : 'INDUSTRIAL';
    this.goreManager.emitGore(this.x, this.y - 40, goreType, 'FINISHER');

    this.scene.cameras.main.shake(150, 0.005); [cite: 2166]
    this.rollForLoot(); [cite: 2167]
    this.destroy();
  }

  private rollForLoot() {
    if (this.dropPool.length === 0) return;

    // 40% base drop rate as per PRD specifications [cite: 2169]
    if (Phaser.Math.Between(1, 100) <= 40) {
      const lootData = Phaser.Utils.Array.GetRandom(this.dropPool); [cite: 2169]
      this.spawnDroppedItem(lootData);
    }
  }

  private spawnDroppedItem(lootData: any) {
    const item = this.scene.physics.add.sprite(this.x, this.y - 20, lootData.key);
    item.setData('itemType', lootData.type);

    // Loot "pops" out with a small bounce [cite: 2173]
    this.scene.tweens.add({
      targets: item,
      y: this.y - 60,
      duration: 300,
      yoyo: true,
      ease: 'Power1'
    });

    // Add to the scene's ground items group for collection logic [cite: 2174]
    (this.scene as any).groundItems.add(item);
  }
}
