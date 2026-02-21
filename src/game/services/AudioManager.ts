import Phaser from 'phaser';

/**
 * AudioManager – thin wrapper around Phaser's SoundManager.
 * Supports playing a random key from a comma-delimited list.
 */
export class AudioManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Play a single sound key. */
  play(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, config);
    }
  }

  /**
   * Play a random sound from a comma-delimited list of keys.
   * Example: playRandom('break_1,break_2,break_3')
   */
  playRandom(keys: string, config?: Phaser.Types.Sound.SoundConfig): void {
    const list = keys.split(',').map(k => k.trim()).filter(Boolean);
    if (list.length === 0) return;
    const picked = list[Math.floor(Math.random() * list.length)];
    this.play(picked, config);
  }

  /** Stop all sounds. */
  stopAll(): void {
    this.scene.sound.stopAll();
  }
}

/** Predefined sound key groups for convenience. */
export const SFX_GROUPS = {
  DIZELCIC_AEROSOL: 'dizelcic_aerosol_1,dizelcic_aerosol_2',
  BREAK: 'break_1,break_2,break_3',
} as const;
