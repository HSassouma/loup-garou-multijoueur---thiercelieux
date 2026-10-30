import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GameRoom, Player, RoleType, GamePhase, GameMode, TimelineEvent } from './src/types/game.ts';
import {
  getRecommendedRoleConfig,
  shuffleAndAssignRoles,
  getNextNightPhase,
  resolveWerewolfVictim,
  resolveNightActions,
  tallyVotes,
  checkWinCondition,
} from './src/game/rules.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory store of active game rooms
const rooms: Record<string, GameRoom> = {};

// SSE client tracking with authorization context
interface SseClient {
  res: Response;
  playerId?: string;
  token?: string;
  isHost?: boolean;
  hostToken?: string;
}

const sseClients: Record<string, Set<SseClient>> = {};
const debateTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Server-side State Sanitizer:
 * Strictly prevents secret information leaks to unauthorized clients.
 * - Host receives projector-safe view (player roles masked during active play to prevent accidental leaks)
 * - Players receive ONLY their own secret role (fellow werewolves see each other's wolf role)
 * - Night actions (wolf target, seer inspection, witch potion) are hidden from unauthorized players
 * - Spectators and public viewers receive strictly sanitized state
 */
export function sanitizeRoomForClient(
  room: GameRoom,
  client: { playerId?: string; token?: string; isHost?: boolean; hostToken?: string } = {}
): GameRoom {
  const safeRoom = JSON.parse(JSON.stringify(room)) as GameRoom;
  delete safeRoom.hostToken;

  // When game is over, reveal all roles and ending status
  if (safeRoom.phase === 'GAME_OVER') {
    Object.keys(safeRoom.players).forEach((pid) => {
      delete safeRoom.players[pid].token;
    });
    return safeRoom;
  }

  const isHostAuthed = client.isHost && (client.hostToken === room.hostToken || client.hostToken === room.hostId);

  if (isHostAuthed) {
    // Projector-safe view for Host:
    // Never expose player secret roles during active play on shared screens
    Object.keys(safeRoom.players).forEach((pid) => {
      delete safeRoom.players[pid].token;
      delete safeRoom.players[pid].role;
      delete safeRoom.players[pid].team;
    });

    safeRoom.nightState.werewolfVotes = {};
    delete safeRoom.nightState.werewolfTargetId;
    delete safeRoom.nightState.seerInspectedId;
    delete safeRoom.nightState.seerInspectedRole;
    delete safeRoom.nightState.salvateurTargetId;
    delete safeRoom.nightState.lastSalvateurTargetId;
    delete safeRoom.nightState.corbeauTargetId;
    delete safeRoom.nightState.witchHealDecision;
    delete safeRoom.nightState.witchPoisonTargetId;

    if (safeRoom.phase.startsWith('NIGHT')) {
      safeRoom.nightState.casualties = [];
    }
    return safeRoom;
  }

  // If authenticated player
  if (client.playerId && safeRoom.players[client.playerId]) {
    const requester = room.players[client.playerId];
    const requesterRole = requester.role;
    const requesterIsWolf = requesterRole === 'LOUP_GAROU';
    const requesterIsLover = !!requester.isLover;
    const requesterIsSeer = requesterRole === 'VOYANTE';
    const requesterIsWitch = requesterRole === 'SORCIERE';

    Object.keys(safeRoom.players).forEach((pid) => {
      delete safeRoom.players[pid].token;

      if (pid === client.playerId) {
        // Requesting player keeps their own private role and team
        return;
      }

      const other = room.players[pid];
      // Fellow werewolves can see other werewolves
      if (requesterIsWolf && other.role === 'LOUP_GAROU') {
        // keep role for fellow wolf
      } else {
        delete safeRoom.players[pid].role;
        delete safeRoom.players[pid].team;
      }

      // Lovers see only their partner as lover
      if (!requesterIsLover || !other.isLover) {
        delete safeRoom.players[pid].isLover;
      }
    });

    // Sanitize night actions according to role
    if (!requesterIsWolf) {
      safeRoom.nightState.werewolfVotes = {};
      delete safeRoom.nightState.werewolfTargetId;
    }

    if (!requesterIsSeer) {
      delete safeRoom.nightState.seerInspectedId;
      delete safeRoom.nightState.seerInspectedRole;
    }

    // Witch only sees wolf target during Witch night phase if heal potion is available
    if (!requesterIsWitch || safeRoom.phase !== 'NIGHT_WITCH') {
      delete safeRoom.nightState.werewolfTargetId;
      delete safeRoom.nightState.witchHealDecision;
      delete safeRoom.nightState.witchPoisonTargetId;
    }

    if (safeRoom.phase.startsWith('NIGHT')) {
      safeRoom.nightState.casualties = [];
    }

    return safeRoom;
  }

  // Spectator / public access (no secret roles or private actions)
  Object.keys(safeRoom.players).forEach((pid) => {
    delete safeRoom.players[pid].token;
    delete safeRoom.players[pid].role;
    delete safeRoom.players[pid].team;
    delete safeRoom.players[pid].isLover;
  });

  safeRoom.nightState.werewolfVotes = {};
  delete safeRoom.nightState.werewolfTargetId;
  delete safeRoom.nightState.seerInspectedId;
  delete safeRoom.nightState.seerInspectedRole;
  delete safeRoom.nightState.salvateurTargetId;
  delete safeRoom.nightState.lastSalvateurTargetId;
  delete safeRoom.nightState.corbeauTargetId;
  delete safeRoom.nightState.cupidLovers;
  delete safeRoom.nightState.witchHealDecision;
  delete safeRoom.nightState.witchPoisonTargetId;

  if (safeRoom.phase.startsWith('NIGHT')) {
    safeRoom.nightState.casualties = [];
  }

  return safeRoom;
}

function broadcastRoom(code: string) {
  const room = rooms[code];
  if (!room) return;
  const clients = sseClients[code];
  if (!clients || clients.size === 0) return;

  clients.forEach((client) => {
    try {
      const sanitized = sanitizeRoomForClient(room, client);
      client.res.write(`data: ${JSON.stringify(sanitized)}\n\n`);
    } catch {
      clients.delete(client);
    }
  });
}

function addTimelineEvent(room: GameRoom, message: string, isPublic: boolean = true) {
  const event: TimelineEvent = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    phase: room.phase,
    message,
    isPublic,
  };
  room.timeline.unshift(event);
  if (room.timeline.length > 50) room.timeline.pop();
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

function startDebateTimer(code: string) {
  stopDebateTimer(code);
  const room = rooms[code];
  if (!room) return;

  room.dayState.isTimerRunning = true;
  debateTimers[code] = setInterval(() => {
    const current = rooms[code];
    if (!current || current.phase !== 'DAY_DEBATE') {
      stopDebateTimer(code);
      return;
    }

    if (current.isPaused) return;

    if (current.dayState.timerSeconds > 0) {
      current.dayState.timerSeconds -= 1;
      broadcastRoom(code);
    } else {
      current.dayState.isTimerRunning = false;
      stopDebateTimer(code);
      current.phase = 'DAY_VOTE';
      current.dayState.votes = {};
      current.narratorText = 'Le temps de débat est écoulé ! Place au vote populaire.';
      addTimelineEvent(current, 'Fin du temps de débat. Début du vote.', true);
      broadcastRoom(code);
    }
  }, 1000);
}

function stopDebateTimer(code: string) {
  if (debateTimers[code]) {
    clearInterval(debateTimers[code]);
    delete debateTimers[code];
  }
}

// ---------------------------------------------------------------------------
// REST ENDPOINTS
// ---------------------------------------------------------------------------

// 1. Create Room (Host Space)
app.post('/api/rooms/create', (req: Request, res: Response) => {
  const { hostName = 'Meneur', gameMode = 'CLASSIC', maxPlayers = 18 } = req.body;
  const code = generateRoomCode();
  const hostId = `host_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const hostToken = `htok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const debateDuration = gameMode === 'RAPID' ? 60 : 180;

  const room: GameRoom = {
    code,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    phase: 'LOBBY',
    gameMode: gameMode as GameMode,
    maxPlayers: Number(maxPlayers) || 18,
    isPaused: false,
    players: {},
    hostId,
    hostToken,
    rolesConfig: getRecommendedRoleConfig(6, gameMode as GameMode),
    nightState: {
      nightNumber: 0,
      werewolfVotes: {},
      witchHealAvailable: true,
      witchPoisonAvailable: true,
      casualties: [],
      hunterPending: false,
    },
    dayState: {
      dayNumber: 0,
      timerSeconds: debateDuration,
      timerTotal: debateDuration,
      isTimerRunning: false,
      votes: {},
      penaltyVotes: {},
    },
    narratorText: 'La salle est ouverte. Invitez les joueurs avec le QR code ou le code de salle.',
    history: ['Salle créée par le Meneur.'],
    timeline: [],
  };

  addTimelineEvent(room, `Salle créée (Mode: ${gameMode})`, true);
  rooms[code] = room;

  res.json({
    success: true,
    room: sanitizeRoomForClient(room, { isHost: true, hostToken }),
    hostId,
    hostToken,
  });
});

// 2. Get Room State (Securely Sanitized)
app.get('/api/rooms/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const room = rooms[code];
  if (!room) {
    return res.status(404).json({ error: 'Salle introuvable' });
  }

  const playerId = req.query.playerId as string | undefined;
  const token = (req.query.token as string | undefined) || (req.headers['x-player-token'] as string | undefined);
  const isHost = req.query.isHost === 'true' || req.query.hostId === room.hostId;
  const hostToken = (req.query.hostToken as string | undefined) || (req.headers['x-host-token'] as string | undefined) || (req.query.hostId as string | undefined);

  const sanitized = sanitizeRoomForClient(room, {
    playerId,
    token,
    isHost,
    hostToken,
  });

  res.json({ room: sanitized });
});

