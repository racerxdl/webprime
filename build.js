// Simple build: copy everything needed for deployment to dist/
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const dist = 'dist';
if (!existsSync(dist)) mkdirSync(dist, { recursive: true });

// Clean dist first
execSync(`rm -rf "${dist}"/*`, { stdio: 'inherit' });

// Copy using shell (avoids node fs permission quirks)
const rules = [
  `cp index.html ucs.html nx.html "${dist}/"`,
  `cp -r lib "${dist}/"`,
  `cp -r ucs "${dist}/"`,
  `[ -d datapack ] && cp -r datapack "${dist}/" || true`,
  `[ -d nx ] && cp -r nx "${dist}/" || true`,
  `mkdir -p "${dist}/node_modules/jquery/dist" && cp node_modules/jquery/dist/jquery.min.js "${dist}/node_modules/jquery/dist/"`,
  `mkdir -p "${dist}/node_modules/@teskevirtualsystem/jpak/dist" && cp node_modules/@teskevirtualsystem/jpak/dist/jpak.min.js "${dist}/node_modules/@teskevirtualsystem/jpak/dist/"`,
];

for (const cmd of rules) {
  execSync(cmd, { stdio: 'inherit' });
}

console.log('Build complete. dist/ is ready for deployment.');
