import Phaser from 'phaser';

export class MainLevel extends Phaser.Scene {
  constructor() {
    super({ key: 'MainLevel' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    const text = this.add.text(width / 2, height / 2, 'MAIN LEVEL\n(Coming Soon)', {
      fontFamily: 'Press Start 2P',
      fontSize: '20px',
      color: '#cc0000',
      align: 'center'
    });
    text.setOrigin(0.5);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }
}
