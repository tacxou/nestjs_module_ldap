import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { prepareRelease, validateReleaseRequest, verifyRelease } from '../release-state.mjs'

test('validateReleaseRequest enforces channel semantics and monotonic versions', () => {
  assert.doesNotThrow(() => validateReleaseRequest('1.0.1', '1.0.2', 'latest'))
  assert.doesNotThrow(() => validateReleaseRequest('1.0.1', '1.1.0-rc.1', 'next'))
  assert.throws(() => validateReleaseRequest('1.0.1', '1.1.0-rc.1', 'latest'), /stable versions/)
  assert.throws(() => validateReleaseRequest('1.0.1', '1.1.0', 'next'), /requires a prerelease/)
  assert.throws(() => validateReleaseRequest('1.0.1', '1.0.0', 'latest'), /older/)
})

test('prepareRelease and verifyRelease keep the package version synchronized', () => {
  const root = mkdtempSync(join(tmpdir(), 'release-state-'))
  try {
    mkdirSync(join(root, 'changelog'))
    writeFileSync(join(root, 'package.json'), '{"name":"example","version":"1.0.1"}\n')
    writeFileSync(join(root, 'changelog', '1.0.2.md'), 'release notes\n')

    prepareRelease(root, '1.0.2', 'latest')
    assert.equal(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version, '1.0.2')
    assert.doesNotThrow(() => verifyRelease(root, '1.0.2', 'latest'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
