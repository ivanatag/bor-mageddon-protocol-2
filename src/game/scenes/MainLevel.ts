import Phaser from 'phaser';
import { Marko } from '../entities/Marko';
import { Darko } from '../entities/Darko';
import { Maja } from '../entities/Maja';
import { MUP } from '../entities/enemies/MUP';
import { BreakableObject, LootData } from '../entities/BreakableObject';
import { Projectile } from '../entities/Projectile';

export class MainLevel extends Phaser.Scene {
    public player!: Marko | Darko | Maja;
    public enemies!: Phaser.Physics.Arcade.Group;
    public projectiles!: Phaser.Physics.Arcade.Group;
    public breakableObjects!: Phaser.Physics.Arcade.Group;
    public groundItems!: Phaser.Physics.Arcade.Group;

    constructor() {
        super({ key: 'MainLevel' });
    }

    create() {
        // ==========================================
        // 1. WORLD SETUP
        // ==========================================
        this.physics.world.setBounds(0, 0, 1920, 1080);
        
        // Add the background (Ensure 'part1_sky' is loaded in your BootScene)
        this.add.image(0, 0, 'part1_sky').setOrigin(0, 0);

        // ==========================================
        // 2. INITIALIZE PHYSICS GROUPS
        // ==========================================
        // These MUST be created before the player/enemies so their scripts can reference them!
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.breakableObjects = this.physics.add.group();
        this.groundItems = this.physics.add.group();

        // ==========================================
        // 3. SPAWN THE CHOSEN CHARACTER
        // ==========================================
        const selectedCharacter = this.registry.get('selectedCharacter') || 'marko';
        const startX = 200;
        const startY = 750; // Ground level on the fake 3D belt

        switch (selectedCharacter.toLowerCase()) {
            case 'darko':
                this.player = new Darko(this, startX, startY);
                break;
            case 'maja':
                this.player = new Maja(this, startX, startY);
                break;
            case 'marko':
            default:
                this.player = new Marko(this, startX, startY);
                break;
        }

        // ==========================================
        // 4. CAMERA SETUP
        // ==========================================
        this.cameras.main.setBounds(0, 0, 1920, 1080);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.1); // Slight zoom for chunkier 16-bit feel

        // ==========================================
        // 5. SPAWN LEVEL ENTITIES
        // ==========================================
        
        // Spawn Riot Police (MUP)
        const mup1 = new MUP(this, 1000, 700);
        const mup2 = new MUP(this, 1200, 800);
        this.enemies.addMultiple([mup1, mup2]);

        // Spawn a Kiosk with Loot
        const possibleLoot: LootData[] = [
            { key: 'item_dinar', type: 'score', value: 500 },
            { key: 'item_health', type: 'health', value: 25 }
        ];
        const kiosk = new BreakableObject(this, 800, 720, 'kiosk', possibleLoot);
        this.breakableObjects.add(kiosk);

        // ==========================================
        // 6. COLLISION & OVERLAP LOGIC
        // ==========================================

        // Projectiles vs Enemies
        this.physics.add.overlap(this.projectiles, this.enemies, (proj: any, enemy: any) => {
            if (proj.onImpact) proj.onImpact(enemy);
        });

        // Projectiles vs Breakable Objects
        this.physics.add.overlap(this.projectiles, this.breakableObjects, (proj: any, obj: any) => {
            if (obj.takeDamage) obj.takeDamage(2); // Bullets deal heavy object damage
            proj.destroy();
        });

        // Player vs Loot (Picking up Dinars / Health)
        this.physics.add.overlap(this.player, this.groundItems, (player: any, item: any) => {
            this.collectLoot(item);
        });

        // ==========================================
        // 7. GLOBAL EVENT LISTENERS
        // ==========================================

        // When Player.ts calls this.scene.events.emit('spawn-projectile', ...)
        this.events.on('spawn-projectile', (data: any) => {
            const proj = new Projectile(this, data.x, data.y, data.direction, data.type);
            this.projectiles.add(proj);
        });

        // When anything calls for Gore
        this.events.on('spawn-gore', (data: any) => {
            this.spawnGoreEffect(data.x, data.y, data.type);
        });

        // ==========================================
        // 8. LAUNCH UI SCENE
        // ==========================================
        this.scene.launch('UIScene');
        
        // Push initial stats to the HUD
        this.events.emit('update-health', this.player.health);
        this.events.emit('update-ammo', this.player.ammo, 5);
    }

    update() {
        // 1. Update Player
        if (this.player && this.player.update) {
            this.player.update();
        }

        // 2. Update Enemy AI
        this.enemies.getChildren().forEach((enemy: any) => {
            if (enemy.updateAI && !enemy.isDead) {
                enemy.updateAI(this.player);
            }
        });

        // 3. Y-Depth Sorting (The Magic of the Belt-Scroller!)
        // This makes sure whoever is "lower" on the screen draws in front.
        this.children.each((child: any) => {
            if (child.y && child.type !== 'Image') { // Ignore the background image
                child.setDepth(child.y);
            }
        });
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private collectLoot(item: any) {
        if (!item.lootData) return;

        const data: LootData = item.lootData;

        // Play pickup sound
        this.sound.playAudioSprite('sfx_atlas', 'pickup_sound');

        // Apply Loot Effects
        if (data.type === 'score') {
            this.events.emit('add-score', data.value);
        } else if (data.type === 'health') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + data.value);
            this.events.emit('update-health', this.player.health);
        }

        // Delete the item from the floor
        item.destroy();
    }

    private spawnGoreEffect(x: number, y: number, type: string) {
        // Just a simple placeholder effect. 
        // If you have a real GoreManager particle system, you drop it here!
        const color = type === 'BUREAUCRATIC' ? 0xcccccc : 0xaa0000;
        
        for (let i = 0; i < 5; i++) {
            const particle = this.add.rectangle(x, y, 4, 4, color);
            this.physics.add.existing(particle);
            
            const body = particle.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-150, -50));
            body.setAllowGravity(true);
            body.setGravityY(400);
            
            this.time.delayedCall(800, () => particle.destroy());
        }
    }
}