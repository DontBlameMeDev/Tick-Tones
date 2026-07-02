import { exec } from 'node:child_process'
import console from 'node:console'
import { readFileSync, writeFileSync } from 'node:fs'
import process, { exit } from 'node:process'
import { parse } from 'semver'

const ReleaseTypes = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease']

let bump = 'patch'

let cmdType = 'version'

for (let arg of process.argv.slice(2)) {
  arg = arg.toLowerCase()
  if (arg === 'bump') {
    cmdType = 'bump'
    continue
  }
  if (ReleaseTypes.includes(arg)) {
    bump = arg
    break
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

if (cmdType === 'version') {
  console.log(pkg.version)
  exit()
}

let semver = parse(pkg.version)

if (semver) {
  semver = semver.inc(bump)
}

if (semver?.toString() !== pkg.version) {
  pkg.version = semver.version
  writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`)
  exec('git add package.json')
}

// read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
const { minAppVersion } = manifest
manifest.version = pkg.version
manifest.description = pkg.description
writeFileSync('manifest.json', JSON.stringify(manifest, null, 2))

// update versions.json with target version and minAppVersion from manifest.json
const versions = JSON.parse(readFileSync('versions.json', 'utf8'))
versions[pkg.version] = minAppVersion
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'))

exec('git add manifest.json versions.json')
