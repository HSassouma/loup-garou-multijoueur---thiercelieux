import React from 'react';
import { GameRoom } from '../../types/game';
import { Vote, AlertCircle } from 'lucide-react';

interface VoteMonitorProps {
  room: GameRoom;
}

export const VoteMonitor: React.FC<VoteMonitorProps> = ({ room }) => {
  const alivePlayers = Object.values(room.players).filter((p) => p.isAlive);
  const totalAlive = alivePlayers.length;
  const votes = room.dayState.votes;
  const votedCount = Object.keys(votes).length;

  // Compute tallies
  const tallies: Record<string, number> = {};
  Object.values(votes).forEach((targetId) => {
    tallies[targetId] = (tallies[targetId] || 0) + 1;
  });

  const sortedCandidates = Object.entries(tallies).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-zinc-900/80 border border-amber-600/30 rounded-2xl p-5 my-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Vote className="w-5 h-5 text-amber-500" />
          <h3 className="font-gothic text-lg font-bold text-amber-200">
            Dépouillement des Suffrages en Direct
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700/50 font-bold">
            {votedCount} / {totalAlive} votes exprimés ({Math.round((votedCount / (totalAlive || 1)) * 100)}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-5">
        <div
          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-500"
          style={{ width: `${(votedCount / (totalAlive || 1)) * 100}%` }}
        />
      </div>

      {/* Results Bar List */}
      {sortedCandidates.length === 0 ? (
        <div className="text-center py-6 text-zinc-500 text-sm">
          En attente des premiers votes des villageois...
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedCandidates.map(([targetId, count]) => {
            const target = room.players[targetId];
            if (!target) return null;
            const pct = Math.round((count / (totalAlive || 1)) * 100);

            return (
              <div key={targetId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-white">{target.name}</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {count} voix ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {votedCount >= totalAlive && totalAlive > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Tous les villageois ont voté ! Clôture immédiate du scrutin.</span>
        </div>
      )}
    </div>
  );
};
