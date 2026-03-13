import Phaser from 'phaser';
import { Player } from '../Player';

/**
 * MUP (Ministarstvo Unutrašnjih Poslova) - 1993 Riot Police
 * Heavy, armored melee unit.
 */
export class MUP extends Phaser.Physics.Arcade.Sprite {
    public health: number = 60; // Armored, takes a few hits
    public isDead: boolean = false;
    public isHurt: boolean = false;
    public isAttacking: boolean = false;
    
    private speed: number = 80;
    private attackRange: number = 70;
    private attackCooldown: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Grab the starting frame from the Mega-Atlas
        super(scene, x, y, 'enemies_1993', 'mup-idle/001.png');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        // Belt-scroller hitbox: wide at the feet, short on the Y axis
        body.setSize(60, 30);
        body.setOffset(20, 150); 
        
        this.setOrigin(0.5, 1);
        body.setCollideWorldBounds(true);
        body.setAllowGravity(false); // Fake 3D depth, no real gravity

        this.play('mup-idle');
    }

    /**
     * AI Logic: Called every frame by MainLevel.ts
     */
    public updateAI(player: Player) {
        if (this.isDead || this.isHurt || this.isAttacking) {
            this.setVelocity(0, 0);
            return;
        }

        const distanceX = Math.abs(this.x - player.x);
        const distanceY = Math.abs(this.y - player.y);

        // Turn to face the player
        this.setFlipX(player.x < this.x);

        // Check if in attack range (both X distance and Z-depth/Y distance)
        if (distanceX < this.attackRange && distanceY < 20) {
            this.setVelocity(0, 0);
            
            // Respect the cooldown before swinging again
            if (this.scene.time.now > this.attackCooldown) {
                this.executeAttack(player);
            } else if (this.anims.currentAnim?.key !== 'mup-idle') {
                this.play('mup-idle', true);
            }
        } else {
            // Move towards the player
            const dirX = player.x > this.x ? 1 : -1;
            const dirY = player.y > this.y ? 1 : -1;

            // Move strictly on X if far away, but align Y to get into the same "lane"
            let vx = dirX * this.speed;
            let vy = distanceY > 10 ? dirY * (this.speed * 0.6) : 0;

            this.setVelocity(vx, vy);
            
            if (this.anims.currentAnim?.key !== 'mup-walk') {
                this.play('mup-walk', true);
            }
        }
    }

    private executeAttack(player: Player) {
        this.isAttacking = true;
        
        // Randomly choose between punch 1 and punch 2 from the CSV
        const attackAnim = Phaser.Math.Between(0, 1) === 0 ? 'mup-punch-1' : 'mup-punch-2';
        this.play(attackAnim, true);

        // Play swing sound
        this.scene.events.emit('play-generic-sfx', 'woosh_heavy');

        // Apply damage at the apex of the animation (approx 300ms in)
        this.scene.time.delayedCall(300, () => {
            if (this.isDead || this.isHurt) return; // Cancel if he was hit mid-swing

            const distanceX = Math.abs(this.x - player.x);
            const distanceY = Math.abs(this.y - player.y);

            // Re-check range to make sure the player didn't dodge
            if (distanceX < this.attackRange + 10 && distanceY < 30) {
                player.takeDamage(15);
            }
        });

        // Reset state when animation finishes
        this.on('animationcomplete', (anim: any) => {
            if (anim.key === 'mup-punch-1' || anim.key === 'mup-punch-2') {
                this.isAttacking = false;
                this.attackCooldown = this.scene.time.now + 1200; // 1.2 second pause between attacks
                this.play('mup-idle', true);
            }
        });
    }

    /**
     * Called by CollisionManager or Player melee hitbox
     */
    public takeDamage(amount: number) {
        if (this.isDead) return;

        this.health -= amount;
        this.isHurt = true;
        this.isAttacking = false;

        // Kinetic Feedback: Flash white
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(50, () => this.clearTint());

        // Spawn Industrial Sparks (hitting armor)
        this.scene.events.emit('spawn-gore', { x: this.x, y: this.y - 100, type: 'INDUSTRIAL' });
        
        // Play Hurt Sound
        this.scene.events.emit('play-sfx', { character: 'mup', action: 'damage' });

        if (this.health <= 0) {
            this.die();
        } else {
            this.play('mup-damage', true);
            
            // Pushback effect
            const pushback = this.flipX ? 15 : -15;
            this.x += pushback;

            this.scene.time.delayedCall(400, () => {
                if (!this.isDead) {
                    this.isHurt = false;
                    this.play('mup-idle', true);
                }
            });
        }
    }

    private die() {
        this.isDead = true;
        this.setVelocity(0, 0);
        
        // Disable physics body so players/bullets walk through the corpse
        (this.body as Phaser.Physics.Arcade.Body).enable = false;

        this.scene.events.emit('play-sfx', { character: 'mup', action: 'dying' });
        this.play('mup-dying', true);

        // Optional: Drop Dinar loot when defeated
        if (Phaser.Math.Between(1, 100) <= 30) {
            const mainLevel = this.scene as any;
            if (mainLevel.groundItems) {
                const item = this.scene.physics.add.sprite(this.x, this.y - 20, 'item_dinar') as any;
                item.lootData = { key: 'item_dinar', type: 'score', value: 100 };
                mainLevel.groundItems.add(item);
                
                this.scene.tweens.add({
                    targets: item,
                    y: this.y - 60,
                    duration: 300,
                    yoyo: true,
                    ease: 'Quad.easeOut'
                });
            }
        }
    }
}