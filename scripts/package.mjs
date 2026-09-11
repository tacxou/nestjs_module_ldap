import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactRoot = join(projectRoot, '.artifacts')
const outputDirectory = join(artifactRoot, 'npm')
const npmCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')

const modules = ['index', 'ldap.constants', 'ldap.core-module', 'ldap.decorators', 'ldap.interfaces', 'ldap.manager', 'ldap.module', 'ldap.utils']

export const EXPECTED_FILES = [
  'LICENSE',
  'README.md',
  'package.json',
  'docs/assets/logo-icon-bolt.png',
  'docs/assets/logo-lockup-2b.png',
  'docs/assets/logo-lockup-2b.svg',
  ...modules.flatMap((moduleName) => [`dist/${moduleName}.d.ts`, `dist/${moduleName}.js`, `dist/${moduleName}.js.map`]),
].sort()

const MAX_FILES = 32
const MAX_PACKED_BYTES = 100_000
const MAX_UNPACKED_BYTES = 250_000

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: 'utf8',
    env: options.env ?? process.env,
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  })
}

function runNpm(args, options = {}) {
  const environment = { ...process.env }
  for (const key of ['npm_config_argv', 'npm_config_version_commit_hooks', 'npm_config_version_git_message', 'npm_config_version_git_tag', 'npm_config_version_tag_prefix']) {
    delete environment[key]
  }
  const npmOptions = { ...options, env: environment }
  return process.platform === 'win32' ? run(process.execPath, [npmCli, ...args], npmOptions) : run('npm', args, npmOptions)
}

function assertSafeOutputDirectory() {
  const root = resolve(projectRoot)
  const artifacts = resolve(artifactRoot)
  const output = resolve(outputDirectory)
  if (!artifacts.startsWith(`${root}${sep}`) || !output.startsWith(`${artifacts}${sep}`)) {
    throw new Error(`Unsafe artifact path: ${output}`)
  }
}

