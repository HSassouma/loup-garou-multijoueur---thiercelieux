import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app, rooms } from '../../server.ts';
import { GameRoom, RoleType } from '../types/game.ts';

let server: http.Server;
let port: number;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      port = addr.port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => {
  server?.close();
});

describe('Loup-Garou Master Multiplayer Test Suite', () => {
  let roomCode: string;
  let hostId: string;
  let hostToken: string;

  const players: Array<{
    id: string;
    token: string;
    name: string;
    role?: RoleType;
  }> = [];

  it('1. Host creates a new room with unique code and admin token', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName: 'Maître Du Jeu', gameMode: 'CLASSIC', maxPlayers: 8 }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.room);
    assert.match(data.room.code, /^[A-Z]{4}$/);
    assert.ok(data.hostId);
    assert.ok(data.hostToken);

    roomCode = data.room.code;
    hostId = data.hostId;
    hostToken = data.hostToken;
  });

  it('2. Invalid room codes are strictly rejected with 404', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/ZZZZ`);
    assert.equal(res.status, 404);

    const joinRes = await fetch(`${baseUrl}/api/rooms/ZZZZ/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Imposteur' }),
    });
    assert.equal(joinRes.status, 404);
  });

  it('3. Multiple independent players join from their devices', async () => {
    const playerNames = ['Alice', 'Bilal', 'Chloé', 'David'];
    const avatars = ['🐺', '🧙', '🦉', '🦊'];

    for (let i = 0; i < playerNames.length; i++) {
      const res = await fetch(`${baseUrl}/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerNames[i], avatar: avatars[i] }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.player.id);
      assert.ok(data.playerToken);
      assert.equal(data.player.name, playerNames[i]);
      assert.equal(data.player.avatar, avatars[i]);
      assert.equal(data.player.isConnected, true);

      players.push({
        id: data.player.id,
        token: data.playerToken,
        name: playerNames[i],
      });
    }

    assert.equal(players.length, 4);
  });

  it('4. Duplicate player name is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice' }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /déjà utilisé/i);
  });

  it('5. Host sees all connected players in real time', async () => {
    const res = await fetch(
      `${baseUrl}/api/rooms/${roomCode}?isHost=true&hostToken=${hostToken}`
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    const joinedPlayers = Object.values(data.room.players);
    assert.equal(joinedPlayers.length, 4);

    for (const p of players) {
      const found = joinedPlayers.find((jp: any) => jp.id === p.id) as any;
      assert.ok(found);
      assert.equal(found.isConnected, true);
    }
  });

  it('6. Host starts game and assigns secret roles', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/${roomCode}/host`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DISTRIBUTE_ROLES', hostToken }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.room.phase, 'ROLE_REVEAL');
  });

  it('7. STRICT SECURITY: Secret roles are NEVER leaked on public or spectator endpoints', async () => {
    // A. Public GET /api/rooms/:code
    const pubRes = await fetch(`${baseUrl}/api/rooms/${roomCode}`);
    const pubData = await pubRes.json();
    Object.values(pubData.room.players).forEach((p: any) => {
      assert.equal(p.role, undefined, `Public endpoint leaked role of ${p.name}!`);
      assert.equal(p.team, undefined, `Public endpoint leaked team of ${p.name}!`);
      assert.equal(p.token, undefined, `Public endpoint leaked token of ${p.name}!`);
    });

    // B. Spectator endpoint /api/rooms/:code/spectator
    const specRes = await fetch(`${baseUrl}/api/rooms/${roomCode}/spectator`);
    const specData = await specRes.json();
    Object.values(specData.room.players).forEach((p: any) => {
      assert.equal(p.role, undefined, `Spectator endpoint leaked role of ${p.name}!`);
      assert.equal(p.team, undefined, `Spectator endpoint leaked team of ${p.name}!`);
    });

    // C. Host endpoint during active game: projector-safe (roles hidden)
    const hostRes = await fetch(`${baseUrl}/api/rooms/${roomCode}?isHost=true&hostToken=${hostToken}`);
    const hostData = await hostRes.json();
    Object.values(hostData.room.players).forEach((p: any) => {
      assert.equal(p.role, undefined, `Host screen leaked role of ${p.name} on projector!`);
    });
  });

  it('8. STRICT SECURITY: Each player sees ONLY their own role, never other roles', async () => {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const res = await fetch(
        `${baseUrl}/api/rooms/${roomCode}?playerId=${p.id}&token=${p.token}`
      );
      assert.equal(res.status, 200);
      const data = await res.json();
      const me = data.room.players[p.id];

      // Player must know their own role
      assert.ok(me.role, `Player ${p.name} should know their own role`);
      p.role = me.role;

      // Player must NOT see other players' roles
      for (const other of players) {
        if (other.id !== p.id) {
          const otherInMyView = data.room.players[other.id];
          if (me.role === 'LOUP_GAROU' && other.role === 'LOUP_GAROU') {
            // Fellow werewolves know each other
            assert.equal(otherInMyView.role, 'LOUP_GAROU');
          } else {
            assert.equal(
              otherInMyView.role,
              undefined,
              `Player ${p.name} should NOT see role of ${other.name}!`
            );
          }
        }
      }
    }
  });

  it('9. Night progression: Role abilities execute privately', async () => {
    // Host starts night
    const startNightRes = await fetch(`${baseUrl}/api/rooms/${roomCode}/host`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'START_NIGHT', hostToken }),
    });
    const nightData = await startNightRes.json();
    assert.match(nightData.room.phase, /^NIGHT_/);

    // Identify who is what
    const wolf = players.find((p) => p.role === 'LOUP_GAROU');
    const seer = players.find((p) => p.role === 'VOYANTE');
    const witch = players.find((p) => p.role === 'SORCIERE');
    const nonWolves = players.filter((p) => p.role !== 'LOUP_GAROU');

    assert.ok(wolf, 'At least 1 werewolf required in 4-player game');

    // If Seer phase is active, Seer inspects
    if (nightData.room.phase === 'NIGHT_SEER' && seer) {
      const inspectRes = await fetch(`${baseUrl}/api/rooms/${roomCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: seer.id,
          playerToken: seer.token,
          actionType: 'SEER_INSPECT',
          targetId: wolf.id,
        }),
      });
      assert.equal(inspectRes.status, 200);
      const inspectData = await inspectRes.json();
      assert.equal(inspectData.room.nightState.seerInspectedId, wolf.id);
      assert.equal(inspectData.room.nightState.seerInspectedRole, 'LOUP_GAROU');

      // Verify non-seer (wolf) CANNOT see inspection result
      const wolfViewRes = await fetch(
        `${baseUrl}/api/rooms/${roomCode}?playerId=${wolf.id}&token=${wolf.token}`
      );
      const wolfView = await wolfViewRes.json();
      assert.equal(wolfView.room.nightState.seerInspectedRole, undefined);

      // Advance to wolves
      await fetch(`${baseUrl}/api/rooms/${roomCode}/host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADVANCE_NIGHT_STEP', hostToken }),
      });
    }

    // Werewolves vote
    const victim = nonWolves[0];
    const wolfVoteRes = await fetch(`${baseUrl}/api/rooms/${roomCode}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: wolf.id,
        playerToken: wolf.token,
        actionType: 'WEREWOLF_VOTE',
        targetId: victim.id,
      }),
    });
    assert.equal(wolfVoteRes.status, 200);

    // Verify non-wolf cannot see werewolf vote
    const victimViewRes = await fetch(
      `${baseUrl}/api/rooms/${roomCode}?playerId=${victim.id}&token=${victim.token}`
    );
    const victimView = await victimViewRes.json();
    assert.deepEqual(victimView.room.nightState.werewolfVotes, {});

    // Advance steps until DAY_ANNOUNCEMENT
    let currentRoom = nightData.room;
    while (currentRoom.phase.startsWith('NIGHT')) {
      const stepRes = await fetch(`${baseUrl}/api/rooms/${roomCode}/host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADVANCE_NIGHT_STEP', hostToken }),
      });
      const stepData = await stepRes.json();
      currentRoom = stepData.room;
    }

    assert.equal(currentRoom.phase, 'DAY_ANNOUNCEMENT');
  });

  it('10. Day debate and voting across devices', async () => {
    // Start voting
    const startVoteRes = await fetch(`${baseUrl}/api/rooms/${roomCode}/host`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'START_VOTING', hostToken }),
    });
    const voteData = await startVoteRes.json();
    assert.equal(voteData.room.phase, 'DAY_VOTE');

    // Get current alive players
    const fullRoom = rooms[roomCode];
    const alivePlayers = Object.values(fullRoom.players).filter((p) => p.isAlive);
    const deadPlayers = Object.values(fullRoom.players).filter((p) => !p.isAlive);

    // Dead player attempts to vote -> Must be rejected!
    if (deadPlayers.length > 0) {
      const deadP = deadPlayers[0];
      const deadVoteRes = await fetch(`${baseUrl}/api/rooms/${roomCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: deadP.id,
          playerToken: deadP.token,
          actionType: 'DAY_VOTE',
          targetId: alivePlayers[0].id,
        }),
      });
      assert.equal(deadVoteRes.status, 403);
    }

    // All alive players vote for the same target (e.g. alivePlayers[0])
    const voteTarget = alivePlayers[0];
    for (const ap of alivePlayers) {
      const vRes = await fetch(`${baseUrl}/api/rooms/${roomCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: ap.id,
          playerToken: ap.token,
          actionType: 'DAY_VOTE',
          targetId: voteTarget.id,
        }),
      });
      assert.equal(vRes.status, 200);
    }
  });

  it('11. Reconnection restores player session and authorized state', async () => {
    const p = players[1];
    const res = await fetch(`${baseUrl}/api/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: p.name,
        playerId: p.id,
        playerToken: p.token,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.player.id, p.id);
    assert.equal(data.player.name, p.name);
    assert.equal(data.player.isConnected, true);
    assert.equal(data.player.role, p.role);
  });

  it('12. SSE Stream: Verifies simultaneous connections for Host and Players with proper proxy headers', async () => {
    const p1 = players[0];
    const p2 = players[1];

    const hostUrl = `${baseUrl}/api/rooms/${roomCode}/stream?isHost=true&hostToken=${hostToken}`;
    const p1Url = `${baseUrl}/api/rooms/${roomCode}/stream?playerId=${p1.id}&token=${p1.token}`;
    const p2Url = `${baseUrl}/api/rooms/${roomCode}/stream?playerId=${p2.id}&token=${p2.token}`;

    const connections: http.ClientRequest[] = [];
    const receivedStates: Record<string, any> = {};

    const connectClient = (url: string, id: string): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          assert.equal(res.headers['content-type'], 'text/event-stream');
          assert.equal(res.headers['x-accel-buffering'], 'no');
          assert.equal(res.headers['cache-control'], 'no-cache');

          res.on('data', (chunk: Buffer) => {
            const text = chunk.toString();
            if (text.startsWith('data: ')) {
              receivedStates[id] = JSON.parse(text.replace(/^data: /, '').trim());
              resolve();
            }
          });
        });
        connections.push(req);
        req.on('error', (err) => {
          if ((err as any).code !== 'ECONNRESET') reject(err);
        });
      });
    };

    // Open simultaneous connections
    await Promise.all([
      connectClient(hostUrl, 'host'),
      connectClient(p1Url, p1.id),
      connectClient(p2Url, p2.id),
    ]);

    assert.ok(receivedStates['host'], 'Host received initial state');
    assert.ok(receivedStates[p1.id], 'Player 1 received initial state');
    assert.ok(receivedStates[p2.id], 'Player 2 received initial state');

    // Close all test connections cleanly
    connections.forEach((req) => req.destroy());
    await new Promise((r) => setTimeout(r, 100));
  });

  it('13. SSE Heartbeat: Verifies periodic ": ping\\n\\n" comment delivery and clean teardown', async () => {
    // Set fast heartbeat for test environment
    process.env.SSE_HEARTBEAT_INTERVAL_MS = '200';

    const p = players[2];
    const streamUrl = `${baseUrl}/api/rooms/${roomCode}/stream?playerId=${p.id}&token=${p.token}`;

    let receivedInitialData = false;
    let receivedPingComment = false;

    await new Promise<void>((resolve, reject) => {
      const req = http.get(streamUrl, (res) => {
        assert.equal(res.headers['x-accel-buffering'], 'no');

        res.on('data', (chunk: Buffer) => {
          const text = chunk.toString();

          if (text.startsWith('data: ')) {
            receivedInitialData = true;
          }

          if (text.includes(': ping\n\n') || text.startsWith(': ping')) {
            receivedPingComment = true;
            // Verify heartbeat is an SSE comment starting with ':' and not a data event
            assert.ok(!text.includes('data: : ping'), 'Heartbeat must not be a data event');
            req.destroy();
          }
        });

        res.on('close', () => {
          resolve();
        });

        res.on('error', (err) => {
          if ((err as any).code === 'ECONNRESET') {
            resolve();
          } else {
            reject(err);
          }
        });
      });

      req.on('error', (err) => {
        if ((err as any).code === 'ECONNRESET') {
          resolve();
        } else {
          reject(err);
        }
      });
    });

    assert.equal(receivedInitialData, true, 'Initial SSE state should arrive');
    assert.equal(receivedPingComment, true, 'Periodic : ping comment should arrive');

    // Wait for server-side res.on('close') cleanup
    await new Promise((r) => setTimeout(r, 150));

    // Reset env to default 25000ms
    delete process.env.SSE_HEARTBEAT_INTERVAL_MS;

    // Verify player is now marked disconnected on server
    const checkRes = await fetch(`${baseUrl}/api/rooms/${roomCode}`);
    const checkData = await checkRes.json();
    assert.equal(checkData.room.players[p.id].isConnected, false);
  });
});
