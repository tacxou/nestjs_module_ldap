import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const changelogDirectory = join(projectRoot, 'changelog')
const outputPath = join(projectRoot, 'CHANGELOG.md')

function parseVersion(version) {
  const match = SEMVER_RE.exec(version)
  if (!match) {
    throw new Error(`Invalid SemVer version: ${version}`)
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split('.') ?? [],
  }
}

export function compareSemver(left, right) {
  const a = parseVersion(left)
  const b = parseVersion(right)

  for (const field of ['major', 'minor', 'patch']) {
    if (a[field] !== b[field]) {
      return a[field] - b[field]
    }
  }

  if (a.prerelease.length === 0 || b.prerelease.length === 0) {
    return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length === 0 ? 1 : -1
  }

  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const leftPart = a.prerelease[index]
    const rightPart = b.prerelease[index]
    if (leftPart === undefined || rightPart === undefined) {
      return leftPart === rightPart ? 0 : leftPart === undefined ? -1 : 1
    }
    if (leftPart === rightPart) {
      continue
    }

    const leftIsNumber = /^\d+$/.test(leftPart)
    const rightIsNumber = /^\d+$/.test(rightPart)
    if (leftIsNumber && rightIsNumber) {
      return Number(leftPart) - Number(rightPart)
    }
    if (leftIsNumber !== rightIsNumber) {
      return leftIsNumber ? -1 : 1
    }
    return leftPart.localeCompare(rightPart)
  }

  return 0
}

function validCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function parseEntry(content, fileName) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(content)
  if (!match) {
    throw new Error(`${fileName}: expected YAML-style front matter`)
  }

  const metadata = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 1) {
      throw new Error(`${fileName}: invalid front matter line: ${line}`)
    }
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    metadata[key] = value
  }

  for (const key of ['version', 'date', 'title']) {
    if (!metadata[key]) {
      throw new Error(`${fileName}: missing ${key}`)
    }
  }
  parseVersion(metadata.version)
  if (basename(fileName, '.md') !== metadata.version) {
    throw new Error(`${fileName}: filename must match version ${metadata.version}`)
  }
  if (!validCalendarDate(metadata.date)) {
    throw new Error(`${fileName}: invalid calendar date ${metadata.date}`)
  }
  if (metadata.previous) {
    parseVersion(metadata.previous)
  }
  if (metadata.repository && !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(metadata.repository)) {
    throw new Error(`${fileName}: repository must be a canonical GitHub URL`)
  }

  const isPrerelease = parseVersion(metadata.version).prerelease.length > 0
  if (metadata.prerelease !== undefined && !['true', 'false'].includes(metadata.prerelease)) {
    throw new Error(`${fileName}: prerelease must be true or false`)
  }
  if (metadata.prerelease !== undefined && (metadata.prerelease === 'true') !== isPrerelease) {
    throw new Error(`${fileName}: prerelease flag does not match ${metadata.version}`)
  }

  const body = match[2].trim()
  if (!body) {
    throw new Error(`${fileName}: release notes must not be empty`)
  }

  return {
    version: metadata.version,
    date: metadata.date,
    title: metadata.title,
    tag: metadata.tag || metadata.version,
    previous: metadata.previous,
    repository: metadata.repository,
    prerelease: isPrerelease,
    body,
  }
}

function repositoryUrl(manifest) {
  const repository = typeof manifest.repository === 'string' ? manifest.repository : manifest.repository?.url
  if (!repository) {
    throw new Error('package.json must define repository')
  }
  return repository.replace(/^git\+/, '').replace(/\.git$/, '')
}

export function buildArtifacts(entries, repository) {
  const ordered = [...entries].sort((a, b) => compareSemver(b.version, a.version))
  const byVersion = new Map(ordered.map((entry) => [entry.version, entry]))
  const sections = ordered.map((entry) => `## [${entry.version}] - ${entry.date}\n\n### ${entry.title}\n\n${entry.body}`)
  const links = ordered.map((entry) => {
    const entryRepository = entry.repository || repository
    if (!entry.previous) {
      return `[${entry.version}]: ${entryRepository}/releases/tag/${entry.tag}`
    }
    const previous = byVersion.get(entry.previous)
    if (!previous) {
      throw new Error(`${entry.version}: previous version ${entry.previous} is missing`)
    }
    return `[${entry.version}]: ${entryRepository}/compare/${previous.tag}...${entry.tag}`
  })

  return `# Changelog\n\nAll notable changes to this project are documented in this file.\n\n${sections.join('\n\n')}\n\n${links.join('\n')}\n`
}

export function renderReleaseNotes(entry) {
  return `# ${entry.version} — ${entry.title}\n\n${entry.body}\n`
}

function loadEntries() {
  return readdirSync(changelogDirectory)
    .filter((fileName) => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\.md$/.test(fileName))
    .map((fileName) => parseEntry(readFileSync(join(changelogDirectory, fileName), 'utf8'), fileName))
}

function argumentValue(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function main() {
  const manifest = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'))
  const entries = loadEntries()
  const releaseVersion = argumentValue('--release-notes')

  if (releaseVersion) {
    const entry = entries.find((candidate) => candidate.version === releaseVersion)
    if (!entry) {
      throw new Error(`Missing changelog entry for ${releaseVersion}`)
    }
    const notes = renderReleaseNotes(entry)
    const destination = argumentValue('--out')
    if (destination) {
      writeFileSync(resolve(projectRoot, destination), notes)
    } else {
      process.stdout.write(notes)
    }
    return
  }

  const generated = buildArtifacts(entries, repositoryUrl(manifest))
  if (process.argv.includes('--check')) {
    if (!existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== generated) {
      throw new Error('CHANGELOG.md is not synchronized; run yarn changelog:build')
    }
    console.log(`Verified CHANGELOG.md from ${entries.length} release entries`)
    return
  }

  writeFileSync(outputPath, generated)
  console.log(`Generated CHANGELOG.md from ${entries.length} release entries`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
