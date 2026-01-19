import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  crtEnabled: boolean;
  onCrtToggle: (enabled: boolean) => void;
  goreEnabled: boolean;
  onGoreToggle: (enabled: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  crtEnabled,
  onCrtToggle,
  goreEnabled,
  onGoreToggle,
  volume,
  onVolumeChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="hud-panel w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-xl text-primary">SETTINGS</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded transition-colors"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
        </div>

        <div className="space-y-6">
          {/* CRT Filter */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-pixel text-sm text-foreground">CRT FILTER</h3>
              <p className="font-retro text-muted-foreground text-sm">
                Enable scanline overlay effect
              </p>
            </div>
            <Switch
              checked={crtEnabled}
              onCheckedChange={onCrtToggle}
            />
          </div>

          {/* Gore Effects */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-pixel text-sm text-foreground">GORE EFFECTS</h3>
              <p className="font-retro text-muted-foreground text-sm">
                Blood and particle effects
              </p>
            </div>
            <Switch
              checked={goreEnabled}
              onCheckedChange={onGoreToggle}
            />
          </div>

          {/* Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-pixel text-sm text-foreground">VOLUME</h3>
              <span className="font-retro text-secondary text-lg">{Math.round(volume * 100)}%</span>
            </div>
            <Slider
              value={[volume * 100]}
              onValueChange={(values) => onVolumeChange(values[0] / 100)}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="font-retro text-muted-foreground text-center text-sm">
            BOR-MAGEDDON PROTOCOL-2 v0.1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
