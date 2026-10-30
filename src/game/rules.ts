import { GamePhase, Player, RoleType, Team, NightState, GameMode } from '../types/game';

/**
 * Pure, centralized game rules and state calculation engine for Loup-Garou de Thiercelieux.
 * Strictly decoupled from UI and framework logic for zero-latency deterministic execution.
 */

export function getRecommendedRoleConfig(playerCount: number, mode: GameMode = 'CLASSIC'): Record<RoleType, number> {
  const config: Record<RoleType, number> = {
    LOUP_GAROU: 1,
    VILLAGEOIS: 0,
    VOYANTE: 1,
    SORCIERE: 0,
    CHASSEUR: 0,
    CUPIDON: 0,
    PETITE_FILLE: 0,
    SALVATEUR: 0,
    CORBEAU: 0,
  };

  if (playerCount < 4) {
    config.VILLAGEOIS = Math.max(0, playerCount - 2);
    return config;
  }

  if (playerCount === 4) {
    config.LOUP_GAROU = 1;
    config.VOYANTE = 1;
    config.SORCIERE = 1;
    config.VILLAGEOIS = 1;
  } else if (playerCount === 5) {
    config.LOUP_GAROU = 1;
    config.VOYANTE = 1;
    config.SORCIERE = 1;
    config.CHASSEUR = 1;
    config.VILLAGEOIS = 1;
  } else if (playerCount === 6) {
    config.LOUP_GAROU = 2;
    config.VOYANTE = 1;
    config.SORCIERE = 1;
    config.CHASSEUR = 1;
    config.VILLAGEOIS = 1;
  } else if (playerCount === 7) {
    config.LOUP_GAROU = 2;
    config.VOYANTE = 1;
    config.SORCIERE = 1;
    config.CHASSEUR = 1;
    config.CUPIDON = 1;
    config.VILLAGEOIS = 1;
  } else if (playerCount <= 9) {
    config.LOUP_GAROU = 2;
    config.VOYANTE = 1;
    config.SORCIERE = 1;
    config.CHASSEUR = 1;
    config.CUPIDON = 1;
    config.SALVATEUR = 1;
    config.PETITE_FILLE = 1;
    config.VILLAGEOIS = Math.max(0, playerCount - 8);
  } else if (playerCount <= 13) {
    config.LOUP_GAROU = 3;
    config.VOYANTE = 1;
    config.SORCIERE = 1;
    config.CHASSEUR = 1;
    config.CUPIDON = 1;
    config.SALVATEUR = 1;
    config.CORBEAU = 1;
    config.PETITE_FILLE = 1;
    config.VILLAGEOIS = Math.max(0, playerCount - 10);
  } else {
    // 14+ players (e.g. 15-18 students in classroom)
    config.LOUP_GAROU = 4;
    config.VOYANTE = 1;
    config.SORCIERE = 1;
    config.CHASSEUR = 1;
    config.CUPIDON = 1;
    config.SALVATEUR = 1;
    config.CORBEAU = 1;
    config.PETITE_FILLE = 1;
    config.VILLAGEOIS = Math.max(0, playerCount - 11);
  }

  return config;
}

export function validateRoleConfig(playerCount: number, config: Record<RoleType, number>): {
  isValid: boolean;
  totalRoles: number;
  message?: string;
} {
  const totalRoles = Object.values(config).reduce((acc, count) => acc + count, 0);
  if (totalRoles !== playerCount) {
    return {
      isValid: false,
      totalRoles,
      message: `Total des rôles (${totalRoles}) différent du nombre de joueurs (${playerCount})`,
    };
  }
  if (config.LOUP_GAROU < 1) {
    return {
      isValid: false,
      totalRoles,
      message: `Il faut au moins 1 Loup-Garou dans la partie`,
    };
  }
  if (config.LOUP_GAROU >= playerCount) {
    return {
      isValid: false,
      totalRoles,
      message: `Les loups ne peuvent pas constituer l’intégralité du village`,
    };
  }
  return { isValid: true, totalRoles };
}

