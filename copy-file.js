import { promises as fs } from 'node:fs';
import path from 'node:path';

/** 
 * Copies the SDK build file from source to destination directory
 * Checks if source exists and destination is accessible before copying
 */

// Get current directory path
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Define source and destination paths
const sourceFile = './dist/softprobe-web-record-sdk.umd.js';
const destinationFile = './dist-demo/softprobe-web-record-sdk.umd.js';

async function copyFile() {
  try {
    // Check if source directory exists
    try {
      await fs.access(sourceFile);
    } catch {
      return console.info(
        `The skd build ${sourceFile} does not exist. Run script pnpm run build first before copying the file.`
      );

    }

    // Copy the file and log success
    await fs.copyFile(sourceFile, destinationFile);
    console.log('success to copy file!');
  } catch (err) {
    console.error('Error copy file: ', err);
  }
}

// Execute the copy operation
copyFile();
