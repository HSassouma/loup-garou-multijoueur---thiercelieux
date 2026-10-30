import { UserProfile, MatchRecord, RoleType, Team, ACHIEVEMENTS_LIST } from '../types/game';

class ProfileService {
  private profileKey = 'werewolf_user_profile';
  private matchHistoryKey = 'werewolf_match_history';

  public getProfile(): UserProfile {
    if (typeof window === 'undefined') {
      return this.createDefaultProfile();
    }
    try {
      const raw = localStorage.getItem(this.profileKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    const defaultProf = this.createDefaultProfile();
    this.saveProfile(defaultProf);
    return defaultProf;
  }

  private createDefaultProfile(): UserProfile {
    const randomAvatars = ['🐺', '🔮', '🏹', '🧪', '👨‍🌾', '👧', '🛡️', '🦅', '👑', '🧙'];
    return {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: `Villageois_${Math.floor(100 + Math.random() * 900)}`,
      avatar: randomAvatars[Math.floor(Math.random() * randomAvatars.length)],
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      rolesPlayed: {
        LOUP_GAROU: 0,
        VILLAGEOIS: 0,
        VOYANTE: 0,
        SORCIERE: 0,
        CHASSEUR: 0,
        CUPIDON: 0,
        PETITE_FILLE: 0,
        SALVATEUR: 0,
        CORBEAU: 0,
      },
      achievements: [],
      createdAt: Date.now(),
    };
  }

  public saveProfile(profile: UserProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.profileKey, JSON.stringify(profile));
    } catch {}
  }

  public updateUsernameAndAvatar(username: string, avatar: string): UserProfile {
    const profile = this.getProfile();
    profile.username = username.trim() || profile.username;
    profile.avatar = avatar || profile.avatar;
    this.saveProfile(profile);
    return profile;
  }

  public recordMatchOutcome(
    match: MatchRecord,
    myRole?: RoleType,
    myTeam?: Team,
    won?: boolean,
    specialActions?: {
      seerFoundWolf?: boolean;
      hunterShotWolf?: boolean;
      salvateurSaved?: boolean;
      witchUsedBoth?: boolean;
      survivedTillEnd?: boolean;
    }
  ): { profile: UserProfile; newlyUnlocked: string[] } {
    const profile = this.getProfile();
    profile.matchesPlayed += 1;

    if (won) {
      profile.wins += 1;
    } else {
      profile.losses += 1;
    }

    if (myRole) {
      profile.rolesPlayed[myRole] = (profile.rolesPlayed[myRole] || 0) + 1;
    }

    // Check & unlock real achievements
    const newlyUnlocked: string[] = [];
    const unlock = (achId: string) => {
      if (!profile.achievements.includes(achId)) {
        profile.achievements.push(achId);
        newlyUnlocked.push(achId);
      }
    };

    if (won) {
      unlock('first_blood');
      if (myTeam === 'LOUPS') unlock('pack_leader');
      if (myTeam === 'VILLAGE') unlock('village_hero');
      if (myTeam === 'AMOUREUX') unlock('pure_love');
    }

    if (specialActions?.seerFoundWolf) unlock('seer_vision');
    if (specialActions?.hunterShotWolf) unlock('hunter_revenge');
    if (specialActions?.salvateurSaved) unlock('guardian_shield');
    if (specialActions?.witchUsedBoth) unlock('master_potion');
    if (specialActions?.survivedTillEnd) unlock('survivor');

    this.saveProfile(profile);

    // Save match in history
    this.saveMatchToHistory(match);

    return { profile, newlyUnlocked };
  }

  public getMatchHistory(): MatchRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.matchHistoryKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveMatchToHistory(match: MatchRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getMatchHistory();
      history.unshift(match);
      // Keep last 30 matches
      localStorage.setItem(this.matchHistoryKey, JSON.stringify(history.slice(0, 30)));
    } catch {}
  }
}

export const profileService = new ProfileService();
