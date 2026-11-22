# Vyra mobile

Application mobile de Vyra : voir d'où vient une information et la faire juger sur pièces.
Expo SDK 58, React Native et Expo Router (versions exactes dans `package.json` et le lockfile). Le client réutilise le métier du site, sans seconde base ni IA embarquée. Elle lit l'API du site (`/api/v1`, voir `docs/API-MOBILE.md` du dépôt `vyra`).

Ce document décrit les écrans de `main` relus le 22 novembre 2026. La version installée peut différer tant qu’elle n’a pas été reconstruite avec ce code.

## Écrans

| Onglet | Rôle |
|---|---|
| Fil | le fil d'actualité rangé par le site (Madagascar ou monde), avec l'état de vérification de chaque publication |
| Enquêtes | les affaires et le formulaire « Nouvelle analyse » ; le dossier suit l'ordre de la page du site : conclusion, sceau (code et QR à partager), What If ?, recherche web, « Déjà vérifiée ailleurs ? », versions retrouvées, pièces |
| Scan | sept onglets : image, vidéo, vocal, lien, texte, « Est-ce bien eux ? » (le message comparé à l’annuaire officiel), sceau reçu |
| Alertes | signaler un contenu, suivre ses signalements ; une vue pour les vérificateurs |
| Compte | le profil et son rôle, les réglages de lecture du site (thème, taille du texte, mode éco, Sans IA), l'annuaire officiel, se déconnecter |

L'assistant est un bouton flottant, présent sur les onglets, le dossier d'une affaire et l'annuaire :
il affiche la réponse, les affaires citées et les propositions de navigation. Le serveur peut désormais renvoyer aussi `references`, `autorun` et `searchNotice` ; leur affichage et l’ouverture automatique ne sont pas encore implémentés dans ce client. La conversation vocale continue est actuellement une interface du site. Le tribunal et les jeux restent sur le site.

La connexion se fait avec l'e-mail et le mot de passe du site (inscription, mot de passe oublié et comptes de démo compris) ; le jeton est gardé sur le téléphone
par Expo SecureStore (`src/lib/session.tsx`, `src/lib/kv.ts`).

Comme sur le site, ce que l'IA a lu ou rédigé est encadré en pointillés (`src/ui/ai-reading.tsx`) ;
les faits gardent un trait plein. Le mode Sans IA (écran Compte) masque ces blocs partout.
Les photos et vidéos se choisissent avec `expo-image-picker` ; la copie protégée et les images
clés se partagent avec `expo-sharing` ; le QR du sceau est dessiné avec `qrcode`.

## Lancer

```bash
npm install --legacy-peer-deps
cp .env.example .env.local   # puis y mettre l'adresse du site Vyra
npx expo start
```

`EXPO_PUBLIC_API_URL` : l'adresse du site (par défaut `http://localhost:3000`). Sur un téléphone
Android branché à l'ordinateur : `adb reverse tcp:3000 tcp:3000`.

## Aperçu dans le navigateur

```bash
npx expo start --web
```

Puis http://localhost:8081 (le premier chargement construit le bundle : environ une minute). L'API du site
doit autoriser le navigateur (CORS, déjà fait dans `vyra/web/next.config.ts`). Sur le web, la session est
gardée dans `localStorage` (`src/lib/kv.web.ts`).

## Vérifier

```bash
npx tsc --noEmit
npm test
npx expo lint
```

Le design est « encre et papier » : l’encre est l’action, la couleur réservée aux verdicts (toujours avec une icône et un mot). Couleurs dans `src/lib/tokens.ts`, composants dans `src/ui/ui.tsx`, en-tête dans `src/components/app-header.tsx`.

## Périmètre et dépendances réseau

Le client possède les sept onglets de scan, les alertes, l’annuaire, les sceaux et les outils
d’enquête. Le tribunal interactif (audience et vote) et les jeux n’ont pas de routes natives dédiées.
Le contrat des routes est dans [API-MOBILE.md](https://github.com/0nlyDevs/vyra/blob/main/docs/API-MOBILE.md).
Une route serveur disponible n’implique pas que chaque nouveau champ de réponse est déjà traité
par le client : c’est notamment le cas des sources web et de la navigation immédiate de l’assistant.

Sans réseau, ce client ne vérifie pas de nouvelles informations : il dépend du serveur web.
Les réponses IA de secours sont un comportement du serveur, pas un mode hors ligne natif.
Le mode Sans IA masque les lectures, sans désactiver à lui seul les requêtes.

La CI de `.github/workflows/check.yml` vérifie types et tests ; `npm run lint` reste à lancer
localement. Cette branche ne contient pas de workflow de génération automatique d’APK.
