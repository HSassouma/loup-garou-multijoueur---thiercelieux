export type RoleType =
  | 'LOUP_GAROU'
  | 'VILLAGEOIS'
  | 'VOYANTE'
  | 'SORCIERE'
  | 'CHASSEUR'
  | 'CUPIDON'
  | 'PETITE_FILLE'
  | 'SALVATEUR'
  | 'CORBEAU';

export type Team = 'VILLAGE' | 'LOUPS' | 'AMOUREUX';

export type GameMode = 'CLASSIC' | 'RAPID' | 'CUSTOM' | 'TRAINING' | 'TOURNAMENT';

export interface RoleDefinition {
  id: RoleType;
  name: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  team: Team;
  descriptionFr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  color: string;
  bgGradient: string;
  soundCue?: string;
}

export type GamePhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'NIGHT_CUPID'
  | 'NIGHT_SALVATEUR'
  | 'NIGHT_SEER'
  | 'NIGHT_WEREWOLVES'
  | 'NIGHT_WITCH'
  | 'NIGHT_CORBEAU'
  | 'DAY_ANNOUNCEMENT'
  | 'HUNTER_SHOT'
  | 'DAY_DEBATE'
  | 'DAY_VOTE'
  | 'DAY_EXECUTION'
  | 'GAME_OVER';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  role?: RoleType;
  team?: Team;
  isAlive: boolean;
  isHost: boolean;
  hasViewedCard: boolean;
  isLover?: boolean;
  connectedAt: number;
  lastActiveAt: number;
  isBot?: boolean;
  token?: string;
  isConnected?: boolean;
}

export interface WitchPotions {
  healAvailable: boolean;
  poisonAvailable: boolean;
}

export interface NightState {
  nightNumber: number;
  cupidLovers?: [string, string];
  salvateurTargetId?: string;
  lastSalvateurTargetId?: string;
  seerInspectedId?: string;
  seerInspectedRole?: RoleType;
  werewolfVotes: Record<string, string>; // voterId -> targetId
  werewolfTargetId?: string;
  witchHealAvailable: boolean;
  witchPoisonAvailable: boolean;
  witchHealDecision?: boolean; // true = used heal
  witchPoisonTargetId?: string; // target poisoned
  corbeauTargetId?: string;
  casualties: {
    playerId: string;
    reason: 'WEREWOLF' | 'WITCH' | 'LOVER' | 'HUNTER' | 'VOTE';
  }[];
  hunterPending: boolean;
  hunterTriggerSource?: 'NIGHT' | 'DAY';
}

export interface DayState {
  dayNumber: number;
  timerSeconds: number;
  timerTotal: number;
  isTimerRunning: boolean;
  votes: Record<string, string>; // voterId -> targetId
  penaltyVotes?: Record<string, number>; // Corbeau penalty
  eliminatedPlayerId?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  phase: GamePhase;
  message: string;
  isPublic: boolean;
}

export interface GameRoom {
  code: string;
  createdAt: number;
  updatedAt: number;
  phase: GamePhase;
  gameMode: GameMode;
  players: Record<string, Player>;
  hostId: string;
  hostToken?: string;
  maxPlayers?: number;
  isPaused?: boolean;
  rolesConfig: Record<RoleType, number>;
  nightState: NightState;
  dayState: DayState;
  winner?: Team | 'EQUALITY';
  narratorText?: string;
  history: string[];
  timeline: TimelineEvent[];
  startedAt?: number;
  endedAt?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  rolesPlayed: Record<RoleType, number>;
  achievements: string[];
  createdAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
}

