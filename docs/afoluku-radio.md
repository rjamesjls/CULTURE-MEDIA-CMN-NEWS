# AFOLUKU RADIO dans AFOLUKU TV

Cette intégration porte la régie de la version Sites `c862448f70bbf7d287ca0187859da8e1d1fbe520` dans le dépôt Next.js. Elle ne charge pas le site ChatGPT dans une iframe et ne dépend ni de son authentification, ni de D1, ni de R2.

## Accès

- Écoute : `/fr/radio` et `/bsh/radio`. L’interface radio reste en français pour cette livraison.
- Régie : `/admin/webradio`, avec la connexion Supabase déjà utilisée par le site. Le profil doit avoir `role = admin` et `status = active`. Le contrôle est effectué sur la page et sur chaque opération d’administration.
- Un lien Radio est ajouté au menu. Le petit lecteur du site utilise la nouvelle programmation et continue à jouer pendant la navigation interne ordinaire. Il s’arrête quand on ouvre le lecteur complet pour éviter deux lectures simultanées.
- La régie conserve PREVIEW et ANTENNE indépendants, audio/vidéo, playlists, file réordonnable, boucle, pause/reprise, micro continu ou maintien pour parler, pochettes, logo, spectres, auditeurs, classement et catégories.

## Activation sur Vercel et Supabase

Projets indiqués par le propriétaire : Supabase **AFOLUKU TV** ; Vercel **culture-media-cmn-news** dans l’équipe `jamess-projects-94d545c9`.

Utiliser les valeurs réelles du projet existant, dans les variables d’environnement sécurisées de Vercel (et dans un fichier `.env.local` ignoré par Git pour les outils locaux). Aucun secret ne doit être ajouté au dépôt ou à la conversation.

| Variable | Utilisation |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase déjà utilisée par le site |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique existante |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur de Storage ; jamais préfixée `NEXT_PUBLIC_` |
| `RADIO_DATABASE_URL` | Connexion PostgreSQL Supabase via le pooler en mode transaction, avec TLS ; compte serveur autorisé à gérer le schéma radio |

Le pool utilise trois connexions maximum par instance et des requêtes explicitement qualifiées avec le schéma `afoluku_radio` (sans dépendre de paramètres de session dans le pooler transactionnel). Les requêtes sont paramétrées ; aucun endpoint n’accepte de SQL. Ne pas utiliser une connexion de navigateur ou le rôle `anon` pour cette variable.

1. Appliquer `supabase/migrations/20260927120000_afoluku_radio.sql` dans le projet Supabase, par l’outil habituel de migrations ou l’éditeur SQL. L’équivalent local est `node --env-file=.env.local scripts/setup-afoluku-radio.mjs`.
2. Vérifier que le bucket `afoluku-radio` est privé. Le script le crée avec une limite de 50 Mo et des types audio/vidéo/image définis.
3. Configurer les variables pour l’environnement Vercel concerné, puis déployer la branche en prévisualisation.
4. Se connecter avec un administrateur actif, importer un audio et une vidéo, lancer une file, puis contrôler `/fr/radio` dans une autre fenêtre et sur un téléphone. Tester le casque et le micro avec HTTPS.
5. Après validation, intégrer la branche au déploiement du domaine.

Si la régie indique une configuration incomplète, vérifier les variables dans **Preview** pour la branche de test, et **Production** pour le domaine. Une variable limitée à Production n’est pas accessible à une Preview. Après tout changement, créer un nouveau déploiement puis ouvrir son adresse : rafraîchir un ancien déploiement ne recharge pas les variables. La régie affiche uniquement les noms des variables manquantes aux administrateurs authentifiés ; les visiteurs reçoivent un message générique. Une panne de configuration ne doit pas proposer de se reconnecter. La connexion ouverte depuis la radio revient à `/admin/webradio`.

La migration ajoute un schéma séparé et ne supprime ni les articles, ni les profils, ni les anciennes tables `public.radio_*`. RLS est activé et aucun accès direct au schéma n’est accordé à `anon` ou `authenticated`. Les lectures publiques passent par les endpoints limités de l’application ; les mutations de gestion exigent un administrateur actif et vérifient l’origine.

## Transfert des contenus

La publication Sites et Supabase possèdent des stockages séparés. Le code seul ne transfère pas les fichiers, playlists ou historiques de la radio Sites. Cette reprise doit être organisée avant de remplacer cette radio en production ; elle n’a pas été exécutée par cette modification.

Pour la **première radio déjà présente dans ce dépôt** (`public.radio_tracks`, bucket `webradio`), l’outil `node --env-file=.env.local scripts/import-legacy-radio.mjs` liste les titres à reprendre sans écrire. Ajouter `--apply` copie les fichiers et les pochettes compatibles et crée les titres absents dans la nouvelle bibliothèque. Les titres déjà présents sont ignorés ; les anciennes données restent conservées. Les URLs externes, durées inconnues et formats non compatibles sont signalés. L’outil ne lance pas la diffusion et ne reconstitue pas de streams historiques. Il faut classer les jingles/publicités et composer les playlists après reprise.

