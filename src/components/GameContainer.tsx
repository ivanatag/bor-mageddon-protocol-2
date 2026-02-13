import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { BootScene } from '@/game/scenes/BootScene';
import { MenuScene } from '@/game/scenes/MenuScene';
import { PangScene } from '@/game/scenes/PangScene';
import { MainLevel } from '@/game/scenes/MainLevel';
import { NeoBelgradeScene } from '@/game/scenes/NeoBelgradeScene';
import { PartisanTunnelsScene } from '@/game/scenes/PartisanTunnelsScene';
import { LeaderboardScene } from '@/game/scenes/LeaderboardScene';
import { eventBus, GameEvents } from '@/game/EventBus';
import SettingsMenu from './SettingsMenu';
import { Settings } from 'lucide-react';

interface GameContainerProps {
  crtEnabled: boolean;
  onCrtToggle: (enabled: boolean) => void;
}

const GameContainer: React.FC<GameContainerProps> = ({ crtEnabled, onCrtToggle }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goreEnabled, setGoreEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      pixelArt: true,
      antialias: false,
      backgroundColor: '#0a0a0a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [BootScene, MenuScene, PangScene, MainLevel, NeoBelgradeScene, PartisanTunnelsScene, LeaderboardScene]
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-background">
      {/* Game canvas container */}
      <div
        ref={containerRef}
        className="relative"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '4/3'
        }}
      />

      {/* CRT overlay */}
      {crtEnabled && <div className="crt-overlay" />}

      {/* Settings button */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="absolute top-4 right-4 p-3 bg-card/80 hover:bg-card border border-primary/50 rounded transition-colors z-50"
        title="Settings"
      >
        <Settings className="w-5 h-5 text-foreground" />
      </button>

      {/* Settings menu */}
      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        crtEnabled={crtEnabled}
        onCrtToggle={onCrtToggle}
        goreEnabled={goreEnabled}
        onGoreToggle={setGoreEnabled}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
};

export default GameContainer;
