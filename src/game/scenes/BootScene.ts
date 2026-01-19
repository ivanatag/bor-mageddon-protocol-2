import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'LOADING...', {
      fontFamily: 'Press Start 2P',
      fontSize: '16px',
      color: '#cc0000'
    });
    loadingText.setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    });
    percentText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.floor(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0xcc0000, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    this.createPlaceholderAssets();
  }

  private createPlaceholderAssets(): void {
    // Create sky background with gradient effect
    const skyGraphics = this.make.graphics({ x: 0, y: 0 });
    // Draw gradient manually
    for (let y = 0; y < 600; y++) {
      const ratio = y / 600;
      const r = Math.floor(26 + ratio * (15 - 26));
      const g = Math.floor(26 + ratio * (15 - 26));
      const b = Math.floor(46 + ratio * (35 - 46));
      skyGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      skyGraphics.fillRect(0, y, 800, 1);
    }
    // Add some stars
    skyGraphics.fillStyle(0xffffff);
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 400;
      skyGraphics.fillCircle(x, y, Math.random() * 1.5);
    }
    skyGraphics.generateTexture('bg_sky', 800, 600);
    skyGraphics.destroy();

    // Create mid layer (buildings silhouette)
    const midGraphics = this.make.graphics({ x: 0, y: 0 });
    midGraphics.fillStyle(0x1a1a2e);
    midGraphics.fillRect(0, 0, 800, 600);
    // Draw brutalist building silhouettes
    midGraphics.fillStyle(0x0d0d1a);
    const buildings = [
      { x: 0, w: 80, h: 180 },
      { x: 90, w: 60, h: 250 },
      { x: 160, w: 100, h: 150 },
      { x: 280, w: 70, h: 300 },
      { x: 360, w: 90, h: 200 },
      { x: 470, w: 80, h: 280 },
      { x: 560, w: 110, h: 160 },
      { x: 680, w: 60, h: 220 },
      { x: 750, w: 50, h: 190 }
    ];
    buildings.forEach(b => {
      midGraphics.fillRect(b.x, 600 - b.h, b.w, b.h);
      // Add some windows
      midGraphics.fillStyle(0x2a2a4a);
      for (let wy = 600 - b.h + 20; wy < 580; wy += 30) {
        for (let wx = b.x + 10; wx < b.x + b.w - 10; wx += 20) {
          if (Math.random() > 0.3) {
            midGraphics.fillRect(wx, wy, 8, 12);
          }
        }
      }
      midGraphics.fillStyle(0x0d0d1a);
    });
    midGraphics.generateTexture('bg_mid', 800, 600);
    midGraphics.destroy();

    // Create floor layer
    const floorGraphics = this.make.graphics({ x: 0, y: 0 });
    floorGraphics.fillStyle(0x2a2a3e);
    floorGraphics.fillRect(0, 0, 800, 100);
    // Add cobblestone pattern
    floorGraphics.fillStyle(0x3a3a4e);
    for (let i = 0; i < 40; i++) {
      floorGraphics.fillRect(i * 20, 0, 18, 10);
      floorGraphics.fillRect(i * 20 + 10, 15, 18, 10);
    }
    // Add gutter
    floorGraphics.fillStyle(0x1a1a2a);
    floorGraphics.fillRect(0, 30, 800, 5);
    floorGraphics.generateTexture('bg_floor', 800, 100);
    floorGraphics.destroy();
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
