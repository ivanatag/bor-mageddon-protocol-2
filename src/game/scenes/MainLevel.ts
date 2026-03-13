import Phaser from 'phaser';
import { Marko } from '../entities/Marko';
import { Darko } from '../entities/Darko';
import { Maja } from '../entities/Maja';

export class MainLevel extends Phaser.Scene {
    private player!: Marko | Darko | Maja;
    public enemies!: Phaser.Physics.Arcade.Group;

    constructor() {
        super({ key: 'MainLevel' });
    }

    create() {
        // 1. ENVIRONMENT SETUP
        // We set the world bounds to match your 1920x1080 part1_sky.jpg background
        this.physics.world.setBounds(0, 0, 1920, 1080);
        
        // Add the background (Ensure 'part1_sky' is loaded in your BootScene)
        this.add.image(0, 0, 'part1_sky').setOrigin(0, 0);

        // 2. ENEMY GROUP INITIALIZATION
        // This MUST be created before the player, because Marko/Darko/Maja 
        // look for (this.scene as any).enemies in their special attack code!
        this.enemies = this.physics.add.group();

        // 3. SPAWN THE CHOSEN CHARACTER
        // Fetch the choice from the React GameContainer wrapper
        const selectedCharacter = this.registry.get('selectedCharacter') || 'marko';

        // Spawn coordinates
        const startX = 200;
        const startY = 700; // Lower down the screen to fake a 3D floor

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

        // 4. CAMERA SETUP
        // Prevent the camera from panning outside your background image
        this.cameras.main.setBounds(0, 0, 1920, 1080);
        
        // Make the camera smoothly follow the player
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.2); // Zooms in slightly to make sprites look bigger/retro

        // 5. TEST DUMMY (So you can test your attacks immediately)
        this.createTestDummy(800, 700);
        this.createTestDummy(1000, 650);

        // 6. AUDIO SETUP
        // Play the 1993 cassette BGM
        this.sound.playAudioSprite('sfx_atlas', 'bgm_level_1', { loop: true, volume: 0.5 });
    }

    update() {
        // Ensure the player processes their movement and attack inputs every frame
        if (this.player && this.player.update) {
            this.player.update();
        }

        // Depth sorting: Makes entities lower on the screen render in front of those higher up
        // This is the classic "Belt-Scroller" fake 3D trick.
        this.children.each((child: any) => {
            if (child.y) {
                child.setDepth(child.y);
            }
        });
    }

    /**
     * A temporary helper to spawn static enemies so you can test your Hitboxes and Finishers.
     * Replace this with your actual Enemy classes later!
     */
    private createTestDummy(x: number, y: number) {
        // Just a red box for now to represent an enemy
        const dummy = this.add.rectangle(x, y, 50, 100, 0xff0000) as any;
        this.physics.add.existing(dummy);
        
        dummy.health = 100;
        dummy.isDead = false;
        dummy.enemyType = 'grunt';
        
        // The function your player attacks will call when they hit this dummy
        dummy.takeDamage = (amount: number) => {
            if (dummy.isDead) return;
            
            dummy.health -= amount;
            
            // Flash white when hit
            dummy.fillColor = 0xffffff;
            this.time.delayedCall(100, () => { dummy.fillColor = 0xff0000; });

            if (dummy.health <= 0) {
                dummy.isDead = true;
                dummy.fillColor = 0x333333; // Turn grey to show it's dead
                
                // Fall over
                this.tweens.add({
                    targets: dummy,
                    angle: 90,
                    y: dummy.y + 50,
                    duration: 200
                });
            }
        };

        this.enemies.add(dummy);
    }
}