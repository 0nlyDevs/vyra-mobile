# Passation : parité mobile ↔ site (branche `feat/parite-site`)

> Ce fichier sert à reprendre le travail en cours. **Supprimez-le dans le dernier commit, avant de fusionner la PR.**

## La demande

Mettre l'application mobile au même niveau que le site (`0nlyDevs/vyra`, dossier `web/`), avec les mêmes noms, les mêmes mots et les mêmes règles.

- **Le tribunal et les jeux ne viennent pas sur mobile.** Leur formulation reste (« Conclusion du tribunal », « Déjà jugée par le tribunal »), mais aucun lien ne mène au tribunal.
- **Les onglets** sont Fil · Enquêtes · Scan · Alertes · Compte. L'assistant est un bouton flottant (`components/assistant-button.tsx`) qui ouvre la fenêtre modale `app/assistant.tsx`.
- **Les noms** sont ceux du site, partout.
- **Les dépendances.** `expo-document-picker` a été acceptée. Toute autre nouvelle dépendance demande l'accord de l'utilisateur.

## Règles à suivre

1. **`vyra/AGENTS.md`** (dans le dépôt du site) :
   - aucune ligne de co-auteur, de signature ou d'outil dans les commits, les PR ou les fichiers ;
   - pas de `any` ni de `console` ;
   - textes de l'interface en français, code en anglais ;
   - pas de `--force` ni de `--no-verify`.
2. **Commits conventionnels**, en français : `type(scope): description`.
   - Fusion de PR : `gh pr merge N --squash --subject "type(scope): … (#N)"`.
   - Fusion de main dans la branche : `git merge -m "chore: fusionne origin/main" origin/main`.
3. **Avant de déclarer fini** :
   - `npx tsc --noEmit`, `npx expo lint` et `npm test` passent ;
   - chaque écran est vérifié dans le navigateur (`npx expo start --web`, `localhost:8081`), à côté du site, en thème clair et sombre.
4. **Les libellés** viennent de `src/lib/domain.ts`, copie de `vyra/web/src/lib/domain.ts`. `src/lib/domain.test.ts` vérifie que les deux restent identiques ; le test est ignoré si le dépôt du site n'est pas à côté (`../vyra`).

## État au 22 novembre 2026, 09:20

**Les vérifications :**
- `tsc` et `lint` passent sans erreur ;
- `npm test` : 18 tests passent ;
- **aucun écran n'a encore été vérifié dans le navigateur.**

**Côté site :**
- Les routes `/api/v1` dont dépend le mobile sont fusionnées dans la PR #49. Elles sont décrites dans `vyra/docs/API-MOBILE.md`.
- La branche `feat/parite-mobile-2` du site ajoute `signals` à `/api/v1/scan/link`. Le mobile l'utilise déjà.

### Fait sur mobile

| Écran ou module | Fichiers |
|---|---|
| Libellés du site, avec un test anti-dérive | `lib/domain.ts`, `lib/domain.test.ts` |
| Liens du site traduits en écrans | `lib/site-links.ts` et son test |
| Préférences : thème, taille du texte, mode éco, Sans IA | `lib/preferences.tsx`, `lib/theme.ts`, `ui/ui.tsx` (`ScaledText`) |
| Onglets et bouton assistant | `app/(tabs)/_layout.tsx`, `components/assistant-button.tsx`, `app/assistant.tsx` |
| Scan, 7 onglets avec `?onglet=` | `app/(tabs)/scan.tsx`, `features/audio-scan.tsx`, `features/link-scan.tsx`, `features/text-check.tsx`, `features/seal-check.tsx` |
| Enquêtes et Nouvelle analyse | `app/(tabs)/cases.tsx`, `features/new-case.tsx` |
| Dossier d'une affaire, dans l'ordre du site | `app/case/[id].tsx`, `features/case-tools.tsx` (recherche web, « Déjà vérifiée ailleurs ? ») |
| Alertes : signaler, mes signalements, vue vérificateur | `app/(tabs)/reports.tsx` |
| Fil rangé par le serveur | `app/(tabs)/index.tsx`, `ui/feed-cards.tsx` |
| Compte : rôle en clair et réglages | `app/(tabs)/account.tsx` |
| Connexion, inscription, mot de passe oublié, comptes de démo | `app/sign-in.tsx`, `lib/session.tsx` (`startSession`) |

## Reste à faire

1. **Bouton assistant sur l'Annuaire.** Ajouter `<AssistantButton />` sur `app/directory.tsx`, comme sur `app/case/[id].tsx`.
2. **Comptes de démo.** `GET /api/v1/auth/demo` peut renvoyer un tableau ou un objet `{ profiles }`. Lancer `curl localhost:3000/api/v1/auth/demo` et simplifier `DemoAccounts` dans `sign-in.tsx` selon la réponse.
3. **Inscription.** La longueur minimale du mot de passe (8 caractères) est une supposition. La comparer à `newPassword` dans `vyra/web/src/features/auth/schema.ts`.
4. **README.** Mettre à jour le tableau « Écrans » et retirer « Pas encore ».
5. **Vérification dans le navigateur** : l'application sur `localhost:8081`, le site sur `localhost:3000`, avec `make up` puis `make seed` dans `vyra`.
   - Écrans : Fil, Enquêtes et une nouvelle analyse, dossier `00000000-0000-4000-8000-000000000002` (sceau `VY-TKHK-VEXF`), Scan (7 onglets), Alertes en citoyen puis en vérificateur (compte démo Rasoa), Compte (thème, A+, mode éco, Sans IA), Connexion, Assistant.
   - Les rangées du téléphone défilent de côté : aucune ne doit déborder.
6. **Livrer le mobile.**
   - `git fetch origin && git merge -m "chore: fusionne origin/main" origin/main`.
   - Supprimer ce fichier.
   - Pousser, mettre la PR en « prête » (`gh pr ready`), puis la fusionner en squash :
     `gh pr merge N --squash --subject "feat(parite): l'application rejoint le site … (#N)"`.
7. **Site, PR 2 (`feat/parite-mobile-2`).**
   - Mettre à jour l'étape 9 de `docs/DEMO.md` avec les nouveaux noms (Fil, Enquêtes, Assistant).
   - Lancer `make check`, fusionner `origin/main`, puis fusionner la PR en squash.
8. **Après les fusions**, revenir sur `origin/main` en local dans les deux dépôts (`git checkout --detach origin/main`).
