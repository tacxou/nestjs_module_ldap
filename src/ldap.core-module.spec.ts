import { Module } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { LdapCoreModule } from './ldap.core-module'
import { LdapModuleOptions, LdapModuleOptionsFactory } from './ldap.interfaces'
import { LdapManager } from './ldap.manager'
import { getLdapConnectionToken, getLdapOptionsToken } from './ldap.utils'

describe('LdapCoreModule', () => {
  const ldapOptions: LdapModuleOptions = {
    config: {
      clients: [{ name: 'primary', options: { url: 'ldap://localhost:389' } }],
    },
  }

  describe('forRoot', () => {
    it('registers options and connection providers', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [LdapCoreModule.forRoot(ldapOptions)],
      }).compile()

      const options = moduleRef.get<LdapModuleOptions>(getLdapOptionsToken(undefined))
      const manager = moduleRef.get<LdapManager>(getLdapConnectionToken(undefined))

      expect(options).toEqual(ldapOptions)
      expect(manager).toBeInstanceOf(LdapManager)
      expect(manager.initialized).toBe(true)
    })

    it('supports named connections', async () => {
      const connection = 'reports'
      const moduleRef = await Test.createTestingModule({
        imports: [LdapCoreModule.forRoot(ldapOptions, connection)],
      }).compile()

      expect(moduleRef.get(getLdapOptionsToken(connection))).toEqual(ldapOptions)
      expect(moduleRef.get<LdapManager>(getLdapConnectionToken(connection))).toBeInstanceOf(LdapManager)
    })
  })

  describe('forRootAsync', () => {
    it('resolves options from a factory', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          LdapCoreModule.forRootAsync(
            {
              useFactory: () => ldapOptions,
            },
            'async-default',
          ),
        ],
      }).compile()

      const manager = moduleRef.get<LdapManager>(getLdapConnectionToken('async-default'))
      expect(manager).toBeInstanceOf(LdapManager)
      expect(manager.getClient('primary')).toBeDefined()
    })

    it('resolves options from a useClass factory', async () => {
      class LdapConfigService implements LdapModuleOptionsFactory {
        public createLdapModuleOptions(): LdapModuleOptions {
          return ldapOptions
        }
      }

      const moduleRef = await Test.createTestingModule({
        imports: [
          LdapCoreModule.forRootAsync(
            {
              useClass: LdapConfigService,
            },
            'async-class',
          ),
        ],
        providers: [LdapConfigService],
      }).compile()

      const manager = moduleRef.get<LdapManager>(getLdapConnectionToken('async-class'))
      expect(manager).toBeInstanceOf(LdapManager)
    })

    it('resolves options from a useExisting factory', async () => {
      class LdapConfigService implements LdapModuleOptionsFactory {
        public createLdapModuleOptions(): LdapModuleOptions {
          return ldapOptions
        }
      }

      @Module({
        providers: [LdapConfigService],
        exports: [LdapConfigService],
      })
      class LdapConfigModule {}

      const moduleRef = await Test.createTestingModule({
        imports: [
          LdapCoreModule.forRootAsync(
            {
              imports: [LdapConfigModule],
              useExisting: LdapConfigService,
            },
            'async-existing',
          ),
        ],
      }).compile()

      const manager = moduleRef.get<LdapManager>(getLdapConnectionToken('async-existing'))
      expect(manager).toBeInstanceOf(LdapManager)
    })
  })

  describe('createAsyncProviders', () => {
    it('throws when no async strategy is provided', () => {
      expect(() => LdapCoreModule.createAsyncProviders({})).toThrow('Invalid configuration. Must provide useFactory, useClass or useExisting')
    })

    it('registers the options factory class when useClass is selected', () => {
      class LdapConfigService implements LdapModuleOptionsFactory {
        public createLdapModuleOptions(): LdapModuleOptions {
          return ldapOptions
        }
      }

      const providers = LdapCoreModule.createAsyncProviders({ useClass: LdapConfigService })

      expect(providers).toHaveLength(2)
      expect(providers[1]).toEqual({ provide: LdapConfigService, useClass: LdapConfigService })
    })
  })
})