// 3. Dedicated Spectator Endpoint
app.get('/api/rooms/:code/spectator', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const room = rooms[code];
  if (!room) {
    return res.status(404).json({ error: 'Salle introuvable' });
  }
  res.json({ room: sanitizeRoomForClient(room, {}) });
});

// 4. Join Room (Player Space)
app.post('/api/rooms/:code/join', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { name, playerId: existingId, playerToken: existingToken, avatar } = req.body;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ error: 'Salle introuvable' });
  }

  // A. Reconnection by existing playerId
  if (existingId && room.players[existingId]) {
    const existing = room.players[existingId];
    existing.lastActiveAt = Date.now();
    existing.isConnected = true;
    if (avatar) existing.avatar = avatar;

    addTimelineEvent(room, `${existing.name} s'est reconnecté.`, true);
    broadcastRoom(code);

    return res.json({
      success: true,
      player: existing,
      playerToken: existing.token,
      room: sanitizeRoomForClient(room, { playerId: existing.id, token: existing.token }),
    });
  }

  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    return res.status(400).json({ error: 'Le pseudo ne peut pas être vide' });
  }

  // B. Mid-game reconnection by name
  if (room.phase !== 'LOBBY') {
    const matched = Object.values(room.players).find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (matched) {
      matched.lastActiveAt = Date.now();
      matched.isConnected = true;
      addTimelineEvent(room, `${matched.name} a repris sa place dans la partie.`, true);
      broadcastRoom(code);

      return res.json({
        success: true,
        player: matched,
        playerToken: matched.token,
        room: sanitizeRoomForClient(room, { playerId: matched.id, token: matched.token }),
      });
    }
    return res.status(403).json({ error: 'La partie a déjà commencé. Impossible de rejoindre un village en cours.' });
  }

  // C. Capacity Check
  const currentCount = Object.keys(room.players).length;
  const maxCap = room.maxPlayers || 18;
  if (currentCount >= maxCap) {
    return res.status(400).json({ error: `La salle a atteint sa capacité maximale (${maxCap} joueurs)` });
  }

  // D. Duplicate Name Check
  const nameTaken = Object.values(room.players).some(
    (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (nameTaken) {
    return res.status(400).json({ error: 'Ce pseudo est déjà utilisé dans la salle. Choisis un autre prénom.' });
  }

  // E. New Player Creation
  const newId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newToken = `ptok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const newPlayer: Player = {
    id: newId,
    name: trimmedName,
    avatar: avatar || '👤',
    isAlive: true,
    isHost: false,
    hasViewedCard: false,
    token: newToken,
    isConnected: true,
    connectedAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  room.players[newId] = newPlayer;
  room.updatedAt = Date.now();

  const newCount = Object.keys(room.players).length;
  if (room.gameMode !== 'CUSTOM') {
    room.rolesConfig = getRecommendedRoleConfig(newCount, room.gameMode);
  }

  addTimelineEvent(room, `${trimmedName} a rejoint le village.`, true);
  broadcastRoom(code);

  res.json({
    success: true,
    player: newPlayer,
    playerToken: newToken,
    room: sanitizeRoomForClient(room, { playerId: newId, token: newToken }),
  });
});

// 5. Host Actions (Admin Control Center)
app.post('/api/rooms/:code/host', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { action, payload, hostToken } = req.body;
  const reqHostToken = hostToken || (req.headers['x-host-token'] as string);
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ error: 'Salle introuvable' });
  }

  // Verify host authorization
  if (reqHostToken && reqHostToken !== room.hostToken && reqHostToken !== room.hostId) {
    return res.status(403).json({ error: 'Autorisation Meneur requise' });
  }

  switch (action) {
    case 'DISTRIBUTE_ROLES': {
      const pids = Object.keys(room.players);
      if (pids.length < 4) {
        return res.status(400).json({ error: 'Il faut au moins 4 joueurs pour lancer la partie' });
      }

      const assignments = shuffleAndAssignRoles(pids, room.rolesConfig);
      pids.forEach((pid) => {
        room.players[pid].role = assignments[pid].role;
        room.players[pid].team = assignments[pid].team;
        room.players[pid].hasViewedCard = false;
        room.players[pid].isAlive = true;
      });

      room.phase = 'ROLE_REVEAL';
      room.startedAt = Date.now();
      room.narratorText = 'Les rôles ont été distribués. Chaque joueur doit regarder sa carte secrète sur son smartphone.';
      addTimelineEvent(room, `Distribution des cartes secrètes à ${pids.length} joueurs.`, true);
      break;
    }

    case 'START_NIGHT': {
      stopDebateTimer(code);
      room.nightState.nightNumber += 1;
      room.nightState.werewolfVotes = {};
      room.nightState.werewolfTargetId = undefined;
      room.nightState.salvateurTargetId = undefined;
      room.nightState.corbeauTargetId = undefined;
      room.nightState.witchHealDecision = undefined;
      room.nightState.witchPoisonTargetId = undefined;
      room.nightState.casualties = [];
      room.nightState.hunterPending = false;

      room.phase = getNextNightPhase('ROLE_REVEAL', room.players, room.nightState.nightNumber);

      if (room.phase === 'NIGHT_CUPID') {
        room.narratorText = 'La nuit tombe sur Thiercelieux... Cupidon se réveille et désigne deux amoureux.';
      } else if (room.phase === 'NIGHT_SALVATEUR') {
        room.narratorText = 'La nuit tombe... Le Salvateur s’éveille pour protéger un villageois.';
      } else if (room.phase === 'NIGHT_SEER') {
        room.narratorText = 'La nuit tombe sur Thiercelieux... La Voyante se réveille et sonde un joueur.';
      } else if (room.phase === 'NIGHT_WEREWOLVES') {
        room.narratorText = 'La nuit tombe sur Thiercelieux... Les Loups-Garous ouvrent les yeux et cherchent une proie.';
      } else {
        room.narratorText = 'La nuit tombe sur Thiercelieux... Le village s’endort.';
      }
      addTimelineEvent(room, `Début de la Nuit ${room.nightState.nightNumber}.`, true);
      break;
    }

    case 'ADVANCE_NIGHT_STEP': {
      const next = getNextNightPhase(room.phase, room.players, room.nightState.nightNumber);
      room.phase = next;

      if (next === 'NIGHT_SALVATEUR') {
        room.narratorText = 'Le Salvateur se réveille discrètement pour protéger un villageois.';
      } else if (next === 'NIGHT_SEER') {
        room.narratorText = 'La Voyante se réveille pour percer l’identité d’un suspect.';
      } else if (next === 'NIGHT_WEREWOLVES') {
        room.narratorText = 'La Voyante s’endort. Les Loups-Garous se réveillent et choisissent leur victime.';
      } else if (next === 'NIGHT_WITCH') {
        const aliveWolves = Object.values(room.players)
          .filter((p) => p.isAlive && p.role === 'LOUP_GAROU')
          .map((p) => p.id);
        room.nightState.werewolfTargetId = resolveWerewolfVictim(
          room.nightState.werewolfVotes,
          aliveWolves
        );
        room.narratorText = 'Les Loups-Garous s’endorment repus. La Sorcière se réveille avec ses fioles...';
      } else if (next === 'NIGHT_CORBEAU') {
        room.narratorText = 'Le Corbeau prend son envol pour déposer un message anonyme accusateur...';
      } else if (next === 'DAY_ANNOUNCEMENT') {
        const resolution = resolveNightActions(room.nightState, room.players);
        resolution.casualties.forEach((c) => {
          if (room.players[c.playerId]) {
            room.players[c.playerId].isAlive = false;
          }
        });
        room.nightState.casualties = resolution.casualties;
        room.dayState.dayNumber += 1;

        room.dayState.penaltyVotes = {};
        if (room.nightState.corbeauTargetId) {
          room.dayState.penaltyVotes[room.nightState.corbeauTargetId] = 2;
        }

        if (resolution.hunterTriggered) {
          room.phase = 'HUNTER_SHOT';
          room.nightState.hunterPending = true;
          room.nightState.hunterTriggerSource = 'NIGHT';
          const hunterName = room.players[resolution.hunterPlayerId!]?.name;
          room.narratorText = `Le jour se lève... Le Chasseur ${hunterName} a succombé et doit tirer son ultime cartouche !`;
        } else {
          const win = checkWinCondition(room.players, room.nightState.cupidLovers);
          if (win) {
            room.phase = 'GAME_OVER';
            room.winner = win;
            room.endedAt = Date.now();
            room.narratorText =
              win === 'VILLAGE'
                ? 'Tous les Loups-Garous ont été éliminés ! Le Village triomphe !'
                : win === 'LOUPS'
                ? 'Les Loups-Garous ont submergé le village ! Victoire de la Meute !'
                : 'Les deux Amoureux ont triomphé envers et contre tous !';
            addTimelineEvent(room, `Partie terminée ! Victoire : ${win}`, true);
          } else {
            const deadNames = resolution.casualties
              .map((c) => room.players[c.playerId]?.name)
              .filter(Boolean);
            room.narratorText =
              deadNames.length > 0
                ? `Le village se réveille. Cette nuit, nous pleurons la disparition de : ${deadNames.join(', ')}.`
                : 'Le village se réveille... et miracle ! Personne n’a trouvé la mort cette nuit.';
          }
        }
      }
      break;
    }

    case 'START_DAY_DEBATE': {
      room.phase = 'DAY_DEBATE';
      const duration = payload?.duration || (room.gameMode === 'RAPID' ? 60 : 180);
      room.dayState.timerSeconds = duration;
      room.dayState.timerTotal = duration;
      room.dayState.votes = {};
      room.narratorText = 'Débattez et tentez de démasquer les coupables avant le vote du village !';
      addTimelineEvent(room, `Ouverture du tribunal populaire et débat.`, true);
      startDebateTimer(code);
      break;
    }

    case 'START_VOTING': {
      stopDebateTimer(code);
      room.phase = 'DAY_VOTE';
      room.dayState.votes = {};
      room.narratorText = 'C’est l’heure du vote ! Chaque villageois vivant doit voter pour un suspect sur son mobile.';
      addTimelineEvent(room, 'Ouverture du vote populaire.', true);
      break;
    }

    case 'CLOSE_VOTING': {
      stopDebateTimer(code);
      const aliveVoters = Object.values(room.players)
        .filter((p) => p.isAlive)
        .map((p) => p.id);
      const tally = tallyVotes(room.dayState.votes, aliveVoters, room.dayState.penaltyVotes);

      if (tally.eliminatedId) {
        const victim = room.players[tally.eliminatedId];
        victim.isAlive = false;
        room.dayState.eliminatedPlayerId = victim.id;

        // Lovers cascade
        if (room.nightState.cupidLovers) {
          const [l1, l2] = room.nightState.cupidLovers;
          if (victim.id === l1 && room.players[l2]?.isAlive) {
            room.players[l2].isAlive = false;
            addTimelineEvent(room, `${room.players[l2].name} meurt de chagrin d'amour.`, true);
          } else if (victim.id === l2 && room.players[l1]?.isAlive) {
            room.players[l1].isAlive = false;
            addTimelineEvent(room, `${room.players[l1].name} meurt de chagrin d'amour.`, true);
          }
        }

        if (victim.role === 'CHASSEUR') {
          room.phase = 'HUNTER_SHOT';
          room.nightState.hunterPending = true;
          room.nightState.hunterTriggerSource = 'DAY';
          room.narratorText = `Le village a voté contre ${victim.name} qui est le Chasseur ! Il tire un coup mortel avant d'expirer.`;
        } else {
          room.phase = 'DAY_EXECUTION';
          room.narratorText = `Le village a désigné ${victim.name}. La sentence est exécutée !`;
          const win = checkWinCondition(room.players, room.nightState.cupidLovers);
          if (win) {
            room.phase = 'GAME_OVER';
            room.winner = win;
            room.endedAt = Date.now();
            room.narratorText =
              win === 'VILLAGE'
                ? 'Le village a vaincu tous les loups ! Victoire des Villageois !'
                : win === 'LOUPS'
                ? 'Les Loups-Garous prennent le contrôle total du village !'
                : 'Les Amoureux ont remporté la partie !';
            addTimelineEvent(room, `Partie terminée ! Victoire : ${win}`, true);
          }
        }
      } else if (tally.isTie) {
        room.phase = 'DAY_EXECUTION';
        room.narratorText = 'Égalité parfaite des suffrages ! Le village hésite et personne n’est éliminé aujourd’hui.';
      } else {
        room.phase = 'DAY_EXECUTION';
        room.narratorText = 'Aucun vote n’a été enregistré. Le village s’abstient.';
      }
      break;
    }

    case 'PAUSE_GAME': {
      room.isPaused = true;
      addTimelineEvent(room, 'Partie mise en pause par le meneur.', true);
      break;
    }

    case 'RESUME_GAME': {
      room.isPaused = false;
      addTimelineEvent(room, 'Partie reprise par le meneur.', true);
      break;
    }

    case 'RESTART_GAME': {
      stopDebateTimer(code);
      room.phase = 'LOBBY';
      room.winner = undefined;
      room.startedAt = undefined;
      room.endedAt = undefined;
      room.isPaused = false;
      room.nightState = {
        nightNumber: 0,
        werewolfVotes: {},
        witchHealAvailable: true,
        witchPoisonAvailable: true,
        casualties: [],
        hunterPending: false,
      };
      room.dayState = {
        dayNumber: 0,
        timerSeconds: 180,
        timerTotal: 180,
        isTimerRunning: false,
        votes: {},
        penaltyVotes: {},
      };
      Object.keys(room.players).forEach((pid) => {
        room.players[pid].isAlive = true;
        room.players[pid].hasViewedCard = false;
        room.players[pid].role = undefined;
        room.players[pid].team = undefined;
        room.players[pid].isLover = undefined;
      });
      room.narratorText = 'Nouvelle partie ! Tous les joueurs sont prêts dans le salon.';
      addTimelineEvent(room, 'Nouvelle manche réinitialisée avec les mêmes joueurs.', true);
      break;
    }

    case 'SET_GAME_MODE': {
      if (payload?.mode) {
        room.gameMode = payload.mode;
        room.rolesConfig = getRecommendedRoleConfig(Object.keys(room.players).length, room.gameMode);
        addTimelineEvent(room, `Mode de jeu modifié : ${room.gameMode}`, true);
      }
      break;
    }

    case 'UPDATE_CONFIG': {
      if (payload?.rolesConfig) {
        room.rolesConfig = payload.rolesConfig;
        room.gameMode = 'CUSTOM';
      }
      if (payload?.maxPlayers) {
        room.maxPlayers = Number(payload.maxPlayers);
      }
      break;
    }

    case 'KICK_PLAYER': {
      if (payload?.playerId && room.players[payload.playerId]) {
        const kickedName = room.players[payload.playerId].name;
        delete room.players[payload.playerId];
        addTimelineEvent(room, `${kickedName} a été exclu par le meneur.`, true);
      }
      break;
    }
  }

  room.updatedAt = Date.now();
  broadcastRoom(code);
  res.json({
    success: true,
    room: sanitizeRoomForClient(room, { isHost: true, hostToken: reqHostToken }),
  });
});

