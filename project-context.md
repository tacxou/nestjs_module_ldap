# Contexte du projet

## Produit

- Objectif : fournir `@ficsysfr/nestjs_module_ldap`, un module NestJS réutilisable
  pour déclarer, nommer et injecter des connexions LDAP basées sur `ldapts`.
- Utilisateurs : développeurs d'applications NestJS intégrant un annuaire LDAP.
- Contraintes métier majeures : préserver l'API publique et la compatibilité avec
  NestJS 6 à 11 et `ldapts` 7 à 8 ; ne jamais exposer de secret LDAP.

## Architecture actuelle

- Applications ou services : bibliothèque npm TypeScript, sans application ni
  serveur autonome.
- Frontières importantes : `src/index.ts` définit l'API publique ;
  `LdapModule` configure l'injection NestJS ; `LdapManager` encapsule les clients
  `ldapts` ; `examples/` reste hors du package publié.
- Sources de données : annuaires LDAP fournis par les applications consommatrices.
- Intégrations externes : NestJS, `ldapts`, npm et GitHub Actions.

## Langage du domaine

Termes canoniques du métier, affûtés par le skill `domain-language` au fil des
sessions :

- **Connexion LDAP** : client `ldapts` nommé et géré par `LdapManager`.
- **Connexion par défaut** : connexion injectée lorsque aucun nom n'est fourni.
- **Jeton d'injection LDAP** : jeton NestJS résolu par `@InjectLdap(connection?)`.

## Développement

- Runtime et versions : Node.js 22 en CI avec TypeScript 6 ; NestJS 11 et
  `ldapts` 8 en développement, selon les plages déclarées dans
  `peerDependencies`.
- Package manager : Yarn Classic 1.22.22.
- Commande d'installation : `yarn install --frozen-lockfile`.
- Commande de développement : aucune commande persistante ; modifier la
  bibliothèque puis exécuter les vérifications ciblées.
- Commande de build : `yarn build`.
- Commandes de lint, de type-check et de test : `yarn lint`, `yarn build`,
  `yarn test` et `yarn test:coverage`.
- Serveur de développement lancé par : aucun.

## Conventions spécifiques

- Langue de la documentation : anglais pour la documentation publique ; français
  pour les instructions internes du dépôt.
- Conventions de code : TypeScript strict, Biome, noms de fichiers `kebab-case`
  avec préfixe `ldap.*`, imports valeur pour les classes injectées ou décorées.
- Bibliothèques imposées ou interdites : `ldapts` est le client LDAP ; éviter les
  dépendances ou wrappers supplémentaires sans bénéfice démontré.
- Documentation à maintenir avec le code : `README.md`, exemples et exports
  publics lors de toute évolution de l'API.
- Dossiers en lecture seule : `dist/` et `coverage/` sont générés ; `.fysion/`,
  ses adapters et `graphify-out/` restent locaux et confidentiels.
- Contraintes de compatibilité : Node.js 22 dans la CI, NestJS 6 à 11 et
  `ldapts` 7 à 8 selon les manifestes en vigueur.
- Exigences de sécurité ou de conformité : ne jamais versionner d'identifiants,
  mots de passe ou données d'annuaire ; signaler les vulnérabilités selon
  `SECURITY.md`.

## Livraison et exploitation

- Environnements : CI GitHub Actions et registre public npm.
- Commande de release : workflow GitHub Actions `release.yml` avec incrément
  SemVer explicite.
- Déploiement : publication du package npm après tests et build ; aucune
  infrastructure applicative n'est déployée par ce dépôt.
- Observabilité : résultats des workflows GitHub Actions et registre npm.
- Sauvegardes et rollback : historique Git et versions npm ; corriger par une
  nouvelle version SemVer plutôt que remplacer un artefact publié.

Ne consigner aucun secret dans ce fichier.
