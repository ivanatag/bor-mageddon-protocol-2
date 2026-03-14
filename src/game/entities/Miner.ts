import Phaser from 'phaser';
import { Player } from '../Player';

/**
 * Miner: The "Shambling Tank" of the Bor Copper Mine.
 * Features high endurance, devastating heavy melee attacks, and a sinking death logic.
 */
export class Miner extends Phaser.Physics.Arcade.Sprite {
    public health: number = 250; // Extremely high endurance
    public isDead: boolean = false;
    public isHurt: boolean = false;
    
    private isAttacking: boolean = false;
    private attackCooldown: boolean = false;

    private speed: number = 50; // Very slow, shuffling walk
    private attackRange: number = 90; // Needs to get relatively close to swing

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Initialised from the 1993 Mega-Atlas
        super(scene, x, y, 'enemies_1993', 'miner-walk/001.png');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Calibrate wide, heavy physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(70, 40);
        body.setOffset(40, 160);
        this.setOrigin(0.5, 1);
        
        body.setCollideWorldBounds(true);
        body.setAllowGravity(false); // Belt-scroller depth physics

        this.play('miner-walk', true);
    }

    public updateAI(player: Player) {
        if (this.isDead || this.isHurt || this.isAttacking) {
            this.setVelocity(0, 0);
            return;
        }

        const distX = Math.abs(player.x - this.x);
        const distY = Math.abs(player.y - this.y);

        this.setFlipX(player.x < this.x);

        // 1. Attack Trigger: If player is within heavy pickaxe swing range
        if (distX <= this.attackRange && distY <= 30 && !this.attackCooldown) {
            this.executeHeavyMelee(player);
        } else {
            // 2. Shuffling walk logic
            const dirX = player.x > this.x ? 1 : -1;
            const dirY = player.y > this.y ? 1 : -1;

            let vx = dirX * this.speed;
            let vy = distY > 10 ? dirY * (this.speed * 0.7) : 0;

            this.setVelocity(vx, vy);
            
            if (this.anims.currentAnim?.key !== 'miner-walk') {
                this.play('miner-walk', true);
            }
        }
    }

    /**
     * Heavy Melee Swing (Since the CSV did not have a 'miner-throw' animation)
     */
    private executeHeavyMelee(player: Player) {
        this.isAttacking = true;
        this.setVelocity(0, 0);

        // Play aggressive melee sequence
        this.play('miner-melee', true);
        
        // Play heavy swoosh sound
        this.scene.events.emit('play-generic-sfx', 'woosh_heavy');

        // Apply damage at the apex of the swing (approx 400ms in)
        this.scene.time.delayedCall(400, () => {
            if (this.isDead || this.isHurt) return;

            const distX = Math.abs(player.x - this.x);
            const distY = Math.abs(player.y - this.y);

            // Huge damage if it connects!
            if (distX <= this.attackRange + 15 && distY <= 35) {
                player.takeDamage(35); 
                this.scene.events.emit('play-generic-sfx', 'sfx_punch_hit');
                
                // Massive screen shake for tank impact
                this.scene.cameras.main.shake(200, 0.015);
            }
        });

        this.once('animationcomplete', (anim: any) => {
            if (anim.key === 'miner-melee') {
                this.isAttacking = false;
                this.attackCooldown = true;
                
                // 3-second recovery speed for the heavy pickaxe
                this.scene.time.delayedCall(3000, () => (this.attackCooldown = false));
                this.play('miner-walk', true);
            }
        });
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        
        this.health -= amount;
        
        // Only interrupt attacks if the damage is high enough, simulating heavy "poise"
        if (amount >= 20) {
            this.isAttacking = false;
        }

        // Kinetic Feedback
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(50, () => this.clearTint());

        // Blood Splatter
        this.scene.events.emit('spawn-gore', { x: this.x, y: this.y - 120, type: 'CLASSIC' });
        
        // Audio
        this.scene.events.emit('play-sfx', { character: 'miner', action: 'damage' });

        if (this.health <= 0) {
            this.die();
        } else if (amount >= 20) {
            // Only play hurt animation for strong hits (like shotgun or finisher)
            this.isHurt = true;
            this.play('miner-damage', true);
            
            this.scene.time.delayedCall(400, () => {
                if (!this.isDead) {
                    this.isHurt = false;
                    this.play('miner-walk', true);
                }
            });
        }
    }

    /**
     * Final Death: Collapse and Sinking Archive Tween
     */
    protected die() {
        this.isDead = true;
        this.setVelocity(0, 0);
        
        // Disable physics body
        (this.body as Phaser.Physics.Arcade.Body).enable = false;

        this.scene.events.emit('play-sfx', { character: 'miner', action: 'dying' });
        this.play('miner-dying', true);

        // Gore: Final burst of industrial debris
        this.scene.events.emit('spawn-gore', { x: this.x, y: this.y - 80, type: 'INDUSTRIAL' });

        // Wait for the dying animation to finish before sinking into the ground
        this.once('animationcomplete', (anim: any) => {
            if (anim.key === 'miner-dying') {
                // Sinks into the floor and fades out 
                this.scene.tweens.add({
                    targets: this,
                    alpha: 0,           // Fade to transparent
                    y: this.y + 50,      // Sink into Bor runoff
                    duration: 2500,     // 2.5 second sink
                    onComplete: () => {
                        // High loot drop chance for killing a tank!
                        if (Phaser.Math.Between(1, 100) <= 80) {
                            this.scene.events.emit('spawn-loot', { x: this.x, y: this.y - 50 });
                        }
                        this.destroy(); 
                    }
                });
            }
        });
    }
}