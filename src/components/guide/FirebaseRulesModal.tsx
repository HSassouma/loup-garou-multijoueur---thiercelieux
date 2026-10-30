import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, X, AlertTriangle } from 'lucide-react';

interface FirebaseRulesModalProps {
  onClose: () => void;
}

export const FirebaseRulesModal: React.FC<FirebaseRulesModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const rulesJson = `{
  "rules": {
    "rooms": {
      "$code": {
        // Métadonnées publiques de la salle (phase, minuteur, nombre de joueurs)
        "meta": {
          ".read": true,
          ".write": "auth != null && auth.uid === data.child('hostId').val()"
        },
        // Liste publique des joueurs (sans exposer le rôle secret !)
        "publicPlayers": {
          ".read": true,
          "$playerId": {
            ".write": "auth != null && (auth.uid === $playerId || auth.uid === root.child('rooms').child($code).child('meta/hostId').val())"
          }
        },
        // Rôles privés : chaque joueur ne peut lire QUE son propre rôle !
        "private": {
          "roles": {
            "$playerId": {
              ".read": "auth != null && (auth.uid === $playerId || auth.uid === root.child('rooms').child($code).child('meta/hostId').val())",
              ".write": "auth != null && auth.uid === root.child('rooms').child($code).child('meta/hostId').val()"
            }
          },
          // Actions nocturnes protégées
          "actions": {
            "wolfVotes": {
              // Seuls les loups-garous peuvent lire ou voter
              ".read": "auth != null",
              "$playerId": {
                ".write": "auth != null && auth.uid === $playerId"
              }
            },
            "seerInspect": {
              ".read": "auth != null && auth.uid === $playerId",
              ".write": "auth != null && auth.uid === $playerId"
            }
          },
          // Votes diurnes
          "votes": {
            ".read": true,
            "$playerId": {
              ".write": "auth != null && auth.uid === $playerId"
            }
          }
        }
      }
    },
    ".read": false,
    ".write": false
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-gothic text-lg font-bold text-amber-200">
                Règles de Sécurité Firebase Durcies
              </h3>
              <p className="text-xs text-zinc-400">
                Protection anti-triche : les apprenants ne peuvent plus inspecter les rôles d'autrui
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 p-3 rounded-2xl bg-amber-950/40 border border-amber-600/30 flex items-start gap-3 text-xs text-amber-200/90">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong>Pourquoi remplacer les règles simples par celles-ci ?</strong>
            <p className="mt-1 leading-relaxed">
              Dans la version simplifiée du guide, <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">.read: true</code> permet à n'importe quel élève ouvrant les DevTools de lire les cartes secrètes de toute la classe. Cette configuration sépare l'état public des rôles privés en utilisant Firebase Anonymous Auth.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-300">database.rules.json</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Règles copiées !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier les règles</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-black/70 rounded-2xl p-4 border border-zinc-800 font-mono text-[11px] text-zinc-300">
          <pre>{rulesJson}</pre>
        </div>

        <div className="pt-4 mt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
