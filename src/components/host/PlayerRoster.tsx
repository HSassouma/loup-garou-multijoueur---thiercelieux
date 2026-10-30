import React from 'react';
import { GameRoom, Player } from '../../types/game';
import { Eye, Heart, Skull, UserX, Bot } from 'lucide-react';

interface PlayerRosterProps {
  room: GameRoom;
  onKickPlayer?: (playerId: string) => void;
}

export const PlayerRoster: React.FC<PlayerRosterProps> = ({ room, onKickPlayer }) => {
  const players = Object.values(room.players);
  const isLobby = room.phase === 'LOBBY';

  if (players.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 text-center text-zinc-500 text-sm">
        Aucun joueur connecté. Scannez le QR Code ou entrez le code pour rejoindre.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {players.map((p) => {
        return (
          <div
            key={p.id}
            className={`relative p-3 rounded-2xl border transition-all ${
              p.isAlive
                ? 'bg-zinc-900/90 border-zinc-700/80 shadow-md hover:border-amber-500/40'
                : 'bg-zinc-950/60 border-zinc-800/60 opacity-60'
            }`}
          >
            {/* Top row: Badges */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    p.isAlive
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {p.isAlive ? 'Vivant' : 'Éliminé'}
                </span>

                {/* Connection status badge */}
                <span
                  title={p.isConnected !== false ? 'Connecté en direct' : 'Déconnecté'}
                  className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${
                    p.isConnected !== false
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/40'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      p.isConnected !== false ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                    }`}
                  />
                  <span>{p.isConnected !== false ? 'En ligne' : 'Hors-ligne'}</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                {p.isBot && (
                  <span title="Joueur Bot" className="p-1 rounded bg-zinc-800 text-zinc-400">
                    <Bot className="w-3 h-3" />
                  </span>
                )}
                {p.hasViewedCard && (
                  <span title="Carte consultée" className="p-1 rounded bg-amber-500/10 text-amber-400">
                    <Eye className="w-3 h-3" />
                  </span>
                )}
                {p.isLover && (
                  <span title="Amoureux" className="p-1 rounded bg-pink-500/20 text-pink-400">
                    <Heart className="w-3 h-3 fill-pink-400" />
                  </span>
                )}
                {isLobby && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(p.id)}
                    title="Exclure ce joueur"
                    className="p-1 rounded hover:bg-red-950 hover:text-red-400 text-zinc-500 transition-colors"
                  >
                    <UserX className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Player Name & Avatar */}
            <div className="font-bold text-sm text-white flex items-center gap-2">
              <span className="text-base select-none">{p.avatar || '👤'}</span>
              <span className="truncate">{p.name}</span>
            </div>

            {/* Voting indicator during day vote */}
            {room.phase === 'DAY_VOTE' && (
              <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] flex items-center justify-between">
                <span className="text-zinc-400">Vote :</span>
                {room.dayState.votes[p.id] ? (
                  <span className="text-emerald-400 font-semibold">A voté ✓</span>
                ) : (
                  <span className="text-amber-400 animate-pulse">En cours...</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
