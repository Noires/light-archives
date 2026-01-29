const fs = require('fs');
const path = require('path');

const clientRoot = path.resolve(__dirname, '..');
const packageRoot = path.join(
  clientRoot,
  'node_modules',
  '@toby.mosque',
  'quasar-ui-qdatetimepicker'
);
const srcLang = path.join(packageRoot, 'src', 'lang');
const destLang = path.join(packageRoot, 'lang');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  if (!fs.existsSync(packageRoot) || !fs.existsSync(srcLang)) {
    process.exit(0);
  }

  if (!fs.existsSync(destLang)) {
    copyDir(srcLang, destLang);
  }
} catch (error) {
  console.warn('fix-qdatetimepicker-lang failed:', error.message || error);
}
