import { InjectionToken, ModuleMetadata, Type } from '@nestjs/common'
import { ClientOptions, Control, DN, SaslMechanism } from 'ldapts'

/**
 * LdapModuleOptions
 *
 * @export
 */
export interface LdapModuleOptions {
  config: LdapModuleOptionsConfig
}

/**
 * LdapModuleOptionsConfig
 *
 * @export
 */
export interface LdapModuleOptionsConfig {
  clients: Array<LdapClientOptions>
}

/**
 * LdapClientOptions
 *
 * @export
 */
export interface LdapClientOptions {
  name: string
  options: ClientOptions
  default?: boolean
  bind?: {
    dn: DN | SaslMechanism | string
    password?: string
    controls?: Control | Control[]
  }
}

export * from 'ldapts'

/**
 * LdapModuleOptionsFactory
 *
 * @export
 */
export interface LdapModuleOptionsFactory {
  createLdapModuleOptions(): Promise<LdapModuleOptions> | LdapModuleOptions
}

/**
 * LdapModuleAsyncOptions
 *
 * @export
 */
export interface LdapModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: InjectionToken[]
  useClass?: Type<LdapModuleOptionsFactory>
  useExisting?: Type<LdapModuleOptionsFactory>
  useFactory?: (...args: unknown[]) => Promise<LdapModuleOptions> | LdapModuleOptions
}
