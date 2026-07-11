import { Client } from 'ldapts'
import type { LdapModuleOptionsConfig } from './ldap.interfaces'
import { LdapManager } from './ldap.manager'

const mockedClient = Client as jest.MockedClass<typeof Client>

describe('LdapManager', () => {
  beforeEach(() => {
    mockedClient.mockClear()
  })

  const createManager = (config: LdapModuleOptionsConfig) => new LdapManager(config)

  it('creates one ldapts Client per configured entry', () => {
    const manager = createManager({
      clients: [
        { name: 'primary', options: { url: 'ldap://localhost:389' } },
        { name: 'secondary', options: { url: 'ldap://localhost:636' } },
      ],
    })

    expect(mockedClient).toHaveBeenCalledTimes(2)
    expect(manager.clients.size).toBe(2)
    expect(manager.clients.has('primary')).toBe(true)
    expect(manager.clients.has('secondary')).toBe(true)
  })

  it('selects the only client as default', () => {
    const manager = createManager({
      clients: [{ name: 'solo', options: { url: 'ldap://localhost:389' } }],
    })

    expect(manager.defaultClient).toBe(manager.getClient('solo'))
  })

  it('honours an explicit default client flag', () => {
    const manager = createManager({
      clients: [
        { name: 'primary', options: { url: 'ldap://localhost:389' } },
        { name: 'secondary', options: { url: 'ldap://localhost:636' }, default: true },
      ],
    })

    expect(manager.defaultClient).toBe(manager.getClient('secondary'))
  })

  it('binds clients that declare bind credentials during initialize', async () => {
    const manager = createManager({
      clients: [
        {
          name: 'bound',
          options: { url: 'ldap://localhost:389' },
          bind: { dn: 'cn=admin,dc=example,dc=com', password: 'secret' },
        },
        { name: 'anonymous', options: { url: 'ldap://localhost:389' } },
      ],
    })

    await manager.initialize()

    expect(manager.getClient('bound').bind).toHaveBeenCalledWith('cn=admin,dc=example,dc=com', 'secret', undefined)
    expect(manager.getClient('anonymous').bind).not.toHaveBeenCalled()
    expect(manager.initialized).toBe(true)
  })

  it('returns a typed client by name', () => {
    const manager = createManager({
      clients: [{ name: 'primary', options: { url: 'ldap://localhost:389' } }],
    })

    expect(manager.getClient('primary')).toBeDefined()
  })

  it('throws when requesting an unknown connection name', () => {
    const manager = createManager({
      clients: [{ name: 'primary', options: { url: 'ldap://localhost:389' } }],
    })

    expect(() => manager.getClient('missing')).toThrow('LDAP Connection missing not found')
  })
})
