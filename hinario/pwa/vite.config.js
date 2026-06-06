import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const BUILD_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

export default defineConfig({
  define: {
    '__BUILD_TIMESTAMP__': JSON.stringify(BUILD_TIMESTAMP),
    '__APP_VERSION__': JSON.stringify(BUILD_TIMESTAMP)
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        remote: 'remote-control.html'
      }
    }
  },
  publicDir: 'public',
  plugins: [
    {
      name: 'version-inject',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          // Substitui {{BUILD_TIMESTAMP}} pelo timestamp real
          return html.replace(/\{\{BUILD_TIMESTAMP\}\}/g, BUILD_TIMESTAMP);
        }
      },
      writeBundle() {
        // Processar sw.js com o timestamp
        const swPath = path.resolve('sw.js');
        const distSwPath = path.resolve('dist/sw.js');
        
        if (fs.existsSync(swPath)) {
          let swContent = fs.readFileSync(swPath, 'utf-8');
          swContent = swContent.replace(/\{\{BUILD_TIMESTAMP\}\}/g, BUILD_TIMESTAMP);
          fs.writeFileSync(distSwPath, swContent);
          console.log('[Plugin] sw.js gerado com timestamp:', BUILD_TIMESTAMP);
        }
        
        // Atualizar version-config.js com a versão
        const versionPath = path.resolve('version-config.js');
        const distVersionPath = path.resolve('dist/version-config.js');
        
        if (fs.existsSync(versionPath)) {
          let versionContent = fs.readFileSync(versionPath, 'utf-8');
          // Substituir versão no arquivo
          versionContent = versionContent.replace(
            /window\.APP_VERSION\s*=\s*['"][^'"]+['"]/,
            `window.APP_VERSION = '${BUILD_TIMESTAMP}'`
          );
          fs.writeFileSync(distVersionPath, versionContent);
          console.log('[Plugin] version-config.js atualizado:', BUILD_TIMESTAMP);
        }
      }
    }
  ]
});
