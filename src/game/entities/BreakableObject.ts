import Phaser from 'phaser';

export type BreakableType = 'crate' | 'barrel' | 'locker' | 'kiosk' | 'container';

export interface LootData {
    key: string; // The sprite texture key (e.g., 'item_dinar', 'item_health')
    type: 'score' | 'health' | 'ammo';
    value: number; // How much it gives (e.g., 500 Dinars, 20 HP)
}

/**
 * BreakableObject: Handles environmental hazards and loot containers.
 * Examples: K67 Kiosks, Trash Containers (Kontejneri), and wooden crates.
 */
export class BreakableObject extends Phaser.Physics.Arcade.Sprite {
    private objectType: BreakableType;
    public health: number;
    private dropPool: LootData[];

    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        type: BreakableType, 
        dropPool: LootData[] = []
    ) {
        // We assume your BootScene loaded textures like 'obj_kiosk'
        super(scene, x, y, `obj_${type}`);
        
        this.objectType = type;
        this.dropPool = dropPool;

        // Scale health based on PRD: Standard = 2 hits, Heavy (Kiosk/Container) = 4 hits
        this.health = (type === 'kiosk' || type === 'container') ? 4 : 2;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Grounded for belt-scroller depth
        this.setOrigin(0.5, 1);
        
        // Ensure the player can't push the heavy kiosk around
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true); 
        
        // Dynamic depth sorting so the player can walk in front of or behind it
        this.setDepth(this.y); 
    }

    /**
     * Called when a player hitbox or bullet overlaps with the object.
     * Heavy weapons deal 2 damage, punches deal 1.
     */
    public takeDamage(damageAmount: number = 1) {
        if (this.health <= 0) return;

        this.health -= damageAmount;

        // Shake effect on hit for kinetic feedback
        this.scene.tweens.add({
            targets: this,
            x: this.x + Phaser.Math.Between(-4, 4),
            duration: 50,
            yoyo: true,
            repeat: 1
        });

        // Flash white when hit
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(50, () => {
            this.clearTint();
        });

        if (this.health <= 0) {
            this.shatter();
        }
    }

    private shatter() {
        // Play era-appropriate destruction sound (Assuming 'sfx_atlas' has these keys)
        if (this.objectType === 'kiosk' || this.objectType === 'locker') {
            this.scene.sound.playAudioSprite('sfx_atlas', 'sfx_metal_clang');
        } else {
            this.scene.sound.playAudioSprite('sfx_atlas', 'wood_smash');
        }

        // Trigger visual debris particles via the global event bus
        const goreType = (this.objectType === 'kiosk') ? 'BUREAUCRATIC' : 'INDUSTRIAL';
        this.scene.events.emit('spawn-gore', { 
            x: this.x, 
            y: this.y - 40, 
            type: goreType 
        });

        // Slight screen shake for heavy objects breaking
        if (this.objectType === 'kiosk' || this.objectType === 'container') {
            this.scene.cameras.main.shake(150, 0.005); 
        }

        this.rollForLoot(); 
        
        // Remove the object from the game
        this.destroy();
    }

    private rollForLoot() {
        if (this.dropPool.length === 0) return;

        // 40% base drop rate as per PRD specifications
        if (Phaser.Math.Between(1, 100) <= 40) {
            const lootData = Phaser.Utils.Array.GetRandom(this.dropPool); 
            this.spawnDroppedItem(lootData);
        }
    }

    private spawnDroppedItem(lootData: LootData) {
        // Spawn the physical item sprite
        const item = this.scene.physics.add.sprite(this.x, this.y - 20, lootData.key) as any;
        
        // Attach the data so the player knows what it is when they pick it up
        item.lootData = lootData;

        // Loot "pops" out with a small bounce animation
        this.scene.tweens.add({
            targets: item,
            y: this.y - 60,
            duration: 300,
            yoyo: true,
            ease: 'Quad.easeOut'
        });

        // Check if the scene has a groundItems group to add it to
        const sceneAny = this.scene as any;
        if (sceneAny.groundItems) {
            sceneAny.groundItems.add(item);
        }
    }
}