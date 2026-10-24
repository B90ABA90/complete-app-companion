# VINASOUND — Intégration de l’espace vidéos

## Contenu de cette archive

Le code source de l’application VINASOUND actuelle, avec l’espace vidéos et les dépendances partagées avec les lives. Les dépendances installées, fichiers générés, historique Git et secrets sont exclus.

Ce n’est pas un module PHP à copier dans un dossier de votre site : cette application React / TanStack Start doit être hébergée séparément. Le ZIP ne contient pas de vidéo MP4.

## Intégration au site existant

1. Déployer cette application depuis son projet Lovable, ou sur un hébergement compatible TanStack Start avec les services nécessaires configurés.
2. Ajouter sur votre site un lien « Vidéos » vers l’adresse réelle de l’application déployée. Aucune adresse publiée n’existait lors de cet export.
3. Configurer les destinations artistes et abonnements dans `src/shared/lib/vinasound-integration.ts` conformément au README. Ne pas déduire une identité artiste d’un compte invité.

Une intégration dans une iframe peut être envisagée seulement après vérification des autorisations d’affichage, du stockage de session et des permissions caméra/micro sur les domaines concernés. Elle n’a pas été vérifiée sur votre site.

## Développement local

Installer Bun, puis exécuter `bun install` et `bun run dev` à la racine du projet. Les variables publiques et serveur nécessaires doivent être fournies séparément par l’environnement d’hébergement. Aucun fichier `.env` n’est inclus.

Les modules générés de connexion au Cloud sont inclus parce que le code les importe. Leurs paramètres publics ne sont pas des clés d’administration. Ne jamais intégrer de clé privée dans le navigateur.

## Données et hébergement

Cette archive utilise le backend Lovable Cloud existant : tables, profils, politiques d’accès, fonctions SQL et bucket vidéo privé. Les données, comptes, fichiers privés et secrets ne sont pas exportés. L’ensemble de migrations Drizzle est vide pour ce remix ; il ne permet pas de recréer le backend sur une base vierge. Une installation indépendante nécessite une exportation séparée du schéma et une configuration du stockage et de l’authentification.

Les pointeurs `.asset.json` restent liés aux médias hébergés existants ; les octets de ces médias ne sont pas inclus. Les fonctions de live et d’IA nécessitent également leurs services d’origine.

Les comptes du site PHP et ceux de l’espace vidéos ne sont pas synchronisés : une liaison d’identité vérifiée reste nécessaire pour les réunir. Un cookie PHP ou un identifiant envoyé par le navigateur n’accorde pas l’accès aux contenus privés.

## Publication : vérification du 23 octobre 2026

Une courte vidéo MP4 a été envoyée réellement depuis `/publier` dans le remix actuel ; sa publication et son apparition dans le fil ont réussi sans erreur JavaScript. Le fichier exact montré sur la capture n’a pas été fourni, et la présentation de la capture diffère de celle de cette version. L’échec sur le site d’origine ne peut donc pas être déclaré corrigé à partir de ce seul test.

Le code actuel prépare déjà le profil propriétaire avant la publication, valide le fichier et limite les vidéos à 50 Mio. Les vidéos expirent après 24 heures selon les règles du backend existant.

Pour diagnostiquer l’échec sur le site d’origine, il faut sa version du formulaire, son traitement de publication et le message d’erreur du serveur, sans mots de passe ni clés privées.