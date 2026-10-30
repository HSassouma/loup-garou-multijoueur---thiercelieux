import React, { useState } from 'react';
import { audioService, AudioSettings } from '../../services/audioService';
import { Volume2, VolumeX, Music, Mic, Bell, X, Check } from 'lucide-react';

interface AudioSettingsModalProps {
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(audioService.getSettings());

  const handleChange = (key: keyof AudioSettings, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    audioService.updateSettings({ [key]: val });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-white shadow-2xl space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-gothic text-base font-bold text-amber-200">
                Mixage Audio & Narrateur
              </h3>
              <p className="text-[11px] text-zinc-400">
                Gestion des volumes sonore, ambiance et synthèse vocale
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Mute switch */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {settings.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>Mode Silencieux (Mute)</span>
          </div>
          <button
            onClick={() => handleChange('isMuted', !settings.isMuted)}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
              settings.isMuted
                ? 'bg-red-950 border-red-700 text-red-300'
                : 'bg-emerald-950 border-emerald-700 text-emerald-300'
            }`}
          >
            {settings.isMuted ? 'Activé (Muet)' : 'Son Actif'}
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-4 text-xs">
          {/* Master Volume */}
          <div>
            <div className="flex justify-between font-bold mb-1 text-zinc-300">
              <span className="flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Volume Général</span>
              <span className="font-mono text-amber-400">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => handleChange('masterVolume', parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Narrator Voice Volume */}
          <div>
            <div className="flex justify-between font-bold mb-1 text-zinc-300">
              <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5 text-sky-400" /> Voix du Narrateur</span>
              <span className="font-mono text-sky-400">{Math.round(settings.narratorVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.narratorVolume}
              onChange={(e) => handleChange('narratorVolume', parseFloat(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between font-bold mb-1 text-zinc-300">
              <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-amber-400" /> Bruitages (Hurlements, Glas)</span>
              <span className="font-mono text-amber-400">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Music / Ambient Drone Volume */}
          <div>
            <div className="flex justify-between font-bold mb-1 text-zinc-300">
              <span className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-purple-400" /> Ambiance Forêt / Nuit</span>
              <span className="font-mono text-purple-400">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => handleChange('musicVolume', parseFloat(e.target.value))}
              className="w-full accent-purple-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
