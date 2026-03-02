import Phaser from 'phaser';

/**
 * CollisionManager – Centralizes collision detection, belt depth-sorting,
 * and boss critical-zone hit detection.
 */
export class CollisionManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Belt depth-sort: set depth of all game objects based on Y position.
   * Call once per frame for all sortable entities.
   */
  depthSort(entities: Phaser.GameObjects.GameObject[]): void {
    for (const entity of entities) {
      if ('y' in entity && 'setDepth' in entity) {
        (entity as any).setDepth((entity as any).y);
      }
    }
  }

  /**
   * Check if a projectile overlaps with a boss's head hitbox (critical zone).
   * Returns 'head' | 'torso' | null.
   */
  checkBossCriticalZone(
    projectile: Phaser.GameObjects.GameObject,
    headHitbox: Phaser.GameObjects.Zone,
    torsoHitbox: Phaser.GameObjects.Zone
  ): 'head' | 'torso' | null {
    const pBounds = (projectile as any).getBounds?.();
    if (!pBounds) return null;

    const headBounds = headHitbox.getBounds();
    const torsoBounds = torsoHitbox.getBounds();

    if (Phaser.Geom.Rectangle.Overlaps(pBounds, headBounds)) {
      return 'head';
    }
    if (Phaser.Geom.Rectangle.Overlaps(pBounds, torsoBounds)) {
      return 'torso';
    }
    return null;
  }

  /**
   * Register arcade overlap between two groups/objects with a callback.
   * Convenience wrapper for the scene's physics system.
   */
  addOverlap(
    objectA: Phaser.GameObjects.GameObject | Phaser.GameObjects.Group,
    objectB: Phaser.GameObjects.GameObject | Phaser.GameObjects.Group,
    callback: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    context?: any
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.overlap(objectA, objectB, callback, undefined, context);
  }

  /**
   * Register arcade collider between two groups/objects.
   */
  addCollider(
    objectA: Phaser.GameObjects.GameObject | Phaser.GameObjects.Group,
    objectB: Phaser.GameObjects.GameObject | Phaser.GameObjects.Group,
    callback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    context?: any
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.collider(objectA, objectB, callback, undefined, context);
  }

  /**
   * Check if point is within a circular AoE zone (for Wall of Death, etc.).
   */
  isInAoE(targetX: number, targetY: number, centerX: number, centerY: number, radius: number): boolean {
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    return (dx * dx + dy * dy) <= (radius * radius);
  }

  /**
   * Z-axis precision check: only register hit if entities are on similar Y belt.
   * Belt tolerance = how many pixels of Y difference is acceptable for a "same lane" hit.
   */
  isSameBeltLane(entityAY: number, entityBY: number, tolerance: number = 30): boolean {
    return Math.abs(entityAY - entityBY) <= tolerance;
  }
}
