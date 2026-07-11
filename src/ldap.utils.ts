import { LDAP_MODULE_CONNECTION, LDAP_MODULE_CONNECTION_TOKEN, LDAP_MODULE_OPTIONS_TOKEN } from './ldap.constants'
import { LdapModuleOptions } from './ldap.interfaces'
import { LdapManager } from './ldap.manager'

export function getLdapOptionsToken(connection?: string): string {
  return `${connection || LDAP_MODULE_CONNECTION}_${LDAP_MODULE_OPTIONS_TOKEN}`
}

export function getLdapConnectionToken(connection?: string): string {
  return `${connection || LDAP_MODULE_CONNECTION}_${LDAP_MODULE_CONNECTION_TOKEN}`
}

export async function createLdapConnection(options: LdapModuleOptions): Promise<LdapManager> {
  const { config } = options

  const manager = new LdapManager(config)
  await manager.initialize()

  return manager
}
