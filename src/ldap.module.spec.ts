import { Test } from '@nestjs/testing'
import { InjectLdap } from './ldap.decorators'
import { LdapManager } from './ldap.manager'
import { LdapModule } from './ldap.module'
import { getLdapConnectionToken } from './ldap.utils'

describe('LdapModule', () => {
  const ldapOptions = {
    config: {
      clients: [{ name: 'primary', options: { url: 'ldap://localhost:389' } }],
    },
  }

  it('exposes a dynamic module for forRoot', () => {
    const dynamicModule = LdapModule.forRoot(ldapOptions)

    expect(dynamicModule.module).toBe(LdapModule)
    expect(dynamicModule.imports).toHaveLength(1)
    expect(dynamicModule.exports).toEqual(expect.arrayContaining([expect.any(Function)]))
  })

  it('exposes a dynamic module for forRootAsync', () => {
    const dynamicModule = LdapModule.forRootAsync({
      useFactory: () => ldapOptions,
    })

    expect(dynamicModule.module).toBe(LdapModule)
    expect(dynamicModule.imports).toHaveLength(1)
    expect(dynamicModule.exports).toEqual(expect.arrayContaining([expect.any(Function)]))
  })

  it('wires LdapManager into the Nest DI container', async () => {
    class LdapConsumer {
      public constructor(@InjectLdap() public readonly ldap: LdapManager) {}
    }

    const moduleRef = await Test.createTestingModule({
      imports: [LdapModule.forRoot(ldapOptions)],
      providers: [LdapConsumer],
    }).compile()

    const consumer = moduleRef.get(LdapConsumer)
    expect(consumer.ldap).toBeInstanceOf(LdapManager)
    expect(consumer.ldap).toBe(moduleRef.get(getLdapConnectionToken(undefined)))
  })

  it('injects a named connection with @InjectLdap(name)', async () => {
    class LdapConsumer {
      public constructor(@InjectLdap('reports') public readonly ldap: LdapManager) {}
    }

    const moduleRef = await Test.createTestingModule({
      imports: [LdapModule.forRoot(ldapOptions, 'reports')],
      providers: [LdapConsumer],
    }).compile()

    const consumer = moduleRef.get(LdapConsumer)
    expect(consumer.ldap).toBe(moduleRef.get(getLdapConnectionToken('reports')))
  })
})
