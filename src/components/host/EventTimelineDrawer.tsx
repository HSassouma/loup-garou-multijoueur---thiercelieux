import React from 'react';
import { TimelineEvent } from '../../types/game';
import { Clock, ShieldAlert, CheckCircle, X } from 'lucide-react';

interface EventTimelineDrawerProps {
  events: TimelineEvent[];
  onClose: () => void;
}

export const EventTimelineDrawer: React.FC<EventTimelineDrawerProps> = ({ events, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-900 border-l border-zinc-700 p-6 text-white shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-gothic text-base font-bold text-amber-200">
              Chronologie & Journal de Régie
            </h3>
            <p className="text-[11px] text-zinc-400">
              Historique temporel certifié des actions de la partie
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            Aucun événement enregistré pour l'instant.
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className={`p-3 rounded-2xl border text-xs space-y-1 transition-all ${
                ev.isPublic
                  ? 'bg-zinc-950/80 border-zinc-800 text-zinc-200'
                  : 'bg-purple-950/30 border-purple-500/30 text-purple-200'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span className="font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {ev.phase}
                </span>
              </div>
              <p className="font-medium text-zinc-200">{ev.message}</p>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-zinc-800 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
