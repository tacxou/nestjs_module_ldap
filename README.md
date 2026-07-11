<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  A LDAP module for the NestJS framework (Node.js) built on top of
  <a href="https://github.com/ldapts/ldapts">ldapts</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/org/tacxou"><img src="https://img.shields.io/npm/v/@tacxou/nestjs_module_ldap.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/org/tacxou"><img src="https://img.shields.io/npm/l/@tacxou/nestjs_module_ldap.svg" alt="Package License" /></a>
  <a href="https://github.com/tacxou/nestjs_module_ldap/actions/workflows/ci.yml"><img src="https://github.com/tacxou/nestjs_module_ldap/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
</p>

## Overview

`@tacxou/nestjs_module_ldap` registers one or more LDAP connections inside a NestJS
application. It wraps [ldapts](https://github.com/ldapts/ldapts) clients in a
`LdapManager`, exposes them through Nest dependency injection, and optionally
performs an initial bind when the module boots.

## Installation

Install the library together with its peer dependencies:

```bash
npm install @tacxou/nestjs_module_ldap ldapts
# or
yarn add @tacxou/nestjs_module_ldap ldapts
```

Supported NestJS versions: `^6`, `^7`, `^8`, `^9`, and `^10`.

## Quick start

Register the module in your root `AppModule` with synchronous configuration:

```typescript
import { Module } from '@nestjs/common'
import { LdapModule } from '@tacxou/nestjs_module_ldap'

@Module({
  imports: [
    LdapModule.forRoot({
      config: {
        clients: [
          {
            name: 'default',
            default: true,
            options: { url: 'ldap://ldap.example.com:389' },
            bind: {
              dn: 'cn=service,dc=example,dc=com',
              password: process.env.LDAP_PASSWORD,
            },
          },
        ],
      },
    }),
  ],
})
export class AppModule {}
```

Inject the manager anywhere in your application:

```typescript
import { Injectable } from '@nestjs/common'
import { InjectLdap, LdapManager } from '@tacxou/nestjs_module_ldap'

@Injectable()
export class UsersService {
  constructor(@InjectLdap() private readonly ldap: LdapManager) {}

  async findUser(dn: string) {
    const client = this.ldap.defaultClient
    const { searchEntries } = await client.search(dn, {
      scope: 'base',
      filter: '(objectClass=*)',
    })
    return searchEntries[0]
  }
}
```

## Configuration

### `LdapModuleOptions`

| Field | Type | Description |
| --- | --- | --- |
| `config.clients` | `LdapClientOptions[]` | List of named LDAP connections to create at startup. |

### `LdapClientOptions`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | Connection identifier used with `@InjectLdap(name)`. |
| `options` | `ClientOptions` | yes | ldapts client options (`url`, TLS settings, timeouts, …). |
| `default` | `boolean` | no | Marks the default client returned by `ldap.defaultClient`. When only one client is configured, it becomes the default automatically. |
| `bind` | `{ dn, password?, controls? }` | no | Optional bind performed during module initialization. |

`ClientOptions`, `DN`, `Control`, and other ldapts symbols are re-exported from the package entry point.

## Registration modes

### Synchronous — `LdapModule.forRoot(options, connection?)`

Use when configuration is known at compile time or can be read synchronously from
`process.env`.

```typescript
LdapModule.forRoot({
  config: {
    clients: [
      {
        name: 'primary',
        options: { url: 'ldap://localhost:389' },
      },
    ],
  },
})
```

### Asynchronous — `LdapModule.forRootAsync(options, connection?)`

Use with `@nestjs/config`, a secrets manager, or any async provider.

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LdapModule } from '@tacxou/nestjs_module_ldap'
import type { ClientOptions } from 'ldapts'

@Module({
  imports: [
    ConfigModule.forRoot(),
    LdapModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: {
          clients: [
            {
              name: 'default',
              options: config.get<ClientOptions>('ldap.options'),
              bind: {
                dn: config.get<string>('ldap.bindDn'),
                password: config.get<string>('ldap.bindPassword'),
              },
            },
          ],
        },
      }),
    }),
  ],
})
export class AppModule {}
```

#### `useClass` and `useExisting`

You can also delegate option building to a dedicated factory class:

```typescript
import { Injectable } from '@nestjs/common'
import type { LdapModuleOptions, LdapModuleOptionsFactory } from '@tacxou/nestjs_module_ldap'

@Injectable()
export class LdapConfigService implements LdapModuleOptionsFactory {
  createLdapModuleOptions(): LdapModuleOptions {
    return {
      config: {
        clients: [{ name: 'default', options: { url: 'ldap://localhost:389' } }],
      },
    }
  }
}

// AppModule
LdapModule.forRootAsync({
  imports: [LdapConfigModule],
  useExisting: LdapConfigService,
})
```

## Multiple connections

Register additional connections by passing a connection name as the second
argument to `forRoot` / `forRootAsync`, then inject them with `@InjectLdap(name)`:

```typescript
@Module({
  imports: [
    LdapModule.forRoot(primaryOptions),
    LdapModule.forRoot(secondaryOptions, 'reporting'),
  ],
})
export class AppModule {}

@Injectable()
export class ReportingService {
  constructor(@InjectLdap('reporting') private readonly ldap: LdapManager) {}
}
```

Each registration is global: once imported, the connection is available application-wide.

## `LdapManager` API

| Member | Description |
| --- | --- |
| `defaultClient` | The ldapts `Client` marked as default (or the only configured client). |
| `clients` | `Map` of all registered clients keyed by connection name. |
| `initialized` | `true` after the optional startup bind phase completes. |
| `getClient(name)` | Returns a client by name; throws if the connection does not exist. |
| `initialize()` | Binds every client that declares `bind` credentials. Called automatically by the module. |

## Public exports

The package entry point exposes:

- `LdapModule`
- `LdapManager`
- `InjectLdap()`
- Configuration interfaces (`LdapModuleOptions`, `LdapClientOptions`, …)
- DI token helpers (`getLdapConnectionToken`, `getLdapOptionsToken`)
- Selected ldapts types and classes (`Client`, `ClientOptions`, `DN`, …)

## Example: per-request user bind

The repository includes an illustrative middleware in `examples/ldap.middleware.ts`
that decrypts a password and binds the default LDAP client for the current request.
Adapt it to your authentication flow and secret management practices.

## Development

```bash
yarn install
yarn test          # unit tests
yarn test:coverage # tests with coverage report
yarn build         # compile TypeScript to dist/
yarn lint          # ESLint on src/
```

## License

MIT — see [LICENSE](LICENSE).
