# API

The main entry point re-exports every public constant, decorator, interface, manager, module, and utility.

## Module and injection

- `LdapModule` registers direct or asynchronous configuration.
- `InjectLdap(connection?)` injects the manager for a selected connection.
- `LdapManager` wraps the `ldapts` client and its lifecycle.

## Types

- `LdapModuleOptions` describes a connection configuration.
- `LdapModuleAsyncOptions` describes asynchronous resolution.
- `ldapts` values used by the API remain typed through the peer dependency.

## Deep imports

The historical `dist/ldap.constants`, `dist/ldap.core-module`, `dist/ldap.decorators`, `dist/ldap.interfaces`, `dist/ldap.manager`, `dist/ldap.module`, and `dist/ldap.utils` paths remain exported, with or without a `.js` runtime suffix.
