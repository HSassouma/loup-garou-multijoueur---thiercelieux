import React, { useState } from 'react';
import { ROLES_METADATA, RoleType } from '../../types/game';
import { GraduationCap, BookOpen, Sparkles, Moon, Sun, Vote, X, ArrowRight, Check } from 'lucide-react';

interface TrainingModeModalProps {
  onClose: () => void;
}

export const TrainingModeModal: React.FC<TrainingModeModalProps> = ({ onClose }) => {
  const [selectedRole, setSelectedRole] = useState<RoleType>('LOUP_GAROU');
  const [activeStep, setActiveStep] = useState<number>(0);

  const tutorialSteps = [
    {
      title: '1. Le But du Jeu',
      icon: '🐺',
      desc: 'Dans le village de Thiercelieux, certains habitants sont devenus des Loups-Garous. Chaque nuit, les loups dévorent un villageois. Le jour, les survivants débattent et votent pour éliminer un suspect au bûcher.',
    },
    {
      title: '2. Déroulement de la Nuit',
      icon: '🌙',
      desc: 'Tous les villageois ferment les yeux. Le meneur appelle tour à tour les personnages spéciaux : Cupidon lie deux amants, le Salvateur protège, la Voyante inspecte un rôle, les Loups choisissent une proie, et la Sorcière décide d’utiliser ses fioles.',
    },
    {
      title: '3. Le Réveil & Le Débat',
      icon: '☀️',
      desc: 'Au lever du jour, le narrateur annonce les disparitions de la nuit. Les villageois vivants ouvrent le tribunal populaire pour débattre, déceler les menteurs, et démasquer les imposteurs.',
    },
    {
      title: '4. Le Vote Populaire',
      icon: '⚖️',
      desc: 'Chaque joueur vote en direct depuis son smartphone. Le villageois qui récolte le plus grand nombre de suffrages est immédiatement exécuté. En cas d’égalité, personne n’est éliminé.',
    },
    {
      title: '5. La Victoire',
      icon: '🏆',
      desc: 'Le Village gagne dès que tous les Loups-Garous sont éliminés. Les Loups-Garous triomphent lorsqu’ils surpassent en nombre les villageois.',
    },
  ];

  const role = ROLES_METADATA[selectedRole];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[88vh] bg-zinc-900 border border-zinc-700 rounded-3xl flex flex-col text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-gothic text-lg font-bold text-amber-200">
                Académie de Thiercelieux — Mode Entraînement
              </h2>
              <p className="text-xs text-zinc-400">
                Guide interactif des règles, rôles et stratégies de survie
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step-by-Step Tutorial Cards */}
          <div>
            <h3 className="font-gothic text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Guide Interactif Pas à Pas</span>
            </h3>

            <div className="p-5 rounded-2xl bg-black/60 border border-zinc-800 relative">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{tutorialSteps[activeStep].icon}</span>
                <h4 className="text-base font-bold text-white font-gothic">
                  {tutorialSteps[activeStep].title}
                </h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                {tutorialSteps[activeStep].desc}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs">
                <div className="flex gap-1.5">
                  {tutorialSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        activeStep === idx ? 'bg-amber-400 w-6' : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {activeStep > 0 && (
                    <button
                      onClick={() => setActiveStep((s) => s - 1)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                    >
                      Précédent
                    </button>
                  )}
                  {activeStep < tutorialSteps.length - 1 ? (
                    <button
                      onClick={() => setActiveStep((s) => s + 1)}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <span>Suivant</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveStep(0)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Revoir le guide</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Grimoire des Rôles */}
          <div>
            <h3 className="font-gothic text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Grimoire des Rôles & Pouvoirs</span>
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 mb-4">
              {(Object.keys(ROLES_METADATA) as RoleType[]).map((rKey) => {
                const r = ROLES_METADATA[rKey];
                const isSelected = selectedRole === rKey;
                return (
                  <button
                    key={rKey}
                    onClick={() => setSelectedRole(rKey)}
                    className={`p-2 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-950 scale-105'
                        : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <span className="text-[10px] font-bold truncate max-w-full text-zinc-300">
                      {r.nameFr.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Deep-Dive Card */}
            {role && (
              <div
                className={`p-5 rounded-2xl border ${
                  role.team === 'LOUPS'
                    ? 'bg-red-950/30 border-red-600/40'
                    : 'bg-zinc-950 border-amber-600/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{role.icon}</span>
                    <div>
                      <h4 className="font-gothic text-base font-bold text-white">{role.nameFr}</h4>
                      <span className="text-[10px] uppercase font-bold text-amber-400">
                        {role.team === 'LOUPS' ? 'Faction des Loups-Garous' : 'Faction du Village'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed mt-2">{role.descriptionFr}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
