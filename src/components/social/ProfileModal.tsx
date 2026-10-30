import React, { useState } from 'react';
import { UserProfile, ACHIEVEMENTS_LIST, MatchRecord } from '../../types/game';
import { profileService } from '../../services/profileService';
import { User, Award, History, Trophy, X, Check, Edit2 } from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onProfileUpdated }) => {
  const [profile, setProfile] = useState<UserProfile>(profileService.getProfile());
  const [history, setHistory] = useState<MatchRecord[]>(profileService.getMatchHistory());
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'history'>('stats');

  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);

  const avatarOptions = ['🐺', '🔮', '🏹', '🧪', '👨‍🌾', '👧', '🛡️', '🦅', '👑', '🧙', '💀', '❤️'];

  const handleSaveProfile = () => {
    const updated = profileService.updateUsernameAndAvatar(usernameInput, selectedAvatar);
    setProfile(updated);
    setIsEditing(false);
    onProfileUpdated?.(updated);
  };

  const winRate = profile.matchesPlayed > 0
    ? Math.round((profile.wins / profile.matchesPlayed) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="text-3xl p-2 rounded-2xl bg-amber-950/60 border border-amber-500/40">
              {profile.avatar}
            </div>
            <div>
              <h3 className="font-gothic text-lg font-bold text-amber-200 flex items-center gap-2">
                <span>{profile.username}</span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                  title="Modifier le profil"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </h3>
              <p className="text-xs text-zinc-400">
                {profile.wins} victoires • {winRate}% taux de victoire
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Edit profile row */}
        {isEditing && (
          <div className="p-4 my-3 bg-black/50 border border-amber-600/30 rounded-2xl space-y-3 animate-fade-in">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Pseudo</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full mt-1 py-1.5 px-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Choisir un Avatar</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {avatarOptions.map((av) => (
                  <button
                    key={av}
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-9 h-9 rounded-xl border text-lg flex items-center justify-center ${
                      selectedAvatar === av
                        ? 'border-amber-400 bg-amber-500/20'
                        : 'border-zinc-700 bg-zinc-800'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
            >
              Enregistrer les modifications
            </button>
          </div>
        )}

        {/* Tab buttons */}
        <div className="flex border-b border-zinc-800 pt-3 gap-2">
          {[
            { id: 'stats', label: 'Statistiques', icon: Trophy },
            { id: 'achievements', label: 'Hauts Faits', icon: Award },
            { id: 'history', label: 'Historique', icon: History },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                  active
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center">
                  <div className="text-xl font-bold font-mono text-white">{profile.matchesPlayed}</div>
                  <div className="text-[10px] text-zinc-400 uppercase">Parties</div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center">
                  <div className="text-xl font-bold font-mono text-emerald-400">{profile.wins}</div>
                  <div className="text-[10px] text-zinc-400 uppercase">Victoires</div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center">
                  <div className="text-xl font-bold font-mono text-amber-400">{winRate}%</div>
                  <div className="text-[10px] text-zinc-400 uppercase">Ratio</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                  Rôles incarnés
                </h4>
                <div className="space-y-1.5">
                  {Object.entries(profile.rolesPlayed)
                    .filter(([_, count]) => count > 0)
                    .map(([r, count]) => (
                      <div
                        key={r}
                        className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                      >
                        <span className="font-semibold text-zinc-300">{r}</span>
                        <span className="text-amber-400 font-mono font-bold">{count} partie(s)</span>
                      </div>
                    ))}
                  {Object.values(profile.rolesPlayed).every((c) => c === 0) && (
                    <p className="text-xs text-zinc-500 italic text-center py-2">
                      Aucune partie enregistrée pour le moment.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-2.5">
              {ACHIEVEMENTS_LIST.map((ach) => {
                const unlocked = profile.achievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      unlocked
                        ? 'bg-amber-950/20 border-amber-500/40 text-white'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl p-2 rounded-xl bg-black/40">{ach.icon}</div>
                      <div>
                        <div className="text-sm font-bold flex items-center gap-1.5">
                          <span>{ach.title}</span>
                          {unlocked && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-xs text-zinc-400">{ach.description}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">+{ach.points} pts</span>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Aucun historique de partie disponible.
                </div>
              ) : (
                history.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Salle {m.roomCode}</span>
                        <span className="text-[10px] text-zinc-400">({m.gameMode})</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {new Date(m.date).toLocaleDateString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} • {Math.round(m.durationSeconds / 60)} min
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          m.winner === 'VILLAGE'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800'
                            : m.winner === 'LOUPS'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-pink-950 text-pink-400 border border-pink-800'
                        }`}
                      >
                        Victoire {m.winner}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
