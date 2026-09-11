# Development

Install dependencies with `yarn install --frozen-lockfile`, then use the Makefile targets.

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

`make package` creates an audited tarball and `SHA256SUMS.txt` in `.artifacts/npm/`. The audit rejects content outside the allowlist and unexpected package growth.