// 6. Player Actions (Night, Votes, Inspection)
app.post('/api/rooms/:code/action', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { playerId, playerToken, actionType, targetId, lovers, heal, poisonTargetId } = req.body;
  const room = rooms[code];

  if (!room || !room.players[playerId]) {
    return res.status(404).json({ error: 'Joueur ou salle introuvable' });
  }

  const player = room.players[playerId];

  // Token security check if player has a token
  if (player.token && playerToken && playerToken !== player.token) {
    return res.status(403).json({ error: 'Jeton de session joueur invalide' });
  }

  // Dead player check (except VIEW_CARD or HUNTER_SHOOT)
  if (!player.isAlive && actionType !== 'VIEW_CARD' && actionType !== 'HUNTER_SHOOT') {
    return res.status(403).json({ error: 'Les fantômes ne peuvent pas participer aux actions actives' });
  }

  switch (actionType) {
    case 'VIEW_CARD': {
      player.hasViewedCard = true;
      break;
    }

    case 'CUPID_CHOOSE': {
      if (room.phase === 'NIGHT_CUPID' && player.role === 'CUPIDON' && lovers?.length === 2) {
        room.nightState.cupidLovers = [lovers[0], lovers[1]];
        if (room.players[lovers[0]]) room.players[lovers[0]].isLover = true;
        if (room.players[lovers[1]]) room.players[lovers[1]].isLover = true;
        addTimelineEvent(room, 'Cupidon a décoché ses flèches sur deux amants.', false);
      }
      break;
    }

    case 'SALVATEUR_PROTECT': {
      if (room.phase === 'NIGHT_SALVATEUR' && player.role === 'SALVATEUR' && targetId) {
        if (targetId === room.nightState.lastSalvateurTargetId) {
          return res.status(400).json({ error: 'Tu ne peux pas protéger la même personne 2 nuits de suite' });
        }
        room.nightState.salvateurTargetId = targetId;
        room.nightState.lastSalvateurTargetId = targetId;
        addTimelineEvent(room, 'Le Salvateur a dressé son bouclier magique.', false);
      }
      break;
    }

    case 'SEER_INSPECT': {
      if (room.phase === 'NIGHT_SEER' && player.role === 'VOYANTE' && targetId) {
        room.nightState.seerInspectedId = targetId;
        room.nightState.seerInspectedRole = room.players[targetId]?.role;
        addTimelineEvent(room, 'La Voyante a scruté l’âme d’un villageois.', false);
      }
      break;
    }

    case 'WEREWOLF_VOTE': {
      if (room.phase === 'NIGHT_WEREWOLVES' && player.role === 'LOUP_GAROU' && targetId) {
        room.nightState.werewolfVotes[playerId] = targetId;
      }
      break;
    }

    case 'WITCH_DECISION': {
      if (room.phase === 'NIGHT_WITCH' && player.role === 'SORCIERE') {
        if (heal !== undefined && room.nightState.witchHealAvailable) {
          room.nightState.witchHealDecision = heal;
        }
        if (poisonTargetId !== undefined && room.nightState.witchPoisonAvailable) {
          room.nightState.witchPoisonTargetId = poisonTargetId;
        }
        addTimelineEvent(room, 'La Sorcière a manipulé ses fioles alchimiques.', false);
      }
      break;
    }

    case 'CORBEAU_HEX': {
      if (room.phase === 'NIGHT_CORBEAU' && player.role === 'CORBEAU' && targetId) {
        room.nightState.corbeauTargetId = targetId;
        addTimelineEvent(room, 'Le Corbeau a désigné sa cible.', false);
      }
      break;
    }

    case 'HUNTER_SHOOT': {
      if (room.phase === 'HUNTER_SHOT' && player.role === 'CHASSEUR' && targetId) {
        const victim = room.players[targetId];
        if (victim && victim.isAlive) {
          victim.isAlive = false;
          addTimelineEvent(room, `${player.name} (Chasseur) emporte ${victim.name} avec son fusil.`, true);

          if (room.nightState.cupidLovers) {
            const [l1, l2] = room.nightState.cupidLovers;
            if (victim.id === l1 && room.players[l2]?.isAlive) {
              room.players[l2].isAlive = false;
            } else if (victim.id === l2 && room.players[l1]?.isAlive) {
              room.players[l1].isAlive = false;
            }
          }

          const win = checkWinCondition(room.players, room.nightState.cupidLovers);
          if (win) {
            room.phase = 'GAME_OVER';
            room.winner = win;
            room.endedAt = Date.now();
          } else {
            room.phase = room.nightState.hunterTriggerSource === 'NIGHT' ? 'DAY_DEBATE' : 'DAY_EXECUTION';
          }
        }
      }
      break;
    }

    case 'DAY_VOTE': {
      if (room.phase === 'DAY_VOTE' && player.isAlive && targetId) {
        room.dayState.votes[playerId] = targetId;

        const aliveCount = Object.values(room.players).filter((p) => p.isAlive).length;
        const votedCount = Object.keys(room.dayState.votes).length;

        // Auto-tally when all living players voted
        if (votedCount >= aliveCount) {
          setTimeout(() => {
            const aliveVoters = Object.values(room.players)
              .filter((p) => p.isAlive)
              .map((p) => p.id);
            const tally = tallyVotes(room.dayState.votes, aliveVoters, room.dayState.penaltyVotes);

            if (tally.eliminatedId) {
              const victim = room.players[tally.eliminatedId];
              victim.isAlive = false;
              room.dayState.eliminatedPlayerId = victim.id;

              if (victim.role === 'CHASSEUR') {
                room.phase = 'HUNTER_SHOT';
                room.nightState.hunterPending = true;
                room.nightState.hunterTriggerSource = 'DAY';
                room.narratorText = `Le village a désigné le Chasseur ${victim.name} ! Il doit tirer son ultime cartouche.`;
              } else {
                const win = checkWinCondition(room.players, room.nightState.cupidLovers);
                if (win) {
                  room.phase = 'GAME_OVER';
                  room.winner = win;
                  room.endedAt = Date.now();
                } else {
                  room.phase = 'DAY_EXECUTION';
                }
              }
            } else {
              room.phase = 'DAY_EXECUTION';
            }
            broadcastRoom(code);
          }, 800);
        }
      }
      break;
    }
  }

  room.updatedAt = Date.now();
  broadcastRoom(code);
  res.json({
    success: true,
    room: sanitizeRoomForClient(room, { playerId, token: player.token }),
  });
});

