import React, { useState, useEffect } from 'react';
import { HostDashboard } from './components/host/HostDashboard';
import { PlayerView } from './components/player/PlayerView';
import { SpectatorScreen } from './components/spectator/SpectatorScreen';
import { Tv, Smartphone, Columns, Eye, Crown, Users, Sparkles } from 'lucide-react';

export type RouteType = 'home' | 'admin' | 'join' | 'room' | 'player' | 'spectator' | 'splitscreen';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<RouteType>('home');
  const [roomCode, setRoomCode] = useState<string>('');
  const [paramPlayerId, setParamPlayerId] = useState<string>('');

  // Synchronize route from current URL
  const parseCurrentUrl = () => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname.replace(/\/+$/, '');
    const searchParams = new URLSearchParams(window.location.search);

    const querySalle = searchParams.get('salle') || searchParams.get('code');
    const queryMode = searchParams.get('mode');

    // Backward compatibility for ?salle=ABCD&mode=...
    if (querySalle) {
      setRoomCode(querySalle.toUpperCase());
    }

    if (queryMode === 'spectator') {
      setCurrentRoute('spectator');
      return;
    } else if (queryMode === 'player') {
      setCurrentRoute('player');
      return;
    } else if (queryMode === 'splitscreen') {
      setCurrentRoute('splitscreen');
      return;
    }

    // Pathname routing
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      if (querySalle) {
        setCurrentRoute('join');
      } else {
        setCurrentRoute('home');
      }
      return;
    }

    const firstSegment = segments[0].toLowerCase();

    if (firstSegment === 'admin') {
      setCurrentRoute('admin');
      if (segments[1]) setRoomCode(segments[1].toUpperCase());
    } else if (firstSegment === 'join') {
      setCurrentRoute('join');
      if (querySalle) setRoomCode(querySalle.toUpperCase());
      if (segments[1]) setRoomCode(segments[1].toUpperCase());
    } else if (firstSegment === 'room') {
      setCurrentRoute('room');
      if (segments[1]) setRoomCode(segments[1].toUpperCase());
    } else if (firstSegment === 'player') {
      setCurrentRoute('player');
      if (segments[1]) setParamPlayerId(segments[1]);
    } else if (firstSegment === 'spectator') {
      setCurrentRoute('spectator');
      if (segments[1]) setRoomCode(segments[1].toUpperCase());
    } else if (firstSegment === 'splitscreen') {
      setCurrentRoute('splitscreen');
    } else {
      setCurrentRoute('home');
    }
  };

  useEffect(() => {
    parseCurrentUrl();

    const handlePopState = () => {
      parseCurrentUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      parseCurrentUrl();
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d14] text-white">
      {/* 1. HOME LANDING PORTAL (When accessing / without params) */}
      {currentRoute === 'home' && (
        <div className="min-h-screen night-sky-gradient flex flex-col justify-center items-center px-4 py-12 text-white">
          <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-center">
            {/* Logo */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-950 via-zinc-900 to-amber-950 border border-amber-600/40 flex items-center justify-center text-4xl shadow-xl shadow-red-950/40 mx-auto mb-4">
              🐺
            </div>

            <h1 className="text-3xl font-black font-gothic tracking-wide text-amber-200 mb-1">
              Les Loups-Garous
            </h1>
            <p className="text-xs text-amber-500/80 uppercase tracking-widest font-semibold mb-6">
              de Thiercelieux — Multijoueur Réel
            </p>

            <p className="text-xs text-zinc-400 mb-8 leading-relaxed max-w-sm mx-auto">
              Bienvenue dans le village de Thiercelieux. Choisissez votre espace pour commencer ou rejoindre une partie en temps réel.
            </p>

            <div className="space-y-4">
              {/* Button: Host Admin Space */}
              <button
                onClick={() => navigate('/admin')}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold transition-all shadow-xl shadow-amber-950/60 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/20">
                    <Crown className="w-6 h-6 text-amber-200" />
                  </div>
                  <div>
                    <div className="font-gothic text-base font-bold text-white group-hover:text-amber-100">
                      Espace Maître du Jeu
                    </div>
                    <div className="text-[11px] text-amber-200/70 font-normal">
                      Créer une salle & projeter sur grand écran (/admin)
                    </div>
                  </div>
                </div>
                <span className="text-xl">➔</span>
              </button>

              {/* Button: Player Space */}
              <button
                onClick={() => navigate('/join')}
                className="w-full p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800/90 border border-zinc-700 hover:border-zinc-500 text-white font-bold transition-all shadow-lg flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700">
                    <Smartphone className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-gothic text-base font-bold text-white group-hover:text-emerald-300">
                      Espace Joueur
                    </div>
                    <div className="text-[11px] text-zinc-400 font-normal">
                      Rejoindre une salle avec son smartphone (/join)
                    </div>
                  </div>
                </div>
                <span className="text-xl text-zinc-500 group-hover:text-white">➔</span>
              </button>

              {/* Quick Split-Screen Testing link */}
              <button
                onClick={() => navigate('/splitscreen')}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-950/30 hover:bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Mode Test Double Écran (Meneur + Mobile)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DEDICATED ADMIN SPACE (/admin & /admin/:code) */}
      {currentRoute === 'admin' && (
        <HostDashboard
          initialCode={roomCode}
          onRoomCodeChange={(code) => {
            setRoomCode(code);
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
              window.history.replaceState({}, '', `/admin/${code}`);
            }
          }}
          onSwitchToPlayer={(code) => {
            setRoomCode(code);
            navigate(`/room/${code}`);
          }}
        />
      )}

      {/* 3. DEDICATED INVITATION & PLAYER SPACE (/join, /room/:code, /player/:playerId) */}
      {(currentRoute === 'join' || currentRoute === 'room' || currentRoute === 'player') && (
        <PlayerView
          initialCode={roomCode}
          onSwitchToHost={() => navigate('/admin')}
        />
      )}

      {/* 4. DEDICATED SPECTATOR SPACE (/spectator/:code) */}
      {currentRoute === 'spectator' && (
        <SpectatorScreen initialCode={roomCode} />
      )}

      {/* 5. MULTI-SCREEN QA TEST SPACE (/splitscreen) */}
      {currentRoute === 'splitscreen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          <div className="overflow-y-auto">
            <HostDashboard
              initialCode={roomCode}
              onRoomCodeChange={(code) => setRoomCode(code)}
            />
          </div>
          <div className="overflow-y-auto bg-black/40">
            <PlayerView initialCode={roomCode} />
          </div>
        </div>
      )}
    </div>
  );
}
