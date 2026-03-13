import Phaser from 'phaser';
import { Marko } from '../entities/Marko';
import { Darko } from '../entities/Darko';
import { Maja } from '../entities/Maja';
import { MUP } from '../entities/enemies/MUP';
import { BreakableObject, LootData } from '../entities/BreakableObject';
import { Projectile } from '../entities/Projectile';

// Import our new decoupled Systems
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
        this.physics.world.setBounds(0, 0, 1920, 1080);
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

        // Example: If you have parsed CSV data in the registry from BootScene, load it here!
        // const soundData = this.registry.get('soundCSV') || [];
        // this.audioManager.loadSoundData(soundData);

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
        this.cameras.main.setBounds(0, 0, 1920, 1080);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.1);

        // ==========================================
        // 6. SPAWN LEVEL ENTITIES
        // ==========================================
        const mup1 = new MUP(this, 1000, 700);
        const mup2 = new MUP(this, 1200, 800);
        this.enemies.addMultiple([mup1, mup2]);

        const possibleLoot: LootData[] = [
            { key: 'item_dinar', type: 'score', value: 500 },
            { key: 'item_health', type: 'health', value: 25 }
        ];
        const kiosk = new BreakableObject(this, 800, 720, 'kiosk', possibleLoot);
        this.breakableObjects.add(kiosk);

        // ==========================================
        // 7. COLLISION LOGIC
        // ==========================================
        
        // Let the CollisionManager handle the complex Z-depth bullet math
        this.collisionManager.setupProjectileCollisions(this.projectiles, this.enemies);

        // Projectiles vs Breakable Objects (with Z-depth check!)
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

        // Player vs Loot
        this.physics.add.overlap(
            this.player, 
            this.groundItems, 
            (player: any, item: any) => {
                this.collectLoot(item);
            },
            (player: any, item: any) => Math.abs(player.y - item.y) <= 30, // Don't pick up items in the background!
            this
        );

        // ==========================================
        // 8. GLOBAL EVENT LISTENERS
        // ==========================================
        this.events.on('spawn-projectile', (data: any) => {
            const proj = new Projectile(this, data.x, data.y, data.direction, data.type);
            this.projectiles.add(proj);
        });

        // ==========================================
        // 9. INITIALIZE REACT HUD DATA
        // ==========================================
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

        // 4. Y-Depth Sorting for the Fake 3D Illusion
        this.children.each((child: any) => {
            if (child.y && child.type !== 'Image') { 
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

        // Route the pickup sound through the global event bus to our AudioManager
        this.events.emit('play-generic-sfx', 'pickup_sound');

        if (data.type === 'score') {
            this.events.emit('add-score', data.value);
        } else if (data.type === 'health') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + data.value);
            this.events.emit('update-health', this.player.health);
        }

        item.destroy();
    }
}