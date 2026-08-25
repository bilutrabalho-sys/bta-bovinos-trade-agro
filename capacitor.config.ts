import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // applicationId permanente na Play Store. Pode ser trocado ANTES de publicar,
  // mas depois de publicado é imutável. Documentado no README.
  appId: 'br.com.bta.app',
  appName: 'BTA',
  // Pasta com o build web (saída do `vite build`). É o que o WebView carrega.
  webDir: 'dist',
  // Demonstração offline: nenhuma URL de servidor. O app é embutido no APK.
  server: {
    androidScheme: 'https',
  },
};

export default config;