export interface MatchRecord {
  id: string;
  roomCode: string;
  date: number;
  durationSeconds: number;
  gameMode: GameMode;
  winner: Team | 'EQUALITY';
  playerCount: number;
  myRole?: RoleType;
  myResult?: 'WIN' | 'LOSS';
  casualtiesCount: number;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_blood',
    title: 'Première Victoire',
    description: 'Remporter ta toute première partie de Loup-Garou.',
    icon: '🏆',
    points: 10,
  },
  {
    id: 'pack_leader',
    title: 'Chef de Meute',
    description: 'Triompher en tant que Loup-Garou.',
    icon: '🐺',
    points: 20,
  },
  {
    id: 'village_hero',
    title: 'Sauveur du Village',
    description: 'Éradiquer tous les loups avec le Village.',
    icon: '🛡️',
    points: 20,
  },
  {
    id: 'pure_love',
    title: 'Amour Éternel',
    description: 'Gagner en tant qu’Amoureux.',
    icon: '❤️',
    points: 30,
  },
  {
    id: 'seer_vision',
    title: 'Clairvoyance Absolue',
    description: 'Démasquer un Loup-Garou avec la Voyante.',
    icon: '🔮',
    points: 15,
  },
  {
    id: 'hunter_revenge',
    title: 'Ultime Cartouche',
    description: 'Abattre un Loup-Garou avec le tir du Chasseur.',
    icon: '🏹',
    points: 25,
  },
  {
    id: 'guardian_shield',
    title: 'Bouclier Céleste',
    description: 'Sauver une victime des loups avec le Salvateur.',
    icon: '🛡️',
    points: 20,
  },
  {
    id: 'master_potion',
    title: 'Alchimiste Suprême',
    description: 'Utiliser les deux potions de la Sorcière dans la même partie.',
    icon: '🧪',
    points: 25,
  },
  {
    id: 'survivor',
    title: 'Dernier Survivant',
    description: 'Être l’un des derniers survivants à la fin du jeu.',
    icon: '🌟',
    points: 15,
  },
];

