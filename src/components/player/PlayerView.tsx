import React, { useState, useEffect } from 'react';
import { GameRoom, Player } from '../../types/game';
import { SecretCard } from './SecretCard';
import { NightActionPad } from './NightActionPad';
import { VotePad } from './VotePad';
import { ProfileModal } from '../social/ProfileModal';
import { syncService } from '../../services/syncService';
import { profileService } from '../../services/profileService';
import {
  Moon,
  Sun,
  Shield,
  LogOut,
  RefreshCw,
  Trophy,
  Skull,
  User,
  Users,
  Award,
  Pause,
  Sparkles,
} from 'lucide-react';

interface PlayerViewProps {
  initialCode?: string;
  onSwitchToHost?: () => void;
}

const AVATARS = ['🐺', '🧙', '🏹', '👑', '🦉', '🦊', '⚔️', '🛡️', '👤', '🌙'];

export const PlayerView: React.FC<PlayerViewProps> = ({ initialCode = '', onSwitchToHost }) => {
  const [profile, setProfile] = useState(profileService.getProfile());
  const [showProfile, setShowProfile] = useState(false);
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState(profile.username);
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check stored session on mount for automatic reconnection
  useEffect(() => {
    const session = syncService.getStoredPlayerSession();
    if (session && (!initialCode || session.roomCode === initialCode.toUpperCase())) {
      setCode(session.roomCode);
      setName(session.playerName);
      handleJoin(session.roomCode, session.playerName, session.playerId, session.playerToken);
    } else if (initialCode) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  // Subscribe to room sync stream with player credentials
  useEffect(() => {
    if (!code || !player) return;
    const unsub = syncService.listenRoom(
      code,
      (updatedRoom) => {
        setRoom(updatedRoom);
        if (updatedRoom.players[player.id]) {
          setPlayer(updatedRoom.players[player.id]);
        }
      },
      {
        playerId: player.id,
        token: player.token,
      }
    );
    return () => unsub();
  }, [code, player?.id, player?.token]);

  const handleJoin = async (
    targetCode: string,
    targetName: string,
    existingId?: string,
    existingToken?: string
  ) => {
    setError(null);
    setLoading(true);
    try {
      const res = await syncService.joinRoom(
        targetCode,
        targetName,
        existingId,
        existingToken,
        selectedAvatar
      );
      setRoom(res.room);
      setPlayer(res.player);
    } catch (err: any) {
      setError(err.message || 'Impossible de rejoindre la partie');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType: string, payload: any) => {
    if (!room || !player) return;
    try {
      const updated = await syncService.performPlayerAction(
        room.code,
        player.id,
        actionType,
        payload
      );
      setRoom(updated);
    } catch (err: any) {
      console.error('Player action failed:', err);
    }
  };

  const handleCardViewed = () => {
    handleAction('VIEW_CARD', {});
  };

  const handleLeave = () => {
    syncService.clearPlayerSession();
    setPlayer(null);
    setRoom(null);
  };

  // 1. JOIN SCREEN
  if (!player || !room) {
    return (
      <div className="min-h-screen night-sky-gradient flex flex-col justify-center items-center px-4 py-8 text-white">
        <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-3xl p-7 shadow-2xl backdrop-blur-md">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-950 via-zinc-900 to-amber-950 border border-amber-600/40 flex items-center justify-center text-3xl shadow-lg shadow-red-950/40 mb-3">
              🐺
            </div>
            <h1 className="text-2xl font-black font-gothic tracking-wide text-amber-200">
              Loup-Garou
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Rejoins la salle sur ton smartphone
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin(code, name);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Code de la salle (4 lettres)
              </label>
              <input
                type="text"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                className="w-full text-center text-2xl font-bold tracking-widest font-mono py-2.5 bg-black/60 border border-zinc-700 rounded-xl text-amber-400 focus:outline-none focus:border-amber-500 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Ton Prénom / Pseudo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bilal, Alice..."
                className="w-full text-center text-base py-2.5 bg-black/60 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Choisis ton Avatar
              </label>
              <div className="flex flex-wrap justify-center gap-1.5 p-2 bg-black/40 rounded-xl border border-zinc-800">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                      selectedAvatar === av
                        ? 'bg-amber-600/40 border border-amber-500 scale-110 shadow-md'
                        : 'hover:bg-zinc-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !code || !name.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-950 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connexion au village...</span>
                </>
              ) : (
                <span>Entrer dans la salle</span>
              )}
            </button>
          </form>

          {onSwitchToHost && (
            <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
              <button
                onClick={onSwitchToHost}
                className="text-xs text-zinc-400 hover:text-amber-400 transition-colors"
              >
                Tu es le meneur de jeu ? Ouvrir l'écran Vidéoprojecteur
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. ACTIVE GAME SCREEN
  const isNight = room.phase.startsWith('NIGHT');
  const playersList = Object.values(room.players);

  return (
    <div className="min-h-screen night-sky-gradient flex flex-col text-white pb-8">
      {/* Top Status Bar */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/50">
            {room.code}
          </span>
          <span className="font-bold text-sm text-zinc-200 truncate max-w-[120px] flex items-center gap-1.5">
            <span>{player.avatar || '👤'}</span>
            <span>{player.name}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
              player.isAlive
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {player.isAlive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Vivant
              </>
            ) : (
              <>
                <Skull className="w-3.5 h-3.5 text-zinc-400" />
                Fantôme
              </>
            )}
          </span>

          <button
            onClick={() => setShowProfile(true)}
            title="Mon Profil & Hauts Faits"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 hover:border-amber-500/50 flex items-center gap-1 text-xs"
          >
            <span>{profile.avatar}</span>
          </button>

          <button
            onClick={handleLeave}
            title="Quitter la salle"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-24 flex flex-col">
        {/* Pause Banner */}
        {room.isPaused && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-950/80 border border-amber-500 text-amber-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
            <Pause className="w-4 h-4 fill-amber-400" />
            <span>Partie mise en pause par le meneur</span>
          </div>
        )}

        {/* Phase Pill Banner */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-300">
            {isNight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nuit {room.nightState.nightNumber || 1}</span>
              </>
            ) : room.phase === 'LOBBY' ? (
              <>
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Salon d'attente</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Journée</span>
              </>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-2 font-medium px-4">
            {room.narratorText}
          </p>
        </div>

        {/* 3. LOBBY WAITING SCREEN (Rich real-time waiting room) */}
        {room.phase === 'LOBBY' && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Status Card */}
            <div className="p-6 bg-zinc-900/70 border border-zinc-800 rounded-3xl text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-amber-600/30 flex items-center justify-center text-3xl mx-auto mb-3 animate-bounce">
                ⏳
              </div>
              <h2 className="text-xl font-bold font-gothic text-amber-300 mb-1">
                Salle d'attente : {room.code}
              </h2>
              <p className="text-xs text-zinc-400 max-w-[260px] mx-auto leading-relaxed">
                Le meneur n'a pas encore lancé la partie. Installe-toi, la distribution des rôles aura bientôt lieu.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-zinc-700 text-xs text-amber-400 font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {playersList.length} joueur{playersList.length > 1 ? 's' : ''} connecté{playersList.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Live Players List in Lobby */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl shadow-lg">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Joueurs dans le village ({playersList.length})
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Mise à jour en direct
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {playersList.map((p) => {
                  const isMe = p.id === player.id;
                  const isOnline = p.isConnected !== false;

                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
                        isMe
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                          : 'bg-zinc-950/70 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base select-none">{p.avatar || '👤'}</span>
                        <span className="text-xs font-bold truncate">
                          {p.name} {isMe && '(Moi)'}
                        </span>
                      </div>

                      <span
                        title={isOnline ? 'En ligne' : 'Hors-ligne'}
                        className={`w-2 h-2 rounded-full ${
                          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECRET CARD DISPLAY (when roles are dealt) */}
        {room.phase !== 'LOBBY' && player.role && (
          <SecretCard player={player} onCardViewed={handleCardViewed} />
        )}

        {/* GHOST / ELIMINATED BANNER */}
        {!player.isAlive && room.phase !== 'LOBBY' && room.phase !== 'GAME_OVER' && (
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-5 my-3 text-center">
            <Skull className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <h3 className="font-gothic text-sm font-bold text-zinc-300 mb-1">
              Tu as été éliminé du village
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Tu erres désormais comme un esprit silencieux. Tu peux observer le déroulement de la partie mais tu ne peux plus voter ni utiliser de pouvoirs.
            </p>
          </div>
        )}

        {/* NIGHT ACTION PAD */}
        {isNight && player.isAlive && (
          <NightActionPad room={room} player={player} onAction={handleAction} />
        )}

        {/* HUNTER REVENGE PAD */}
        {room.phase === 'HUNTER_SHOT' && (
          <NightActionPad room={room} player={player} onAction={handleAction} />
        )}

        {/* DAY VOTING PAD */}
        {room.phase === 'DAY_VOTE' && player.isAlive && (
          <VotePad
            room={room}
            player={player}
            onVote={(targetId) => handleAction('DAY_VOTE', { targetId })}
          />
        )}

        {/* DAY EXECUTION RESULTS */}
        {room.phase === 'DAY_EXECUTION' && (
          <div className="bg-zinc-900/80 border border-amber-600/40 rounded-2xl p-5 my-4 text-center">
            <h3 className="font-gothic text-base font-bold text-amber-300 mb-1">
              Sentence du Village
            </h3>
            <p className="text-xs text-zinc-300">
              {room.narratorText}
            </p>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {room.phase === 'GAME_OVER' && (
          <div className="bg-zinc-900/90 border-2 border-amber-500 rounded-3xl p-6 my-4 text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-amber-950/60 border border-amber-500 flex items-center justify-center text-4xl mx-auto mb-3">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black font-gothic text-amber-300 mb-1">
              Fin de la Partie !
            </h2>
            <div className="text-lg font-bold text-white mb-2">
              {room.winner === 'VILLAGE' && '🎉 Victoire du Village !'}
              {room.winner === 'LOUPS' && '🐺 Victoire des Loups-Garous !'}
              {room.winner === 'AMOUREUX' && '❤️ Victoire des Amoureux !'}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              {room.narratorText}
            </p>
            <div className="text-xs text-zinc-500">
              Le meneur peut relancer une nouvelle manche à tout moment.
            </div>
          </div>
        )}
      </main>

      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
};
