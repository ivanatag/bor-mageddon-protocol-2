import Phaser from 'phaser';
import { Player } from './Player';

export class Darko extends Player {
    // Darko's unique lanky/bassist stats
    private specialWidth: number = 300;
    private specialDamage: number = 15;
    private finisherRadius: number = 250;
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Calls the Player.ts constructor to set up the physics sprite
        super(scene, x, y, 'darko');
        
        // Darko is slightly faster but more fragile than Marko
        this.health = 90;
        this.maxHealth = 90;
        this.smfMeter = 0;
    }

    /**
     * OVERRIDE: Lanky Build Jump
     * Darko has a snappier, higher vertical arc than Marko.
     */
    protected executeJump() {
        this.isJumping = true;
        this.play(`${this.characterName}_jump`, true);
        
        this.scene.tweens.add({
            targets: this,
            y: this.y - 180, // Higher jump arc (180px vs Marko's 150px)
            duration: 350,   // Snappier rise and fall (350ms vs 400ms)
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => { 
                this.isJumping = false; 
                if (!this.isAttacking) this.play(`${this.characterName}_idle`);
            }
        });
    }

    /**
     * OVERRIDE: Extended Reach Melee
     * Darko's longer arms and bass guitar provide a wider standard hitbox.
     */
    protected executeMelee(animKey: string) {
        this.isAttacking = true;
        this.play(`${this.characterName}_${animKey}`, true);

        // Extended Reach: Pushes the hitbox further out in front of him
        const xOffset = this.flipX ? -80 : 80;
        const hitbox = this.scene.add.zone(this.x + xOffset, this.y - 40, 100, 60);
        this.scene.physics.add.existing(hitbox);

        const enemiesGroup = (this.scene as any).enemies;
        if (enemiesGroup) {
            this.scene.physics.add.overlap(hitbox, enemiesGroup, (hb, enemyObj: any) => {
                if (enemyObj.takeDamage && !enemyObj.isHurt) {
                    enemyObj.takeDamage(10); // Standard attack damage
                    
                    // Minor hitstop for "juice"
                    this.scene.physics.world.pause();
                    this.scene.time.delayedCall(30, () => this.scene.physics.world.resume());
                }
            });
        }

        this.scene.time.delayedCall(250, () => {
            hitbox.destroy();
            this.isAttacking = false;
        });
    }

    /**
     * SPECIAL MOVE: Feedback Blast
     * Consumes 25% SMF. Sends a traveling shockwave across the floor to pop enemies up.
     * Mapped to CSV animation: 'darko_special_attack'
     */
    public executeFeedbackBlast() {
        if (this.smfMeter < 25 || this.isAttacking) return;

        this.isAttacking = true;
        this.smfMeter -= 25;
        this.scene.events.emit('update-smf', this.smfMeter); // Updates React HUD
        
        this.play('darko_special_attack', true);
        
        // Play specific audio mapped from Sound CSV
        this.scene.sound.playAudioSprite('sfx_atlas', 'darko-special-smf');
        this.scene.cameras.main.shake(150, 0.008);

        // Create a traveling directional shockwave
        const xDir = this.flipX ? -1 : 1;
        const shockwave = this.scene.add.zone(this.x + (50 * xDir), this.y - 40, 100, 80);
        this.scene.physics.add.existing(shockwave);
        
        // Send the hitbox flying forward
        (shockwave.body as Phaser.Physics.Arcade.Body).setVelocityX(450 * xDir);

        const enemiesGroup = (this.scene as any).enemies;
        if (enemiesGroup) {
            this.scene.physics.add.overlap(shockwave, enemiesGroup, (sw, enemyObj: any) => {
                if (enemyObj.takeDamage) {
                    enemyObj.takeDamage(this.specialDamage);
                    enemyObj.setVelocityY(-350); // "Pop up" effect for juggle combos
                }
            });
        }

        // Cleanup after the wave travels
        this.scene.time.delayedCall(400, () => {
            shockwave.destroy();
            this.isAttacking = false;
            this.play('darko_idle', true);
        });
    }

    /**
     * FINISHER: Air Guitar Resonance Fracture
     * Triggers at 100% SMF. Shatters the enemy's structure into dust.
     * Mapped to CSV animation: 'darko_finish_move'
     */
    public executeAirGuitarFinisher() {
        if (this.smfMeter < 100 || this.isAttacking) return;

        this.isAttacking = true;
        this.smfMeter = 0;
        this.scene.events.emit('update-smf', this.smfMeter);
        this.scene.events.emit('update-corruption', 100); // Triggers UI VHS Glitch
        
        this.play('darko_finish_move', true);
        
        // The Forbidden Riff from Sound CSV
        this.scene.sound.playAudioSprite('sfx_atlas', 'forbidden-riff-final'); 
        this.scene.cameras.main.flash(300, 255, 255, 255);

        // Massive AOE Impact Radius
        const blastZone = this.scene.add.circle(this.x, this.y - 40, this.finisherRadius);
        this.scene.physics.add.existing(blastZone);

        const enemiesGroup = (this.scene as any).enemies;
        if (enemiesGroup) {
            this.scene.physics.add.overlap(blastZone, enemiesGroup, (bz, enemyObj: any) => {
                if (!enemyObj.isDead && enemyObj.takeDamage) {
                    // Instant Kill
                    enemyObj.takeDamage(999);
                    
                    // Spawn Dust/Debris Gore
                    this.scene.events.emit('spawn-gore', {
                        x: enemyObj.x, 
                        y: enemyObj.y - 50, 
                        type: 'DUST'
                    });
                }
            });
        }

        // Cleanup
        this.scene.time.delayedCall(1500, () => {
            blastZone.destroy();
            this.isAttacking = false;
            this.play('darko_idle', true);
        });
    }

    /**
     * Override standard combat input from Player.ts to listen for Darko's specials
     */
    protected handleCombatInput() {
        // Call the standard punch/shoot logic from the parent class
        super.handleCombatInput();

        const specialKey = this.scene.input.keyboard.addKey('Q');
        const finisherKey = this.scene.input.keyboard.addKey('E');

        if (Phaser.Input.Keyboard.JustDown(specialKey)) {
            this.executeFeedbackBlast();
        }

        if (Phaser.Input.Keyboard.JustDown(finisherKey)) {
            this.executeAirGuitarFinisher();
        }
    }
}