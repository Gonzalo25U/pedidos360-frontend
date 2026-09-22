import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


const basePath = process.env.VITE_BASE_PATH || '/';
const base = basePath.endsWith('/') ? basePath : `${basePath}/`;

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 4200,
  },
});