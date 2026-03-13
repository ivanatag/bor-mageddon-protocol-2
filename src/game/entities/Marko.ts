import Phaser from 'phaser';
import { Player } from './Player';

export class Marko extends Player {
    // Marko's unique stats
    private specialRadius: number = 160;
    private specialDamage: number = 25;
    private finisherRadius: number = 250;
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Calls the Player.ts constructor to set up the physics sprite
        super(scene, x, y, 'marko');
        
        // Overriding base player stats for Marko's specific build
        this.health = 100;
        this.maxHealth = 100;
        this.smfMeter = 0;
    }

    /**
     * SPECIAL MOVE: Wall of Death
     * 360-degree chain-link belt swing that damages and knocks back enemies.
     * Costs 25% SMF. Mapped to CSV animation: 'marko_special_attack'
     */
    public executeWallOfDeath() {
        if (this.smfMeter < 25 || this.isAttacking) return;

        this.isAttacking = true;
        this.smfMeter -= 25;
        this.scene.events.emit('update-smf', this.smfMeter); // Updates React HUD
        
        // Play the animation mapped from the Movements CSV
        this.play('marko_special_attack', true);
        
        // Play audio mapped from Sound CSV
        this.scene.sound.playAudioSprite('sfx_atlas', 'marko_special_1');
        
        // Create an invisible circular hitbox for the AoE
        const cycloneZone = this.scene.add.circle(this.x, this.y - 40, this.specialRadius);
        this.scene.physics.add.existing(cycloneZone);
        (cycloneZone.body as Phaser.Physics.Arcade.Body).setCircle(this.specialRadius);

        // Detect overlapping enemies (Assuming enemies are stored in 'enemies' group on the scene)
        const enemiesGroup = (this.scene as any).enemies;
        if (enemiesGroup) {
            this.scene.physics.add.overlap(cycloneZone, enemiesGroup, (cz, enemyObj: any) => {
                if (enemyObj.takeDamage) {
                    enemyObj.takeDamage(this.specialDamage);
                    
                    // Knockback logic
                    const pushDir = enemyObj.x > this.x ? 1 : -1;
                    enemyObj.setVelocity(300 * pushDir, -100); 
                }
            });
        }

        // Cleanup after animation completes (approx 500ms)
        this.scene.time.delayedCall(500, () => {
            cycloneZone.destroy();
            this.isAttacking = false;
            this.play('marko_idle', true);
        });
    }

    /**
     * FINISHER: Sony Walkman Feedback Blast
     * Triggers at 100% SMF. Screen-clearing AoE that turns enemies into bureaucratic gore.
     * Mapped to CSV animation: 'marko_finish_move'
     */
    public executeWalkmanFinisher() {
        if (this.smfMeter < 100 || this.isAttacking) return;

        this.isAttacking = true;
        this.smfMeter = 0;
        this.scene.events.emit('update-smf', this.smfMeter); // Reset HUD
        
        // Trigger the global VHS Glitch in the React UI
        this.scene.events.emit('update-corruption', 100); 
        
        this.play('marko_finish_move', true);
        
        // The Forbidden Riff from Sound CSV
        this.scene.sound.playAudioSprite('sfx_atlas', 'forbidden-riff-final'); 
        this.scene.cameras.main.shake(1000, 0.015);

        // Massive AOE Impact Radius
        const blastZone = this.scene.add.circle(this.x, this.y - 40, this.finisherRadius);
        this.scene.physics.add.existing(blastZone);

        const enemiesGroup = (this.scene as any).enemies;
        if (enemiesGroup) {
            this.scene.physics.add.overlap(blastZone, enemiesGroup, (bz, enemyObj: any) => {
                if (!enemyObj.isDead && enemyObj.takeDamage) {
                    // Instant Kill
                    enemyObj.takeDamage(999);
                    
                    // Spawn Tax Form / Black Sludge Gore
                    this.scene.events.emit('spawn-gore', {
                        x: enemyObj.x, 
                        y: enemyObj.y - 50, 
                        type: 'BUREAUCRATIC'
                    });
                }
            });
        }

        // Cleanup after the cinematic blast
        this.scene.time.delayedCall(1500, () => {
            blastZone.destroy();
            this.isAttacking = false;
            this.play('marko_idle', true);
        });
    }

    /**
     * Override standard combat input from Player.ts to listen for Marko's specific specials
     */
    protected handleCombatInput() {
        // Call the standard punch/shoot logic from the parent class
        super.handleCombatInput();

        const specialKey = this.scene.input.keyboard.addKey('Q');
        const finisherKey = this.scene.input.keyboard.addKey('E');

        if (Phaser.Input.Keyboard.JustDown(specialKey)) {
            this.executeWallOfDeath();
        }

        if (Phaser.Input.Keyboard.JustDown(finisherKey)) {
            this.executeWalkmanFinisher();
        }
    }
}