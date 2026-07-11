import { DynamicModule, Global, Module, Provider } from '@nestjs/common'
import { LdapModuleAsyncOptions, LdapModuleOptions, LdapModuleOptionsFactory } from './ldap.interfaces'
import { createLdapConnection, getLdapConnectionToken, getLdapOptionsToken } from './ldap.utils'

@Global()
@Module({})
export class LdapCoreModule {
  /**
   * Register the LdapModule with the provided options
   *
   * @param options LdapModuleOptions
   * @param connection string
   * @returns DynamicModule
   */
  public static forRoot(options: LdapModuleOptions, connection?: string): DynamicModule {
    const ldapOptionsProvider: Provider = {
      provide: getLdapOptionsToken(connection),
      useValue: options,
    }

    const ldapConnectionProvider: Provider = {
      provide: getLdapConnectionToken(connection),
      useFactory: () => createLdapConnection(options),
    }

    return {
      module: LdapCoreModule,
      providers: [ldapOptionsProvider, ldapConnectionProvider],
      exports: [ldapOptionsProvider, ldapConnectionProvider],
    }
  }

  /**
   * Register the LdapModule with the provided async options
   *
   * @param options LdapModuleAsyncOptions
   * @param connection string
   * @returns DynamicModule
   */
  public static forRootAsync(options: LdapModuleAsyncOptions, connection?: string): DynamicModule {
    const ldapConnectionProvider: Provider = {
      provide: getLdapConnectionToken(connection),
      useFactory(options: LdapModuleOptions) {
        return createLdapConnection(options)
      },
      inject: [getLdapOptionsToken(connection)],
    }

    return {
      module: LdapCoreModule,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options, connection), ldapConnectionProvider],
      exports: [ldapConnectionProvider],
    }
  }

  /**
   * Create the async providers
   *
   * @param options LdapModuleAsyncOptions
   * @param connection string
   * @returns Provider[]
   */
  public static createAsyncProviders(options: LdapModuleAsyncOptions, connection?: string): Provider[] {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting')
    }

    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options, connection)]
    }

    const useClass = options.useClass
    if (!useClass) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting')
    }

    return [this.createAsyncOptionsProvider(options, connection), { provide: useClass, useClass }]
  }

  /**
   * Create the async options provider
   *
   * @param options LdapModuleAsyncOptions
   * @param connection string
   * @returns Provider
   */
  public static createAsyncOptionsProvider(options: LdapModuleAsyncOptions, connection?: string): Provider {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting')
    }

    if (options.useFactory) {
      return {
        provide: getLdapOptionsToken(connection),
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    const injectToken = options.useClass ?? options.useExisting
    if (!injectToken) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting')
    }

    return {
      provide: getLdapOptionsToken(connection),
      async useFactory(optionsFactory: LdapModuleOptionsFactory): Promise<LdapModuleOptions> {
        return await optionsFactory.createLdapModuleOptions()
      },
      inject: [injectToken],
    }
  }
}
