import Phaser from 'phaser';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';

/**
 * CollisionManager: Handles precision hit detection between projectiles and entities.
 * Orchestrates the relationship between the Player's firearms and the Enemy waves.
 */
export class CollisionManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene; // [cite: 2218]
    }

    /**
     * Sets up the physics overlap for ranged combat.
     * Maps the 'bullet.png' or 'throwable_weapon' to the enemy group.
     */
    public setupProjectileCollisions(projectiles: Phaser.Physics.Arcade.Group, enemies: Phaser.Physics.Arcade.Group) {
        // [cite: 668, 1660, 2219]
        this.scene.physics.add.overlap(
            projectiles,
            enemies,
            (proj, target) => {
                const projectile = proj as Projectile;
                const enemy = target as Enemy;

                // Ignore hits if the enemy is already in a dead or invulnerable state
                if (enemy.isDead || (enemy as any).isInvulnerable) return; // [cite: 1614, 1628, 2037]

                // Trigger the projectile's impact logic (Gore, Damage, and Sound)
                projectile.onImpact(enemy); // [cite: 1664, 1674, 2125]
            },
            undefined,
            this
        );
    }

    /**
     * Specialized logic for Boss Multi-Hitboxes (Slobodan CEO / Mecha-Tito).
     * Handles 2x/3x damage multipliers for headshots.
     */
    public setupBossCollisions(projectiles: Phaser.Physics.Arcade.Group, boss: any) {
        // Headshot Logic: 3x Damage for Slobodan mustache area [cite: 1149, 1295, 1729, 2219]
        if (boss.headHitbox) {
            this.scene.physics.add.overlap(projectiles, boss.headHitbox, (proj, head) => {
                const projectile = proj as Projectile;
                boss.takeDamageFromZone(projectile.getDamage(), 'head'); // [cite: 1291, 1548, 1759]
                projectile.onImpact(boss);
            });
        }

        // Torso Logic: Standard Damage [cite: 1186, 1731, 2220]
        if (boss.torsoHitbox) {
            this.scene.physics.add.overlap(projectiles, boss.torsoHitbox, (proj, torso) => {
                const projectile = proj as Projectile;
                boss.takeDamageFromZone(projectile.getDamage(), 'torso'); // [cite: 1548, 1708]
                projectile.onImpact(boss);
            });
        }
    }
}
