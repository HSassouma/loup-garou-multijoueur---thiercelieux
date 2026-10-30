import React, { useState } from 'react';
import { Player, ROLES_METADATA } from '../../types/game';
import { Eye, EyeOff, Shield, Sparkles, Flame } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface SecretCardProps {
  player: Player;
  onCardViewed?: () => void;
}

export const SecretCard: React.FC<SecretCardProps> = ({ player, onCardViewed }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const role = player.role ? ROLES_METADATA[player.role] : null;

  const handleToggle = () => {
    const nextState = !isRevealed;
    setIsRevealed(nextState);

    if (nextState) {
      if (player.role) {
        audioService.playRoleRevealSound(player.role);
      }
      onCardViewed?.();
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto perspective-1000 my-4 select-none">
      <div
        onClick={handleToggle}
        className={`relative w-full h-[400px] rounded-3xl cursor-pointer transition-transform duration-700 transform-style-3d shadow-2xl ${
          isRevealed ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT OF CARD (SEALED WITH WAX SEAL) */}
        <div className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-stone-900 via-neutral-900 to-zinc-950 border-2 border-amber-600/50 p-6 flex flex-col items-center justify-between backface-hidden shadow-2xl overflow-hidden">
          {/* Subtle gothic watermark */}
          <div className="absolute -right-8 -bottom-8 opacity-5 text-white text-9xl pointer-events-none font-gothic">
            ⚜
          </div>

          <div className="flex items-center justify-between w-full text-amber-500/80 text-xs font-semibold tracking-widest uppercase">
            <span>Thiercelieux</span>
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Top Secret</span>
          </div>

          <div className="flex flex-col items-center text-center my-auto">
            {/* Wax Seal with Crimson Ring */}
            <div className="relative mb-6 group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-700 via-red-900 to-amber-950 border-4 border-amber-500/60 flex items-center justify-center text-3xl shadow-xl shadow-red-950/80 transform group-hover:scale-105 transition-transform">
                <Flame className="w-10 h-10 text-amber-300 drop-shadow-md" />
              </div>
              <div className="absolute -inset-2 rounded-full border border-red-500/30 animate-ping opacity-25" />
            </div>

            <h3 className="text-2xl font-black font-gothic text-amber-200 mb-2 tracking-wide">
              Sceau Secret
            </h3>
            <p className="text-xs text-stone-400 max-w-[210px] leading-relaxed">
              Briser le sceau pour révéler ton identité secrète. Garde l’écran à l’abri des regards indiscrets.
            </p>
          </div>

          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide shadow-inner">
            <Eye className="w-4 h-4" />
            <span>Briser le sceau et révéler</span>
          </div>
        </div>

        {/* BACK OF CARD (REVEALED ROLE) */}
        <div
          className={`absolute inset-0 w-full h-full rounded-3xl p-6 flex flex-col items-center justify-between backface-hidden rotate-y-180 border-2 shadow-2xl ${
            role?.team === 'LOUPS'
              ? 'bg-gradient-to-b from-red-950 via-zinc-950 to-black border-red-500/80'
              : 'bg-gradient-to-b from-slate-900 via-zinc-950 to-black border-sky-500/80'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                role?.team === 'LOUPS'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm shadow-red-950'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm shadow-sky-950'
              }`}
            >
              {role?.team === 'LOUPS' ? 'Équipe des Loups' : 'Équipe du Village'}
            </span>
            <div className="flex items-center gap-1">
              {player.isLover && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse font-bold">
                  ❤️ Amoureux
                </span>
              )}
            </div>
          </div>

          {/* Role Illustration & Title */}
          <div className="flex flex-col items-center text-center my-auto">
            <div className="w-24 h-24 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-5xl mb-3 shadow-2xl transform hover:scale-105 transition-transform">
              {role?.icon || '❓'}
            </div>
            <h2 className="text-2xl font-black font-gothic tracking-wide text-white mb-2">
              {role?.nameFr || 'Inconnu'}
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed px-1 font-medium">
              {role?.descriptionFr}
            </p>
          </div>

          {/* Hide button */}
          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 text-xs font-bold transition-all shadow-md"
          >
            <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
            <span>Refermer ma carte (Secret)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
