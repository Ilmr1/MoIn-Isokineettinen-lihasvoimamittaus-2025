import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: "/",
   plugins: [
    tailwindcss(),
    solid(),
  ],
  server: {
    port: 5175
  }
});
