import Phaser from 'phaser';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';

/**
 * CollisionManager: Handles precision hit detection between projectiles and entities.
 * Orchestrates the relationship between the Player's firearms and the Enemy waves.
 */
export class CollisionManager {
    private scene: Phaser.Scene;
    // How close entities need to be on the Y-axis (depth) to actually hit each other
    private readonly Z_DEPTH_TOLERANCE = 35; 

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Sets up the physics overlap for ranged combat.
     */
    public setupProjectileCollisions(projectiles: Phaser.Physics.Arcade.Group, enemies: Phaser.Physics.Arcade.Group) {
        this.scene.physics.add.overlap(
            projectiles,
            enemies,
            (proj, target) => {
                const projectile = proj as Projectile;
                const enemy = target as Enemy;

                // 1. Ignore hits if the enemy is already dead or invulnerable
                // (The bullet will pass cleanly through corpses)
                if (enemy.isDead || (enemy as any).isInvulnerable) return;

                // 2. Trigger the projectile's impact logic (Damage, Gore, and Sound)
                projectile.onImpact(enemy);
            },
            // The "Process Callback": Only allow the collision if they are on the same 3D plane
            (proj, target) => {
                const projectile = proj as Projectile;
                const enemy = target as Enemy;
                
                // Compare their "feet" (Y-coordinates). If the difference is larger than the tolerance,
                // the bullet passes in front of or behind the enemy without hitting them!
                return Math.abs(projectile.y - enemy.y) <= this.Z_DEPTH_TOLERANCE;
            },
            this
        );
    }

    /**
     * Specialized logic for Boss Multi-Hitboxes (Slobodan CEO / Mecha-Tito).
     * Handles 2x/3x damage multipliers for headshots.
     */
    public setupBossCollisions(projectiles: Phaser.Physics.Arcade.Group, boss: any) {
        // Headshot Logic: 3x Damage for mustache area
        if (boss.headHitbox) {
            this.scene.physics.add.overlap(
                projectiles, 
                boss.headHitbox, 
                (proj, head) => {
                    const projectile = proj as Projectile;
                    
                    // Tell the boss it's a headshot FIRST, so it can set its damage multiplier internally
                    if (boss.setDamageZone) boss.setDamageZone('head');
                    
                    // Let the projectile do its normal impact routine (which will trigger boss.takeDamage)
                    projectile.onImpact(boss);
                },
                // Same Z-depth check applies to bosses!
                (proj) => {
                    return Math.abs((proj as Projectile).y - boss.y) <= this.Z_DEPTH_TOLERANCE;
                },
                this
            );
        }

        // Torso Logic: Standard Damage
        if (boss.torsoHitbox) {
            this.scene.physics.add.overlap(
                projectiles, 
                boss.torsoHitbox, 
                (proj, torso) => {
                    const projectile = proj as Projectile;
                    
                    if (boss.setDamageZone) boss.setDamageZone('torso');
                    projectile.onImpact(boss);
                },
                (proj) => {
                    return Math.abs((proj as Projectile).y - boss.y) <= this.Z_DEPTH_TOLERANCE;
                },
                this
            );
        }
    }
}