import React, { useState } from 'react';
import { GameRoom } from '../../types/game';
import { syncService } from '../../services/syncService';
import { Bot, Play, UserPlus, FastForward, CheckCircle, X } from 'lucide-react';

interface BotRunnerModalProps {
  room: GameRoom;
  onClose: () => void;
  onRefreshRoom?: () => void;
}

export const BotRunnerModal: React.FC<BotRunnerModalProps> = ({ room, onClose, onRefreshRoom }) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 1. Add standard 6 players (from page 7 of guide)
  const handleAdd6Bots = async () => {
    setLoading(true);
    setStatusMessage('Génération de 6 joueurs d’essai (Alice, Bilal, Chloé, Driss, Emma, Farid)...');
    try {
      await syncService.simulateBots(room.code, 6);
      setStatusMessage('6 joueurs ajoutés avec succès !');
      onRefreshRoom?.();
    } catch (e: any) {
      setStatusMessage(`Erreur: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Add 15 players for classroom stress test
  const handleAdd15Bots = async () => {
    setLoading(true);
    setStatusMessage('Génération de 15 joueurs pour test de charge salle de classe...');
    try {
      await syncService.simulateBots(room.code, 15);
      setStatusMessage('15 joueurs ajoutés avec succès !');
      onRefreshRoom?.();
    } catch (e: any) {
      setStatusMessage(`Erreur: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Simulate Night actions automatically for bots
  const handleAutoNight = async () => {
    setLoading(true);
    setStatusMessage('Simulation des actions de nuit des bots...');
    try {
      const aliveBots = Object.values(room.players).filter((p) => p.isAlive && p.isBot);
      const aliveNonWolves = Object.values(room.players).filter((p) => p.isAlive && p.role !== 'LOUP_GAROU');

      if (room.phase === 'NIGHT_WEREWOLVES') {
        const wolves = aliveBots.filter((p) => p.role === 'LOUP_GAROU');
        if (wolves.length > 0 && aliveNonWolves.length > 0) {
          const target = aliveNonWolves[Math.floor(Math.random() * aliveNonWolves.length)];
          for (const wolf of wolves) {
            await syncService.performPlayerAction(room.code, wolf.id, 'WEREWOLF_VOTE', {
              targetId: target.id,
            });
          }
          setStatusMessage(`Les loups bots ont voté contre ${target.name}.`);
        }
      } else if (room.phase === 'NIGHT_SEER') {
        const seer = aliveBots.find((p) => p.role === 'VOYANTE');
        const target = aliveBots.find((p) => p.id !== seer?.id);
        if (seer && target) {
          await syncService.performPlayerAction(room.code, seer.id, 'SEER_INSPECT', {
            targetId: target.id,
          });
          setStatusMessage(`La voyante bot a inspecté ${target.name}.`);
        }
      } else if (room.phase === 'NIGHT_WITCH') {
        const witch = aliveBots.find((p) => p.role === 'SORCIERE');
        if (witch) {
          await syncService.performPlayerAction(room.code, witch.id, 'WITCH_DECISION', {
            heal: false,
          });
          setStatusMessage('La sorcière bot a validé son tour.');
        }
      }
      onRefreshRoom?.();
    } catch (e: any) {
      setStatusMessage(`Erreur: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Simulate Random Votes for all alive bots during day vote
  const handleAutoVotes = async () => {
    setLoading(true);
    setStatusMessage('Simulation aléatoire des votes des villageois bots...');
    try {
      const alivePlayers = Object.values(room.players).filter((p) => p.isAlive);
      const aliveBots = alivePlayers.filter((p) => p.isBot);

      for (const bot of aliveBots) {
        // Vote for a random other alive player
        const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        await syncService.performPlayerAction(room.code, bot.id, 'DAY_VOTE', {
          targetId: target.id,
        });
      }
      setStatusMessage(`Votes enregistrés pour ${aliveBots.length} bots.`);
      onRefreshRoom?.();
    } catch (e: any) {
      setStatusMessage(`Erreur: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-white shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-gothic text-lg font-bold text-amber-200">
                Simulateur de Bots & Tests QA
              </h3>
              <p className="text-xs text-zinc-400">
                Génération de scénarios conformes au guide de test Loup-Garou
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMessage && (
          <div className="my-3 p-3 rounded-xl bg-purple-950/50 border border-purple-500/40 text-purple-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-purple-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="py-4 space-y-3">
          {/* Action 1: Add 6 players (Alice, Bilal, Chloé, Driss, Emma, Farid) */}
          <button
            onClick={handleAdd6Bots}
            disabled={loading || room.phase !== 'LOBBY'}
            className="w-full p-3.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-left transition-all disabled:opacity-40 flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Injecter les 6 joueurs du guide (Page 7)</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Alice, Bilal, Chloé, Driss, Emma, Farid (configuration idéale 6 joueurs)
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              +6 Bots
            </span>
          </button>

          {/* Action 2: Add 15 players for stress test */}
          <button
            onClick={handleAdd15Bots}
            disabled={loading || room.phase !== 'LOBBY'}
            className="w-full p-3.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-left transition-all disabled:opacity-40 flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-sm text-sky-300 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Simuler 15 élèves (Test de charge salle de classe)</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Simule une classe DWWM complète avec répartition équilibrée
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
              +15 Bots
            </span>
          </button>

          {/* Action 3: Auto Night Actions */}
          <button
            onClick={handleAutoNight}
            disabled={loading || !room.phase.startsWith('NIGHT')}
            className="w-full p-3.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-left transition-all disabled:opacity-40 flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                <FastForward className="w-4 h-4" />
                <span>Exécuter automatiquement les actions de nuit des bots</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Les bots vivants (Loups, Voyante, Sorcière) valident leur action sans attendre
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Nuit Auto
            </span>
          </button>

          {/* Action 4: Auto Day Votes */}
          <button
            onClick={handleAutoVotes}
            disabled={loading || room.phase !== 'DAY_VOTE'}
            className="w-full p-3.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-left transition-all disabled:opacity-40 flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>Faire voter tous les bots vivants aléatoirement</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Simule les suffrages du village et déclenche la clôture automatique
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Vote Auto
            </span>
          </button>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Mode QA Actif • Code salle : {room.code}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
