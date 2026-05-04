import { Router } from "express";
import archiver from "archiver";
import path from "node:path";
import fs from "node:fs";

const router = Router();

// Built bundle lives in artifacts/api-server/dist/ — project root is 3 levels up
const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../");

// Folders/files inside artifacts/ to include (node_modules and dist excluded)
const ARTIFACT_DIRS = ["api-server", "four-digit-battle"];

// Root-level files to bundle
const ROOT_FILES = [
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "tsconfig.base.json",
  "replit.md",
  "README.md",
];

// Patterns to skip when adding directories
const IGNORE_GLOBS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
  "**/.cache/**",
  "**/coverage/**",
];

/**
 * GET /api/download-zip
 *
 * Streams a ZIP of the entire project (frontend + backend source files)
 * directly to the browser as a file download.  Excludes node_modules and
 * build artefacts to keep the archive small.
 */
router.get("/download-zip", (req, res) => {
  // Tell the browser this is a file download
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="four-digit-battle-project.zip"',
  );

  // Create an archiver instance with zip compression
  const archive = archiver("zip", {
    zlib: { level: 6 }, // Balanced speed vs. size
  });

  // Pipe archive data straight to the HTTP response
  archive.pipe(res);

  // ── Root-level config/meta files ──────────────────────────────────────
  for (const file of ROOT_FILES) {
    const abs = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(abs)) {
      // Place each root file at the top level inside the zip
      archive.file(abs, { name: file });
    }
  }

  // ── Shared libraries (lib/*) ──────────────────────────────────────────
  const libDir = path.join(PROJECT_ROOT, "lib");
  if (fs.existsSync(libDir)) {
    archive.glob("**/*", {
      cwd: libDir,
      ignore: IGNORE_GLOBS,
      dot: true, // Include dotfiles like .gitignore
    }, { prefix: "lib" });
  }

  // ── Selected artifact directories ─────────────────────────────────────
  for (const dir of ARTIFACT_DIRS) {
    const abs = path.join(PROJECT_ROOT, "artifacts", dir);
    if (fs.existsSync(abs)) {
      archive.glob("**/*", {
        cwd: abs,
        ignore: IGNORE_GLOBS,
        dot: true,
      }, { prefix: `artifacts/${dir}` });
    }
  }

  // ── Finalise: flush & close the archive ───────────────────────────────
  archive.finalize();

  // Log any archiver errors so they show up in server logs
  archive.on("error", (err) => {
    req.log.error({ err }, "ZIP archive error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create ZIP archive." });
    }
  });

  archive.on("finish", () => {
    req.log.info({ bytes: archive.pointer() }, "ZIP archive sent");
  });
});

export default router;
