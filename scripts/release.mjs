import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateReleaseRequest } from './release-state.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gh = process.platform === 'win32' ? 'gh.exe' : 'gh'
const git = process.platform === 'win32' ? 'git.exe' : 'git'

function run(command, args) {
  return execFileSync(command, args, { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()
}

function value(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function findRun(startedAt) {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const runs = JSON.parse(run(gh, ['run', 'list', '--workflow', 'release.yml', '--event', 'workflow_dispatch', '--limit', '20', '--json', 'databaseId,createdAt,headBranch,url']))
    const matchingRun = runs.find((candidate) => candidate.headBranch === 'main' && Date.parse(candidate.createdAt) >= startedAt - 120_000)
    if (matchingRun) {
      return matchingRun
    }
    await new Promise((done) => setTimeout(done, 2_000))
  }
  throw new Error('Release workflow was dispatched but its run could not be located')
}

async function main() {
  const version = value('--version')
  const channel = value('--channel') ?? 'latest'
  const watch = process.argv.includes('--watch')
  if (!version) {
    throw new Error('Missing --version X.Y.Z')
  }

  const manifest = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'))
  validateReleaseRequest(manifest.version, version, channel)
  if (!existsSync(join(projectRoot, 'changelog', `${version}.md`))) {
    throw new Error(`Missing changelog/${version}.md`)
  }

  run(git, ['fetch', 'origin', 'main', '--quiet'])
  if (run(git, ['branch', '--show-current']) !== 'main') {
    throw new Error('Releases must be dispatched from main')
  }
  if (run(git, ['status', '--porcelain'])) {
    throw new Error('The worktree must be clean')
  }
  if (run(git, ['rev-parse', 'HEAD']) !== run(git, ['rev-parse', 'origin/main'])) {
    throw new Error('main and origin/main must point to the same commit')
  }
  const startedAt = Date.now()
  run(gh, ['workflow', 'run', 'release.yml', '--ref', 'main', '-f', `version=${version}`, '-f', `channel=${channel}`])
  const workflowRun = await findRun(startedAt)
  console.log(`Release workflow: ${workflowRun.url}`)

  if (watch) {
    execFileSync(gh, ['run', 'watch', String(workflowRun.databaseId), '--exit-status'], { cwd: projectRoot, stdio: 'inherit' })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
