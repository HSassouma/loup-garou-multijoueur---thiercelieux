import React, { useState } from 'react';
import { BookOpen, HelpCircle, Terminal, ShieldCheck, CheckSquare, X, Copy, Check } from 'lucide-react';

interface TeacherGuideModalProps {
  onClose: () => void;
}

export const TeacherGuideModal: React.FC<TeacherGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'parcours' | 'depannage' | 'prompts' | 'defis'>('parcours');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[90vh] bg-zinc-900 border border-zinc-700 rounded-3xl flex flex-col text-white shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-gothic text-xl font-bold text-amber-200">
                Guide de Test Loup-Garou Multijoueur
              </h2>
              <p className="text-xs text-zinc-400">
                Document de référence pédagogique par @Hmidouche Amine • DWWM
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

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900 px-5 gap-2 pt-3">
          {[
            { id: 'parcours', label: '1. Parcours de Test (Étapes 1-6)', icon: CheckSquare },
            { id: 'depannage', label: '2. Tableau de Dépannage', icon: HelpCircle },
            { id: 'prompts', label: '3. Batterie de Prompts IA', icon: Terminal },
            { id: 'defis', label: '4. Défis Apprenants DWWM', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-amber-500/10 rounded-t-xl'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: PARCOURS DE TEST */}
          {activeTab === 'parcours' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/30">
                <h3 className="font-gothic font-bold text-amber-300 text-base mb-1">
                  En Bref (Page 1 du Guide)
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Le meneur ouvre la salle sur l’ordinateur projeté, chaque apprenant rejoint sur son téléphone avec un code de 4 lettres ou un QR code, et la plateforme synchronise tout en temps réel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <h4 className="font-bold text-amber-400 mb-2">Étape 1 : Tester en mode local (5 min)</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                    Tant que la config Firebase est vide, l'app tourne en mode local. Tous les onglets de ton navigateur partagent la même partie via BroadcastChannel.
                  </p>
                  <ol className="list-decimal list-inside text-xs text-zinc-300 space-y-1">
                    <li>Créer une salle (onglet Meneur).</li>
                    <li>Ouvrir 4 à 6 onglets avec le lien de la salle.</li>
                    <li>Distribuer les rôles et vérifier « Cartes vues : 4/4 ».</li>
                    <li>Lancer la nuit puis passer au vote.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <h4 className="font-bold text-sky-400 mb-2">Étape 2 : Projet Firebase & RTDB (10 min)</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                    Création du projet sur console.firebase.google.com (gratuit Spark).
                  </p>
                  <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1">
                    <li>Emplacement : Belgique (europe-west1).</li>
                    <li>Publier les règles sous rooms/$code.</li>
                    <li>Noter l'URL databaseURL.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <h4 className="font-bold text-purple-400 mb-2">Étape 4 : Test multi-onglets Firebase (5 min)</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Fenêtre normale + navigation privée côte à côte. Vérifier que la console affiche les données en direct sous rooms &gt; ABCD.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <h4 className="font-bold text-emerald-400 mb-2">Étape 5 & 6 : Test téléphones & Répétition</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Tester une fois en Wi-Fi école et une fois en 4G. Vérifier que le QR code se scanne depuis le fond de la salle et tester le son du narrateur.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TABLEAU DE DÉPANNAGE */}
          {activeTab === 'depannage' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-800 text-zinc-300 border-b border-zinc-700">
                    <th className="p-3 font-bold">Symptôme</th>
                    <th className="p-3 font-bold">Cause probable</th>
                    <th className="p-3 font-bold">Solution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr className="hover:bg-zinc-800/40">
                    <td className="p-3 font-semibold text-red-400">Le bandeau « Mode local » reste affiché</td>
                    <td className="p-3 text-zinc-400">databaseURL vide ou scripts bloqués</td>
                    <td className="p-3 text-emerald-300">Remplir databaseURL, Ctrl+F5, essayer un autre réseau</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/40">
                    <td className="p-3 font-semibold text-amber-400">Console : PERMISSION_DENIED</td>
                    <td className="p-3 text-zinc-400">Règles non publiées ou mal collées</td>
                    <td className="p-3 text-emerald-300">Recoller les règles sous l'onglet Règles et cliquer Publier</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/40">
                    <td className="p-3 font-semibold text-amber-400">« Salle introuvable » sur un téléphone</td>
                    <td className="p-3 text-zinc-400">Code mal tapé ou mauvais domaine</td>
                    <td className="p-3 text-emerald-300">Scanner le QR code directement</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/40">
                    <td className="p-3 font-semibold text-amber-400">Un joueur a perdu sa carte (onglet fermé)</td>
                    <td className="p-3 text-zinc-400">Fermeture inopinée de l'onglet</td>
                    <td className="p-3 text-emerald-300">Rouvrir le lien et retaper exactement le même prénom (reconnexion automatique)</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/40">
                    <td className="p-3 font-semibold text-amber-400">La nuit est bloquée sur une étape</td>
                    <td className="p-3 text-zinc-400">Téléphone d'un joueur en veille</td>
                    <td className="p-3 text-emerald-300">Cliquer sur le bouton « Passer cette étape » sur l'écran meneur</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/40">
                    <td className="p-3 font-semibold text-amber-400">Les téléphones ne se mettent plus à jour</td>
                    <td className="p-3 text-zinc-400">Wi-Fi de l'école qui coupe les connexions WebSocket</td>
                    <td className="p-3 text-emerald-300">Passer en 4G ou partage de connexion 4G</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: BATTERIE DE PROMPTS IA */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              {[
                {
                  title: 'Plan de test complet (Page 7)',
                  text: `You are a QA engineer. Attached is index.html, a single-file multiplayer Werewolf game (Firebase Realtime Database, with a local mode that syncs browser tabs when the Firebase config is empty). The host screen is projected; each player joins on a phone with a 4-letter room code or a QR code.\n\nWrite a manual test plan as a table: ID, feature, steps, expected result. Cover room creation, joining, role distribution, every night step (Seer, Werewolves, Witch), the day vote, automatic vote closing, win screens and "New game". Keep each test under 2 minutes.`,
                },
                {
                  title: 'Analyse des 15 cas limites (Page 7)',
                  text: `Read the attached index.html and list the 15 edge cases most likely to break a live game with 15 students. For each one, explain what happens in the current code and whether it is handled. Examples to consider: two players with the same name, a player who joins after roles are dealt, a phone that goes to sleep during the night, a tie vote, the host refreshing the page, a Werewolf who is the last player alive.`,
                },
                {
                  title: 'Simulation d’une partie pas à pas (Page 7)',
                  text: `Simulate a full game of the attached Werewolf app with 6 players: [Alice, Bilal, Chloé, Driss, Emma, Farid]. Assign roles the way the code would, then walk through each night and day, showing what the host screen and each phone display at every step, and the exact data written under rooms/ABCD in Firebase. Stop and flag anything in the code that would not behave as a player expects.`,
                },
                {
                  title: 'Sécurité : Comment un apprenant curieux pourrait tricher (Page 9)',
                  text: `Act as a curious student who wants to cheat in this browser-based Werewolf game. List every way to see hidden roles, change votes or skip the night using only the browser DevTools. For each trick, rate how easy it is and how to block it. I will use this as a security lesson, so explain each one for beginner web developers.`,
                },
              ].map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-300">{p.title}</h4>
                    <button
                      onClick={() => handleCopy(p.text, idx)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier le prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                    {p.text}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: DÉFIS APPRENANTS DWWM */}
          {activeTab === 'defis' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
                Ces défis sont conçus pour les apprenants de la formation DWWM (Développeur Web et Web Mobile) pour approfondir le JavaScript moderne, la synchronisation temps réel et la sécurité.
              </div>

              {[
                {
                  num: 'Défi 1',
                  titre: 'Ajout du rôle Chasseur / Cupidon (Page 10)',
                  desc: 'Ajouter les rôles avec la gestion de l’amitié inséparable et le tir ultime lors de la mort.',
                  statut: 'Déjà intégré dans notre moteur !',
                },
                {
                  num: 'Défi 2',
                  titre: 'Reconnexion automatique fiable (Page 10)',
                  desc: 'Stocker un player ID dans localStorage, restaurer la session au rechargement sans obliger le joueur à retaper son prénom.',
                  statut: 'Déjà intégré dans notre moteur !',
                },
                {
                  num: 'Défi 3',
                  titre: 'Durcissement des règles de sécurité (Page 9)',
                  desc: 'Empêcher la lecture des rôles d’autrui dans l’onglet Réseau avec Authentification Anonyme Firebase.',
                  statut: 'Prêt pour déploiement dans database.rules.json !',
                },
                {
                  num: 'Défi 4',
                  titre: 'Accessibilité & Vidéoprojecteur (Page 10)',
                  desc: 'Contrastes élevés, tailles de police adaptées pour être lisibles à 6 mètres depuis le fond de la classe.',
                  statut: 'Validé sur écran Host !',
                },
              ].map((d, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">{d.num}</span>
                    <h4 className="font-bold text-white text-sm my-0.5">{d.titre}</h4>
                    <p className="text-xs text-zinc-400">{d.desc}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 font-bold shrink-0 ml-4">
                    {d.statut}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
