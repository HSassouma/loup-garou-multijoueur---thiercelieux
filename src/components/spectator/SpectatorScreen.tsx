import React, { useState, useEffect } from 'react';
import { GameRoom } from '../../types/game';
import { syncService } from '../../services/syncService';
import { Moon, Sun, Users, Trophy, Skull } from 'lucide-react';

interface SpectatorScreenProps {
  initialCode: string;
}

export const SpectatorScreen: React.FC<SpectatorScreenProps> = ({ initialCode }) => {
  const [room, setRoom] = useState<GameRoom | null>(null);

  useEffect(() => {
    if (!initialCode) return;
    const unsub = syncService.listenRoom(initialCode, (updated) => {
      setRoom(updated);
    });
    return () => unsub();
  }, [initialCode]);

  if (!room) {
    return (
      <div className="min-h-screen night-sky-gradient flex items-center justify-center text-amber-200">
        <div className="font-gothic text-lg">Connexion à la salle spectateur...</div>
      </div>
    );
  }

  const players = Object.values(room.players);
  const alivePlayers = players.filter((p) => p.isAlive);
  const isNight = room.phase.startsWith('NIGHT');

  return (
    <div className="min-h-screen night-sky-gradient text-white flex flex-col p-8 select-none">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐺</span>
          <div>
            <h1 className="font-gothic text-2xl font-black text-amber-200">
              Thiercelieux — Écran Spectateur Public
            </h1>
            <p className="text-xs text-zinc-400">Salle {room.code} • Sans révélation des rôles secrets</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>{alivePlayers.length} / {players.length} vivants</span>
          </span>
        </div>
      </header>

      {/* Main Stage */}
      <main className="flex-1 max-w-5xl mx-auto w-full py-8 flex flex-col justify-center text-center">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-zinc-800 text-xs font-bold text-zinc-300 mx-auto mb-4">
          {isNight ? (
            <>
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Nuit {room.nightState.nightNumber}</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Journée {room.dayState.dayNumber}</span>
            </>
          )}
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-gothic text-amber-100 mb-6 leading-tight max-w-2xl mx-auto">
          « {room.narratorText} »
        </h2>

        {/* Players Grid (Public View only) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-8">
          {players.map((p) => (
            <div
              key={p.id}
              className={`p-3 rounded-2xl border text-center transition-all ${
                p.isAlive
                  ? 'bg-zinc-900/80 border-zinc-700'
                  : 'bg-zinc-950/40 border-zinc-800/40 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">{p.isAlive ? p.avatar || '👤' : '💀'}</div>
              <div className="font-bold text-xs text-white truncate">{p.name}</div>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block ${
                  p.isAlive
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {p.isAlive ? 'Vivant' : 'Éliminé'}
              </span>

              {/* Reveal role ONLY if GAME_OVER */}
              {room.phase === 'GAME_OVER' && p.role && (
                <div className="mt-2 text-[10px] text-amber-300 font-bold font-gothic">
                  {p.role}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
