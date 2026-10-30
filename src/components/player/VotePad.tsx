import React from 'react';
import { GameRoom, Player } from '../../types/game';
import { Vote, Check, ShieldAlert } from 'lucide-react';

interface VotePadProps {
  room: GameRoom;
  player: Player;
  onVote: (targetId: string) => void;
}

export const VotePad: React.FC<VotePadProps> = ({ room, player, onVote }) => {
  const currentVote = room.dayState.votes[player.id];
  const alivePlayers = Object.values(room.players).filter((p) => p.isAlive);

  if (!player.isAlive) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 my-4 text-center">
        <span className="text-2xl mb-1 block">👻</span>
        <h4 className="font-gothic text-zinc-300 font-bold mb-1">Tu es un fantôme</h4>
        <p className="text-xs text-zinc-500">
          Les défunts ne peuvent pas voter lors de l'assemblée du village.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/70 border border-amber-600/30 rounded-2xl p-5 my-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Vote className="w-5 h-5 text-amber-500" />
          <h3 className="font-gothic text-base">Tribunal Populaire</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40 font-semibold">
          {Object.keys(room.dayState.votes).length} / {alivePlayers.length} ont voté
        </span>
      </div>

      <p className="text-xs text-zinc-400 mb-3">
        Vote pour désigner le suspect à condamner au bûcher.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {alivePlayers.map((p) => {
          const isMyChoice = currentVote === p.id;
          const isSelf = p.id === player.id;

          return (
            <button
              key={p.id}
              onClick={() => onVote(p.id)}
              className={`py-3 px-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between ${
                isMyChoice
                  ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-950'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-200 hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="truncate">{p.name}</span>
                {isSelf && <span className="text-[10px] text-zinc-400">(Moi)</span>}
              </div>
              {isMyChoice && <Check className="w-4 h-4 text-white shrink-0" />}
            </button>
          );
        })}
      </div>

      {currentVote && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-center flex items-center justify-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          <span>Ton vote actuel est enregistré pour : <strong>{room.players[currentVote]?.name}</strong></span>
        </div>
      )}
    </div>
  );
};
