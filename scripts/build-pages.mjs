import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyCuratedProjectMedia } from '../project-media.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(process.argv[2] || path.join(root, '_site'));
if (existsSync(output)) throw new Error(`Output already exists: ${output}. Choose a new output directory.`);
const files = new Set([
  'index.html', 'project.html', 'script.js', 'project.js', 'project-media.js',
  'language.js', 'shared-header.js', 'layout-scale.js', 'styles.css',
  'index-layout.css', 'project-layout.css', '.nojekyll',
]);

function addAsset(url) {
  if (typeof url !== 'string' || !url.startsWith('./assets/')) return;
  const relative = decodeURIComponent(url.split(/[?#]/)[0]).slice(2);
  const source = path.resolve(root, relative);
  if (!source.startsWith(`${root}${path.sep}assets${path.sep}`)) throw new Error(`Invalid asset: ${url}`);
  if (!existsSync(source) || !statSync(source).isFile()) throw new Error(`Missing asset: ${url}`);
  if (realpathSync(source) !== source) throw new Error(`Symlink asset is not deployable: ${url}`);
  files.add(relative);
}

function collectMedia(value) {
  if (Array.isArray(value)) return value.forEach(collectMedia);
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (['src', 'zoomSrc', 'href', 'nightSrc', 'poster'].includes(key)) addAsset(entry);
    else if (key === 'srcset' && typeof entry === 'string') {
      entry.split(',').forEach(candidate => addAsset(candidate.trim().split(/\s+/)[0]));
    } else collectMedia(entry);
  }
}

const projects = applyCuratedProjectMedia(JSON.parse(readFileSync(path.join(root, 'data/projects.json'), 'utf8')))
  .filter(project => project.visibility === 'published')
  .map(project => {
    if (project.projectPage?.layout !== 'concise') throw new Error(`Legacy layout cannot be deployed: ${project.slug}`);
    const presentation = project.projectPage.fullPresentation;
    if (presentation?.enabled && (presentation.source !== 'image-sequence' || !presentation.pages?.length)) {
      throw new Error(`Static presentation missing: ${project.slug}`);
    }
    collectMedia(project.index);
    collectMedia(project.projectPage);
    // Preserve the source record in Git; omit dynamic-only metadata from the public data.
    const { scenes, pdfFile, pdfPage, pdfPages, pages, ...publicProject } = project;
    return publicProject;
  });
if (!projects.length) throw new Error('No published projects.');

for (const file of files) {
  if (file.startsWith('assets/')) continue;
  const text = readFileSync(path.join(root, file), 'utf8');
  for (const match of text.matchAll(/["']((?:\.\/)?assets\/[^"'`]+)["']/g)) {
    for (const candidate of match[1].split(',')) {
      const url = candidate.trim().replace(/\s+\d+(?:\.\d+)?[wx]$/, '');
      addAsset(url.startsWith('./') ? url : `./${url}`);
    }
  }
}
let bytes = 0;
for (const file of files) {
  const destination = path.join(output, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(path.join(root, file), destination);
  bytes += statSync(destination).size;
}
mkdirSync(path.join(output, 'data'), { recursive: true });
const data = JSON.stringify(projects);
writeFileSync(path.join(output, 'data/projects.json'), data);
bytes += Buffer.byteLength(data);
if (bytes >= 1_000_000_000) throw new Error('Bundle exceeds the GitHub Pages size limit.');
console.log(`Built ${projects.length} published projects, ${files.size + 1} files, ${(bytes / 1024 / 1024).toFixed(1)} MiB in ${output}`);
