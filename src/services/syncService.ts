import { GameRoom, RoleType } from '../types/game';

type RoomListener = (room: GameRoom) => void;

export interface StreamAuthOptions {
  playerId?: string;
  token?: string;
  isHost?: boolean;
  hostToken?: string;
}

class SyncService {
  private activeStreams: Record<string, EventSource> = {};
  private broadcastChannels: Record<string, BroadcastChannel> = {};
  private listeners: Record<string, Set<RoomListener>> = {};

  private getBroadcastChannel(code: string): BroadcastChannel | null {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return null;
    if (!this.broadcastChannels[code]) {
      const bc = new BroadcastChannel(`loup_garou_${code}`);
      bc.onmessage = (event) => {
        if (event.data?.room) {
          this.notifyListeners(code, event.data.room);
        }
      };
      this.broadcastChannels[code] = bc;
    }
    return this.broadcastChannels[code];
  }

  private notifyListeners(code: string, room: GameRoom) {
    if (this.listeners[code]) {
      this.listeners[code].forEach((cb) => cb(room));
    }
  }

  public listenRoom(
    code: string,
    callback: RoomListener,
    authOptions?: StreamAuthOptions
  ): () => void {
    const upperCode = code.toUpperCase();
    if (!this.listeners[upperCode]) {
      this.listeners[upperCode] = new Set();
    }
    this.listeners[upperCode].add(callback);

    // Initial fetch
    this.getRoom(upperCode, authOptions).then((room) => {
      if (room) callback(room);
    });

    // Start SSE stream
    if (typeof window !== 'undefined') {
      const streamKey = `${upperCode}_${authOptions?.playerId || 'host'}_${authOptions?.isHost ? 'h' : 'p'}`;

      if (this.activeStreams[streamKey]) {
        try {
          this.activeStreams[streamKey].close();
        } catch {}
      }

      try {
        const query = new URLSearchParams();
        if (authOptions?.playerId) query.set('playerId', authOptions.playerId);
        if (authOptions?.token) query.set('token', authOptions.token);
        if (authOptions?.isHost) query.set('isHost', 'true');
        if (authOptions?.hostToken) query.set('hostToken', authOptions.hostToken);

        const qs = query.toString() ? `?${query.toString()}` : '';
        const stream = new EventSource(`/api/rooms/${upperCode}/stream${qs}`);

        stream.onmessage = (event) => {
          try {
            const room: GameRoom = JSON.parse(event.data);
            this.notifyListeners(upperCode, room);
            const bc = this.getBroadcastChannel(upperCode);
            bc?.postMessage({ room });
          } catch (e) {
            console.error('Error parsing room stream data', e);
          }
        };

        this.activeStreams[streamKey] = stream;
      } catch (err) {
        console.warn('SSE not available, falling back to polling/BroadcastChannel', err);
      }
    }

    this.getBroadcastChannel(upperCode);

    return () => {
      if (this.listeners[upperCode]) {
        this.listeners[upperCode].delete(callback);
      }
    };
  }

  public async createRoom(
    hostName: string = 'Meneur',
    gameMode: string = 'CLASSIC',
    maxPlayers: number = 18
  ): Promise<{ room: GameRoom; hostId: string; hostToken: string }> {
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName, gameMode, maxPlayers }),
    });
    if (!res.ok) throw new Error('Échec de la création de la salle');
    const data = await res.json();
    this.saveHostSession(data.room.code, data.hostId, data.hostToken);
    return data;
  }

  public async getRoom(code: string, auth?: StreamAuthOptions): Promise<GameRoom | null> {
    const upperCode = code.toUpperCase();
    try {
      const query = new URLSearchParams();
      if (auth?.playerId) query.set('playerId', auth.playerId);
      if (auth?.token) query.set('token', auth.token);
      if (auth?.isHost) query.set('isHost', 'true');
      if (auth?.hostToken) query.set('hostToken', auth.hostToken);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await fetch(`/api/rooms/${upperCode}${qs}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.room;
    } catch {
      return null;
    }
  }

  public async joinRoom(
    code: string,
    name: string,
    existingId?: string,
    existingToken?: string,
    avatar?: string
  ): Promise<{ player: any; playerToken: string; room: GameRoom }> {
    const upperCode = code.toUpperCase();
    const res = await fetch(`/api/rooms/${upperCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        playerId: existingId,
        playerToken: existingToken,
        avatar,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Impossible de rejoindre');
    this.savePlayerSession(upperCode, data.player.id, data.player.name, data.playerToken);
    return data;
  }

  public async performHostAction(
    code: string,
    action: string,
    payload?: any
  ): Promise<GameRoom> {
    const upperCode = code.toUpperCase();
    const hostSession = this.getStoredHostSession();
    const hostToken = hostSession?.roomCode === upperCode ? hostSession.hostToken : undefined;

    const res = await fetch(`/api/rooms/${upperCode}/host`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(hostToken ? { 'x-host-token': hostToken } : {}),
      },
      body: JSON.stringify({ action, payload, hostToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur action meneur');
    return data.room;
  }

  public async performPlayerAction(
    code: string,
    playerId: string,
    actionType: string,
    payload?: {
      targetId?: string;
      lovers?: [string, string];
      heal?: boolean;
      poisonTargetId?: string;
    }
  ): Promise<GameRoom> {
    const upperCode = code.toUpperCase();
    const playerSession = this.getStoredPlayerSession();
    const playerToken = playerSession?.playerId === playerId ? playerSession.playerToken : undefined;

    const res = await fetch(`/api/rooms/${upperCode}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(playerToken ? { 'x-player-token': playerToken } : {}),
      },
      body: JSON.stringify({ playerId, playerToken, actionType, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur action joueur');
    return data.room;
  }

  public async simulateBots(code: string, count: number = 6): Promise<GameRoom> {
    const upperCode = code.toUpperCase();
    const res = await fetch(`/api/rooms/${upperCode}/bots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur simulation bots');
    return data.room;
  }

  // Session persistence for Host
  public saveHostSession(roomCode: string, hostId: string, hostToken: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        'werewolf_host_session',
        JSON.stringify({ roomCode, hostId, hostToken, savedAt: Date.now() })
      );
    } catch {}
  }

  public getStoredHostSession(): { roomCode: string; hostId: string; hostToken: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('werewolf_host_session');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Session persistence for Player
  public savePlayerSession(roomCode: string, playerId: string, playerName: string, playerToken?: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        'werewolf_player_session',
        JSON.stringify({ roomCode, playerId, playerName, playerToken, savedAt: Date.now() })
      );
    } catch {}
  }

  public getStoredPlayerSession(): {
    roomCode: string;
    playerId: string;
    playerName: string;
    playerToken?: string;
  } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('werewolf_player_session');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public clearPlayerSession() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('werewolf_player_session');
    } catch {}
  }

  public clearHostSession() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('werewolf_host_session');
    } catch {}
  }
}

export const syncService = new SyncService();
