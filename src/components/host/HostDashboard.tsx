import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { GameRoom, RoleType, ROLES_METADATA } from '../../types/game';
import { PlayerRoster } from './PlayerRoster';
import { VoteMonitor } from './VoteMonitor';
import { BotRunnerModal } from '../simulation/BotRunnerModal';
import { TeacherGuideModal } from '../guide/TeacherGuideModal';
import { FirebaseRulesModal } from '../guide/FirebaseRulesModal';
import { GameConfigModal } from './GameConfigModal';
import { AudioSettingsModal } from '../audio/AudioSettingsModal';
import { EventTimelineDrawer } from './EventTimelineDrawer';
import { TrainingModeModal } from '../training/TrainingModeModal';
import { syncService } from '../../services/syncService';
import { audioService } from '../../services/audioService';
import { profileService } from '../../services/profileService';
import {
  Moon,
  Sun,
  Users,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Bot,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  FastForward,
  Skull,
  Eye,
  Trophy,
  Sliders,
  GraduationCap,
  ListOrdered,
} from 'lucide-react';

interface HostDashboardProps {
  initialCode?: string;
  onSwitchToPlayer?: (code: string) => void;
  onRoomCodeChange?: (code: string) => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ initialCode, onSwitchToPlayer, onRoomCodeChange }) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSpectator, setCopiedSpectator] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals
  const [showBotRunner, setShowBotRunner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTraining, setShowTraining] = useState(false);

  // Narrator speech tracking
  const lastNarratedText = useRef<string>('');

  // 1. Initial Room Creation or Load
  useEffect(() => {
    const initRoom = async () => {
      setLoading(true);
      try {
        const storedHost = syncService.getStoredHostSession();
        const targetCode = initialCode || (storedHost?.roomCode);

        if (targetCode) {
          const existing = await syncService.getRoom(targetCode, {
            isHost: true,
            hostToken: storedHost?.hostToken,
          });
          if (existing) {
            setRoom(existing);
            onRoomCodeChange?.(existing.code);
            return;
          }
        }
        const created = await syncService.createRoom('Meneur');
        setRoom(created.room);
        onRoomCodeChange?.(created.room.code);
      } catch (e) {
        console.error('Failed to init host room', e);
      } finally {
        setLoading(false);
      }
    };
    initRoom();
  }, [initialCode]);

  // 2. Real-time Room Sync Listener
  useEffect(() => {
    if (!room?.code) return;
    const storedHost = syncService.getStoredHostSession();
    const unsub = syncService.listenRoom(
      room.code,
      (updatedRoom) => {
        setRoom(updatedRoom);
      },
      {
        isHost: true,
        hostToken: storedHost?.roomCode === room.code ? storedHost.hostToken : undefined,
      }
    );
    return () => unsub();
  }, [room?.code]);

  // 3. Generate High-Res QR Code for Projector
  useEffect(() => {
    if (!room?.code || typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/join?code=${room.code}`;
    QRCode.toDataURL(shareUrl, {
      width: 400,
      margin: 1.5,
      color: {
        dark: '#0c0d14',
        light: '#f8fafc',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [room?.code]);

  // 4. Voice Narration & Atmospheric Audio Effects on Phase change
  useEffect(() => {
    if (!room || !room.narratorText) return;
    if (room.narratorText !== lastNarratedText.current) {
      lastNarratedText.current = room.narratorText;
      audioService.narrate(room.narratorText);

      // Play matching procedural sound
      if (room.phase.startsWith('NIGHT')) {
        audioService.playWolfHowl();
      } else if (room.phase === 'DAY_ANNOUNCEMENT') {
        audioService.playDawnChime();
      } else if (room.phase === 'DAY_VOTE') {
        audioService.playVoteChime();
      } else if (room.phase === 'DAY_EXECUTION' || room.phase === 'HUNTER_SHOT') {
        audioService.playDeathBell();
      } else if (room.phase === 'GAME_OVER') {
        audioService.playVictoryFanfare();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }
  }, [room?.phase, room?.narratorText]);

  // Copy shareable invitation link
  const handleCopyLink = () => {
    if (!room) return;
    const shareUrl = `${window.location.origin}/join?code=${room.code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Host Action helper
  const handleHostAction = async (action: string, payload?: any) => {
    if (!room) return;
    try {
      const updated = await syncService.performHostAction(room.code, action, payload);
      setRoom(updated);
    } catch (err: any) {
      alert(err.message || 'Action impossible');
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioService.updateSettings({ isMuted: next });
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading || !room) {
    return (
      <div className="min-h-screen night-sky-gradient flex items-center justify-center text-amber-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <span className="font-gothic text-lg">Initialisation de la salle du Meneur...</span>
        </div>
      </div>
    );
  }

  const playersList = Object.values(room.players);
  const alivePlayers = playersList.filter((p) => p.isAlive);
  const cardsViewedCount = playersList.filter((p) => p.hasViewedCard).length;
  const isNight = room.phase.startsWith('NIGHT');

  return (
    <div className="min-h-screen night-sky-gradient text-white flex flex-col font-sans select-none">
      {/* 1. TOP CONTROL BAR */}
      <header className="bg-black/80 backdrop-blur-md border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-950 via-zinc-900 to-amber-950 border border-amber-500/40 flex items-center justify-center text-xl shadow-md">
            🐺
          </div>
          <div>
            <h1 className="text-lg font-black font-gothic tracking-wider text-amber-200 flex items-center gap-2">
              <span>Loup-Garou de Thiercelieux</span>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/60">
                Régie Meneur
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">Écran principal pour vidéoprojecteur de classe</p>
          </div>
        </div>

        {/* Action pills & quick tools */}
        <div className="flex items-center gap-2">
          {/* Audio voice toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isMuted
                ? 'bg-zinc-900 border-zinc-700 text-zinc-400'
                : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            }`}
            title={isMuted ? 'Activer la voix du narrateur' : 'Désactiver le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMuted ? 'Muet' : 'Voix Active'}</span>
          </button>

          {/* Replay narrator button */}
          <button
            onClick={() => audioService.narrate(room.narratorText || '', true)}
            title="Répéter la réplique du narrateur"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Pause / Resume Game toggle */}
          {room.phase !== 'LOBBY' && room.phase !== 'GAME_OVER' && (
            <button
              onClick={() => handleHostAction(room.isPaused ? 'RESUME_GAME' : 'PAUSE_GAME')}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                room.isPaused
                  ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white animate-pulse'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
              title={room.isPaused ? 'Reprendre la partie' : 'Mettre en pause'}
            >
              {room.isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
              <span>{room.isPaused ? 'Reprendre' : 'Pause'}</span>
            </button>
          )}

          {/* Mode & Roles Config Modal */}
          <button
            onClick={() => setShowConfig(true)}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Mode & Rôles ({room.gameMode})</span>
          </button>

          {/* Audio Settings Modal */}
          <button
            onClick={() => setShowAudio(true)}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span className="hidden lg:inline">Mixage Son</span>
          </button>

          {/* Timeline Drawer */}
          <button
            onClick={() => setShowTimeline(true)}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ListOrdered className="w-4 h-4 text-indigo-400" />
            <span className="hidden xl:inline">Chronologie</span>
          </button>

          {/* Training Academy Modal */}
          <button
            onClick={() => setShowTraining(true)}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline">Académie</span>
          </button>

          {/* Bot Runner QA Modal */}
          <button
            onClick={() => setShowBotRunner(true)}
            className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Simulateur Bots QA</span>
          </button>

          {/* Teacher Guide PDF Modal */}
          <button
            onClick={() => setShowGuide(true)}
            className="px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Guide de Test PDF</span>
          </button>

          {/* Firebase Rules Modal */}
          <button
            onClick={() => setShowRules(true)}
            className="px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">Règles Sécurisées</span>
          </button>

          {/* Fullscreen button */}
          <button
            onClick={handleToggleFullscreen}
            title="Plein écran projecteur"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN PROJECTOR VIEW */}
      <main className="flex-1 p-6 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* LEFT COLUMN: ROOM JOIN & QR CODE (3 cols) */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-zinc-900/90 border-2 border-amber-600/40 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-widest mb-1">
              Code de la salle
            </span>

            {/* Giant 4-letter Code */}
            <div className="text-5xl font-black font-mono tracking-widest text-amber-300 py-1 drop-shadow-md">
              {room.code}
            </div>

            {/* Crisp High-Res QR Code */}
            <div className="p-2.5 bg-white rounded-2xl shadow-xl my-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code Salle ${room.code}`}
                  className="w-48 h-48 rounded-xl object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-black text-xs font-bold">
                  Génération QR...
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-300 font-medium">
              Scannez avec l'appareil photo du smartphone pour rejoindre
            </p>

            {/* Copy link button */}
            <button
              onClick={handleCopyLink}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Lien copié dans le presse-papier !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le lien d'invitation</span>
                </>
              )}
            </button>

            {/* Copy spectator link */}
            <button
              onClick={() => {
                const specUrl = `${window.location.origin}/spectator/${room.code}`;
                navigator.clipboard.writeText(specUrl);
                setCopiedSpectator(true);
                setTimeout(() => setCopiedSpectator(false), 2000);
              }}
              className="mt-2 w-full py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedSpectator ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Lien Spectateur copié !</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>Copier lien Écran Spectateur</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Stats card */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Joueurs connectés
              </span>
              <strong className="text-white text-sm">{playersList.length}</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Villageois vivants</span>
              <strong className="text-emerald-400 text-sm">{alivePlayers.length}</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Éliminés / Fantômes</span>
              <strong className="text-zinc-500 text-sm">
                {playersList.length - alivePlayers.length}
              </strong>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Nuit en cours</span>
              <strong className="text-indigo-400 text-sm">{room.nightState.nightNumber}</strong>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: MAIN STAGE & ACTIONS (6 cols) */}
        <section className="lg:col-span-6 flex flex-col justify-between">
          <div>
            {/* Phase Big Banner */}
            <div className="p-6 rounded-3xl bg-zinc-900/95 border-2 border-zinc-800 text-center shadow-2xl relative overflow-hidden mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                {isNight ? (
                  <span className="px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Nuit {room.nightState.nightNumber || 1}</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700/50 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Journée {room.dayState.dayNumber || 1}</span>
                  </span>
                )}
              </div>

              {/* Narrator Speech Subtitle */}
              <h2 className="text-2xl sm:text-3xl font-extrabold font-gothic tracking-wide text-amber-100 my-3 leading-snug px-4">
                « {room.narratorText} »
              </h2>

              {/* Phase Specific Context Displays */}
              {room.phase === 'ROLE_REVEAL' && (
                <div className="mt-4 p-4 rounded-2xl bg-black/50 border border-amber-600/30 max-w-md mx-auto">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-2">
                    <span>Cartes secrètes consultées</span>
                    <span>
                      {cardsViewedCount} / {playersList.length}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{
                        width: `${(cardsViewedCount / (playersList.length || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {room.phase === 'DAY_DEBATE' && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 border border-amber-600/40 text-amber-300 font-mono text-xl font-bold">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>{room.dayState.timerSeconds}s</span>
                  </div>
                  <button
                    onClick={() => handleHostAction('START_DAY_DEBATE', { duration: room.dayState.timerSeconds + 30 })}
                    className="text-xs px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                  >
                    +30s
                  </button>
                </div>
              )}
            </div>

            {/* LIVE VOTING MONITOR */}
            {room.phase === 'DAY_VOTE' && <VoteMonitor room={room} />}

            {/* VICTORY STAGE */}
            {room.phase === 'GAME_OVER' && (
              <div className="p-8 rounded-3xl bg-zinc-900 border-2 border-amber-500 text-center shadow-2xl mb-6">
                <div className="w-24 h-24 rounded-full bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center text-5xl mx-auto mb-4 animate-bounce">
                  🏆
                </div>
                <h3 className="text-3xl font-black font-gothic text-amber-300 mb-2">
                  Partie Terminée !
                </h3>
                <div className="text-xl font-bold text-white mb-4">
                  {room.winner === 'VILLAGE' && 'Le Village a triomphé des Loups !'}
                  {room.winner === 'LOUPS' && 'Les Loups-Garous ont décimé le Village !'}
                  {room.winner === 'AMOUREUX' && 'Les Amoureux ont remporté la victoire !'}
                </div>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Tous les rôles sont maintenant dévoilés. Vous pouvez relancer une nouvelle partie en gardant les mêmes joueurs.
                </p>
              </div>
            )}
          </div>

          {/* 3. PRIMARY ACTION COMMAND BAR */}
          <div className="p-4 rounded-3xl bg-zinc-950/90 border border-zinc-800 flex flex-wrap gap-3 items-center justify-between">
            {room.phase === 'LOBBY' && (
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-zinc-400">
                  {playersList.length < 4 ? (
                    <span className="text-amber-400 font-semibold">
                      ⚠️ Au moins 4 joueurs requis pour distribuer les rôles.
                    </span>
                  ) : (
                    <span>Prêt à démarrer avec {playersList.length} joueurs.</span>
                  )}
                </div>

                <button
                  onClick={() => handleHostAction('DISTRIBUTE_ROLES')}
                  disabled={playersList.length < 4}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-amber-950 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Distribuer les Rôles</span>
                </button>
              </div>
            )}

            {room.phase === 'ROLE_REVEAL' && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-zinc-400">
                  Attendez que chacun découvre sa carte.
                </span>
                <button
                  onClick={() => handleHostAction('START_NIGHT')}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-indigo-950 flex items-center gap-2"
                >
                  <Moon className="w-4 h-4" />
                  <span>La nuit tombe</span>
                </button>
              </div>
            )}

            {isNight && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-zinc-400">
                  Étape en cours : <strong className="text-indigo-300">{room.phase}</strong>
                </span>
                <button
                  onClick={() => handleHostAction('ADVANCE_NIGHT_STEP')}
                  className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-bold rounded-2xl text-xs transition-all flex items-center gap-2"
                >
                  <FastForward className="w-4 h-4 text-amber-400" />
                  <span>Passer cette étape (Force)</span>
                </button>
              </div>
            )}

            {room.phase === 'DAY_ANNOUNCEMENT' && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-zinc-400">
                  L'aube s'est levée. Les morts ont été annoncés.
                </span>
                <button
                  onClick={() => handleHostAction('START_DAY_DEBATE', { duration: 180 })}
                  className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-amber-950 flex items-center gap-2"
                >
                  <Sun className="w-4 h-4" />
                  <span>Ouvrir le Débat du Village</span>
                </button>
              </div>
            )}

            {room.phase === 'DAY_DEBATE' && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-zinc-400">
                  Débattez avant le vote d'élimination.
                </span>
                <button
                  onClick={() => handleHostAction('START_VOTING')}
                  className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-red-950 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Passer au Vote Maintenant</span>
                </button>
              </div>
            )}

            {room.phase === 'DAY_VOTE' && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-zinc-400">
                  Le vote se clôt automatiquement quand tout le monde a voté.
                </span>
                <button
                  onClick={() => handleHostAction('CLOSE_VOTING')}
                  className="px-6 py-3.5 bg-red-700 hover:bg-red-600 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-red-950 flex items-center gap-2"
                >
                  <Skull className="w-4 h-4" />
                  <span>Clore le vote et exécuter</span>
                </button>
              </div>
            )}

            {room.phase === 'DAY_EXECUTION' && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-zinc-400">
                  Sentence rendue. Prêt pour la tombée de la nuit.
                </span>
                <button
                  onClick={() => handleHostAction('START_NIGHT')}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-indigo-950 flex items-center gap-2"
                >
                  <Moon className="w-4 h-4" />
                  <span>La nuit tombe (Nuit suivante)</span>
                </button>
              </div>
            )}

            {room.phase === 'GAME_OVER' && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-zinc-400">
                  Fin de la partie.
                </span>
                <button
                  onClick={() => handleHostAction('RESTART_GAME')}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-emerald-950 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Nouvelle Partie (Garder les Joueurs)</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: PLAYERS ROSTER & HISTORY (3 cols) */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h3 className="font-gothic font-bold text-sm text-amber-200 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Villageois ({playersList.length})</span>
              </h3>
              <span className="text-[10px] text-zinc-400 font-semibold">
                {alivePlayers.length} vivants
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px]">
              <PlayerRoster
                room={room}
                onKickPlayer={(pid) => handleHostAction('KICK_PLAYER', { playerId: pid })}
              />
            </div>
          </div>
        </section>
      </main>

      {/* MODALS */}
      {showBotRunner && (
        <BotRunnerModal
          room={room}
          onClose={() => setShowBotRunner(false)}
          onRefreshRoom={() => {
            syncService.getRoom(room.code).then((r) => r && setRoom(r));
          }}
        />
      )}

      {showGuide && <TeacherGuideModal onClose={() => setShowGuide(false)} />}
      {showRules && <FirebaseRulesModal onClose={() => setShowRules(false)} />}

      {showConfig && (
        <GameConfigModal
          room={room}
          onClose={() => setShowConfig(false)}
          onSaveConfig={(mode, config) => {
            handleHostAction('SET_GAME_MODE', { mode });
            handleHostAction('UPDATE_CONFIG', { rolesConfig: config });
          }}
        />
      )}

      {showAudio && <AudioSettingsModal onClose={() => setShowAudio(false)} />}

      {showTimeline && (
        <EventTimelineDrawer
          events={room.timeline || []}
          onClose={() => setShowTimeline(false)}
        />
      )}

      {showTraining && <TrainingModeModal onClose={() => setShowTraining(false)} />}
    </div>
  );
};
