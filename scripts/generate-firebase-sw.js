/**
 * Prebuild script: generates public/firebase-messaging-sw.js
 * from public/firebase-messaging-sw.template.js by substituting
 * %%PLACEHOLDER%% tokens with real values from environment variables.
 *
 * Run automatically via the "prebuild" and "predev" npm scripts.
 * Requires the following env vars (in .env.local or CI secrets):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
 */

const fs = require('fs');
const path = require('path');

// Load .env.local if it exists (for local development)
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const required = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('\n❌  generate-firebase-sw: Missing required environment variables:');
  missing.forEach(k => console.error(`   - ${k}`));
  console.error('\nAdd them to .env.local (locally) or your CI/CD environment secrets.\n');
  process.exit(1);
}

const templatePath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.template.js');
const outputPath   = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');

let template = fs.readFileSync(templatePath, 'utf-8');

for (const key of required) {
  template = template.replace(`%%${key}%%`, process.env[key]);
}

fs.writeFileSync(outputPath, template, 'utf-8');
console.log('✅  firebase-messaging-sw.js generated successfully.');
