const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server');

// Check if .medusa/server exists - if not, build process failed
if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error('.medusa/server directory not found. This indicates the Medusa build process failed. Please check for build errors.');
}

// ── Apply Electro Store admin branding ──────────────────────────────
const ADMIN_HTML_PATH = path.join(MEDUSA_SERVER_PATH, 'public', 'admin', 'index.html');
if (fs.existsSync(ADMIN_HTML_PATH)) {
  console.log('Applying admin branding...');
  const brandingSource = path.join(process.cwd(), 'src', 'admin', 'branding', 'index.html');
  if (fs.existsSync(brandingSource)) {
    // Extract <style>, <script>, <title>, and <link rel="icon"> from branding template
    const branding = fs.readFileSync(brandingSource, 'utf8');
    const styleMatch = branding.match(/<style>[\s\S]*?<\/style>/);
    const scriptMatch = branding.match(/<script>[\s\S]*?<\/script>/);
    const titleMatch = branding.match(/<title>.*?<\/title>/);

    let adminHtml = fs.readFileSync(ADMIN_HTML_PATH, 'utf8');
    // Replace placeholder favicon with our logo (data URI so no file dependency)
    adminHtml = adminHtml.replace(
      '<link rel="icon" href="data:," data-placeholder-favicon />',
      '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'820 820 2360 2360\' fill=\'%231a1a2e\'%3E%3Cpath d=\'M1742.075,2062.26l197.432,341.959l184.532,319.615h661.448v-243.507h-520.862l-241.376-418.068H1742.075z M2124.038,1276.164l-188.023,325.666l-178.96,309.969l281.172,0.004l226.398-392.132l520.862-0.003v-243.505H2124.038z\'/%3E%3Cpolygon points=\'1737.643,1093.916 1214.513,1999.999 1737.643,2906.083 1878.228,3149.587 2159.403,3149.587 2785.487,3149.587 2785.487,2906.083 2180.85,2906.083 2018.818,2906.083 1495.689,1999.999 2018.818,1093.916 2180.85,1093.916 2785.487,1093.916 2785.487,850.413 2159.403,850.413 1878.228,850.413\'/%3E%3Cpath d=\'M1776.425,1878.245c-23.432,40.587-46.863,81.169-70.294,121.755c23.432,40.584,46.862,81.17,70.294,121.752h1009.062v-243.507H1776.425z\'/%3E%3C/svg%3E" />'
    );
    // Inject title, style, and script before </head>
    const inject = [titleMatch?.[0], styleMatch?.[0], scriptMatch?.[0]].filter(Boolean).join('\n        ');
    if (inject) {
      adminHtml = adminHtml.replace('</head>', `        ${inject}\n    </head>`);
    }
    fs.writeFileSync(ADMIN_HTML_PATH, adminHtml);
    console.log('Admin branding applied to built index.html');
  } else {
    console.log('Branding source not found, skipping');
  }
} else {
  console.log('Admin HTML not found at expected path, skipping branding');
}
// ────────────────────────────────────────────────────────────────────

// Copy pnpm-lock.yaml
fs.copyFileSync(
  path.join(process.cwd(), 'pnpm-lock.yaml'),
  path.join(MEDUSA_SERVER_PATH, 'pnpm-lock.yaml')
);

// Copy .env if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(
    envPath,
    path.join(MEDUSA_SERVER_PATH, '.env')
  );
}

// Install dependencies
console.log('Installing dependencies in .medusa/server...');
execSync('pnpm i --prod --frozen-lockfile', {
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit'
});
