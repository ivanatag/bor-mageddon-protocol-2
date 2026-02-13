import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Container;
  private flickerTimer: number = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Dark background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);

    // Red star decorations
    for (let i = 0; i < 5; i++) {
      const star = this.add.star(
        100 + i * 150,
        80,
        5,
        10,
        25,
        0xcc0000
      );
      star.setAlpha(0.6);
      this.tweens.add({
        targets: star,
        rotation: Math.PI * 2,
        duration: 10000 + i * 1000,
        repeat: -1
      });
    }

    // Title
    this.titleText = this.add.text(width / 2, height / 3, 'BOR-MAGEDDON', {
      fontFamily: 'Press Start 2P',
      fontSize: '32px',
      color: '#cc0000',
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 0,
        fill: true
      }
    });
    this.titleText.setOrigin(0.5);

    // Subtitle
    const subtitleText = this.add.text(width / 2, height / 3 + 50, 'PROTOCOL-2', {
      fontFamily: 'Press Start 2P',
      fontSize: '20px',
      color: '#fbbf24'
    });
    subtitleText.setOrigin(0.5);

    // Tagline
    const tagline = this.add.text(width / 2, height / 3 + 90, 'HYPERINFLATION STABILIZATION', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#888888'
    });
    tagline.setOrigin(0.5);

    // Start button
    this.createStartButton(width / 2, height / 2 + 80);

    // Instructions
    const instructions = this.add.text(width / 2, height - 100, 
      '← → MOVE    SPACE SHOOT    ESC PAUSE', {
      fontFamily: 'VT323',
      fontSize: '18px',
      color: '#666666'
    });
    instructions.setOrigin(0.5);

    // Copyright
    const copyright = this.add.text(width / 2, height - 40, '© 1993 SFRY ARCADE', {
      fontFamily: 'VT323',
      fontSize: '16px',
      color: '#444444'
    });
    copyright.setOrigin(0.5);

    // Leaderboard button
    const lbText = this.add.text(width / 2, height / 2 + 140, 'LEADERBOARD (L)', {
      fontFamily: 'VT323',
      fontSize: '20px',
      color: '#fbbf24'
    });
    lbText.setOrigin(0.5);
    lbText.setInteractive({ useHandCursor: true });
    lbText.on('pointerdown', () => this.scene.start('LeaderboardScene'));

    // Keyboard input
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.startGame();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startGame();
    });

    this.input.keyboard?.on('keydown-L', () => {
      this.scene.start('LeaderboardScene');
    });
  }

  private createStartButton(x: number, y: number): void {
    const buttonBg = this.add.rectangle(0, 0, 200, 50, 0xcc0000);
    buttonBg.setStrokeStyle(4, 0xff0000);

    const buttonText = this.add.text(0, 0, 'START GAME', {
      fontFamily: 'Press Start 2P',
      fontSize: '12px',
      color: '#ffffff'
    });
    buttonText.setOrigin(0.5);

    this.startButton = this.add.container(x, y, [buttonBg, buttonText]);
    this.startButton.setSize(200, 50);
    this.startButton.setInteractive({ useHandCursor: true });

    this.startButton.on('pointerover', () => {
      buttonBg.setFillStyle(0xff0000);
      this.tweens.add({
        targets: this.startButton,
        scale: 1.05,
        duration: 100
      });
    });

    this.startButton.on('pointerout', () => {
      buttonBg.setFillStyle(0xcc0000);
      this.tweens.add({
        targets: this.startButton,
        scale: 1,
        duration: 100
      });
    });

    this.startButton.on('pointerdown', () => {
      this.startGame();
    });

    // Pulsing animation
    this.tweens.add({
      targets: this.startButton,
      alpha: 0.8,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  private startGame(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('PangScene');
    });
  }

  update(time: number, delta: number): void {
    // Title flicker effect
    this.flickerTimer += delta;
    if (this.flickerTimer > 3000) {
      this.titleText.setAlpha(0.7 + Math.random() * 0.3);
      if (Math.random() > 0.9) {
        this.flickerTimer = 0;
      }
    }
  }
}
