import Phaser from 'phaser';
import { Player } from '../Player';

/**
 * Dizelčić: The younger tracksuit thug of Bor 1993.
 * Uses an aerosol spray can for close-range area denial.
 */
export class Dizelcic extends Phaser.Physics.Arcade.Sprite {
    public health: number = 80; // Weaker than the older Dizelaš
    public isDead: boolean = false;
    public isHurt: boolean = false;
    
    private isSpraying: boolean = false;
    private sprayCooldown: boolean = false;

    private speed: number = 110;
    private attackRange: number = 150;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Grab the starting frame from the 1993 Mega-Atlas
        super(scene, x, y, 'enemies_1993', 'dizelcic-walk/001.png');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(40, 30);
        body.setOffset(30, 150);
        this.setOrigin(0.5, 1);
        body.setCollideWorldBounds(true);
        body.setAllowGravity(false);

        this.play('dizelcic-walk', true);
    }

    public updateAI(player: Player) {
        if (this.isDead || this.isHurt || this.isSpraying) {
            this.setVelocity(0, 0);
            return;
        }

        const distX = Math.abs(player.x - this.x);
        const distY = Math.abs(player.y - this.y);

        this.setFlipX(player.x < this.x);

        // Ambush Trigger: Within spray range
        if (distX <= this.attackRange && distY <= 20 && !this.sprayCooldown) {
            this.executeAerosolAttack(player);
        } else {
            // Stalk logic
            const dirX = player.x > this.x ? 1 : -1;
            const dirY = player.y > this.y ? 1 : -1;

            let vx = dirX * this.speed;
            let vy = distY > 15 ? dirY * (this.speed * 0.8) : 0;

            this.setVelocity(vx, vy);
            
            if (this.anims.currentAnim?.key !== 'dizelcic-walk') {
                this.play('dizelcic-walk', true);
            }
        }
    }

    private executeAerosolAttack(player: Player) {
        this.isSpraying = true;
        this.setVelocity(0, 0);
        
        // Uses punch_1 as defined in the CSV for the aerosol attack
        this.play('dizelcic-punch-1', true); 

        // Play spray sound effect
        this.scene.events.emit('play-generic-sfx', 'sfx_spray_can');

        // Spawn mist slightly after the animation starts
        this.scene.time.delayedCall(200, () => {
            if (!this.isDead && !this.isHurt) {
                this.spawnMistCloud(player);
            }
        });

        this.once('animationcomplete', (anim: any) => {
            if (anim.key === 'dizelcic-punch-1') {
                this.isSpraying = false;
                this.sprayCooldown = true;
                this.scene.time.delayedCall(2000, () => (this.sprayCooldown = false));
                this.play('dizelcic-walk', true);
            }
        });
    }

    private spawnMistCloud(player: Player) {
        const xDir = this.flipX ? -1 : 1;
        
        // Create an invisible damage zone where the mist is spraying
        const impactZone = this.scene.add.zone(this.x + (70 * xDir), this.y - 80, 80, 80);
        this.scene.physics.add.existing(impactZone);

        // Visually spawn dust/mist particles via GoreManager
        this.scene.events.emit('spawn-dust', { x: impactZone.x, y: impactZone.y });

        // Check for overlap with the player
        this.scene.physics.add.overlap(impactZone, player, () => {
            // Prevent hitting the player repeatedly in the same frame
            if (!(player as any).isInvulnerable) {
                player.takeDamage(10); // Lower damage, but creates distance
            }
        });

        // The mist cloud dissipates after 400ms
        this.scene.time.delayedCall(400, () => impactZone.destroy());
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        
        this.health -= amount;
        this.isSpraying = false;

        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(50, () => this.clearTint());

        // Blood Splatter
        this.scene.events.emit('spawn-gore', { x: this.x, y: this.y - 70, type: 'CLASSIC' });
        
        // Audio
        this.scene.events.emit('play-sfx', { character: 'dizelcic', action: 'damage' });

        if (this.health <= 0) {
            this.die();
        } else {
            this.isHurt = true;
            this.play('dizelcic-damage', true);
            
            this.x += this.flipX ? 15 : -15; // Pushback

            this.scene.time.delayedCall(300, () => {
                if (!this.isDead) {
                    this.isHurt = false;
                    this.play('dizelcic-walk', true);
                }
            });
        }
    }

    private die() {
        this.isDead = true;
        this.setVelocity(0, 0);
        (this.body as Phaser.Physics.Arcade.Body).enable = false;

        this.scene.events.emit('play-sfx', { character: 'dizelcic', action: 'dying' });
        this.play('dizelcic-dying', true);

        // Knockdown flight path
        this.x += this.flipX ? 30 : -30;

        // Loot drop
        if (Phaser.Math.Between(1, 100) <= 25) {
            const mainLevel = this.scene as any;
            if (mainLevel.groundItems) {
                const item = this.scene.physics.add.sprite(this.x, this.y - 20, 'item_dinar') as any;
                item.lootData = { key: 'item_dinar', type: 'score', value: 50 };
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