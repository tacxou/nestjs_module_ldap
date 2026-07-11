import { Logger } from '@nestjs/common'
import { Client, LdapModuleOptionsConfig } from './ldap.interfaces'

export class LdapManager {
  protected logger: Logger = new Logger(LdapManager.name)

  private _initialized: boolean = false
  private _defaultClient!: string | symbol
  private _clients: Map<string | symbol, Client> = new Map()

  public constructor(private readonly _options: LdapModuleOptionsConfig) {
    for (const client of _options.clients) {
      this._clients.set(client.name, new Client(client.options))

      if (client.default || _options.clients.length === 1) {
        this._defaultClient = client.name
      }
    }
  }

  public async initialize(): Promise<void> {
    for (const client of this._options.clients) {
      if (typeof client.bind === 'object' && client.bind.dn) {
        const ldapClient = this.clients.get(client.name)
        if (ldapClient) {
          await ldapClient.bind(client.bind.dn, client.bind.password, client.bind.controls)
        }
      }
    }
    this._initialized = true
  }

  public get clients(): Map<string | symbol, Client> {
    return this._clients
  }

  public get defaultClient(): Client {
    const client = this._clients.get(this._defaultClient)
    if (!client) {
      throw new Error('LDAP default client not found')
    }

    return client
  }

  public get initialized(): boolean {
    return this._initialized
  }

  public getClient<T = Record<string, never>>(name: string | symbol): Client & T {
    if (!this.clients.has(name)) {
      throw new Error(`LDAP Connection ${name.toString()} not found`)
    }

    return this.clients.get(name) as Client & T
  }
}
