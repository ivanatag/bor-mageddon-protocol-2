import Phaser from 'phaser';

// Players
import { Marko } from '../entities/Marko';
import { Darko } from '../entities/Darko';
import { Maja } from '../entities/Maja';

// 1993 Enemy Roster
import { MUP } from '../entities/enemies/MUP';
import { Dizel } from '../entities/enemies/Dizel';
import { Dizelcic } from '../entities/enemies/Dizelcic';
import { Miner } from '../entities/enemies/Miner';
import { SlobodanCEO } from '../entities/enemies/SlobodanCEO';

// Objects & Projectiles
import { BreakableObject, LootData } from '../entities/BreakableObject';
import { Projectile } from '../entities/Projectile';

// Systems
import { GoreManager } from '../systems/GoreManager';
import { CollisionManager } from '../systems/CollisionManager';
import { AudioManager } from '../systems/AudioManager';
import { InputService } from '../systems/InputService';

export class MainLevel extends Phaser.Scene {
    // Entities
    public player!: Marko | Darko | Maja;
    public enemies!: Phaser.Physics.Arcade.Group;
    public projectiles!: Phaser.Physics.Arcade.Group;
    public breakableObjects!: Phaser.Physics.Arcade.Group;
    public groundItems!: Phaser.Physics.Arcade.Group;

    // Systems
    public goreManager!: GoreManager;
    public collisionManager!: CollisionManager;
    public audioManager!: AudioManager;
    public inputService!: InputService;

    constructor() {
        super({ key: 'MainLevel' });
    }

    create() {
        // ==========================================
        // 1. WORLD SETUP
        // ==========================================
        this.physics.world.setBounds(0, 0, 2400, 1080); // Expanded bounds for the boss fight
        this.add.image(0, 0, 'part1_sky').setOrigin(0, 0);

        // ==========================================
        // 2. INITIALIZE PHYSICS GROUPS
        // ==========================================
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.breakableObjects = this.physics.add.group();
        this.groundItems = this.physics.add.group();

        // ==========================================
        // 3. INITIALIZE MANAGERS & SYSTEMS
        // ==========================================
        this.goreManager = new GoreManager(this);
        this.collisionManager = new CollisionManager(this);
        this.audioManager = new AudioManager(this);
        this.inputService = new InputService(this);

        // ==========================================
        // 4. SPAWN THE CHOSEN CHARACTER
        // ==========================================
        const selectedCharacter = this.registry.get('selectedCharacter') || 'marko';
        const startX = 200;
        const startY = 750;

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
        // 5. CAMERA SETUP
        // ==========================================
        this.cameras.main.setBounds(0, 0, 2400, 1080);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.1);

        // ==========================================
        // 6. SPAWN LEVEL ENTITIES (The 1993 Roster!)
        // ==========================================
        
        // Armored Riot Police
        const mup1 = new MUP(this, 1000, 700);
        const mup2 = new MUP(this, 1200, 800);
        
        // Fast Tracksuit Thugs
        const dizel1 = new Dizel(this, 1400, 750);
        const dizelcic1 = new Dizelcic(this, 1500, 680);

        // Heavy Copper Miner Tank
        const miner1 = new Miner(this, 1600, 720);

        // THE ARCHITECT OF INFLATION (Level 1 Boss)
        const boss = new SlobodanCEO(this, 2000, 750);
        
        // Register standard enemies into the physics group
        this.enemies.addMultiple([mup1, mup2, dizel1, dizelcic1, miner1, boss]);

        // Breakable Loot Kiosk
        const possibleLoot: LootData[] = [
            { key: 'item_dinar', type: 'score', value: 500 },
            { key: 'item_health', type: 'health', value: 25 }
        ];
        const kiosk = new BreakableObject(this, 800, 720, 'kiosk', possibleLoot);
        this.breakableObjects.add(kiosk);

        // ==========================================
        // 7. COLLISION LOGIC
        // ==========================================
        
        // A. Standard Enemies Z-depth projectile logic
        this.collisionManager.setupProjectileCollisions(this.projectiles, this.enemies);

        // B. Specialized Boss Hitboxes (Headshot multiplier logic)
        this.collisionManager.setupBossCollisions(this.projectiles, boss);

        // C. Projectiles vs Breakable Objects (with Z-depth check!)
        this.physics.add.overlap(
            this.projectiles, 
            this.breakableObjects, 
            (proj: any, obj: any) => {
                if (obj.takeDamage) obj.takeDamage(2); 
                proj.destroy();
            },
            (proj: any, obj: any) => Math.abs(proj.y - obj.y) <= 35, // 2.5D Depth tolerance
            this
        );

        // D. Player vs Loot (Picking up items)
        this.physics.add.overlap(
            this.player, 
            this.groundItems, 
            (player: any, item: any) => {
                this.collectLoot(item);
            },
            (player: any, item: any) => Math.abs(player.y - item.y) <= 30, // Don't pick up background items
            this
        );

        // ==========================================
        // 8. GLOBAL EVENT LISTENERS
        // ==========================================
        
        // Handle gunfire from the player
        this.events.on('spawn-projectile', (data: any) => {
            const proj = new Projectile(this, data.x, data.y, data.direction, data.type);
            this.projectiles.add(proj);
        });

        // Listen for standard loot drops from defeated enemies
        this.events.on('spawn-loot', (data: { x: number, y: number }) => {
            const item = this.physics.add.sprite(data.x, data.y - 20, 'item_dinar') as any;
            item.lootData = { key: 'item_dinar', type: 'score', value: 100 };
            this.groundItems.add(item);
            
            this.tweens.add({
                targets: item,
                y: data.y - 60,
                duration: 300,
                yoyo: true,
                ease: 'Quad.easeOut'
            });
        });

        // Listen for level completion!
        this.events.on('boss-defeated', () => {
            console.log("LEVEL 1 COMPLETE: The Architect of Inflation has fallen!");
            // Here is where you will eventually call SaveManager to unlock Level 2
        });

        // ==========================================
        // 9. INITIALIZE REACT HUD DATA
        // ==========================================
        // Small delay ensures the React GameHUD component has mounted before we emit data to it
        this.time.delayedCall(100, () => {
            this.events.emit('update-health', this.player.health);
            this.events.emit('update-smf', this.player.smfMeter);
        });
    }

    update() {
        // 1. Poll gamepads and keyboards FIRST
        if (this.inputService) {
            this.inputService.update();
        }

        // 2. Update Player
        if (this.player && this.player.update) {
            this.player.update();
        }

        // 3. Update Enemies
        this.enemies.getChildren().forEach((enemy: any) => {
            if (enemy.updateAI && !enemy.isDead) {
                enemy.updateAI(this.player);
            }
        });

        // 4. Y-Depth Sorting for the Fake 3D Belt-Scroller Illusion
        this.children.each((child: any) => {
            // Give projectiles a slightly higher Z-index so you can see them fly over things
            if (child instanceof Projectile) {
                child.setDepth(child.y + 10);
            } else if (child.y && child.type !== 'Image') { 
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

        // Route the pickup sound through the global event bus
        this.events.emit('play-generic-sfx', 'pickup_sound');

        // Apply health or score depending on what dropped
        if (data.type === 'score') {
            this.events.emit('add-score', data.value);
        } else if (data.type === 'health') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + data.value);
            this.events.emit('update-health', this.player.health);
        }

        item.destroy();
    }
}