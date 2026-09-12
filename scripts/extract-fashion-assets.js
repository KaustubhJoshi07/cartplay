const { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } = require('fs');
const { execFileSync } = require('child_process');
const { join } = require('path');

const root = join(__dirname, '..');
const marker = join(root, 'assets', 'fashion', 'fashion-34600.jpg');
const archive = join(root, 'bundles', 'fashion-assets.tar.gz');
const partsDir = join(root, 'bundle-parts');

if (!existsSync(marker)) {
  if (!existsSync(archive)) {
    const parts = existsSync(partsDir)
      ? readdirSync(partsDir).filter(name => name.startsWith('fashion-assets.tar.gz.part-')).sort()
      : [];
    if (!parts.length) throw new Error('Missing bundled fashion asset parts.');
    writeFileSync(archive, Buffer.concat(parts.map(part => readFileSync(join(partsDir, part)))));
  }
  mkdirSync(join(root, 'assets'), { recursive: true });
  execFileSync('tar', ['-xzf', archive, '-C', root]);
  console.log('Extracted bundled CartPlay fashion previews.');
}