// 7. Bots QA Simulator Endpoint
app.post('/api/rooms/:code/bots', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const { count = 6, names } = req.body;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ error: 'Salle introuvable' });
  }

  const defaultNames = [
    'Alice',
    'Bilal',
    'Chloé',
    'Driss',
    'Emma',
    'Farid',
    'Gabriel',
    'Hajar',
    'Inès',
    'Julien',
    'Karim',
    'Léa',
    'Mehdi',
    'Nora',
    'Othmane',
  ];
  const botNames = names || defaultNames.slice(0, count);

  botNames.forEach((name: string) => {
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    room.players[botId] = {
      id: botId,
      name,
      avatar: '🤖',
      isAlive: true,
      isHost: false,
      hasViewedCard: true,
      isBot: true,
      isConnected: true,
      connectedAt: Date.now(),
      lastActiveAt: Date.now(),
    };
  });

  if (room.gameMode !== 'CUSTOM') {
    room.rolesConfig = getRecommendedRoleConfig(Object.keys(room.players).length, room.gameMode);
  }
  room.updatedAt = Date.now();
  addTimelineEvent(room, `${botNames.length} bots ont rejoint la salle.`, true);
  broadcastRoom(code);

  res.json({ success: true, room: sanitizeRoomForClient(room, { isHost: true }) });
});

