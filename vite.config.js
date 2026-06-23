import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-framer':   ['framer-motion'],
          'vendor-firebase': [
            'firebase/app',
            'firebase/firestore',
            'firebase/auth',
            'firebase/storage',
            'firebase/analytics',
          ],
        },
      },
    },
  },
});
