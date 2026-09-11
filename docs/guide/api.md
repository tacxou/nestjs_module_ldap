# API

Le point d’entrée principal réexporte les constantes, décorateurs, interfaces, gestionnaire, module et utilitaires publics.

## Module et injection

- `LdapModule` enregistre une configuration directe ou asynchrone.
- `InjectLdap(connection?)` injecte le gestionnaire de la connexion demandée.
- `LdapManager` encapsule le client `ldapts` et son cycle de vie.

## Types

- `LdapModuleOptions` décrit la configuration d’une connexion.
- `LdapModuleAsyncOptions` décrit la résolution asynchrone.
- Les exports de `ldapts` utilisés par l’API restent typés par la dépendance pair.

## Imports profonds

Les chemins historiques `dist/ldap.constants`, `dist/ldap.core-module`, `dist/ldap.decorators`, `dist/ldap.interfaces`, `dist/ldap.manager`, `dist/ldap.module` et `dist/ldap.utils` restent exposés, avec ou sans suffixe `.js` à l’exécution.
