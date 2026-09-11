import assert from 'node:assert/strict'
import test from 'node:test'
import { buildArtifacts, compareSemver, parseEntry, renderReleaseNotes } from '../build-changelog.mjs'

test('compareSemver follows stable and prerelease precedence', () => {
  assert.equal(compareSemver('1.0.0', '1.0.0-rc.1'), 1)
  assert.equal(compareSemver('1.0.0-rc.2', '1.0.0-rc.10'), -8)
  assert.equal(compareSemver('2.0.0', '1.9.9'), 1)
})

test('parseEntry validates filename and metadata', () => {
  const entry = parseEntry('---\nversion: 1.2.3\ndate: 2026-09-11\ntitle: Example\nprevious: 1.2.2\n---\n\n- Changed something.\n', '1.2.3.md')
  assert.equal(entry.version, '1.2.3')
  assert.equal(entry.body, '- Changed something.')
  assert.throws(() => parseEntry('---\nversion: 1.2.3\ndate: 2026-02-30\ntitle: Invalid\n---\nBody\n', '1.2.3.md'), /invalid calendar date/)
})

test('buildArtifacts orders entries and preserves historical tags', () => {
  const older = { version: '1.0.0', date: '2026-01-01', title: 'First', tag: 'v1.0.0', body: '- First.', prerelease: false }
  const newer = { version: '1.0.1', date: '2026-01-02', title: 'Second', tag: 'v1.0.1', previous: '1.0.0', body: '- Second.', prerelease: false }
  const output = buildArtifacts([older, newer], 'https://github.com/example/repository')
  assert.ok(output.indexOf('[1.0.1]') < output.indexOf('[1.0.0]'))
  assert.match(output, /compare\/v1\.0\.0\.\.\.v1\.0\.1/)
  assert.equal(renderReleaseNotes(newer), '# 1.0.1 — Second\n\n- Second.\n')
})
