# Instructions agents IA — NestJS LDAP Module

Fichier lu par Cursor Agent, Codex, Copilot Agent et assistants similaires.

## Messages de commit

Suivre **Conventional Commits 1.0.0** — spécification complète :
[`docs/conventions/conventional-commits.md`](docs/conventions/conventional-commits.md)

Résumé :

```
<type>(<scope>): <description>
```

- Anglais, impératif, sujet ≤ 72 caractères, sans point final.
- Types : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Scopes : `src`, `examples`, `deps`, `ci`, `root`.
- Proposer le message ; ne pas `git commit` / `git push` sans demande explicite.

## Versionnement

**SemVer 2.0.0 stricte** : format `X.Y.Z` ; `fix` → PATCH, `feat` → MINOR, breaking → MAJOR. Détails dans la spec ci-dessus.

## Génération assistée

Commande Cursor `/commit-message` (voir `.cursor/commands/commit-message.md`).

Charte projet complète : [`CLAUDE.md`](CLAUDE.md).
