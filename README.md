# VINASOUND — Vidéos et Lives

Application VINASOUND. Les deux espaces sont rangés dans des dossiers séparés pour pouvoir être
téléchargés et repris indépendamment.

## Où se trouve quoi

| Dossier | Ce qu'il contient |
| --- | --- |
| `src/videos/` | **Espace vidéos** : fil, lecture, publication, likes et commentaires, partage, profil vidéo, durée de vie 24 h |
| `src/lives/` | **Espace lives** : découverte des lives, salle, scène, invités, cadeaux, réglages du direct |
| `src/shared/` | **Socle commun** : session, navigation, image VINASOUND, boutons de partage, utilitaires |
| `src/routes/` | Les pages — une adresse = un fichier (`routeTree.gen.ts` est généré, ne pas le modifier) |
| `src/components/ui/` | Bibliothèque d'interface (boutons, boîtes de dialogue…) |
| `src/integrations/` | Accès à la base de données Lovable Cloud — fichiers générés, ne pas modifier |
| `src/test/` | Tests automatiques |

Les dossiers `src/videos/` et `src/lives/` ne s'importent jamais l'un l'autre, et `src/shared/`
n'importe ni l'un ni l'autre : `src/test/space-separation.test.ts` le vérifie à chaque test.

### Pages

- Vidéos : `/` (fil), `/publier`, `/video/{id}`, `/profil` (gestion des vidéos), `/decouvrir`, `/createur/{id}`
- Lives : `/lives` (découverte), `/live/{id}` (salle)

## Emporter uniquement l'espace vidéos

Copier dans un nouveau projet :

- `src/videos/`, `src/shared/`, `src/routes/`, `src/components/ui/`, `src/integrations/`, `src/assets/`, `src/test/`
- `src/styles.css`, `src/router.tsx`, `src/server.ts`, `src/start.ts`, `src/routeTree.gen.ts`
- les fichiers de configuration à la racine : `package.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `components.json`, `eslint.config.js`, `drizzle/`, `.env` (à compléter chez vous)

Puis supprimer `src/lives/` ainsi que les deux pages de live `src/routes/lives.tsx` et
`src/routes/live.$id.tsx`. La liste des pages se régénère toute seule au premier lancement.

L'inverse fonctionne pareil pour l'espace lives : garder `src/lives/` et les deux pages de live,
supprimer `src/videos/` et les pages vidéos.

## Télécharger le dépôt

Dans Lovable : **Project settings → Git**. Utiliser **Download codebase** pour récupérer l'archive
complète, ou connecter Git sync à votre propre compte GitHub pour cloner le dépôt avec `git clone`.

## Liaison au site audio VINASOUND

Compléter `src/shared/lib/vinasound-integration.ts` pour connecter la rubrique vidéo :

- `profileUrlTemplate` : format du profil principal, actuellement `https://vinasound.fun/{artist}`.
- `artistHandles` : correspondance entre l'identifiant du propriétaire vidéo et son nom exact sur le site principal (par exemple `ABOULE9`). Aucun compte invité n'est lié automatiquement à un artiste.
- `useProfileUsername` : laisser `false` tant que les noms des profils vidéo ne sont pas fournis par une liaison d'identité vérifiée. Activer seulement lorsque ces noms sont les identifiants artistes du site principal.
- `followUrlTemplate` : adresse de la page d'abonnement du site principal, avec `{artist}`. Vide par défaut. Cette page doit vérifier la session VINASOUND et confirmer l'abonnement elle-même. Le bouton + ouvre cette page ; il n'enregistre pas d'abonnement dans la rubrique vidéo.
- `accountUrl` : adresse de gestion du compte principal, vide jusqu'à sa configuration.

Ces réglages sont publics : ne jamais y mettre de clé privée, cookie, mot de passe ou jeton. Une
correspondance sert à la navigation, pas à prouver l'identité ni à donner accès aux vidéos privées.
La session vidéo reste distincte tant qu'un échange d'identité vérifié n'est pas ajouté. La
synchronisation automatique des comptes et abonnements n'est pas encore connectée.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48819566-d25c-4711-8b9f-e06281f86020).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitLab and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
