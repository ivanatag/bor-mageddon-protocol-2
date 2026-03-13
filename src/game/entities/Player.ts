import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    public characterName: string;
    
    // Core Stats (These are overridden by Marko/Darko/Maja subclasses)
    public health: number = 100;
    public maxHealth: number = 100;
    public smfMeter: number = 0;
    public speed: number = 220;

    // State Flags
    public isAttacking: boolean = false;
    public isJumping: boolean = false;
    public isInvulnerable: boolean = false;
    public facingRight: boolean = true;

    // Weapon State
    public ammo: number = 5; 
    public hasGun: boolean = true; // True when holding the M70, False when bare-handed

    constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
        // Initialize with the character's idle animation from the CSV
        super(scene, x, y, `${name}_idle`);
        this.characterName = name;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Define the physics body size and offset
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(80, 40); 
        body.setOffset(88, 210);
        this.setOrigin(0.5, 1);
        
        // The player moves in a 2D plane that fakes 3D depth, so no Y-gravity
        body.setAllowGravity(false); 
        body.setCollideWorldBounds(true);
    }

    /**
     * Called every frame by MainLevel.ts
     */
    update() {
        if (this.health <= 0) return;
        
        this.handleMovement();
        this.handleCombatInput();
        
        // Invulnerability Blinking Effect
        if (this.isInvulnerable) {
            this.alpha = Math.sin(this.scene.time.now * 0.02) * 0.5 + 0.5;
        } else {
            this.alpha = 1;
        }
    }

    /**
     * Handles keyboard movement and updates walking/idle animations
     */
    private handleMovement() {
        if (this.isAttacking) return;
        
        const cursors = this.scene.input.keyboard.createCursorKeys();
        let vx = 0, vy = 0;

        if (cursors.left.isDown) { 
            vx = -1; 
            this.flipX = true; 
            this.facingRight = false;
        } else if (cursors.right.isDown) { 
            vx = 1; 
            this.flipX = false; 
            this.facingRight = true;
        }
        
        if (cursors.up.isDown) vy = -0.7; 
        else if (cursors.down.isDown) vy = 0.7;

        this.setVelocity(vx * this.speed, vy * this.speed);
        
        // Update standard animations if not jumping
        if (!this.isJumping) {
            if (vx !== 0 || vy !== 0) {
                this.play(`${this.characterName}_walk`, true);
            } else {
                // Determine which idle animation to play based on weapon state
                const idleAnim = this.hasGun ? 'shoot_idle' : 'idle';
                this.play(`${this.characterName}_${idleAnim}`, true);
            }
        }
    }

    /**
     * Handles standard attacks (A key) and jumping (Space).
     * (Special attacks Q and E are handled in the subclasses like Marko.ts)
     */
    protected handleCombatInput() {
        const attackKey = this.scene.input.keyboard.addKey('A');
        const jumpKey = this.scene.input.keyboard.addKey('SPACE');

        // Handle Standard Attack
        if (Phaser.Input.Keyboard.JustDown(attackKey) && !this.isAttacking) {
            if (this.isJumping) {
                // Aerial Melee (Disables gun logic while airborne)
                this.executeMelee('jump_punch');
            } else {
                // Grounded Combat Logic
                if (this.hasGun && this.ammo > 0) {
                    this.executeRangedAttack();
                } else if (this.hasGun && this.ammo <= 0) {
                    this.executeWeaponThrow();
                } else {
                    this.executeMelee('punch_1');
                }
            }
        }

        // Handle Jump
        if (Phaser.Input.Keyboard.JustDown(jumpKey) && !this.isJumping && !this.isAttacking) {
            this.executeJump();
        }
    }

    /**
     * Standard Jump logic. (Darko overrides this for a higher jump).
     */
    protected executeJump() {
        this.isJumping = true;
        this.play(`${this.characterName}_jump`, true);
        
        this.scene.tweens.add({
            targets: this,
            y: this.y - 150,
            duration: 400,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => { 
                this.isJumping = false; 
                if (!this.isAttacking) {
                    const idleAnim = this.hasGun ? 'shoot_idle' : 'idle';
                    this.play(`${this.characterName}_${idleAnim}`, true);
                }
            }
        });
    }

    /**
     * Shoots the M70 using the 1-frame recoil technique.
     */
    private executeRangedAttack() {
        this.isAttacking = true;
        this.ammo--;
        
        // Play gunshot sound
        this.scene.sound.playAudioSprite('sfx_atlas', 'm70_fire');

        // Swap to 1-frame Recoil animation
        this.play(`${this.characterName}_shoot_recoil`, true);
        
        // Push the character back 5 pixels to simulate recoil weight
        const pushback = this.flipX ? 5 : -5;
        this.x += pushback;

        // Spawn the BULLET Projectile
        this.scene.events.emit('spawn-projectile', {
            x: this.x + (this.flipX ? -110 : 110),
            y: this.y - 125,
            direction: this.flipX ? -1 : 1,
            type: 'BULLET'
        });

        // 100ms Recovery: Revert to Shoot Idle and restore position
        this.scene.time.delayedCall(100, () => {
            this.x -= pushback; // Restore X position
            if (!this.isDead) this.play(`${this.characterName}_shoot_idle`, true);
            this.isAttacking = false;
        });
    }

    /**
     * Throws the empty M70 rifle at the enemy.
     */
    private executeWeaponThrow() {
        this.isAttacking = true;
        this.play(`${this.characterName}_throw`, true); 

        // Spawn the THROW Projectile mid-animation
        this.scene.time.delayedCall(200, () => {
            this.scene.events.emit('spawn-projectile', {
                x: this.x + (this.flipX ? -60 : 60), 
                y: this.y - 110, 
                direction: this.flipX ? -1 : 1, 
                type: 'THROW' // Tells Projectile.ts to use arc gravity and rotation
            });
            
            // Mark the player as bare-handed
            this.hasGun = false;
        });

        this.scene.time.delayedCall(400, () => { 
            this.isAttacking = false;
            this.play(`${this.characterName}_idle`, true); 
        });
    }

    /**
     * Executes a standard bare-handed punch.
     */
    protected executeMelee(animKey: string) {
        this.isAttacking = true;
        this.play(`${this.characterName}_${animKey}`, true);
        
        // Basic Hitbox creation
        const xOffset = this.flipX ? -60 : 60;
        const hitbox = this.scene.add.zone(this.x + xOffset, this.y - 40, 60, 60);
        this.scene.physics.add.existing(hitbox);

        const enemiesGroup = (this.scene as any).enemies;
        if (enemiesGroup) {
            this.scene.physics.add.overlap(hitbox, enemiesGroup, (hb, enemyObj: any) => {
                if (enemyObj.takeDamage && !enemyObj.isHurt) {
                    enemyObj.takeDamage(10); // Standard punch damage
                    this.scene.events.emit('spawn-gore', { x: enemyObj.x, y: enemyObj.y, type: 'CLASSIC' });
                }
            });
        }

        // Cleanup hitbox
        this.scene.time.delayedCall(200, () => { 
            hitbox.destroy();
            this.isAttacking = false; 
        });
    }

    /**
     * Called when an enemy successfully strikes the player.
     */
    public takeDamage(amount: number) {
        if (this.isInvulnerable || this.health <= 0) return;

        this.health -= amount;
        this.isInvulnerable = true;
        this.isAttacking = false; // Interrupt current attack

        // Play hurt animation
        this.play(`${this.characterName}_damage_&_hurt`, true);
        
        // Update React HUD
        this.scene.events.emit('update-health', this.health);

        // Recovery Time
        this.scene.time.delayedCall(400, () => { 
            if (this.health > 0) {
                const idleAnim = this.hasGun ? 'shoot_idle' : 'idle';
                this.play(`${this.characterName}_${idleAnim}`, true);
            }
        });

        // End Invulnerability frames after 1.5 seconds
        this.scene.time.delayedCall(1500, () => { 
            this.isInvulnerable = false; 
        });
    }

    public get isDead(): boolean {
        return this.health <= 0;
    }
}