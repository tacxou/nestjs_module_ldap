import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compareSemver, SEMVER_RE } from './build-changelog.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const PACKAGE_FILES = ['package.json']

export function validateReleaseRequest(currentVersion, targetVersion, channel) {
  if (!SEMVER_RE.test(targetVersion)) {
    throw new Error(`Invalid SemVer version: ${targetVersion}`)
  }
  if (!['latest', 'next'].includes(channel)) {
    throw new Error(`Unsupported release channel: ${channel}`)
  }

  const prerelease = targetVersion.includes('-')
  if (channel === 'latest' && prerelease) {
    throw new Error('The latest channel only accepts stable versions')
  }
  if (channel === 'next' && !prerelease) {
    throw new Error('The next channel requires a prerelease version')
  }
  if (compareSemver(targetVersion, currentVersion) < 0) {
    throw new Error(`Target version ${targetVersion} is older than ${currentVersion}`)
  }
}

export function prepareRelease(root, targetVersion, channel) {
  const manifestPath = join(root, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  validateReleaseRequest(manifest.version, targetVersion, channel)

  const changelogPath = join(root, 'changelog', `${targetVersion}.md`)
  if (!existsSync(changelogPath)) {
    throw new Error(`Missing changelog entry: changelog/${targetVersion}.md`)
  }

  manifest.version = targetVersion
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

export function verifyRelease(root, targetVersion, channel) {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  validateReleaseRequest(manifest.version, targetVersion, channel)
  if (manifest.version !== targetVersion) {
    throw new Error(`package.json has version ${manifest.version}, expected ${targetVersion}`)
  }
  if (!existsSync(join(root, 'changelog', `${targetVersion}.md`))) {
    throw new Error(`Missing changelog entry: changelog/${targetVersion}.md`)
  }
}

function value(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function main() {
  const mode = process.argv[2]
  const targetVersion = value('--version')
  const channel = value('--channel') ?? 'latest'
  if (!['prepare', 'verify'].includes(mode) || !targetVersion) {
    throw new Error('Usage: node scripts/release-state.mjs <prepare|verify> --version X.Y.Z --channel <latest|next>')
  }

  if (mode === 'prepare') {
    prepareRelease(projectRoot, targetVersion, channel)
    console.log(`Prepared ${PACKAGE_FILES.join(', ')} for ${targetVersion}`)
  } else {
    verifyRelease(projectRoot, targetVersion, channel)
    console.log(`Verified release state for ${targetVersion} (${channel})`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
