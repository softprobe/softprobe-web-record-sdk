import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  console.log('⚙️Build Mode: ', mode);
  if (mode === 'demo')
    return {
      build: {
        emptyOutDir: true,
        outDir: 'dist-demo'
      }
    };

  return {
    build: {
      copyPublicDir: false,
      lib: {
        entry: 'src/lib/sdk.ts', 
        emptyOutDir: true,
        name: 'softprobe-web-record-sdk', 
        fileName: (format) => `softprobe-web-record-sdk.${format}.js`, 
        formats: ['es', 'umd'] 
      },
      rollupOptions: {
        output: {
        }
      }
    }
  };
});
