# Versioned changelog sources

Each release has one `X.Y.Z.md` (or prerelease SemVer) source file. The generated root `CHANGELOG.md` is never edited directly.

Required front matter fields are `version`, `date`, and `title`. Use `tag` when a historical Git tag differs from the version, and `previous` to generate a comparison link.

```md
---
version: 1.2.3
date: 2026-09-11
title: Short release title
previous: 1.2.2
tag: 1.2.3
---

- Release note written for package users.
```

Run `yarn changelog:build` after editing a source. CI runs `yarn changelog:check`.
