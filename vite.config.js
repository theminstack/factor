import react from '@vitejs/plugin-react';
import FullReload from 'vite-plugin-full-reload';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), FullReload('**')],
});
