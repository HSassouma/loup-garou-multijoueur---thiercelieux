# Loup-Garou de Thiercelieux — Plateforme Multijoueur Premium

Plateforme web multijoueur professionnelle, immersive, cinématographique et temps réel pour le jeu des **Loups-Garous de Thiercelieux**, développée selon les standards architecturaux et ergonomiques les plus exigeants.

---

## 🐺 Synthèse des Fonctionnalités Implémentées

### 1. Rôles & Factions (Système Modulaire et Équilibré)
- **Loups-Garous :** Délibération secrète de meute en direct, vote synchronisé entre congénères.
- **Simple Villageois :** Débats oratoires et vote au tribunal populaire.
- **Voyante :** Révélation instantanée et strictement privée de l'identité d'un suspect.
- **Sorcière :** Gestion persistante de ses 2 fioles alchimiques (Guérison pour sauver la proie des loups, Poison pour éliminer un suspect).
- **Chasseur :** Phase d'interruption prioritaire avec tir ultime en cas de mort.
- **Cupidon :** Désignation des deux amoureux inséparables avec cascade de mort récursive par chagrin d'amour.
- **Petite Fille :** Capacité d'espionnage discret de la meute.
- **Salvateur (Nouveau) :** Bouclier protecteur déployé chaque nuit avant les loups. Règle stricte : interdiction de protéger la même personne deux nuits consécutives.
- **Corbeau (Nouveau) :** Lettre anonyme accusatrice déposée de nuit infligeant 2 voix de pénalité immédiates au vote diurne.

### 2. Modes de Jeu
- **Classique :** Durée de débat 180s, enchaînement standard de Thiercelieux.
- **Rapide Blitz :** Débat accéléré 60s, vote express 30s.
- **Personnalisé :** Ajustement libre du nombre de chaque rôle avec calculatrice d'équilibrage et validation de conformité.
- **Académie (Entraînement) :** Guide interactif complet pour débutants avec grimoire des rôles et déroulement pas-à-pas.
- **Écran Spectateur Public :** Affichage assaini pour grand écran masquant rigoureusement les cartes secrètes et actions nocturnes jusqu'à la fin de la partie.

### 3. Audio & Ambiance Cinématographique
- **Mixeur Audio Multi-Canal :** Contrôle indépendant des volumes Général, Voix du Narrateur, Bruitages (SFX) et Musique d'Ambiance.
- **Ambiance procédurale (Web Audio API) :** Nappe sonore nocturne mystique générée sans fichier externe lourd.
- **Bruitages procéduraux par rôle :** Hurlement de loup, glas mortuaire, tintement mystique de la Voyante, armement métallique du Chasseur, cliquetis de bouclier du Salvateur, chant du coq à l'aube, fanfare de victoire.
- **Synthèse Vocale (`Web Speech API`) :** Annonces dramatiques du narrateur en français adaptées au contexte.

### 4. Profils Joueurs, Hauts Faits & Historique
- **Profil Persistant :** Pseudo modifiable, sélecteur d'avatar (12 emblèmes médiévaux).
- **Système de Hauts Faits (Achievements) :** 9 récompenses certifiées débloquées sur événements réels du jeu (Première Victoire, Chef de Meute, Sauveur du Village, Amour Éternel, Clairvoyance Absolue, Ultime Cartouche, Bouclier Céleste, Alchimiste Suprême, Dernier Survivant).
- **Historique des Parties :** Enregistrement local des 30 dernières parties avec durée, mode, rôles et vainqueur.

### 5. Outils Régie & Journal Chronologique
- **Régie Meneur Avancée :** Affichage haute visibilité pour vidéoprojecteur, QR code dynamique scannable à distance, minuteur synchronisé.
- **Chronologie des Événements :** Journal d'audit horodaté retraçant chaque phase, décision et élimination.
- **Simulateur de Bots QA :** Injection instantanée des 6 joueurs du guide (*Alice, Bilal, Chloé, Driss, Emma, Farid*) ou d'une classe entière de 15 apprenants, exécution automatique de la nuit et votes aléatoires.
- **Règles Firebase Durcies :** Modèle de règles RTDB avec Authentification Anonyme empêchant l'inspection des rôles secrets via les DevTools.

---

## 🚀 Commandes d'Exécution & Vérification

```bash
# Lancer l'application en développement
npm run dev

# Exécuter la suite complète de tests unitaires (Node test runner)
npx --yes tsx --test src/game/rules.test.ts

# Linter TypeScript
npm run lint

# Compiler l'application pour la production
npm run build
```

---

## 🧪 Résultats des Tests

- **Tests unitaires (`src/game/rules.test.ts`) :** 9/9 tests passés en 210 ms.
- **Validation TypeScript (`tsc --noEmit`) :** 0 erreur.
- **Tests de rendu multi-écrans :** Vidéoprojecteur (1440x900), Smartphone mobile (390x844), Écran scindé (Splitscreen), et Écran Spectateur validés.
