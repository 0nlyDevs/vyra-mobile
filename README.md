# Vyra mobile

Application mobile de Vyra : voir d'où vient une information et la faire juger sur pièces.

Expo (React Native), Expo Router. Le thème est dans `src/lib/tokens.ts` (encre, papier, accent rouge).

## Lancer

```bash
npm install
EXPO_PUBLIC_API_URL=http://<adresse du serveur>:8000 npx expo start
```

`EXPO_PUBLIC_API_URL` : l'adresse de l'API que l'application appelle (voir `src/lib/config.ts`).

## Vérifier

```bash
npm run lint
npm test
```
