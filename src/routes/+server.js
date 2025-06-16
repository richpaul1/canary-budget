// src/routes/+page.server.js
import { redirect } from '@sveltejs/kit';

export function load() {
  throw redirect(302, '/upload'); // 302 for temporary, 301 for permanent
}