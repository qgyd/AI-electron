const fs = require('fs')
const path = require('path')

const isKeptFile = (name) => {
  if (name === 'latest-mac.yml') return true
  if (name.endsWith('.dmg')) return true
  if (name.endsWith('.zip')) return true
  if (name.endsWith('.zip.blockmap')) return true
  return false
}

exports.default = async (context) => {
  const outDir = context.outDir
  if (!outDir) return

  let entries = []
  try {
    entries = await fs.promises.readdir(outDir, { withFileTypes: true })
  } catch {
    return
  }

  const tasks = entries
    .filter((e) => (e.isFile() && !isKeptFile(e.name)) || e.isDirectory())
    .map((e) => fs.promises.rm(path.join(outDir, e.name), { recursive: true, force: true }))

  await Promise.all(tasks)
}
