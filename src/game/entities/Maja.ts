import Phaser from 'phaser';
import { Player } from './Player';

export class Maja extends Player {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Calls the Player.ts constructor to set up the physics sprite
        super(scene, x, y, 'maja');
        
        // Maja is the Tank: Highest health pool in the game
        this.health = 150;
        this.maxHealth = 150;
        this.smfMeter = 0;
    }

    /**
     * SPECIAL MOVE: Balkan Suplex
     * Consumes 30% SMF. High damage grapple with a chance to break Boss defense.
     * Mapped to CSV animation: 'maja_special_attack'
     */
    public executeBalkanSuplex() {
        if (this.smfMeter < 30 || this.isAttacking) return;

        this.isAttacking = true;
        this.setVelocity(0, 0);

        // Deduct SMF immediately on cast
        this.smfMeter -= 30;
        this.scene.events.emit('update-smf', this.smfMeter);

        // Create a short-range grab box in front of Maja
        const xOffset = this.flipX ? -60 : 60;
        const grabZone = this.scene.add.zone(this.x + xOffset, this.y - 40, 80, 100);
        this.scene.physics.add.existing(grabZone);

        let grabbedEnemy: any = null;
        
        const enemiesGroup = (this.scene as any).enemies;
        if (enemiesGroup) {
            this.scene.physics.add.overlap(grabZone, enemiesGroup, (gz, enemyObj: any) => {
                if (!grabbedEnemy && !enemyObj.isDead) {
                    grabbedEnemy = enemyObj;
                }
            });
        }

        // Give the physics engine 1 frame (20ms) to detect the overlap
        this.scene.time.delayedCall(20, () => {
            grabZone.destroy();
            
            if (grabbedEnemy) {
                this.executeSuplexSequence(grabbedEnemy);
            } else {
                // Whiffed the grab
                this.play('maja_special_attack', true); // Or a specific miss animation if you have one
                this.scene.time.delayedCall(400, () => { 
                    this.isAttacking = false; 
                    this.play('maja_idle', true);
                });
            }
        });
    }

    /**
     * The cinematic sequence that plays if the Suplex connects.
     */
    private executeSuplexSequence(enemy: any) {
        this.play('maja_special_attack', true);
        
        // Disable enemy AI/movement while grabbed
        if (enemy.isKnockedDown !== undefined) enemy.isKnockedDown = true;
        
        // Pin enemy to Maja's shoulder
        enemy.setPosition(this.x, this.y - 80); 
        enemy.setVelocity(0, 0);

        // Wait for the exact "slam" frame in the animation (e.g., frame 6)
        this.on('animationupdate', (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
            if (frame.index === 6) { 
                // Move enemy to the floor
                enemy.setPosition(this.x + (this.flipX ? -80 : 80), this.y);
                
                if (enemy.takeDamage) enemy.takeDamage(40);
                
                // 10% Armor Break Logic for Bosses
                if (enemy.enemyType === 'boss' && Phaser.Math.Between(1, 100) <= 10) {
                    if (enemy.applyArmorBreak) enemy.applyArmorBreak();
                }

                // Heavy impact juice
                this.scene.cameras.main.shake(200, 0.02);
                this.scene.sound.playAudioSprite('sfx_atlas', 'maja-suplex-slam');
                
                // Spawn debris/gore
                this.scene.events.emit('spawn-gore', { x: enemy.x, y: enemy.y, type: 'INDUSTRIAL' });
                
                // Stop listening so it doesn't trigger twice
                this.off('animationupdate'); 
            }
        });

        this.once('animationcomplete', () => {
            this.isAttacking = false;
            this.play('maja_idle', true);
            this.off('animationupdate'); // Safety cleanup
        });
    }

    /**
     * FINISHER: The Bor Mining Drill
     * Triggers at 100% SMF. Literally deletes the enemy from the game code.
     * Mapped to CSV animation: 'maja_finish_move'
     */
    public executeMiningDrill() {
        if (this.smfMeter < 100 || this.isAttacking) return;

        // Create a forward zone to catch the victim
        const xOffset = this.flipX ? -80 : 80;
        const drillHitbox = this.scene.add.zone(this.x + xOffset, this.y - 40, 100, 100);
        this.scene.physics.add.existing(drillHitbox);

        let grabbedEnemy: any = null;
        const enemiesGroup = (this.scene as any).enemies;
        
        if (enemiesGroup) {
            this.scene.physics.add.overlap(drillHitbox, enemiesGroup, (dh, enemyObj: any) => {
                if (!grabbedEnemy && !enemyObj.isDead) grabbedEnemy = enemyObj;
            });
        }

        this.scene.time.delayedCall(20, () => {
            drillHitbox.destroy();
            
            if (grabbedEnemy) {
                // Initiate the Finisher sequence
                this.isAttacking = true;
                this.smfMeter = 0;
                this.scene.events.emit('update-smf', this.smfMeter);
                this.scene.events.emit('update-corruption', 100); // VHS Glitch
                
                this.play('maja_finish_move', true);
                grabbedEnemy.setVelocity(0, 0);
                
                this.scene.sound.playAudioSprite('sfx_atlas', 'forbidden-riff-final');

                this.scene.time.delayedCall(800, () => {
                    this.scene.cameras.main.shake(1500, 0.015);
                    
                    // Continual blood spray effect
                    this.scene.time.addEvent({
                        delay: 100,
                        repeat: 15,
                        callback: () => {
                            this.scene.events.emit('spawn-blood-splatter', { x: grabbedEnemy.x, y: grabbedEnemy.y - 40 });
                        }
                    });

                    this.scene.time.delayedCall(1500, () => {
                        if (grabbedEnemy.takeDamage) grabbedEnemy.takeDamage(999); // Deleted
                        this.isAttacking = false;
                        this.play('maja_idle', true);
                    });
                });
            }
        });
    }

    /**
     * Override standard combat input from Player.ts to listen for Maja's specials
     */
    protected handleCombatInput() {
        super.handleCombatInput();

        const specialKey = this.scene.input.keyboard.addKey('Q');
        const finisherKey = this.scene.input.keyboard.addKey('E');

        if (Phaser.Input.Keyboard.JustDown(specialKey)) {
            this.executeBalkanSuplex();
        }

        if (Phaser.Input.Keyboard.JustDown(finisherKey)) {
            this.executeMiningDrill();
        }
    }
}