import { Client } from 'ldapts'
import { LDAP_MODULE_CONNECTION, LDAP_MODULE_CONNECTION_TOKEN, LDAP_MODULE_OPTIONS_TOKEN } from './ldap.constants'
import { createLdapConnection, getLdapConnectionToken, getLdapOptionsToken } from './ldap.utils'
import { LdapManager } from './ldap.manager'

const mockedClient = Client as jest.MockedClass<typeof Client>

describe('ldap.utils', () => {
  beforeEach(() => {
    mockedClient.mockClear()
  })

  describe('getLdapOptionsToken', () => {
    it('returns the default options token when connection is omitted', () => {
      expect(getLdapOptionsToken(undefined)).toBe(
        `${LDAP_MODULE_CONNECTION}_${LDAP_MODULE_OPTIONS_TOKEN}`,
      )
    })

    it('returns a namespaced options token for a named connection', () => {
      expect(getLdapOptionsToken('secondary')).toBe(`secondary_${LDAP_MODULE_OPTIONS_TOKEN}`)
    })
  })

  describe('getLdapConnectionToken', () => {
    it('returns the default connection token when connection is omitted', () => {
      expect(getLdapConnectionToken(undefined)).toBe(
        `${LDAP_MODULE_CONNECTION}_${LDAP_MODULE_CONNECTION_TOKEN}`,
      )
    })

    it('returns a namespaced connection token for a named connection', () => {
      expect(getLdapConnectionToken('reports')).toBe(`reports_${LDAP_MODULE_CONNECTION_TOKEN}`)
    })
  })

  describe('createLdapConnection', () => {
    it('builds a LdapManager and initializes clients', async () => {
      const manager = await createLdapConnection({
        config: {
          clients: [
            {
              name: 'primary',
              options: { url: 'ldap://localhost:389' },
              bind: { dn: 'cn=admin,dc=example,dc=com', password: 'secret' },
            },
          ],
        },
      })

      expect(manager).toBeInstanceOf(LdapManager)
      expect(manager.initialized).toBe(true)
      expect(mockedClient).toHaveBeenCalledTimes(1)
      expect(mockedClient).toHaveBeenCalledWith({ url: 'ldap://localhost:389' })

      const client = manager.getClient('primary')
      expect(client.bind).toHaveBeenCalledWith('cn=admin,dc=example,dc=com', 'secret', undefined)
    })
  })
})
