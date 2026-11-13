const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const process = require('process');

const MAX_BYTES = 1048576; // 1 MiB

function printHelp() {
  const msg = [];
  msg.push('Usage: node main.ts [--help]');
  msg.push('');
  msg.push('Copies the file `entry.png` located next to this script to');
  msg.push('  $MAKEFUN_OUTPUT_DIR/entry.png (defaults to /output/entry.png)');
  msg.push('');
  msg.push('Validation before copy:');
  msg.push('  - maximum file size: 1048576 bytes (1 MiB)');
  msg.push('  - allowed file formats (by magic bytes): PNG or JPEG');
  msg.push('');
  msg.push('Note: the copy is a pure byte-copy when validation passes.');
  console.log(msg.join('\n'));
}

(async function main() {
  try {
    const argv = process.argv.slice(2);
    if (argv.includes('--help') || argv.includes('-h')) {
      printHelp();
      process.exit(0);
    }

    const scriptDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(process.argv[1]);
    const src = path.join(scriptDir, 'entry.png');
    const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
    const dest = path.join(outDir, 'entry.png');

    // Read source bytes for validation
    const data = await fs.readFile(src);

    // Size check
    if (data.length > MAX_BYTES) {
      console.error(`Error: source file too large (${data.length} bytes) > ${MAX_BYTES} bytes`);
      process.exit(1);
    }

    // Magic bytes check: PNG (89 50 4E 47) or JPEG (FF D8 FF)
    const isPng = data.length >= 4 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47;
    const isJpeg = data.length >= 3 && data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF;
    if (!isPng && !isJpeg) {
      console.error('Error: unsupported file magic; expected PNG or JPEG');
      process.exit(1);
    }

    // Ensure output directory and do a pure byte write
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(dest, data, { flag: 'w' });

    console.error(`Wrote ${dest}`);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : String(err));
    process.exit(1);
  }
})();
