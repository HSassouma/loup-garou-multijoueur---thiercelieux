import React, { useState } from 'react';
import { GameRoom, Player, ROLES_METADATA } from '../../types/game';
import { Eye, Heart, Skull, Sparkles, Moon, CheckCircle, Shield, Feather } from 'lucide-react';

interface NightActionPadProps {
  room: GameRoom;
  player: Player;
  onAction: (actionType: string, payload: any) => void;
}

export const NightActionPad: React.FC<NightActionPadProps> = ({ room, player, onAction }) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [cupidSelection, setCupidSelection] = useState<string[]>([]);
  const [witchHeal, setWitchHeal] = useState<boolean>(false);
  const [witchPoisonTarget, setWitchPoisonTarget] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const alivePlayers = Object.values(room.players).filter((p) => p.isAlive);
  const otherAlivePlayers = alivePlayers.filter((p) => p.id !== player.id);

  // 1. CUPID PHASE
  if (room.phase === 'NIGHT_CUPID') {
    if (player.role !== 'CUPIDON') {
      return <SleepingVillageoisScreen />;
    }

    const toggleCupidChoice = (pid: string) => {
      if (cupidSelection.includes(pid)) {
        setCupidSelection(cupidSelection.filter((id) => id !== pid));
      } else if (cupidSelection.length < 2) {
        setCupidSelection([...cupidSelection, pid]);
      }
    };

    const handleCupidConfirm = () => {
      if (cupidSelection.length === 2) {
        onAction('CUPID_CHOOSE', { lovers: cupidSelection });
        setSubmitted(true);
      }
    };

    return (
      <div className="bg-pink-950/40 border border-pink-500/30 rounded-3xl p-5 my-4 shadow-xl">
        <div className="flex items-center gap-2 text-pink-400 font-bold mb-2">
          <Heart className="w-5 h-5 fill-pink-500/30" />
          <h3 className="font-gothic text-lg">Cupidon — Choisis 2 Amoureux</h3>
        </div>
        <p className="text-xs text-pink-200/80 mb-4 leading-relaxed">
          Sélectionne deux villageois qui seront liés par le destin. Si l'un périt, l'autre meurt de chagrin.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {alivePlayers.map((p) => {
            const isSelected = cupidSelection.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleCupidChoice(p.id)}
                disabled={submitted}
                className={`py-2.5 px-3 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-pink-600 border-pink-400 text-white shadow-lg shadow-pink-900/50'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:border-pink-500/50'
                }`}
              >
                <span>{p.name}</span>
                {isSelected && <Heart className="w-4 h-4 fill-white" />}
              </button>
            );
          })}
        </div>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-2xl">
            <CheckCircle className="w-4 h-4" />
            <span>Choix validé. Cupidon peut se rendormir.</span>
          </div>
        ) : (
          <button
            onClick={handleCupidConfirm}
            disabled={cupidSelection.length !== 2}
            className="w-full py-3.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-pink-950"
          >
            Lier les 2 Amoureux ({cupidSelection.length}/2)
          </button>
        )}
      </div>
    );
  }

  // 2. SALVATEUR PHASE (PROTECTOR)
  if (room.phase === 'NIGHT_SALVATEUR') {
    if (player.role !== 'SALVATEUR') {
      return <SleepingVillageoisScreen />;
    }

    const lastProtectedId = room.nightState.lastSalvateurTargetId;
    const currentProtectedId = room.nightState.salvateurTargetId;

    const handleProtect = (targetId: string) => {
      setSelectedTarget(targetId);
      onAction('SALVATEUR_PROTECT', { targetId });
      setSubmitted(true);
    };

    return (
      <div className="bg-sky-950/40 border border-sky-500/40 rounded-3xl p-5 my-4 shadow-xl">
        <div className="flex items-center gap-2 text-sky-400 font-bold mb-2">
          <Shield className="w-5 h-5" />
          <h3 className="font-gothic text-lg">Salvateur — Bouclier Protecteur</h3>
        </div>
        <p className="text-xs text-sky-200/80 mb-3 leading-relaxed">
          Choisis un villageois à protéger cette nuit contre les griffes des loups. Tu ne peux pas protéger la même personne deux nuits de suite.
        </p>

        {lastProtectedId && (
          <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-700 text-[11px] text-zinc-400 mb-3">
            Protégé la nuit précédente : <strong className="text-sky-300">{room.players[lastProtectedId]?.name}</strong> (Inéligible cette nuit)
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {alivePlayers.map((p) => {
            const isLast = p.id === lastProtectedId;
            const isCurrent = currentProtectedId === p.id || selectedTarget === p.id;

            return (
              <button
                key={p.id}
                disabled={isLast || submitted}
                onClick={() => handleProtect(p.id)}
                className={`py-3 px-3 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between ${
                  isLast
                    ? 'opacity-40 border-zinc-800 bg-black/40 text-zinc-600 cursor-not-allowed'
                    : isCurrent
                    ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-950'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:border-sky-500/50'
                }`}
              >
                <span>{p.name}</span>
                {isCurrent && <Shield className="w-4 h-4 text-white" />}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Bouclier déployé. Le Salvateur peut se rendormir.</span>
          </div>
        )}
      </div>
    );
  }

  // 3. SEER PHASE
  if (room.phase === 'NIGHT_SEER') {
    if (player.role !== 'VOYANTE') {
      return <SleepingVillageoisScreen />;
    }

    const inspectedId = room.nightState.seerInspectedId;
    const inspectedRole = room.nightState.seerInspectedRole;
    const inspectedPlayer = inspectedId ? room.players[inspectedId] : null;

    const handleInspect = (pid: string) => {
      setSelectedTarget(pid);
      onAction('SEER_INSPECT', { targetId: pid });
    };

    return (
      <div className="bg-purple-950/40 border border-purple-500/30 rounded-3xl p-5 my-4 shadow-xl">
        <div className="flex items-center gap-2 text-purple-400 font-bold mb-2">
          <Eye className="w-5 h-5" />
          <h3 className="font-gothic text-lg">Voyante — Scrute les Âmes</h3>
        </div>
        <p className="text-xs text-purple-200/80 mb-4 leading-relaxed">
          Touche un joueur pour percer son secret et révéler son véritable rôle.
        </p>

        {inspectedRole && inspectedPlayer ? (
          <div className="p-5 rounded-2xl bg-purple-900/60 border border-purple-400 text-center mb-2 animate-fade-in shadow-xl">
            <span className="text-xs uppercase tracking-widest text-purple-300 font-bold">Révélation Secrète</span>
            <div className="text-4xl my-2">{ROLES_METADATA[inspectedRole]?.icon}</div>
            <div className="text-xl font-bold font-gothic text-white">{inspectedPlayer.name}</div>
            <div className="text-sm font-semibold text-purple-300">{ROLES_METADATA[inspectedRole]?.nameFr}</div>
            <p className="text-xs text-purple-200/70 mt-3">Ce savoir t’appartient. La Voyante peut se rendormir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {otherAlivePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => handleInspect(p.id)}
                className="py-3 px-3 rounded-2xl bg-zinc-900/90 border border-zinc-700 hover:border-purple-500 text-zinc-200 text-sm font-semibold transition-all flex items-center justify-between"
              >
                <span>{p.name}</span>
                <Eye className="w-3.5 h-3.5 text-purple-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. WEREWOLVES PHASE
  if (room.phase === 'NIGHT_WEREWOLVES') {
    if (player.role !== 'LOUP_GAROU') {
      return <SleepingVillageoisScreen />;
    }

    const myCurrentVote = room.nightState.werewolfVotes[player.id];
    const nonWolfPlayers = alivePlayers.filter((p) => p.role !== 'LOUP_GAROU');
    const wolfTeammates = alivePlayers.filter((p) => p.role === 'LOUP_GAROU');

    const handleWolfVote = (targetId: string) => {
      onAction('WEREWOLF_VOTE', { targetId });
    };

    return (
      <div className="bg-red-950/40 border border-red-600/40 rounded-3xl p-5 my-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <Skull className="w-5 h-5 text-red-500" />
            <h3 className="font-gothic text-lg">La Meute — Choisis ta proie</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-700/50 font-bold">
            {wolfTeammates.length} loups
          </span>
        </div>
        <p className="text-xs text-red-200/80 mb-3 leading-relaxed">
          Concerte-toi avec tes congénères. Désigne le villageois à dévorer cette nuit.
        </p>

        {/* Teammates votes */}
        <div className="flex flex-wrap gap-2 mb-4 p-2.5 bg-black/50 rounded-2xl border border-red-900/40 text-xs">
          <span className="text-red-400/90 font-bold">Meute :</span>
          {wolfTeammates.map((w) => {
            const targetName = room.nightState.werewolfVotes[w.id]
              ? room.players[room.nightState.werewolfVotes[w.id]]?.name
              : 'hésite...';
            return (
              <span key={w.id} className="text-zinc-300 bg-red-950/80 px-2 py-0.5 rounded-lg border border-red-800/40">
                {w.name} ➔ <strong className="text-red-300">{targetName}</strong>
              </span>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {nonWolfPlayers.map((p) => {
            const isTargetedByMe = myCurrentVote === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleWolfVote(p.id)}
                className={`py-3 px-3 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between ${
                  isTargetedByMe
                    ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-950'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:border-red-500/50'
                }`}
              >
                <span>{p.name}</span>
                {isTargetedByMe && <Skull className="w-4 h-4 fill-white" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. WITCH PHASE
  if (room.phase === 'NIGHT_WITCH') {
    if (player.role !== 'SORCIERE') {
      return <SleepingVillageoisScreen />;
    }

    const victimId = room.nightState.werewolfTargetId;
    const victim = victimId ? room.players[victimId] : null;
    const healAvailable = room.nightState.witchHealAvailable;
    const poisonAvailable = room.nightState.witchPoisonAvailable;

    const handleConfirmWitch = () => {
      onAction('WITCH_DECISION', {
        heal: healAvailable ? witchHeal : false,
        poisonTargetId: poisonAvailable ? witchPoisonTarget || undefined : undefined,
      });
      setSubmitted(true);
    };

    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-5 my-4 shadow-xl">
        <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-gothic text-lg">Sorcière — Tes Potions</h3>
        </div>

        {victim ? (
          <div className="p-3 bg-red-950/60 border border-red-600/50 rounded-2xl mb-4 text-xs">
            <span className="text-red-300 font-bold">⚠️ Attaqué par les loups : </span>
            <strong className="text-white text-sm ml-1">{victim.name}</strong>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 mb-4">Les loups n’ont fait aucune victime directe cette nuit.</p>
        )}

        {/* Heal Potion */}
        <div className="mb-4 p-3 bg-zinc-900/80 border border-zinc-700 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <span>Potion de Guérison 🧪</span>
                {!healAvailable && (
                  <span className="text-[10px] text-red-400 font-normal">(Épuisée)</span>
                )}
              </div>
              <div className="text-xs text-zinc-400">Sauver la victime désignée</div>
            </div>
            <button
              disabled={!victim || !healAvailable || submitted}
              onClick={() => setWitchHeal(!witchHeal)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                !healAvailable
                  ? 'opacity-30 bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                  : witchHeal
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-zinc-800 border-zinc-600 text-zinc-300'
              }`}
            >
              {witchHeal ? 'Activée (Sauver)' : 'Ne pas utiliser'}
            </button>
          </div>
        </div>

        {/* Poison Potion */}
        <div className="mb-4 p-3 bg-zinc-900/80 border border-zinc-700 rounded-2xl">
          <div className="text-sm font-bold text-purple-300 mb-1 flex items-center gap-1.5">
            <span>Potion de Poison ☠️</span>
            {!poisonAvailable && (
              <span className="text-[10px] text-red-400 font-normal">(Épuisée)</span>
            )}
          </div>
          <div className="text-xs text-zinc-400 mb-2">Éliminer un autre villageois suspect</div>
          {poisonAvailable ? (
            <div className="grid grid-cols-2 gap-1.5">
              {alivePlayers
                .filter((p) => p.id !== victimId)
                .map((p) => {
                  const isSelected = witchPoisonTarget === p.id;
                  return (
                    <button
                      key={p.id}
                      disabled={submitted}
                      onClick={() => setWitchPoisonTarget(isSelected ? null : p.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border ${
                        isSelected
                          ? 'bg-purple-600 border-purple-400 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic">Potion de poison déjà utilisée dans cette partie.</div>
          )}
        </div>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-2xl">
            <CheckCircle className="w-4 h-4" />
            <span>Décision enregistrée. La Sorcière peut se rendormir.</span>
          </div>
        ) : (
          <button
            onClick={handleConfirmWitch}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-950"
          >
            Confirmer mes décisions alchimiques
          </button>
        )}
      </div>
    );
  }

  // 6. CORBEAU PHASE
  if (room.phase === 'NIGHT_CORBEAU') {
    if (player.role !== 'CORBEAU') {
      return <SleepingVillageoisScreen />;
    }

    const currentHex = room.nightState.corbeauTargetId || selectedTarget;

    const handleCorbeauHex = (targetId: string) => {
      setSelectedTarget(targetId);
      onAction('CORBEAU_HEX', { targetId });
      setSubmitted(true);
    };

    return (
      <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-3xl p-5 my-4 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
          <Feather className="w-5 h-5" />
          <h3 className="font-gothic text-lg">Corbeau — Désignation Anonyme</h3>
        </div>
        <p className="text-xs text-indigo-200/80 mb-3 leading-relaxed">
          Dépose une lettre accusatrice sur la porte d'un suspect. Il démarrera le vote du jour avec 2 voix contre lui.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {otherAlivePlayers.map((p) => {
            const isHexed = currentHex === p.id;
            return (
              <button
                key={p.id}
                disabled={submitted}
                onClick={() => handleCorbeauHex(p.id)}
                className={`py-3 px-3 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between ${
                  isHexed
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:border-indigo-500/50'
                }`}
              >
                <span>{p.name}</span>
                {isHexed && <Feather className="w-4 h-4 text-white" />}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Message déposé. Le Corbeau replie ses ailes.</span>
          </div>
        )}
      </div>
    );
  }

  // 7. HUNTER SHOT (INTERRUPT)
  if (room.phase === 'HUNTER_SHOT') {
    if (player.role !== 'CHASSEUR') {
      return (
        <div className="bg-amber-950/30 border border-amber-600/30 rounded-3xl p-6 my-4 text-center">
          <h3 className="font-gothic text-base text-amber-300 font-bold mb-1">Panique au village !</h3>
          <p className="text-xs text-amber-200/80">
            Le Chasseur a été touché mortellement ! Il arme son fusil pour abattre sa dernière cible...
          </p>
        </div>
      );
    }

    const handleHunterShoot = (targetId: string) => {
      onAction('HUNTER_SHOOT', { targetId });
    };

    return (
      <div className="bg-amber-950/60 border-2 border-amber-500 rounded-3xl p-6 my-4 shadow-2xl animate-pulse">
        <h3 className="font-gothic text-xl text-amber-300 font-bold mb-1">
          🎯 Dernier Tir du Chasseur !
        </h3>
        <p className="text-xs text-amber-200 mb-4 leading-relaxed">
          Tu as été éliminé, mais ton fusil a encore une balle. Choisis qui emporter avec toi dans la tombe !
        </p>

        <div className="grid grid-cols-2 gap-2">
          {otherAlivePlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => handleHunterShoot(p.id)}
              className="py-3.5 px-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm border border-amber-400 shadow-xl shadow-amber-950 flex items-center justify-between"
            >
              <span>{p.name}</span>
              <span>💥</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <SleepingVillageoisScreen />;
};

const SleepingVillageoisScreen: React.FC = () => (
  <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-7 my-4 text-center shadow-lg">
    <div className="w-16 h-16 rounded-full bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
      <Moon className="w-8 h-8 text-indigo-400" />
    </div>
    <h3 className="font-gothic text-base font-bold text-indigo-200 mb-1">
      Le village dort profondément...
    </h3>
    <p className="text-xs text-zinc-400 leading-relaxed max-w-[240px] mx-auto">
      Garde ton téléphone face contre table. Écoute la voix du narrateur et ne bouge pas.
    </p>
  </div>
);