export const ROLES_METADATA: Record<RoleType, RoleDefinition> = {
  LOUP_GAROU: {
    id: 'LOUP_GAROU',
    name: 'Loup-Garou',
    nameFr: 'Loup-Garou',
    nameEn: 'Werewolf',
    nameAr: 'المستذئب',
    team: 'LOUPS',
    descriptionFr: 'Chaque nuit, dévore un villageois avec tes congénères. Le jour, masque ton identité.',
    descriptionEn: 'Each night, devour a villager with your pack. By day, blend in.',
    descriptionAr: 'كل ليلة، تفترس قروياً مع بقية الذئاب. بالنهار، تظاهر بأنك قروي بريء.',
    icon: '🐺',
    color: '#ef4444',
    bgGradient: 'from-red-950 via-zinc-900 to-black',
  },
  VILLAGEOIS: {
    id: 'VILLAGEOIS',
    name: 'Simple Villageois',
    nameFr: 'Simple Villageois',
    nameEn: 'Simple Villager',
    nameAr: 'قروي بسيط',
    team: 'VILLAGE',
    descriptionFr: 'Tu n’as aucun pouvoir magique, mais ta parole et ton vote peuvent sauver le village.',
    descriptionEn: 'You have no magical powers, but your voice and vote can save the village.',
    descriptionAr: 'لا تملك قوى سحرية، لكن صوتك وحدسك قادران على إنقاذ القرية.',
    icon: '👨‍🌾',
    color: '#3b82f6',
    bgGradient: 'from-blue-950 via-zinc-900 to-black',
  },
  VOYANTE: {
    id: 'VOYANTE',
    name: 'Voyante',
    nameFr: 'Voyante',
    nameEn: 'Seer',
    nameAr: 'العرافة',
    team: 'VILLAGE',
    descriptionFr: 'Chaque nuit, découvre la véritable identité secrète d’un joueur de ton choix.',
    descriptionEn: 'Each night, discover the secret role of one chosen player.',
    descriptionAr: 'كل ليلة، تكشف الهوية السرية لأحد اللاعبين من اختيارك.',
    icon: '🔮',
    color: '#a855f7',
    bgGradient: 'from-purple-950 via-zinc-900 to-black',
  },
  SORCIERE: {
    id: 'SORCIERE',
    name: 'Sorcière',
    nameFr: 'Sorcière',
    nameEn: 'Witch',
    nameAr: 'الساحرة',
    team: 'VILLAGE',
    descriptionFr: 'Possède 2 potions uniques : une de guérison pour sauver la victime, et une de poison.',
    descriptionEn: 'Owns 2 unique potions: one of healing to save the victim, and one of deadly poison.',
    descriptionAr: 'تملك جرعتين لمرة واحدة: جرعة شفاء لإنقاذ الضحية، وجرعة سم لقتل مشتبه به.',
    icon: '🧪',
    color: '#10b981',
    bgGradient: 'from-emerald-950 via-zinc-900 to-black',
  },
  CHASSEUR: {
    id: 'CHASSEUR',
    name: 'Chasseur',
    nameFr: 'Chasseur',
    nameEn: 'Hunter',
    nameAr: 'الصياد',
    team: 'VILLAGE',
    descriptionFr: 'Si tu te fais dévorer ou éliminer, tu tires un ultime coup de fusil pour emporter un suspect.',
    descriptionEn: 'If eliminated, you take a final shot with your rifle to take down any player.',
    descriptionAr: 'إذا قُتلت، تطلق رصاصتك الأخيرة لتأخذ معك مشتبهاً به إلى القبر.',
    icon: '🏹',
    color: '#f59e0b',
    bgGradient: 'from-amber-950 via-zinc-900 to-black',
  },
  CUPIDON: {
    id: 'CUPIDON',
    name: 'Cupidon',
    nameFr: 'Cupidon',
    nameEn: 'Cupid',
    nameAr: 'كيوبيد',
    team: 'VILLAGE',
    descriptionFr: 'La première nuit, désigne deux amoureux inséparables. Si l’un meurt, l’autre périt de chagrin.',
    descriptionEn: 'On night 1, designate two lovers. If one dies, the other perishes of grief.',
    descriptionAr: 'في الليلة الأولى، تختار عاشقين. إن مات أحدهما، مات الآخر حزناً عليه.',
    icon: '💘',
    color: '#ec4899',
    bgGradient: 'from-pink-950 via-zinc-900 to-black',
  },
  PETITE_FILLE: {
    id: 'PETITE_FILLE',
    name: 'Petite Fille',
    nameFr: 'Petite Fille',
    nameEn: 'Little Girl',
    nameAr: 'الفتاة الصغيرة',
    team: 'VILLAGE',
    descriptionFr: 'Peut discrètement espionner les loups pendant leur festin nocturne.',
    descriptionEn: 'Can discreetly peek during the werewolves feast.',
    descriptionAr: 'تستطيع التلصص بحذر على الذئاب أثناء اجتماعهم الليلي.',
    icon: '👧',
    color: '#06b6d4',
    bgGradient: 'from-cyan-950 via-zinc-900 to-black',
  },
  SALVATEUR: {
    id: 'SALVATEUR',
    name: 'Salvateur',
    nameFr: 'Salvateur (Protecteur)',
    nameEn: 'Protector',
    nameAr: 'الحامي',
    team: 'VILLAGE',
    descriptionFr: 'Chaque nuit avant les loups, protège un joueur de ton choix. Tu ne peux pas protéger la même personne 2 nuits de suite.',
    descriptionEn: 'Each night before the wolves, protects one player. Cannot protect the same player twice in a row.',
    descriptionAr: 'كل ليلة قبل الذئاب، تحمي لاعباً من الموت. لا يمكنك حماية نفس الشخص ليلتين متتاليتين.',
    icon: '🛡️',
    color: '#38bdf8',
    bgGradient: 'from-sky-950 via-zinc-900 to-black',
  },
  CORBEAU: {
    id: 'CORBEAU',
    name: 'Corbeau',
    nameFr: 'Corbeau',
    nameEn: 'Raven',
    nameAr: 'الغراب',
    team: 'VILLAGE',
    descriptionFr: 'Chaque nuit, désigne anonymement un suspect qui commencera le vote du jour avec 2 voix contre lui.',
    descriptionEn: 'Each night, designate a suspect who will start the next vote with 2 penalty votes.',
    descriptionAr: 'كل ليلة، تعين مشتبهاً به سيبدأ تصويت النهار القادم بصوتين ضده مسبقاً.',
    icon: '🦅',
    color: '#6366f1',
    bgGradient: 'from-indigo-950 via-zinc-900 to-black',
  },
};
