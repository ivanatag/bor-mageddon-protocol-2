import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    public characterName: string;
    
    // Core Stats
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
    public hasGun: boolean = true;

    constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
        super(scene, x, y, `${name}_idle`);
        this.characterName = name;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(80, 40); 
        body.setOffset(88, 210);
        this.setOrigin(0.5, 1);
        
        body.setAllowGravity(false); 
        body.setCollideWorldBounds(true);
    }

    update() {
        if (this.health <= 0) return;
        
        this.handleMovement();
        this.handleCombatInput();
        
        if (this.isInvulnerable) {
            this.alpha = Math.sin(this.scene.time.now * 0.02) * 0.5 + 0.5;
        } else {
            this.alpha = 1;
        }
    }

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
        
        if (!this.isJumping) {
            if (vx !== 0 || vy !== 0) {
                this.play(`${this.characterName}_walk`, true);
            } else {
                const idleAnim = this.hasGun ? 'shoot_idle' : 'idle';
                this.play(`${this.characterName}_${idleAnim}`, true);
            }
        }
    }

    /**
     * Reads the exact keys defined in the HUD:
     * A = Punch, S = Kick, D = Shoot, SPACE = Jump, Q = Special, E = Finisher
     */
    protected handleCombatInput() {
        // Only accept input if we aren't already attacking or dead
        if (this.isAttacking || this.health <= 0) return;

        const kb = this.scene.input.keyboard;
        if (!kb) return;

        // 1. JUMP COMMAND (SPACEBAR)
        if (Phaser.Input.Keyboard.JustDown(kb.addKey('SPACE')) && !this.isJumping) {
            this.executeJump();
            return; // Exit early so we don't accidentally attack on the exact same frame
        }

        // 2. AERIAL COMBAT (If jumping, you can only punch/kick, no shooting)
        if (this.isJumping) {
            if (Phaser.Input.Keyboard.JustDown(kb.addKey('A'))) {
                this.executeMelee('jump_punch');
            } else if (Phaser.Input.Keyboard.JustDown(kb.addKey('S'))) {
                this.executeMelee('jump_kick');
            }
            return; 
        }

        // 3. GROUNDED COMBAT
        // A -> PUNCH
        if (Phaser.Input.Keyboard.JustDown(kb.addKey('A'))) {
            this.executeMelee('punch_1');
        }
        // S -> KICK
        else if (Phaser.Input.Keyboard.JustDown(kb.addKey('S'))) {
            this.executeMelee('kick_1');
        }
        // D -> SHOOT (Or throw weapon if empty)
        else if (Phaser.Input.Keyboard.JustDown(kb.addKey('D'))) {
            if (this.hasGun && this.ammo > 0) {
                this.executeRangedAttack();
            } else if (this.hasGun && this.ammo <= 0) {
                this.executeWeaponThrow();
            } else {
                // If they press shoot but have no gun, do a heavy punch
                this.executeMelee('punch_2'); 
            }
        }
        // Q -> SPECIAL ABILITY (Overridden by Maja/Marko/Darko)
        else if (Phaser.Input.Keyboard.JustDown(kb.addKey('Q'))) {
            this.executeSpecial();
        }
        // E -> FINISHER (Overridden by Maja/Marko/Darko)
        else if (Phaser.Input.Keyboard.JustDown(kb.addKey('E'))) {
            this.executeFinisher();
        }
    }

    // --- COMBAT ACTIONS ---

    /**
     * The Jump Command logic. Elevates the character and applies a shadow/tween.
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

    private executeRangedAttack() {
        this.isAttacking = true;
        this.ammo--;
        
        this.scene.sound.playAudioSprite('sfx_atlas', 'm70_fire');
        this.play(`${this.characterName}_shoot_recoil`, true);
        
        const pushback = this.flipX ? 5 : -5;
        this.x += pushback;

        this.scene.events.emit('spawn-projectile', {
            x: this.x + (this.flipX ? -110 : 110),
            y: this.y - 125,
            direction: this.flipX ? -1 : 1,
            type: 'BULLET'
        });

        this.scene.time.delayedCall(100, () => {
            this.x -= pushback; 
            if (!this.isDead) this.play(`${this.characterName}_shoot_idle`, true);
            this.isAttacking = false;
        });
    }

    private executeWeaponThrow() {
        this.isAttacking = true;
        this.play(`${this.characterName}_throw`, true); 

        this.scene.time.delayedCall(200, () => {
            this.scene.events.emit('spawn-projectile', {
                x: this.x + (this.flipX ? -60 : 60), 
                y: this.y - 110, 
                direction: this.flipX ? -1 : 1, 
                type: 'THROW'
            });
            this.hasGun = false;
        });

        this.scene.time.delayedCall(400, () => { 
            this.isAttacking = false;
            this.play(`${this.characterName}_idle`, true); 
        });
    }

    protected executeMelee(animKey: string) {
        this.isAttacking = true;
        this.play(`${this.characterName}_${animKey}`, true);
        
        const xOffset = this.flipX ? -60 : 60;
        const hitbox = this.scene.add.zone(this.x + xOffset, this.y - 40, 60, 60);
        this.scene.physics.add.existing(hitbox);

        const enemiesGroup = (this.scene as any).enemies;
        if (enemiesGroup) {
            this.scene.physics.add.overlap(hitbox, enemiesGroup, (hb, enemyObj: any) => {
                if (enemyObj.takeDamage && !enemyObj.isHurt) {
                    enemyObj.takeDamage(10);
                    this.scene.events.emit('spawn-gore', { x: enemyObj.x, y: enemyObj.y, type: 'CLASSIC' });
                }
            });
        }

        this.scene.time.delayedCall(250, () => { 
            hitbox.destroy();
            this.isAttacking = false; 
        });
    }

    // --- VIRTUAL METHODS FOR SUBCLASSES ---
    // Marko, Darko, and Maja will override these in their own files
    protected executeSpecial() { /* Overridden by subclasses */ }
    protected executeFinisher() { /* Overridden by subclasses */ }

    // --- DAMAGE LOGIC ---
    public takeDamage(amount: number) {
        if (this.isInvulnerable || this.health <= 0) return;

        this.health -= amount;
        this.isInvulnerable = true;
        this.isAttacking = false; 

        this.play(`${this.characterName}_damage_&_hurt`, true);
        this.scene.events.emit('update-health', this.health);

        this.scene.time.delayedCall(400, () => { 
            if (this.health > 0) {
                const idleAnim = this.hasGun ? 'shoot_idle' : 'idle';
                this.play(`${this.characterName}_${idleAnim}`, true);
            }
        });

        this.scene.time.delayedCall(1500, () => { 
            this.isInvulnerable = false; 
        });
    }

    public get isDead(): boolean {
        return this.health <= 0;
    }
}