export function validatePackResult(packResult, manifest) {
  const files = packResult.files.map((file) => file.path.replace(/^package\//, '')).sort()
  const unexpected = files.filter((file) => !EXPECTED_FILES.includes(file))
  const missing = EXPECTED_FILES.filter((file) => !files.includes(file))

  if (packResult.name !== manifest.name || packResult.version !== manifest.version) {
    throw new Error(`Tarball identity ${packResult.name}@${packResult.version} does not match package.json`)
  }
  if (files.length > MAX_FILES) {
    throw new Error(`Tarball contains ${files.length} files; maximum is ${MAX_FILES}`)
  }
  if (packResult.size > MAX_PACKED_BYTES) {
    throw new Error(`Tarball is ${packResult.size} bytes compressed; maximum is ${MAX_PACKED_BYTES}`)
  }
  if (packResult.unpackedSize > MAX_UNPACKED_BYTES) {
    throw new Error(`Tarball is ${packResult.unpackedSize} bytes unpacked; maximum is ${MAX_UNPACKED_BYTES}`)
  }
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error(`Tarball allowlist mismatch\nUnexpected: ${unexpected.join(', ') || 'none'}\nMissing: ${missing.join(', ') || 'none'}`)
  }
  if (files.some((file) => /(?:^|\/)\.(?:env|git)|tsbuildinfo|(?:^|\/)(?:src|test|tests|coverage|scripts|\.github)(?:\/|$)/i.test(file))) {
    throw new Error('Tarball contains a forbidden source, secret, test, or build file')
  }

  return files
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function smokeTest(tarballPath, packageName) {
  const temporaryProject = mkdtempSync(join(tmpdir(), 'nestjs-ldap-package-'))
  let smokeTestError
  try {
    writeFileSync(join(temporaryProject, 'package.json'), `${JSON.stringify({ name: 'package-smoke-test', private: true, type: 'module' }, null, 2)}\n`)
    runNpm(
      [
        'install',
        '--ignore-scripts',
        '--no-package-lock',
        '--no-audit',
        '--no-fund',
        '--save-exact',
        tarballPath,
        '@nestjs/common@11.2.3',
        '@nestjs/core@11.2.3',
        'ldapts@8.2.0',
        'reflect-metadata@0.2.2',
        'rxjs@7.8.2',
        'typescript@6.0.3',
      ],
      { cwd: temporaryProject },
    )

    writeFileSync(
      join(temporaryProject, 'esm.mjs'),
      `import { LdapModule } from '${packageName}'\nimport { LDAP_MODULE_OPTIONS_TOKEN } from '${packageName}/dist/ldap.constants'\nif (typeof LdapModule !== 'function' || LDAP_MODULE_OPTIONS_TOKEN !== 'LdapModuleOptionsToken') process.exit(1)\n`,
    )
    writeFileSync(
      join(temporaryProject, 'commonjs.cjs'),
      `const { LdapModule } = require('${packageName}')\nconst deepIndex = require('${packageName}/dist/index')\nconst { LDAP_MODULE_OPTIONS_TOKEN } = require('${packageName}/dist/ldap.constants.js')\nif (typeof LdapModule !== 'function' || deepIndex.LdapModule !== LdapModule || LDAP_MODULE_OPTIONS_TOKEN !== 'LdapModuleOptionsToken') process.exit(1)\n`,
    )
    writeFileSync(
      join(temporaryProject, 'consumer.ts'),
      `import { LdapModule, type LdapModuleOptions } from '${packageName}'\nimport { LDAP_MODULE_OPTIONS_TOKEN } from '${packageName}/dist/ldap.constants'\nconst options: LdapModuleOptions = { config: { clients: [{ name: 'default', options: { url: 'ldap://localhost:389' }, default: true }] } }\nvoid LdapModule\nvoid options\nvoid LDAP_MODULE_OPTIONS_TOKEN\n`,
    )
    writeFileSync(
      join(temporaryProject, 'tsconfig.json'),
      `${JSON.stringify({ compilerOptions: { module: 'Node16', moduleResolution: 'Node16', strict: true, noEmit: true, skipLibCheck: true }, include: ['consumer.ts'] }, null, 2)}\n`,
    )

    run(process.execPath, ['esm.mjs'], { cwd: temporaryProject })
    run(process.execPath, ['commonjs.cjs'], { cwd: temporaryProject })
    const typescript = join(temporaryProject, 'node_modules', 'typescript', 'bin', 'tsc')
    run(process.execPath, [typescript, '-p', 'tsconfig.json'], { cwd: temporaryProject })
  } catch (error) {
    smokeTestError = error
  }

  const resolvedTemporaryProject = realpathSync(temporaryProject)
  const resolvedTemporaryRoot = realpathSync(tmpdir())
  if (!resolvedTemporaryProject.startsWith(`${resolvedTemporaryRoot}${sep}`)) {
    throw new Error(`Refusing to remove unsafe temporary directory: ${resolvedTemporaryProject}`)
  }
  rmSync(resolvedTemporaryProject, { recursive: true, force: true })
  if (smokeTestError) {
    throw smokeTestError
  }
}

function main() {
  assertSafeOutputDirectory()
  if (existsSync(outputDirectory)) {
    rmSync(outputDirectory, { recursive: true, force: true })
  }
  mkdirSync(outputDirectory, { recursive: true })

  const manifest = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'))
  const rawPackResult = runNpm(['pack', '--json', '--ignore-scripts', '--pack-destination', outputDirectory], { capture: true })
  const results = JSON.parse(rawPackResult)
  if (!Array.isArray(results) || results.length !== 1) {
    throw new Error('npm pack did not return exactly one package')
  }

  const [packResult] = results
  const files = validatePackResult(packResult, manifest)
  const tarballPath = join(outputDirectory, basename(packResult.filename))
  if (!existsSync(tarballPath)) {
    throw new Error(`npm pack did not create ${tarballPath}`)
  }

  const checksum = sha256File(tarballPath)
  writeFileSync(join(outputDirectory, 'SHA256SUMS.txt'), `${checksum}  ${basename(tarballPath)}\n`)
  smokeTest(tarballPath, manifest.name)

  console.log(`Audited ${relative(projectRoot, tarballPath)}: ${files.length} files, ${packResult.size} bytes, sha256 ${checksum}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
