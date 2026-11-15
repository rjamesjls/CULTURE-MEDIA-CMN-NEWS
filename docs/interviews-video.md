# Studio d’interviews vidéo

## Accès

- Studio administrateur : `/admin/interviews/video`, accessible depuis « Interviews vidéo » dans le tableau de bord.
- Invité : `/interviews?room=<id>&invite=1#<invitation>`. Le jeton est retiré de la barre d’adresse après ouverture et conservé uniquement dans la session du navigateur. Aucun compte administrateur n’est nécessaire.
- La rubrique existante `/admin/interviews` (campagnes et questionnaires) est conservée.

Le studio est indépendant de la radio. Aucun appel n’est diffusé sur l’antenne. Il utilise l’authentification administrateur existante et la connexion PostgreSQL `RADIO_DATABASE_URL`, avec ses propres tables dans `afoluku_interviews`. Le schéma et la table sont initialisés au premier accès avec `CREATE IF NOT EXISTS` ; le rôle PostgreSQL doit pouvoir créer ce schéma. Aucune table de la radio ou des campagnes n’est modifiée.

## Utilisation

1. Créer une interview avec un titre et son nom.
2. Copier le lien d’invitation et l’envoyer à son interlocuteur, ou ouvrir l’e-mail prérempli puis choisir son destinataire et l’envoyer. Un salon accueille un animateur et un invité.
3. Préparer le micro et la caméra, puis ouvrir le studio. L’invité indique son nom, accepte l’éventualité d’un enregistrement et rejoint l’appel.
4. Choisir l’écran partagé, l’animateur seul, l’invité seul ou l’incrustation. Ces choix pilotent le rendu et l’enregistrement de l’animateur ; l’invité conserve son aperçu d’appel.
5. Enregistrer des scènes nommées dans « Mes scènes » pour retrouver une disposition et son cadre (12 scènes, stockage dans ce navigateur). Activer ou retirer l’habillage ; un cadre PNG/WebP transparent de 1920 × 1080 peut être ajouté (10 Mo max). Sans habillage, le même montage est enregistré sans titres ni cadre.
6. Enregistrer, changer de scène à volonté, puis arrêter et télécharger la prise. Le participant voit un indicateur d’enregistrement.
7. Terminer l’interview pour révoquer le lien. Les invitations expirent au bout de 24 heures et peuvent être renouvelées avant connexion d’un invité.

## Vidéo et réseau

WebRTC transmet directement les deux flux, sans enregistrer les médias sur le serveur. La signalisation HTTPS utilise une offre/réponse SDP et une présence rafraîchie toutes les deux secondes. La prise de parole et la vidéo ne dépendent pas de cette fréquence une fois l’appel établi. Les identifiants de session empêchent un second invité de prendre une place occupée ; les offres périmées sont refusées.

STUN est configuré par défaut. Pour les réseaux restrictifs (notamment certains mobiles et réseaux d’entreprise), configurer un service TURN avec les variables serveur Vercel suivantes, puis redéployer :

- `INTERVIEW_TURN_URL` : URL `turn:` ou `turns:` ; plusieurs URL séparées par une virgule.
- `INTERVIEW_TURN_USERNAME`
- `INTERVIEW_TURN_CREDENTIAL`

Les informations TURN sont transmises uniquement aux participants disposant d’une invitation valide et aux administrateurs. Utiliser un compte limité dédié à cette application. Sans relais, les connexions directes peuvent fonctionner mais les appels entre tous les réseaux ne sont pas garantis. Le studio affiche cet état et fournit un bouton Reconnecter.

## Enregistrement et limites

Le rendu local utilise un canvas 1920 × 1080 à 30 images/s et un mixage des deux voix via Web Audio. MP4 est choisi lorsque le navigateur sait l’enregistrer, sinon WebM. Aucun faux changement d’extension. Les vidéos sources sont ajustées entièrement dans chaque cadre.

Les prises sont conservées dans IndexedDB dans le navigateur de l’animateur, et peuvent être téléchargées et supprimées. Elles ne sont pas sauvegardées dans le cloud. En cas de quota local atteint, la prise reste téléchargeable pendant la session. Téléchargez avant de fermer l’onglet. Une prise est arrêtée automatiquement à 30 minutes ou 500 Mo pour limiter l’utilisation mémoire. Garder l’onglet visible ; les navigateurs peuvent ralentir le canvas en arrière-plan. Un casque évite de réinjecter le son de l’invité dans le microphone.

## Vérification

`npm run test:interviews` vérifie les permissions, l’origine des requêtes, les invitations hachées, le consentement de l’invité, l’occupation d’un salon, la signalisation, l’indicateur d’enregistrement, la révocation et l’expiration sur PostgreSQL local.
