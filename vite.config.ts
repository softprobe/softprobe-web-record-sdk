import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  console.log("mode", mode);
  if (mode === "demo")
    return {
      build: {
        emptyOutDir: true,
        outDir: "dist-demo",
      },
    };

  return {
    build: {
      copyPublicDir: false,
      lib: {
        entry: new URL(import.meta.url).pathname.replace(
          "vite.config.ts",
          "src/lib/sdk.ts",
        ), // 入口文件
        emptyOutDir: true,
        name: "arex-record-sdk", // 导出的库名称
        fileName: (format) => `arex-record-sdk.${format}.js`, // 输出文件名
        formats: ["es", "umd"], // 输出格式
      },
      rollupOptions: {
        output: {
          // 确保外部化处理那些你不想打包进库的依赖
          //     external: ['rrweb'], // 外部依赖
          //     output: {
          //         globals: {
          //             rrweb: 'rrweb', // UMD 格式下的全局变量名
          //         },
          //     },
        },
      },
    },
  };
});
