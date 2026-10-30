import React, { useState } from 'react';
import { GameRoom, RoleType, GameMode, ROLES_METADATA } from '../../types/game';
import { validateRoleConfig, getRecommendedRoleConfig } from '../../game/rules';
import { Sliders, Zap, Shield, Sparkles, Check, AlertCircle, X } from 'lucide-react';

interface GameConfigModalProps {
  room: GameRoom;
  onClose: () => void;
  onSaveConfig: (mode: GameMode, config: Record<RoleType, number>) => void;
}

export const GameConfigModal: React.FC<GameConfigModalProps> = ({ room, onClose, onSaveConfig }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(room.gameMode);
  const [customConfig, setCustomConfig] = useState<Record<RoleType, number>>({ ...room.rolesConfig });

  const playerCount = Object.keys(room.players).length || 6;
  const validation = validateRoleConfig(playerCount, customConfig);

  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    if (mode !== 'CUSTOM') {
      setCustomConfig(getRecommendedRoleConfig(playerCount, mode));
    }
  };

  const updateRoleCount = (role: RoleType, delta: number) => {
    const current = customConfig[role] || 0;
    const next = Math.max(0, current + delta);
    setCustomConfig({ ...customConfig, [role]: next });
    setSelectedMode('CUSTOM');
  };

  const handleApply = () => {
    if (selectedMode === 'CUSTOM' && !validation.isValid) {
      alert(validation.message || 'Configuration invalide');
      return;
    }
    onSaveConfig(selectedMode, customConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-gothic text-base font-bold text-amber-200">
                Configuration de Partie & Rôles
              </h3>
              <p className="text-[11px] text-zinc-400">
                Choix du mode de jeu et composition sur mesure du village
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'CLASSIC', label: 'Classique', icon: Shield, desc: 'Règles de Thiercelieux 180s' },
            { id: 'RAPID', label: 'Rapide Blitz', icon: Zap, desc: 'Débats express 60s' },
            { id: 'CUSTOM', label: 'Personnalisé', icon: Sliders, desc: 'Ajustement libre des rôles' },
          ].map((m) => {
            const Icon = m.icon;
            const isSel = selectedMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id as GameMode)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isSel
                    ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-950'
                    : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">{m.label}</span>
                  <Icon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-[10px] text-zinc-400">{m.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Role Sliders / Counters */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          <div className="flex items-center justify-between text-xs px-1 text-zinc-400">
            <span>Rôle</span>
            <span>
              Total attribué : <strong className={validation.isValid ? 'text-emerald-400' : 'text-amber-400'}>{validation.totalRoles} / {playerCount}</strong>
            </span>
          </div>

          {(Object.keys(ROLES_METADATA) as RoleType[]).map((rKey) => {
            const r = ROLES_METADATA[rKey];
            const count = customConfig[rKey] || 0;

            return (
              <div
                key={rKey}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.icon}</span>
                  <span className="font-semibold text-zinc-200">{r.nameFr}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateRoleCount(rKey, -1)}
                    disabled={count === 0}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 font-bold text-sm text-white"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-amber-400 w-5 text-center">{count}</span>
                  <button
                    onClick={() => updateRoleCount(rKey, 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold text-sm text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!validation.isValid && (
          <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-600/40 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validation.message}</span>
          </div>
        )}

        <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
          >
            Annuler
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950"
          >
            Appliquer la configuration
          </button>
        </div>
      </div>
    </div>
  );
};
