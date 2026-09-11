import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { EXPECTED_FILES, sha256File, validatePackResult } from '../package.mjs'

test('validatePackResult accepts the exact package allowlist', () => {
  const manifest = { name: '@example/package', version: '1.0.0' }
  const packResult = {
    name: manifest.name,
    version: manifest.version,
    size: 50_000,
    unpackedSize: 150_000,
    files: EXPECTED_FILES.map((path) => ({ path })),
  }
  assert.deepEqual(validatePackResult(packResult, manifest), EXPECTED_FILES)
})

test('validatePackResult rejects unexpected content and size growth', () => {
  const manifest = { name: '@example/package', version: '1.0.0' }
  const base = { name: manifest.name, version: manifest.version, size: 50_000, unpackedSize: 150_000 }
  assert.throws(() => validatePackResult({ ...base, files: [...EXPECTED_FILES, 'src/private.ts'].map((path) => ({ path })) }, manifest), /allowlist mismatch/)
  assert.throws(() => validatePackResult({ ...base, size: 100_001, files: EXPECTED_FILES.map((path) => ({ path })) }, manifest), /compressed/)
})

test('sha256File returns the expected digest', () => {
  const root = mkdtempSync(join(tmpdir(), 'package-hash-'))
  try {
    const path = join(root, 'fixture.txt')
    writeFileSync(path, 'verified\n')
    const expected = createHash('sha256').update('verified\n').digest('hex')
    assert.equal(sha256File(path), expected)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
