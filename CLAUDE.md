# CLAUDE.md — Règles du projet NestJS LDAP Module

Ce fichier fait foi pour toute contribution de Claude Code sur ce dépôt. Les règles
ci-dessous sont **impératives** et priment sur les habitudes par défaut.

`@tacxou/nestjs_module_ldap` est un **module NestJS** (bibliothèque npm)
pour intégrer LDAP via [ldapts](https://github.com/ldapts/ldapts). Il expose
`LdapModule`, `LdapManager`, le décorateur `@InjectLdap()` et les utilitaires associés.

---

## 0. Règle absolue — Git

🚫 **Claude ne doit JAMAIS `git commit` ni `git push` de lui-même.**

- Préparer les modifications (édition de fichiers), proposer un message de commit si utile,
  puis **laisser l'utilisateur committer et pousser lui-même**.
- Cette règle s'applique même si l'utilisateur a précédemment approuvé un commit : chaque
  commit/push reste une action manuelle de l'utilisateur.
- **Format des messages** : Conventional Commits 1.0.0 — voir
  `docs/conventions/conventional-commits.md` (types, scopes, exemples).
  Sujet en anglais : `type(scope): description impérative`, ≤ 72 caractères, sans point final.
- **Versionnement** : SemVer 2.0.0 **stricte** (`MAJOR.MINOR.PATCH`) — même référence ;
  signaler le bump attendu (`PATCH` / `MINOR` / `MAJOR`) quand le commit le justifie.

---

## 1. Arborescence du dépôt

```
nestjs_module_ldap/
├── src/                   # Code source du module (API publique)
│   ├── ldap.module.ts     # Point d'entrée du module Nest (forRoot / forRootAsync)
│   ├── ldap.core-module.ts
│   ├── ldap.manager.ts    # Gestionnaire de connexions ldapts
│   ├── ldap.decorators.ts # @InjectLdap()
│   ├── ldap.interfaces.ts # Types et réexport ldapts
│   ├── ldap.utils.ts
│   ├── ldap.constants.ts
│   └── index.ts           # Barrel — tout export public passe par ici
├── examples/              # Exemples d'intégration (non publiés sur npm)
├── docs/
│   ├── assets/            # Logos SVG versionnés (lockups 2a / 2b, icône bolt-split)
│   ├── branding.md        # Identité visuelle du package
│   └── conventions/       # Conventions partagées (commits, etc.)
├── .github/workflows/     # CI (publication npm sur release GitHub)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 2. Vérifications OBLIGATOIRES en fin de modification

À la fin de **toute** modification de code, avant de présenter le travail comme
terminé, lancer et faire passer au vert :

1. **Build TypeScript** :
   ```bash
   yarn build
   ```
2. **Lint** :
   ```bash
   yarn lint
   ```

Règles : ne jamais contourner un hook ni un échec (`--no-verify` interdit). Si un
check échoue, corriger la cause racine. Une modification n'est « terminée » que lorsque
le build passe au vert.

---

## 3. Règles de code (`src/` — NestJS / TypeScript)

Respecter strictement les conventions TypeScript et NestJS.

**Nommage**
- Fonctions / méthodes / variables : `camelCase`
- Classes / décorateurs / types / interfaces : `PascalCase`
- Fichiers : `kebab-case` avec préfixe de domaine `ldap.*` :
  `ldap.module.ts`, `ldap.manager.ts`, `ldap.decorators.ts`, etc.

**API publique**
- Tout symbole exporté consommable par les applications hôtes doit passer par `src/index.ts`.
- Ne pas casser la compatibilité `peerDependencies` (`@nestjs/common`, `@nestjs/core`, `ldapts`)
  sans signaler un bump **MAJOR**.

**Style**
- TypeScript strict sur les API publiques, pas de `any` implicite (Biome `noExplicitAny`).
- Injection de dépendances Nest, un fichier = une responsabilité.
- **Imports** : classes injectées et symboles Nest en **import valeur** (DI + `emitDecoratorMetadata`) ;
  `import type` pour les types purs sans métadonnées runtime. Voir `.cursor/rules/nestjs-library-imports.mdc`.

**ldapts**
- Le client LDAP sous-jacent est `ldapts` ; les types utiles sont réexportés depuis `ldap.interfaces.ts`.
- `LdapManager` encapsule plusieurs connexions nommées ; `@InjectLdap(connection?)` résout le token DI.

---

## 4. Exemples (`examples/`)

- Code illustratif pour les consommateurs du module (middleware, stratégies, etc.).
- Non inclus dans le build npm (`rootDir: src` uniquement).
- Peut importer `@tacxou/nestjs_module_ldap` comme le ferait une application hôte.

---

## 5. Publication

- Publication npm déclenchée par une **release GitHub** (workflow `.github/workflows/ci.yml`).
- Le champ `version` de `package.json` doit rester aligné avec la release SemVer.
- Le script `postbuild` copie `README.md`, `LICENSE` et `package.json` dans `dist/`.
