# Utilisation

## Enregistrer une connexion

```ts
import { Module } from '@nestjs/common'
import { LdapModule } from '@ficsysfr/nestjs_module_ldap'

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

## Injecter le gestionnaire

```ts
import { Injectable } from '@nestjs/common'
import { InjectLdap, LdapManager } from '@ficsysfr/nestjs_module_ldap'

@Injectable()
export class DirectoryService {
  constructor(@InjectLdap() private readonly ldap: LdapManager) {}
}
```

Consultez le README pour les connexions nommées, la configuration asynchrone et l’exemple de middleware.