// 8. Real-time SSE Stream (Personalized & Authoritative)
app.get('/api/rooms/:code/stream', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const room = rooms[code];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const playerId = req.query.playerId as string | undefined;
  const token = req.query.token as string | undefined;
  const isHost = req.query.isHost === 'true' || (room && req.query.hostId === room.hostId);
  const hostToken = req.query.hostToken as string | undefined;

  const client: SseClient = {
    res,
    playerId,
    token,
    isHost,
    hostToken,
  };

  if (!sseClients[code]) {
    sseClients[code] = new Set();
  }
  sseClients[code].add(client);

  // If a player connects, mark online
  if (room && playerId && room.players[playerId]) {
    room.players[playerId].isConnected = true;
    room.players[playerId].lastActiveAt = Date.now();
    broadcastRoom(code);
  }

  // Send initial personalized state
  if (room) {
    const sanitized = sanitizeRoomForClient(room, client);
    res.write(`data: ${JSON.stringify(sanitized)}\n\n`);
  }

  req.on('close', () => {
    if (sseClients[code]) {
      sseClients[code].delete(client);

      // Check if player has other active streams
      if (room && playerId && room.players[playerId]) {
        let hasOther = false;
        sseClients[code].forEach((c) => {
          if (c.playerId === playerId) hasOther = true;
        });
        if (!hasOther) {
          room.players[playerId].isConnected = false;
          broadcastRoom(code);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// SERVER START & SPA FALLBACK
// ---------------------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Loup-Garou Master Server running on port ${PORT}`);
  });
}

// Only launch standalone server if executed directly as entrypoint (not when imported in unit tests)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js')
);

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, rooms, generateRoomCode };
