import Phaser from 'phaser';
import { Miner } from './Miner';
import { MUP } from './MUP';

export class EnemyManager {
    private enemies: Phaser.Physics.Arcade.Group;
    private maxAggressiveSlots = 2; // Slot system [cite: 739, 4805]

    constructor(private scene: Phaser.Scene, private gore: any, private audio: any) {
        this.enemies = this.scene.physics.add.group({ runChildUpdate: true });
    }

    public spawnWave(era: string, count: number) {
        for (let i = 0; i < count; i++) {
            const x = 1200 + (i * 300); // Prevent overlapping [cite: 4808]
            const y = Phaser.Math.Between(350, 580); // Restricted road belt [cite: 290, 4809]
            
            const enemy = era === '1993' ? 
                new Miner(this.scene, x, y, this.gore, this.audio) : 
                new MUP(this.scene, x, y, this.gore, this.audio);
            
            this.enemies.add(enemy);
        }
    }

    public update(player: any) {
        let activeAttackers = 0;
        this.enemies.getChildren().forEach((enemy: any) => {
            if (enemy.isDead) return;

            if (activeAttackers < this.maxAggressiveSlots) {
                enemy.updateAI(player); // Stalk Mode [cite: 706, 3625]
                activeAttackers++;
            } else {
                this.flankPlayer(enemy, player); // Circle Mode [cite: 739, 3657]
            }
        });
    }

    private flankPlayer(enemy: any, player: any) {
        const side = enemy.x > player.x ? 350 : -350;
        enemy.setVelocityX(enemy.x > player.x + side ? -80 : 80);
        enemy.play(`${enemy.enemyType}_walk`, true);
    }

    public getGroup() { return this.enemies; }
}
