import { promises as fs } from 'node:fs';
import path from 'node:path';

// 定义源文件和目标文件路径
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const sourceDir = path.join(__dirname, 'dist');
const sourceFile = path.join(sourceDir, 'arex-record-sdk.umd.js');
const destinationDir = path.join(__dirname, 'dist-demo');
const destinationFile = path.join(destinationDir, 'arex-record-sdk.umd.js');

async function copyFile() {
  try {
    try {
      await fs.access(sourceDir);
    } catch {
      return console.info(
        'The skd build does not exist. Run script pnpm run build first before copying the file.'
      );
    }

    try {
      await fs.access(destinationDir);
    } catch {
      return;
    }

    await fs.copyFile(sourceFile, destinationFile);
    console.log('success to copy file!');
  } catch (err) {
    console.error('Error copy file: ', err);
  }
}

copyFile();
