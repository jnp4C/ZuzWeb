import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const dataPath = join(root, "data/projects.json");
const rendererPath = join(root, "scripts/render-pdf-crops.swift");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const [key, value] = process.argv[index].split("=");
  args.set(key.replace(/^--/, ""), value ?? "true");
}

const projectTitle = args.get("project") || "CONCEPT OF SEMNĚVICE LANDSCAPE";
const widths = (args.get("widths") || "1200,1800,2400")
  .split(",")
  .map((value) => Number.parseInt(value, 10))
  .filter(Number.isInteger);
const widthMode = args.get("width-mode") || "crop";
const quality = Number.parseFloat(args.get("quality") || "0.84");
const writeJson = args.get("write") !== "false";
const limit = args.has("limit") ? Number.parseInt(args.get("limit"), 10) : Infinity;
const force = args.get("force") === "true";
const replaceExisting = args.get("replace-existing") === "true";

if (widths.length === 0) {
  throw new Error("At least one width is required.");
}

const projects = JSON.parse(readFileSync(dataPath, "utf8"));
const project = projects.find((entry) => entry.title === projectTitle);
if (!project) {
  throw new Error(`Project not found: ${projectTitle}`);
}
if (!project.pdfFile) {
  throw new Error(`Project has no pdfFile: ${projectTitle}`);
}

const slug = projectTitle
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const assetRoot = join(root, "assets/generated", slug);
const jobs = [];
let generatedCount = 0;

for (const scene of project.scenes || []) {
  for (const object of scene.objects || []) {
    if (generatedCount >= limit) {
      break;
    }
    const hasGeneratedSource = typeof object.src === "string" && object.src.includes("/assets/generated/");
    if (
      (object.src && !force)
      || (object.src && force && !hasGeneratedSource && !replaceExisting)
      || object.text
      || !Array.isArray(object.crop)
    ) {
      continue;
    }

    const objectSlug = (object.name || `page-${scene.page}-object-${generatedCount + 1}`)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const outputWidths = widths
      .map((width) => widthMode === "page" ? Math.max(240, Math.round(width * object.crop[2])) : width)
      .filter((width, index, list) => list.indexOf(width) === index);
    const baseName = `${String(scene.page).padStart(2, "0")}-${objectSlug}`;
    const outputs = outputWidths.map((width) => join(assetRoot, `${baseName}-${width}.jpg`));
    const srcset = outputs
      .map((output, index) => `./${relative(root, output).replaceAll("\\", "/")} ${outputWidths[index]}w`)
      .join(", ");

    object.src = `./${relative(root, outputs[Math.min(1, outputs.length - 1)]).replaceAll("\\", "/")}`;
    object.srcset = srcset;
    if (replaceExisting || !object.sizes) {
      object.sizes = `min(${Math.round((object.displayWidthRatio || object.crop[2]) * 86)}vw, ${Math.round((object.displayWidthRatio || object.crop[2]) * 1190)}px)`;
    }

    jobs.push({
      pdfPath: join(root, project.pdfFile),
      page: scene.page,
      crop: object.crop,
      widths: outputWidths,
      quality,
      outputs,
    });
    generatedCount += 1;
  }
  if (generatedCount >= limit) {
    break;
  }
}

if (jobs.length === 0) {
  console.log(`No missing PDF crops found for ${projectTitle}.`);
  process.exit(0);
}

const tempDir = mkdtempSync(join(tmpdir(), "zuzweb-crops-"));
const manifestPath = join(tempDir, "manifest.json");
writeFileSync(manifestPath, JSON.stringify(jobs, null, 2));

try {
  execFileSync("swift", [rendererPath, manifestPath], { stdio: "inherit" });
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

if (writeJson) {
  writeFileSync(dataPath, `${JSON.stringify(projects, null, 2)}\n`);
}

console.log(`Generated ${generatedCount} cropped objects for ${projectTitle}.`);
