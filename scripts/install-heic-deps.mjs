#!/usr/bin/env node
import { spawn } from 'node:child_process'

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
      shell: process.platform === 'win32',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} saiu com código ${code}`))
    })
  })
}

if (process.platform === 'linux') {
  try {
    await run('apt-get', ['update'])
    await run(
      'apt-get',
      ['install', '-y', 'imagemagick', 'libheif1', 'libheif-examples'],
      { DEBIAN_FRONTEND: 'noninteractive' },
    )
    console.log('==> Instalado. Teste: magick -version && heif-convert --version')
  } catch (err) {
    console.error(err.message)
    console.error('Rode com sudo se necessário, ou instale manualmente: imagemagick + libheif')
    process.exit(1)
  }
  process.exit(0)
}

if (process.platform === 'win32') {
  console.log('No Windows, instale o ImageMagick com suporte HEIC:')
  console.log('  winget install ImageMagick.ImageMagick')
  console.log('Ou baixe em https://imagemagick.org')
  process.exit(0)
}

console.log('Instale manualmente: imagemagick + libheif')
process.exit(1)
