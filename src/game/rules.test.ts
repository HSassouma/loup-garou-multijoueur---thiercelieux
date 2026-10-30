import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRecommendedRoleConfig,
  validateRoleConfig,
  shuffleAndAssignRoles,
  getNextNightPhase,
  resolveWerewolfVictim,
  resolveNightActions,
  tallyVotes,
  checkWinCondition,
} from './rules';
import { Player, NightState } from '../types/game';

test('getRecommendedRoleConfig balances 4, 6, 8, 15 players correctly', () => {
  const cfg4 = getRecommendedRoleConfig(4);
  assert.equal(cfg4.LOUP_GAROU, 1);
  assert.equal(cfg4.VOYANTE, 1);
  assert.equal(cfg4.SORCIERE, 1);
  assert.equal(cfg4.VILLAGEOIS, 1);

  const cfg6 = getRecommendedRoleConfig(6);
  assert.equal(cfg6.LOUP_GAROU, 2);
  assert.equal(cfg6.VOYANTE, 1);
  assert.equal(cfg6.SORCIERE, 1);
  assert.equal(cfg6.CHASSEUR, 1);
  assert.equal(cfg6.VILLAGEOIS, 1);

  const cfg15 = getRecommendedRoleConfig(15);
  assert.equal(cfg15.LOUP_GAROU, 4);
  assert.equal(cfg15.VOYANTE, 1);
  assert.equal(cfg15.SORCIERE, 1);
  assert.equal(cfg15.CHASSEUR, 1);
  assert.equal(cfg15.CUPIDON, 1);
  assert.equal(cfg15.SALVATEUR, 1);
  assert.equal(cfg15.CORBEAU, 1);
  assert.equal(cfg15.PETITE_FILLE, 1);
  assert.equal(
    Object.values(cfg15).reduce((a, b) => a + b, 0),
    15
  );
});

test('validateRoleConfig catches mismatches and 0 werewolves', () => {
  const valid = validateRoleConfig(6, getRecommendedRoleConfig(6));
  assert.equal(valid.isValid, true);

  const invalidCount = validateRoleConfig(5, getRecommendedRoleConfig(6));
  assert.equal(invalidCount.isValid, false);

  const noWolves = validateRoleConfig(4, {
    LOUP_GAROU: 0,
    VILLAGEOIS: 4,
    VOYANTE: 0,
    SORCIERE: 0,
    CHASSEUR: 0,
    CUPIDON: 0,
    PETITE_FILLE: 0,
    SALVATEUR: 0,
    CORBEAU: 0,
  });
  assert.equal(noWolves.isValid, false);
});

test('shuffleAndAssignRoles assigns exactly one role to every player', () => {
  const pids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  const config = getRecommendedRoleConfig(6);
  const assignments = shuffleAndAssignRoles(pids, config);

  assert.equal(Object.keys(assignments).length, 6);
  const wolfCount = Object.values(assignments).filter((a) => a.role === 'LOUP_GAROU').length;
  assert.equal(wolfCount, 2);
});

