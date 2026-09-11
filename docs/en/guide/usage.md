# Usage

## Register a connection

```ts
import { Module } from '@nestjs/common'
import { LdapModule } from '@tacxou/nestjs_module_ldap'

@Module({
  imports: [
    LdapModule.forRoot({
      config: {
        clients: [
          {
            name: 'default',
            options: { url: 'ldap://localhost:389' },
            default: true,
          },
        ],
      },
    }),
  ],
})
export class AppModule {}
```

## Inject the manager

```ts
import { Injectable } from '@nestjs/common'
import { InjectLdap, LdapManager } from '@tacxou/nestjs_module_ldap'

@Injectable()
export class DirectoryService {
  constructor(@InjectLdap() private readonly ldap: LdapManager) {}
}
```

See the README for named connections, asynchronous configuration, and middleware integration.
