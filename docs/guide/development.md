# Développement

Installez les dépendances avec `yarn install --frozen-lockfile`, puis utilisez les cibles du `Makefile`.

```bash
make lint
make typecheck
make test-coverage
make test-scripts
make build
make docs-build
make changelog-check
make package
```

`make package` génère un tarball audité et `SHA256SUMS.txt` dans `.artifacts/npm/`. Le contrôle refuse les fichiers hors liste blanche ainsi qu’un paquet trop volumineux.
