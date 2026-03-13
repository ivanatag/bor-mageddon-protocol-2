import Phaser from 'phaser';

export class Dizelcic extends Phaser.Physics.Arcade.Sprite {
    public health: number = 120;
    public isDead: boolean = false;
    public isHurt: boolean = false;
    private isSpraying: boolean = false;
    private sprayCooldown: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Initialised with standard idle/walk key
        super(scene, x, y, 'dizelcic_walk');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(80, 40);
        this.body.setOffset(88, 210);
        this.setOrigin(0.5, 1);
    }

    public updateAI(player: Phaser.Physics.Arcade.Sprite) {
        if (this.isDead || this.isHurt || this.isSpraying) {
            this.setVelocityX(0);
            return;
        }

        const distX = Math.abs(player.x - this.x);
        const distY = Math.abs(player.y - this.y);

        // Ambush Trigger: Within 200px
        if (distX <= 200 && distY <= 20 && !this.sprayCooldown) {
            this.executeAerosolAttack();
        } else {
            // Stalk logic
            this.setVelocityY(distY > 15 ? (player.y > this.y ? 90 : -90) : 0);
            if (distX > 180) {
                this.setVelocityX(player.x > this.x ? 110 : -110);
                this.flipX = player.x < this.x;
                this.play('dizelcic_walk', true);
            } else {
                this.setVelocityX(0);
            }
        }
        
        this.setDepth(this.y);
    }

    private executeAerosolAttack() {
        this.isSpraying = true;
        this.setVelocityX(0);
        
        // Uses punch_1 as defined in the CSV for the aerosol attack
        this.play('dizelcic_punch_1', true); 

        // Spawn mist on Frame 2
        this.on('animationupdate', (anim: any, frame: any) => {
            if (frame.index === 2) this.spawnMistCloud();
        });

        this.once('animationcomplete', () => {
            this.isSpraying = false;
            this.sprayCooldown = true;
            this.scene.time.delayedCall(2000, () => (this.sprayCooldown = false));
        });
    }

    private spawnMistCloud() {
        // Area denial logic...
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.isHurt = true;
        
        // Play the standardized damage animation from CSV
        this.play('dizelcic_damage_&_hurt', true);
        
        this.scene.time.delayedCall(200, () => {
            this.isHurt = false;
        });

        if (this.health <= 0) this.isDead = true; // Add death logic later
    }
}