## Stockage et limites

Les imports se font directement du navigateur vers Supabase au moyen d’une autorisation temporaire créée après vérification des droits. Vercel reçoit seulement les métadonnées et la confirmation. Le serveur contrôle la taille réellement stockée et la signature des images/vidéos ; une confirmation répétée ne crée pas de doublon. Les pistes et pochettes sont servies par redirection vers une URL signée pour que la vidéo puisse utiliser les requêtes Range de Storage. Les lecteurs Web Audio utilisent CORS.

Les segments micro WAV de 2 secondes passent par l’API (moins de 1,2 Mo chacun), sont stockés dans Supabase et les anciens segments sont supprimés progressivement. Le direct nécessite un onglet régie actif. L’envoi garde une file ordonnée et réessaie les erreurs réseau temporaires sans fermer le direct. La file est limitée à 12 extraits : une panne prolongée signale explicitement les passages non transmis. Les refus d’autorisation ou la fermeture de la session interrompent la transmission. Le lecteur télécharge les extraits manquants en parallèle et conserve une marge de lecture de 1,2 seconde ; les retards ordinaires ne sautent plus des morceaux de voix. Après relâchement du bouton de parole, le micro se coupe immédiatement et le mélange musical reste envoyé six secondes pour laisser passer la fin de la phrase. La latence réelle dépend du réseau, des régions Vercel/Supabase et du navigateur ; elle doit être mesurée sur le déploiement. Le passage automatique des titres repose sur l’horloge serveur, sans tâche cron.

Les imports abandonnés restent dans Storage et dans `afoluku_radio.uploads`. Avant une exploitation importante, prévoir une tâche de nettoyage des tickets expirés, en supprimant uniquement les objets d’un ticket sans `result_json` et jamais un média finalisé. Les statistiques conservent les mêmes limites que la version Sites : navigateurs actifs estimés, streams après 30 secondes, musique uniquement.

## Validation réalisée

- `npm run test:radio` : tests de lecture/micro et scénarios API sur un vrai moteur PostgreSQL local PGlite ; migration réexécutable, rôles, origine, conflits de version, fichier de 6 Mo, confirmation répétée, redirections, pochettes/logo, programmation, audience, classement et direct.
- `npm run build` : compilation complète avec des valeurs Supabase fictives uniquement pour le build ; aucune base de production n’a été contactée pour ces tests.
- Storage et la session Supabase sont simulés dans les tests locaux, sans accès réseau externe. Le stockage réel, les cookies, le décodage vidéo, le rendu visuel et le microphone matériel restent à vérifier dans l’environnement Vercel de prévisualisation.

