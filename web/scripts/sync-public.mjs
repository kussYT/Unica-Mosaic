import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.resolve(webRoot, '..', 'public')
const destination = path.join(webRoot, 'public')

if (!existsSync(source) || !statSync(source).isDirectory()) {
  console.error('Dossier source introuvable :', source)
  process.exit(1)
}

const sourceBefore = countFiles(source)

if (existsSync(destination) && lstatSync(destination).isSymbolicLink()) {
  removeLink(destination)
}

mkdirSync(destination, { recursive: true })
const seen = new Set()
copyTree(source, destination, '')
prune(destination, '')

if (countFiles(source) !== sourceBefore) {
  console.error('La synchronisation a modifié le dossier public d’origine.')
  process.exit(1)
}

console.log(`Assets synchronisés : ${seen.size} fichiers, sans copie Git.`)

function removeLink(target) {
  if (process.platform === 'win32') {
    const result = spawnSync('cmd', ['/c', 'rmdir', target], { stdio: 'inherit' })
    if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1)
    return
  }
  unlinkSync(target)
}

function copyTree(fromDir, toDir, relativeDir) {
  for (const entry of readdirSync(fromDir, { withFileTypes: true })) {
    const relative = path.join(relativeDir, entry.name)
    const from = path.join(fromDir, entry.name)
    const to = path.join(toDir, entry.name)
    if (entry.isDirectory()) {
      mkdirSync(to, { recursive: true })
      copyTree(from, to, relative)
      continue
    }
    if (!entry.isFile()) continue
    seen.add(relative)
    if (existsSync(to)) {
      const sourceStat = statSync(from)
      const copyStat = statSync(to)
      if (sourceStat.size === copyStat.size && sourceStat.mtimeMs === copyStat.mtimeMs) continue
    }
    cpSync(from, to, { preserveTimestamps: true })
  }
}

function prune(dir, relativeDir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const relative = path.join(relativeDir, entry.name)
    const current = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      prune(current, relative)
      if (readdirSync(current).length === 0) rmSync(current, { recursive: false })
      continue
    }
    if (entry.isFile() && !seen.has(relative)) unlinkSync(current)
  }
}

function countFiles(dir) {
  let count = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const current = path.join(dir, entry.name)
    if (entry.isDirectory()) count += countFiles(current)
    else if (entry.isFile()) count += 1
  }
  return count
}
