# Vyra mobile

Application mobile de Vyra : voir d'où vient une information et la faire juger sur pièces.
Expo (React Native), Expo Router. Elle lit l'API du site (`/api/v1`, voir `docs/API-MOBILE.md` du dépôt `vyra`).

## Écrans

| Onglet | Rôle |
|---|---|
| Fil | le fil d'actualité (Madagascar ou monde), avec l'état de vérification de chaque publication |
| Affaires | les affaires ; le dossier montre la conclusion, What If ?, les versions retrouvées, les pièces |
| Vérifier | un texte ou un lien reçu : affaire déjà jugée, signes d'alerte, vérifications publiées |
| Assistant | des questions, des réponses qui citent les affaires jugées |
| Compte | le profil, le serveur, se déconnecter |

La connexion se fait avec l'e-mail et le mot de passe du site ; le jeton est gardé sur le téléphone
(`src/lib/session.tsx`).

## Lancer

```bash
npm install --legacy-peer-deps
EXPO_PUBLIC_API_URL=http://<adresse du site Vyra> npx expo start
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

Le thème est dans `src/lib/tokens.ts` (encre, papier, accent rouge).

## Pas encore

Scan d'image ou de son, tribunal (audience et vote), alertes, jeu : l'API du site ne les expose pas encore.
