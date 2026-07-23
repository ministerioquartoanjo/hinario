import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { APP_VERSION } from './version.js';

const BUILD_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function updateVersionConfig(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  let versionContent = fs.readFileSync(targetPath, 'utf-8');
  versionContent = versionContent.replace(
    /window\.APP_VERSION\s*=\s*['"][^'"]+['"]/,
    `window.APP_VERSION = '${APP_VERSION}'`
  );
  fs.writeFileSync(targetPath, versionContent);
  console.log('[Plugin] version-config.js atualizado:', APP_VERSION, '->', targetPath);
}

export default defineConfig({
  define: {
    '__BUILD_TIMESTAMP__': JSON.stringify(BUILD_TIMESTAMP),
    '__APP_VERSION__': JSON.stringify(APP_VERSION)
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
          // Substitui {{BUILD_TIMESTAMP}} pela versão centralizada
          return html.replace(/\{\{BUILD_TIMESTAMP\}\}/g, APP_VERSION);
        }
      },
      buildStart() {
        updateVersionConfig(path.resolve('public/version-config.js'));
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
        
        // Atualizar version-config.js em dist/ com a versão centralizada
        updateVersionConfig(path.resolve('dist/version-config.js'));
      }
    }
  ]
});