Références : [limites des fonctions Vercel](https://vercel.com/docs/functions/limitations), [imports signés Supabase](https://supabase.com/docs/reference/javascript/file-buckets-uploadtosignedurl).

## Importer depuis un lien

La régie et la bibliothèque proposent **Importer depuis un lien** : coller un lien HTTPS direct vers un fichier audio/vidéo public (50 Mo maximum), puis saisir éventuellement un titre. Le navigateur télécharge le fichier sans cookies ni référent ; l’import existant vérifie la durée, stocke une copie dans Supabase et calcule la forme d’onde lorsque le format le permet. Le média rejoint la bibliothèque sans modifier la programmation à l’antenne.

L’hébergeur du fichier doit autoriser les téléchargements depuis un autre site (CORS). Sinon, télécharger le fichier sur son appareil puis utiliser l’import local. Les pages de partage, liens YouTube, fichiers protégés par connexion et flux continus ne sont pas des fichiers importables. Le téléchargement est annulable, limité à 50 Mo réels et à deux minutes ; aucun proxy serveur vers une URL arbitraire n’est ajouté.


## Caméra directement depuis la régie

Le bouton « Activer ma caméra » demande uniquement l’accès à la caméra et affiche un aperçu privé. « Passer la caméra à l’antenne » publie la caméra et le mélange audio de la régie via LiveKit. Les commandes existantes du micro restent nécessaires pour prendre la parole. OBS n’est pas requis.

Configurer un projet LiveKit Cloud (ou un serveur LiveKit avec TLS), puis ajouter dans les variables **serveur** Vercel du projet :

- `LIVEKIT_URL` : adresse `wss://…` du projet.
- `LIVEKIT_API_KEY` : clé API du projet.
- `LIVEKIT_API_SECRET` : secret associé, sans préfixe `NEXT_PUBLIC_`.

Redéployer après ajout des variables. Aucune valeur ne doit être publiée dans GitHub ou dans une conversation. Aucun abonnement ni projet LiveKit n’est créé automatiquement par l’application.

Sans configuration, l’aperçu local fonctionne ; le bouton de diffusion explique les trois variables manquantes. La table privée `afoluku_radio.camera_state` est initialisée au premier démarrage autorisé via la connexion serveur existante. Seuls les administrateurs actifs reçoivent un droit de publication ; les visiteurs ont des jetons de lecture seuls, limités à la session en cours. Les secrets restent au serveur.

Chaque direct a une salle distincte. Le studio confirme sa présence toutes les cinq secondes ; sans confirmation pendant vingt secondes, la radio revient au programme habituel. Arrêter le direct coupe les pistes publiées et ferme la salle. Fermer la caméra éteint aussi l’aperçu. Un départ de la page interrompt le direct. Le bouton général d’arrêt de la radio termine également la caméra.

Le bouton d’enregistrement actuel capture toujours **l’audio uniquement**, y compris pendant un direct caméra. Il ne produit pas de replay vidéo.

Validation à effectuer après configuration réelle : ouvrir la régie et un second navigateur auditeur, publier caméra + micro, vérifier musique/voix/image, couper/réactiver la vidéo, arrêter/reprendre, puis fermer la régie pour vérifier le retour au programme. Les tests locaux couvrent les droits, l’expiration, l’aperçu et le transport simulé ; ils ne remplacent pas ce test réseau avec les identifiants du projet.

Documentation LiveKit : https://docs.livekit.io/frontends/reference/tokens-grants/


## Cadre public 3:4 et export d’extraits

Dans Antenne, « Afficher le cadre public en 3:4 » active la présentation portrait pour tous les auditeurs (actualisation des paramètres sous environ cinq secondes). La présentation existante reste le choix par défaut. Le cadre 1080 × 1440 conserve un seul logo en haut, le titre « Extrait Radio », « cette semaine » en petit, le badge blanc sur rouge « #musique », le média, son titre, la programmation, le spectre et les temps de lecture. Sans pochette ni vidéo, le mot Radio remplace le second logo. Les commandes d’écoute restent sous le cadre.

« Exporter un extrait » sous Antenne utilise le fichier du titre courant. Le même bouton dans « Mes enregistrements » utilise une prise audio terminée dans la régie. Choisir **Audio MP3** ou **Vidéo MP4 · 1080 × 1440**, saisir Début et Fin en minutes:secondes ou en secondes, puis « Préparer l’extrait ». Le MP3 est encodé à 192 kbit/s ; le MP4 utilise H.264/AAC et contient l’habillage portrait et le son. Un enregistrement audio ne contient pas l’historique des images ou des changements de titres de l’émission : l’extrait utilise le nom de la prise et l’habillage actuel de la radio. Le téléchargement original de la prise complète reste disponible séparément.

L’export se fait localement dans le navigateur avec un lecteur distinct de l’antenne (10 minutes maximum par extrait). La vidéo est capturée en temps réel puis encodée ; garder l’onglet visible jusqu’à la fin. Le MP3 est découpé et encodé directement. La préparation est annulable et ne déplace pas la diffusion. Le téléchargement est proposé après génération, avec prévisualisation. Les fichiers ne sont pas envoyés au serveur. Télécharger les prises et exports avant de quitter la régie. Les sources sont limitées à 256 Mo ; sur un appareil peu puissant, privilégier les extraits courts.

Le moteur FFmpeg.wasm mono-thread (~32 Mo au premier export) est chargé depuis le même site. `npm run dev` et `npm run build` préparent ses fichiers statiques via `scripts/prepare-radio-encoder.mjs` ; les fichiers générés ne sont pas versionnés. Aucun secret ou réglage Vercel supplémentaire, ni en-tête COOP/COEP n’est nécessaire. Voir `/afoluku-radio/encoder/NOTICE.txt` pour les sources et licences du moteur.


## Valeurs par défaut des imports

Dans Paramètres, choisir la catégorie musicale (urbaine, traditionnelle, gospel ou « Aucune — à classer ») et enregistrer les paramètres. L’image par défaut est importée séparément (PNG/JPG/WebP, 30 Mo maximum) et enregistrée immédiatement. Ces valeurs sont appliquées par le serveur lors de la finalisation de chaque nouvel import audio ou vidéo, y compris les imports par lien. Les titres existants ne sont pas modifiés ; les catégories et pochettes restent modifiables individuellement.

Les images par défaut sont des objets immuables partagés sous `import-covers/`. Changer ou retirer le défaut ne supprime pas l’image utilisée par des titres précédents. La suppression d’un titre ou le remplacement de sa pochette ne supprime pas ces objets partagés. Leur éventuel nettoyage doit être effectué séparément après vérification des références. Aucun changement du schéma SQL n’est nécessaire : les valeurs sont conservées dans le JSON des paramètres existants.