export function shuffleAndAssignRoles(
  playerIds: string[],
  config: Record<RoleType, number>
): Record<string, { role: RoleType; team: Team }> {
  const rolePool: RoleType[] = [];
  (Object.keys(config) as RoleType[]).forEach((role) => {
    const count = config[role] || 0;
    for (let i = 0; i < count; i++) {
      rolePool.push(role);
    }
  });

  // Fisher-Yates shuffle
  const shuffled = [...rolePool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const assignments: Record<string, { role: RoleType; team: Team }> = {};
  playerIds.forEach((pid, index) => {
    const role = shuffled[index] || 'VILLAGEOIS';
    const team: Team = role === 'LOUP_GAROU' ? 'LOUPS' : 'VILLAGE';
    assignments[pid] = { role, team };
  });

  return assignments;
}

export function getNextNightPhase(
  currentPhase: GamePhase,
  players: Record<string, Player>,
  nightNumber: number
): GamePhase {
  const alivePlayers = Object.values(players).filter((p) => p.isAlive);
  const isRoleAlive = (r: RoleType) => alivePlayers.some((p) => p.role === r);

  switch (currentPhase) {
    case 'ROLE_REVEAL':
    case 'LOBBY':
    case 'DAY_EXECUTION':
    case 'DAY_DEBATE':
      if (nightNumber === 1 && isRoleAlive('CUPIDON')) {
        return 'NIGHT_CUPID';
      }
      if (isRoleAlive('SALVATEUR')) {
        return 'NIGHT_SALVATEUR';
      }
      if (isRoleAlive('VOYANTE')) {
        return 'NIGHT_SEER';
      }
      if (isRoleAlive('LOUP_GAROU')) {
        return 'NIGHT_WEREWOLVES';
      }
      if (isRoleAlive('SORCIERE')) {
        return 'NIGHT_WITCH';
      }
      if (isRoleAlive('CORBEAU')) {
        return 'NIGHT_CORBEAU';
      }
      return 'DAY_ANNOUNCEMENT';

    case 'NIGHT_CUPID':
      if (isRoleAlive('SALVATEUR')) {
        return 'NIGHT_SALVATEUR';
      }
      if (isRoleAlive('VOYANTE')) {
        return 'NIGHT_SEER';
      }
      if (isRoleAlive('LOUP_GAROU')) {
        return 'NIGHT_WEREWOLVES';
      }
      if (isRoleAlive('SORCIERE')) {
        return 'NIGHT_WITCH';
      }
      if (isRoleAlive('CORBEAU')) {
        return 'NIGHT_CORBEAU';
      }
      return 'DAY_ANNOUNCEMENT';

    case 'NIGHT_SALVATEUR':
      if (isRoleAlive('VOYANTE')) {
        return 'NIGHT_SEER';
      }
      if (isRoleAlive('LOUP_GAROU')) {
        return 'NIGHT_WEREWOLVES';
      }
      if (isRoleAlive('SORCIERE')) {
        return 'NIGHT_WITCH';
      }
      if (isRoleAlive('CORBEAU')) {
        return 'NIGHT_CORBEAU';
      }
      return 'DAY_ANNOUNCEMENT';

    case 'NIGHT_SEER':
      if (isRoleAlive('LOUP_GAROU')) {
        return 'NIGHT_WEREWOLVES';
      }
      if (isRoleAlive('SORCIERE')) {
        return 'NIGHT_WITCH';
      }
      if (isRoleAlive('CORBEAU')) {
        return 'NIGHT_CORBEAU';
      }
      return 'DAY_ANNOUNCEMENT';

    case 'NIGHT_WEREWOLVES':
      if (isRoleAlive('SORCIERE')) {
        return 'NIGHT_WITCH';
      }
      if (isRoleAlive('CORBEAU')) {
        return 'NIGHT_CORBEAU';
      }
      return 'DAY_ANNOUNCEMENT';

    case 'NIGHT_WITCH':
      if (isRoleAlive('CORBEAU')) {
        return 'NIGHT_CORBEAU';
      }
      return 'DAY_ANNOUNCEMENT';

    case 'NIGHT_CORBEAU':
      return 'DAY_ANNOUNCEMENT';

    default:
      return 'DAY_ANNOUNCEMENT';
  }
}

export function resolveWerewolfVictim(
  votes: Record<string, string>,
  aliveWerewolfIds: string[]
): string | undefined {
  const counts: Record<string, number> = {};
  aliveWerewolfIds.forEach((wid) => {
    const target = votes[wid];
    if (target) {
      counts[target] = (counts[target] || 0) + 1;
    }
  });

  let topTarget: string | undefined;
  let maxVotes = 0;
  for (const [target, count] of Object.entries(counts)) {
    if (count > maxVotes) {
      maxVotes = count;
      topTarget = target;
    }
  }
  return topTarget;
}

export interface NightResolutionResult {
  casualties: {
    playerId: string;
    reason: 'WEREWOLF' | 'WITCH' | 'LOVER';
  }[];
  hunterTriggered: boolean;
  hunterPlayerId?: string;
  survivedByPotion?: string;
  survivedByProtector?: string;
}

export function resolveNightActions(
  nightState: NightState,
  players: Record<string, Player>
): NightResolutionResult {
  const casualties: {
    playerId: string;
    reason: 'WEREWOLF' | 'WITCH' | 'LOVER';
  }[] = [];
  const deadIds = new Set<string>();
  let survivedByPotion: string | undefined;
  let survivedByProtector: string | undefined;

  // 1. Werewolf attack resolution
  const wolfTarget = nightState.werewolfTargetId;
  if (wolfTarget && players[wolfTarget]?.isAlive) {
    if (nightState.salvateurTargetId === wolfTarget) {
      // Protected by Salvateur!
      survivedByProtector = wolfTarget;
    } else if (nightState.witchHealDecision && nightState.witchHealAvailable) {
      // Saved by Witch Healing potion!
      survivedByPotion = wolfTarget;
      nightState.witchHealAvailable = false;
    } else {
      deadIds.add(wolfTarget);
      casualties.push({ playerId: wolfTarget, reason: 'WEREWOLF' });
    }
  }

  // 2. Witch poison resolution
  const poisonTarget = nightState.witchPoisonTargetId;
  if (
    poisonTarget &&
    nightState.witchPoisonAvailable &&
    players[poisonTarget]?.isAlive &&
    !deadIds.has(poisonTarget)
  ) {
    deadIds.add(poisonTarget);
    casualties.push({ playerId: poisonTarget, reason: 'WITCH' });
    nightState.witchPoisonAvailable = false;
  }

  // 3. Lover grief cascade
  if (nightState.cupidLovers) {
    const [loverA, loverB] = nightState.cupidLovers;
    if (deadIds.has(loverA) && !deadIds.has(loverB) && players[loverB]?.isAlive) {
      deadIds.add(loverB);
      casualties.push({ playerId: loverB, reason: 'LOVER' });
    } else if (deadIds.has(loverB) && !deadIds.has(loverA) && players[loverA]?.isAlive) {
      deadIds.add(loverA);
      casualties.push({ playerId: loverA, reason: 'LOVER' });
    }
  }

  // 4. Hunter check
  let hunterTriggered = false;
  let hunterPlayerId: string | undefined;
  deadIds.forEach((pid) => {
    if (players[pid]?.role === 'CHASSEUR') {
      hunterTriggered = true;
      hunterPlayerId = pid;
    }
  });

  return {
    casualties,
    hunterTriggered,
    hunterPlayerId,
    survivedByPotion,
    survivedByProtector,
  };
}

export function tallyVotes(
  votes: Record<string, string>,
  aliveVoterIds: string[],
  penaltyVotes?: Record<string, number>
): {
  tallies: Record<string, number>;
  votersForTarget: Record<string, string[]>;
  eliminatedId?: string;
  isTie: boolean;
  maxVotes: number;
} {
  const tallies: Record<string, number> = {};
  const votersForTarget: Record<string, string[]> = {};

  // Add penalty votes from Corbeau if any
  if (penaltyVotes) {
    for (const [target, penalty] of Object.entries(penaltyVotes)) {
      tallies[target] = (tallies[target] || 0) + penalty;
    }
  }

  aliveVoterIds.forEach((voterId) => {
    const target = votes[voterId];
    if (target) {
      tallies[target] = (tallies[target] || 0) + 1;
      if (!votersForTarget[target]) {
        votersForTarget[target] = [];
      }
      votersForTarget[target].push(voterId);
    }
  });

  let maxVotes = 0;
  let topCandidates: string[] = [];

  for (const [target, count] of Object.entries(tallies)) {
    if (count > maxVotes) {
      maxVotes = count;
      topCandidates = [target];
    } else if (count === maxVotes && maxVotes > 0) {
      topCandidates.push(target);
    }
  }

  if (topCandidates.length === 1 && maxVotes > 0) {
    return {
      tallies,
      votersForTarget,
      eliminatedId: topCandidates[0],
      isTie: false,
      maxVotes,
    };
  }

  return {
    tallies,
    votersForTarget,
    eliminatedId: undefined,
    isTie: topCandidates.length > 1,
    maxVotes,
  };
}

export function checkWinCondition(
  players: Record<string, Player>,
  cupidLovers?: [string, string]
): Team | 'EQUALITY' | null {
  const aliveList = Object.values(players).filter((p) => p.isAlive);

  if (aliveList.length === 0) {
    return 'EQUALITY';
  }

  // Check lovers victory:
  // If only 2 alive players remain and they are the Cupid lovers (and one is Wolf, one is Villager),
  // they win together as AMOUREUX!
  if (aliveList.length === 2 && cupidLovers) {
    const [l1, l2] = cupidLovers;
    const lover1Alive = aliveList.some((p) => p.id === l1);
    const lover2Alive = aliveList.some((p) => p.id === l2);
    if (lover1Alive && lover2Alive) {
      const p1 = players[l1];
      const p2 = players[l2];
      if (p1.role === 'LOUP_GAROU' || p2.role === 'LOUP_GAROU') {
        return 'AMOUREUX';
      }
    }
  }

  const wolvesCount = aliveList.filter((p) => p.role === 'LOUP_GAROU').length;
  const villagersCount = aliveList.length - wolvesCount;

  // Village wins if all wolves are eliminated
  if (wolvesCount === 0) {
    return 'VILLAGE';
  }

  // Werewolves win if wolves count >= villagers count
  if (wolvesCount >= villagersCount) {
    return 'LOUPS';
  }

  return null;
}
