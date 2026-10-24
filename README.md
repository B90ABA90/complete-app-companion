# VINASOUND — Vidéos

Application VINASOUND. Les deux espaces sont rangés dans des dossiers séparés pour pouvoir être
téléchargés et repris indépendamment.

## Où se trouve quoi

L'espace lives a été supprimé : l'application ne contient plus que les vidéos.

| Dossier | Ce qu'il contient |
| --- | --- |
| `src/videos/` | Fil, lecture, publication, likes et commentaires, partage, profil vidéo, durée de vie 24 h |
| `src/shared/` | Socle commun : session, navigation, image VINASOUND, partage, utilitaires |
| `src/routes/` | Les pages (`routeTree.gen.ts` est généré, ne pas le modifier) |

Pages : `/` (fil), `/publier`, `/video/{id}`, `/profil`, `/decouvrir`, `/createur/{id}`

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
