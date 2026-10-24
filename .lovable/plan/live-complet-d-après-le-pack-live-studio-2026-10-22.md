# Live complet — d'après le pack LIVE Studio

Ce qui existe déjà : création du live, aperçu caméra/micro, diffusion navigateur ou OBS, chat en temps réel, likes, cadeaux (crédits test), masquer/bloquer un message, couper le chat, terminer le live, résumé IA des questions.

Ce qui sera ajouté, page par page du pack :

## 1. Démarrer
- Nouveaux réglages enregistrés avec le live : visibilité (Public / Abonnés / Privé), qui peut demander à monter (Tout le monde / Abonnés / Personne), places invités (1, 3, 5, 8), commentaires et cadeaux autorisés, anti-spam renforcé.
- Les règles sont vérifiées par le serveur, pas seulement à l'écran.

## 2. Côté auditeur
- Boutons Suivre, Partager (lien du live), Demander à monter, en barre flottante sur mobile par-dessus la vidéo.
- Lives Privés/Abonnés invisibles pour ceux qui n'ont pas le droit.

## 3. Demande pour monter
- Le spectateur envoie / annule sa demande ; il voit l'état (en attente, acceptée, refusée).
- L'hôte reçoit la file des demandes en direct et accepte ou refuse ; limite de places respectée.

## 4. Invité sur le LIVE
- Un invité accepté passe sur scène : sa caméra/micro est transmise à l'hôte, puis rediffusée aux spectateurs en écran partagé (grille hôte + invités).
- Contrôles invité : caméra, micro, quitter la scène. L'hôte peut retirer un invité.
- Mode audio uniquement possible.

## 5. Chat et cadeaux
- Messages de cadeaux affichés dans le chat ; animations conservées.
- Les messages des abonnés/invités mis en évidence.

## 6. Modération et fin
- Mode lent (délai entre messages), filtre des liens, signalement d'un message par les spectateurs.
- Confirmation avant « Terminer le LIVE », puis écran de fin avec récapitulatif (durée, spectateurs max, likes, cadeaux).

## Robustesse
- Reconnexion automatique du chat et de la vidéo (corrige « Erreur, reconnexion… »).
- Indicateur de qualité réseau, message clair si caméra refusée.
- Tests automatiques pour les règles : places invités, mode lent, demandes refusées si « Personne ».

## Limite à connaître
La vidéo passe directement d'appareil à appareil. C'est fiable pour quelques invités et quelques dizaines de spectateurs ; au-delà, il faudra la diffusion Cloudflare (déjà prévue via OBS), qui demande un jeton Cloudflare valide — le vôtre est actuellement bloqué par une restriction d'adresse IP.

## Détails techniques
- Migration : colonnes de réglages sur `lives` (visibility, join_policy, guest_slots, gifts_enabled, slow_mode_seconds, block_links), tables `live_join_requests` (status pending/accepted/rejected/cancelled/left), `live_reports`, `follows` si absente ; RLS hôte/demandeur ; trigger de validation des places et du mode lent/liens sur `live_messages`.
- WebRTC : étendre `browser-live.tsx` — invités en connexion pair-à-pair avec l'hôte, l'hôte relaie vers les spectateurs (signalisation via le canal Realtime existant), serveurs STUN publics.
- Abonnement Realtime avec reconnexion à backoff dans `live.$id.tsx`.
