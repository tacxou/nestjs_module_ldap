import { getLdapConnectionToken } from './ldap.utils'
import { InjectLdap } from './ldap.decorators'

describe('InjectLdap', () => {
  it('returns a Nest parameter decorator for the default connection', () => {
    expect(typeof InjectLdap()).toBe('function')
  })

  it('returns a Nest parameter decorator for a named connection', () => {
    expect(typeof InjectLdap('billing')).toBe('function')
  })

  it('uses distinct tokens for default and named connections', () => {
    expect(getLdapConnectionToken(undefined)).not.toBe(getLdapConnectionToken('billing'))
  })
})
