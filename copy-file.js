import { promises as fs } from "node:fs";
import path from "node:path";

// 定义源文件和目标文件路径
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const sourceDir = path.join(__dirname, "dist");
const sourceFile = path.join(sourceDir, "arex-record-sdk.umd.js");
const destinationDir = path.join(__dirname, "dist-demo");
const destinationFile = path.join(destinationDir, "arex-record-sdk.umd.js");

async function copyFile() {
  try {
    // 检查源文件夹是否存在
    try {
      await fs.access(sourceDir);
    } catch {
      return console.info(
        "skd构建产物不存在，要进行CDN测试请先执行 pnpm run build",
      );
    }

    // 检查目标文件夹是否存在
    try {
      await fs.access(destinationDir);
    } catch {
      return;
    }

    // 如果目标文件夹存在，执行复制操作
    await fs.copyFile(sourceFile, destinationFile);
    console.log("文件复制成功！");
  } catch (err) {
    console.error("复制文件时出错：", err);
  }
}

copyFile();
