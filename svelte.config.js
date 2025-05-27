import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath, URL } from 'url';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      // default options are sufficient for Electron
      pages: 'build', // Output directory for static files
      assets: 'build', // Output directory for assets
      fallback: 'index.html', // Fallback for client-side routing
      precompress: false, // You might want to disable this for Electron
      strict: true,
    }),
    // Ensure SSR is disabled for the entire app for Electron builds
    // You can conditionally disable this based on an environment variable
    // if you also want a web version with SSR.
    
  },
};

export default config;