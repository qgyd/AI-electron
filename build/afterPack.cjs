const fs = require('fs')
const path = require('path')

const removeDir = async (dir) => {
  await fs.promises.rm(dir, { recursive: true, force: true })
}

const removeFile = async (filePath) => {
  await fs.promises.rm(filePath, { force: true })
}

exports.default = async (context) => {
  if (context.electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename
  const resourcesDir = path.join(
    context.appOutDir,
    `${appName}.app`,
    'Contents',
    'Frameworks',
    'Electron Framework.framework',
    'Versions',
    'A',
    'Resources'
  )

  const keep = new Set(['zh_CN.lproj'])

  let entries = []
  try {
    entries = await fs.promises.readdir(resourcesDir, { withFileTypes: true })
  } catch {
    return
  }

  const targets = entries
    .filter((e) => e.isDirectory() && e.name.endsWith('.lproj') && !keep.has(e.name))
    .map((e) => path.join(resourcesDir, e.name))

  await Promise.all(targets.map(removeDir))

  const frameworkBase = path.join(
    context.appOutDir,
    `${appName}.app`,
    'Contents',
    'Frameworks',
    'Electron Framework.framework',
    'Versions',
    'A'
  )

  await Promise.all([
    removeFile(path.join(frameworkBase, 'Libraries', 'libvk_swiftshader.dylib')),
    removeFile(path.join(frameworkBase, 'Libraries', 'vk_swiftshader_icd.json'))
  ])
}
