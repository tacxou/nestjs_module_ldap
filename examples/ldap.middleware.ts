import { CipherCCMTypes, CipherGCMTypes, createDecipheriv } from 'node:crypto'
import { Injectable, NestMiddleware, Scope } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectLdap, LdapManager } from '@tacxou/nestjs_module_ldap'
import { NextFunction, Request, Response } from 'express'

@Injectable({ scope: Scope.REQUEST })
export class LdapMiddleware implements NestMiddleware {
  public constructor(
    @InjectLdap() private readonly ldap: LdapManager,
    private readonly config: ConfigService,
  ) {}

  public async use(req: Request, _: Response, next: NextFunction) {
    const decipher = createDecipheriv(
      this.config.get<string | CipherCCMTypes | CipherGCMTypes>('crypt.algorithm'),
      this.config.get<Buffer>('crypt.securityKey'),
      this.config.get<Buffer>('crypt.initVector'),
    )
    const decrypted = decipher.update(req.user.cryptpasswd, 'hex', 'utf-8') + decipher.final()

    await this.ldap.defaultClient.bind(req.user.dn, decrypted)
    next()
  }
}
