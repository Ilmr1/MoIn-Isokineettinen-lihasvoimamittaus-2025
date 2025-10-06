import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: "/isokineettinen-lihasvoimamittaus-2025",
   plugins: [
    tailwindcss(),
    solid(),
  ],
  server: {
    port: 5175
  }
});