test('getNextNightPhase sequences correctly with Salvateur and Seer', () => {
  const mockPlayers: Record<string, Player> = {
    p1: { id: 'p1', name: 'Cupid', role: 'CUPIDON', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    p2: { id: 'p2', name: 'Protector', role: 'SALVATEUR', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    p3: { id: 'p3', name: 'Seer', role: 'VOYANTE', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    p4: { id: 'p4', name: 'Wolf', role: 'LOUP_GAROU', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    p5: { id: 'p5', name: 'Witch', role: 'SORCIERE', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    p6: { id: 'p6', name: 'Raven', role: 'CORBEAU', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
  };

  // Night 1 sequences: Cupid -> Salvateur -> Seer -> Wolves -> Witch -> Corbeau -> Day
  assert.equal(getNextNightPhase('ROLE_REVEAL', mockPlayers, 1), 'NIGHT_CUPID');
  assert.equal(getNextNightPhase('NIGHT_CUPID', mockPlayers, 1), 'NIGHT_SALVATEUR');
  assert.equal(getNextNightPhase('NIGHT_SALVATEUR', mockPlayers, 1), 'NIGHT_SEER');
  assert.equal(getNextNightPhase('NIGHT_SEER', mockPlayers, 1), 'NIGHT_WEREWOLVES');
  assert.equal(getNextNightPhase('NIGHT_WEREWOLVES', mockPlayers, 1), 'NIGHT_WITCH');
  assert.equal(getNextNightPhase('NIGHT_WITCH', mockPlayers, 1), 'NIGHT_CORBEAU');
  assert.equal(getNextNightPhase('NIGHT_CORBEAU', mockPlayers, 1), 'DAY_ANNOUNCEMENT');
});

test('resolveWerewolfVictim picks the consensus target', () => {
  const votes = {
    wolf1: 'alice',
    wolf2: 'alice',
    wolf3: 'bob',
  };
  const target = resolveWerewolfVictim(votes, ['wolf1', 'wolf2', 'wolf3']);
  assert.equal(target, 'alice');
});

test('resolveNightActions handles Salvateur shield protection', () => {
  const players: Record<string, Player> = {
    alice: { id: 'alice', name: 'Alice', role: 'VILLAGEOIS', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    bob: { id: 'bob', name: 'Bob', role: 'LOUP_GAROU', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    claire: { id: 'claire', name: 'Claire', role: 'SALVATEUR', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
  };

  // Wolves attack Alice, but Salvateur protected Alice!
  const nightState: NightState = {
    nightNumber: 1,
    salvateurTargetId: 'alice',
    werewolfVotes: { bob: 'alice' },
    werewolfTargetId: 'alice',
    witchHealAvailable: true,
    witchPoisonAvailable: true,
    casualties: [],
    hunterPending: false,
  };

  const res = resolveNightActions(nightState, players);
  assert.equal(res.casualties.length, 0);
  assert.equal(res.survivedByProtector, 'alice');
});

test('resolveNightActions handles witch potions and persistent exhaustion', () => {
  const players: Record<string, Player> = {
    alice: { id: 'alice', name: 'Alice', role: 'VILLAGEOIS', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    bilal: { id: 'bilal', name: 'Bilal', role: 'CHASSEUR', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    chloe: { id: 'chloe', name: 'Chloé', role: 'LOUP_GAROU', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
  };

  const nightState: NightState = {
    nightNumber: 1,
    werewolfVotes: { chloe: 'alice' },
    werewolfTargetId: 'alice',
    witchHealAvailable: true,
    witchHealDecision: true,
    witchPoisonAvailable: true,
    witchPoisonTargetId: 'bilal',
    casualties: [],
    hunterPending: false,
  };

  const res = resolveNightActions(nightState, players);
  assert.equal(res.survivedByPotion, 'alice');
  assert.equal(res.casualties.length, 1); // Bilal was poisoned
  assert.equal(res.hunterTriggered, true);
  // Both potions are now exhausted
  assert.equal(nightState.witchHealAvailable, false);
  assert.equal(nightState.witchPoisonAvailable, false);
});

test('tallyVotes supports Corbeau penalty votes and ties', () => {
  const votes = {
    p1: 'p2',
    p2: 'p3',
  };
  // Penalty votes from Corbeau: 2 votes against p3
  const penaltyVotes = {
    p3: 2,
  };
  const res = tallyVotes(votes, ['p1', 'p2'], penaltyVotes);
  assert.equal(res.eliminatedId, 'p3'); // p3 has 1 + 2 = 3 votes!
  assert.equal(res.tallies['p3'], 3);
  assert.equal(res.isTie, false);
});

test('checkWinCondition detects village, wolves, and lovers victories', () => {
  const villageWin: Record<string, Player> = {
    p1: { id: 'p1', name: 'A', role: 'VILLAGEOIS', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    p2: { id: 'p2', name: 'B', role: 'VOYANTE', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    p3: { id: 'p3', name: 'C', role: 'LOUP_GAROU', isAlive: false, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
  };
  assert.equal(checkWinCondition(villageWin), 'VILLAGE');

  const wolvesWin: Record<string, Player> = {
    p1: { id: 'p1', name: 'A', role: 'VILLAGEOIS', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    p2: { id: 'p2', name: 'B', role: 'LOUP_GAROU', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
    p3: { id: 'p3', name: 'C', role: 'LOUP_GAROU', isAlive: true, isHost: false, hasViewedCard: true, connectedAt: 0, lastActiveAt: 0 },
  };
  assert.equal(checkWinCondition(wolvesWin), 'LOUPS');
});
