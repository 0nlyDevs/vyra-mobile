# Vyra mobile

Application mobile de Vyra : voir d'où vient une information et la faire juger sur pièces.
Expo (React Native), Expo Router. Elle lit l'API du site (`/api/v1`, voir `docs/API-MOBILE.md` du dépôt `vyra`).

## Écrans

| Onglet | Rôle |
|---|---|
| Fil | le fil d'actualité (Madagascar ou monde), avec l'état de vérification de chaque publication |
| Affaires | les affaires ; le dossier montre la conclusion, son sceau (code et QR à partager), What If ?, les versions retrouvées, les pièces |
| Vérifier | cinq examens : un texte ou un lien (affaire déjà jugée, signes d'alerte, vérifications publiées), une image (déjà vue, copie protégée, lecture par l'IA), une vidéo (images clés protégées, bande son transcrite), « Est-ce bien eux ? » (le message comparé à l'annuaire officiel), un sceau reçu |
| Assistant | des questions, des réponses qui citent les affaires jugées |
| Compte | le profil, le mode Sans IA, l'annuaire officiel (modifiable par un vérificateur), le serveur, se déconnecter |

La connexion se fait avec l'e-mail et le mot de passe du site ; le jeton est gardé sur le téléphone
(`src/lib/session.tsx`).

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

## Pas encore

Scan d'un vocal seul, tribunal (audience et vote), alertes, jeu : l'API du site ne les expose pas encore.
