/* homepage-js.mjs — where the homepage's application code lives.
 *
 * The dataset, the world-map grid and the news block are all JS literals inside the
 * homepage's code, and several build steps parse or rewrite them. That code moved out
 * of index.html into app.js (see build-app-js.mjs); this is the one place that knows
 * which file to open, so no build step has to hard-code the answer or break if it
 * ever moves back inline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** absolute path of the file holding the homepage's application JS */
export const homepageJsPath = () => {
  const app = path.join(ROOT, 'app.js');
  return fs.existsSync(app) ? app : path.join(ROOT, 'index.html');
};

export const readHomepageJs = () => fs.readFileSync(homepageJsPath(), 'utf8');

/** rewrite it, keeping index.html's ?v= cache-buster in step when it is external */
export const writeHomepageJs = async (src) => {
  const f = homepageJsPath();
  fs.writeFileSync(f, src);
  if (path.basename(f) === 'app.js') await import('./build-app-js.mjs');
};
