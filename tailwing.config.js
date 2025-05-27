/** @type {import('tailwindcss').Config} */
export default {
    content: [
      './src/**/*.{html,js,svelte,ts}',
      './node_modules/@skeletonlabs/skeleton/**/*.{html,js,svelte,ts}'
    ],
    theme: { extend: {} },
    plugins: [require('@skeletonlabs/skeleton/tailwind')],
    darkMode: 'class' // Enables dark mode with 'dark' class
  };