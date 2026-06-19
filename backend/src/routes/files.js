const express = require("express");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const multer = require("multer");
const { query } = require("../db");
const { config } = require("../config");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const uploadRoot = path.resolve(process.cwd(), config.uploadDir);
const previewRoot = path.resolve(process.cwd(), config.previewDir);

fs.mkdirSync(uploadRoot, { recursive: true });
fs.mkdirSync(previewRoot, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, uploadRoot);
  },
  filename(_req, file, callback) {
    const safeName = file.originalname.replace(/[^\w.\-а-яА-ЯёЁ]/g, "_");
    callback(null, `${Date.now()}-${safeName}`);
  },
});
const upload = multer({ storage });

router.use(requireAuth);

router.get("/projects/:projectId/files", async (req, res, next) => {
  try {
    const { rows } = await query(
      "select * from land_project_files where project_id = $1 order by created_at desc",
      [req.params.projectId],
    );
    res.json({ files: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/projects/:projectId/files", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const { kind = "document", fileCategory = "" } = req.body || {};

    if (!["image", "document"].includes(kind)) {
      return res.status(400).json({ error: "Invalid file kind" });
    }

    const { rows } = await query(
      `insert into land_project_files (
        project_id, kind, name, size, type, storage_path, file_category, created_by
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        req.params.projectId,
        kind,
        req.file.originalname,
        req.file.size,
        req.file.mimetype || "",
        req.file.filename,
        fileCategory,
        req.user.id,
      ],
    );

    return res.status(201).json({ file: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get("/files/:id/download", async (req, res, next) => {
  try {
    const { rows } = await query("select * from land_project_files where id = $1", [req.params.id]);
    const file = rows[0];

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    return res.download(path.join(uploadRoot, file.storage_path), file.name);
  } catch (error) {
    return next(error);
  }
});

router.get("/files/:id/text", async (req, res, next) => {
  try {
    const { rows } = await query("select * from land_project_files where id = $1", [req.params.id]);
    const file = rows[0];

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(uploadRoot, file.storage_path);
    const buffer = await fs.promises.readFile(filePath);
    const text = extractFileText(buffer, file);

    return res.json({ text });
  } catch (error) {
    return next(error);
  }
});

router.get("/files/:id/preview", async (req, res, next) => {
  try {
    const { rows } = await query("select * from land_project_files where id = $1", [req.params.id]);
    const file = rows[0];

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const sourcePath = path.join(uploadRoot, file.storage_path);
    const pdfPath = await getPdfPreviewPath(sourcePath, file);
    const encodedName = encodeURIComponent(`${path.parse(file.name).name}.pdf`).replace(/['()]/g, (char) => `%${char.charCodeAt(0).toString(16)}`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodedName}`);
    return res.sendFile(pdfPath);
  } catch (error) {
    if (error.code === "PREVIEW_UNAVAILABLE") {
      return res.status(501).json({ error: error.message });
    }

    return next(error);
  }
});

router.get("/files/:id/html", async (req, res, next) => {
  try {
    const { rows } = await query("select * from land_project_files where id = $1", [req.params.id]);
    const file = rows[0];

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const sourcePath = path.join(uploadRoot, file.storage_path);
    const htmlPath = await getHtmlPreviewPath(sourcePath, file);
    const html = await fs.promises.readFile(htmlPath, "utf8");

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json({ html: buildPreviewHtml(rewritePreviewAssetUrls(html, req.params.id, req.query.token || "", baseUrl)) });
  } catch (error) {
    if (error.code === "PREVIEW_UNAVAILABLE") {
      return res.status(501).json({ error: error.message });
    }

    return next(error);
  }
});

router.get("/files/:id/assets/:assetName", async (req, res, next) => {
  try {
    const assetName = path.basename(req.params.assetName);
    const assetPath = path.join(previewRoot, assetName);

    if (!assetPath.startsWith(previewRoot) || !fs.existsSync(assetPath)) {
      return res.status(404).json({ error: "Asset not found" });
    }

    return res.sendFile(assetPath);
  } catch (error) {
    return next(error);
  }
});

router.get("/files/:id/view", async (req, res, next) => {
  try {
    const { rows } = await query("select * from land_project_files where id = $1", [req.params.id]);
    const file = rows[0];

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(uploadRoot, file.storage_path);
    const encodedName = encodeURIComponent(file.name).replace(/['()]/g, (char) => `%${char.charCodeAt(0).toString(16)}`);

    res.setHeader("Content-Type", file.type || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodedName}`);
    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
});

router.delete("/files/:id", async (req, res, next) => {
  try {
    const { rows } = await query("select * from land_project_files where id = $1", [req.params.id]);
    const file = rows[0];

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    if (req.user.role !== "admin" && file.created_by !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await query("delete from land_project_files where id = $1", [req.params.id]);
    fs.rm(path.join(uploadRoot, file.storage_path), { force: true }, () => {});

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

async function getPdfPreviewPath(sourcePath, file) {
  if (!canConvertToPdf(file)) {
    const error = new Error("Preview is not available for this file type");
    error.code = "PREVIEW_UNAVAILABLE";
    throw error;
  }

  const previewName = `${path.parse(file.storage_path).name}.pdf`;
  const previewPath = path.join(previewRoot, previewName);

  if (await isPreviewFresh(sourcePath, previewPath)) {
    return previewPath;
  }

  await runLibreOfficeConversion(sourcePath);

  if (!fs.existsSync(previewPath)) {
    const error = new Error("LibreOffice did not create a PDF preview");
    error.code = "PREVIEW_UNAVAILABLE";
    throw error;
  }

  return previewPath;
}

async function getHtmlPreviewPath(sourcePath, file) {
  if (!canConvertToHtml(file)) {
    const error = new Error("Preview is not available for this file type");
    error.code = "PREVIEW_UNAVAILABLE";
    throw error;
  }

  const previewName = `${path.parse(file.storage_path).name}.html`;
  const previewPath = path.join(previewRoot, previewName);

  if (await isPreviewFresh(sourcePath, previewPath)) {
    return previewPath;
  }

  await runLibreOfficeConversion(sourcePath, "html");

  if (!fs.existsSync(previewPath)) {
    const error = new Error("LibreOffice did not create an HTML preview");
    error.code = "PREVIEW_UNAVAILABLE";
    throw error;
  }

  return previewPath;
}

function canConvertToPdf(file) {
  const name = (file.name || "").toLowerCase();
  const type = file.type || "";
  const extensions = [".doc", ".docx", ".rtf", ".odt", ".xls", ".xlsx", ".ods", ".ppt", ".pptx", ".odp"];

  return extensions.some((extension) => name.endsWith(extension)) || type.includes("word") || type.includes("excel") || type.includes("powerpoint");
}

function canConvertToHtml(file) {
  const name = (file.name || "").toLowerCase();
  const type = file.type || "";
  const extensions = [".doc", ".docx", ".rtf", ".odt", ".xls", ".xlsx", ".ods", ".ppt", ".pptx", ".odp", ".pdf"];

  return (
    extensions.some((extension) => name.endsWith(extension)) ||
    type.includes("pdf") ||
    type.includes("word") ||
    type.includes("excel") ||
    type.includes("powerpoint")
  );
}

async function isPreviewFresh(sourcePath, previewPath) {
  try {
    const [sourceStat, previewStat] = await Promise.all([fs.promises.stat(sourcePath), fs.promises.stat(previewPath)]);
    return previewStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
}

function runLibreOfficeConversion(sourcePath, format = "pdf") {
  return new Promise((resolve, reject) => {
    execFile(
      config.libreOfficePath,
      ["--headless", "--convert-to", format, "--outdir", previewRoot, sourcePath],
      { windowsHide: true, timeout: 60000 },
      (error) => {
        if (error) {
          const previewError = new Error("Для просмотра оригинала документа на сайте нужно установить LibreOffice на сервере и указать LIBREOFFICE_PATH.");
          previewError.code = "PREVIEW_UNAVAILABLE";
          previewError.cause = error;
          reject(previewError);
          return;
        }

        resolve();
      },
    );
  });
}

function rewritePreviewAssetUrls(html, fileId, token, baseUrl) {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s(on\w+)="[^"]*"/gi, "")
    .replace(/\s(on\w+)='[^']*'/gi, "")
    .replace(/(src|href)=["']([^"']+)["']/gi, (match, attr, value) => {
      if (/^(https?:|data:|#|mailto:)/i.test(value)) {
        return `${attr}="${value}"`;
      }

      const assetName = path.basename(value);
      return `${attr}="${baseUrl}/api/files/${fileId}/assets/${encodeURIComponent(assetName)}${query}"`;
    });
}

function buildPreviewHtml(html) {
  const previewStyles = `
    <style>
      html, body {
        margin: 0;
        min-height: 100%;
        background: #e9ecef;
      }
      body {
        padding: 12px;
        box-sizing: border-box;
      }
      body > * {
        max-width: 100% !important;
      }
      table {
        max-width: 100%;
        border-collapse: collapse;
      }
      img {
        max-width: 100%;
        height: auto;
      }
    </style>
  `;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${previewStyles}`);
  }

  return `<!doctype html><html><head>${previewStyles}</head><body>${html}</body></html>`;
}

function extractFileText(buffer, file) {
  const name = (file.name || "").toLowerCase();
  const type = file.type || "";

  if (name.endsWith(".docx") || type.includes("wordprocessingml.document")) {
    return extractDocxText(buffer);
  }

  if (name.endsWith(".rtf") || type.includes("rtf")) {
    return rtfToPlainText(buffer.toString("utf8"));
  }

  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".csv") || name.endsWith(".json")) {
    return buffer.toString("utf8");
  }

  return "";
}

function extractDocxText(buffer) {
  const xml = readZipEntry(buffer, "word/document.xml");

  if (!xml) {
    return "";
  }

  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readZipEntry(buffer, wantedName) {
  const eocdOffset = findEndOfCentralDirectory(buffer);

  if (eocdOffset < 0) {
    return "";
  }

  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (offset < end) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      break;
    }

    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);

    if (fileName === wantedName) {
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const data = buffer.subarray(dataStart, dataStart + compressedSize);
      const output = compression === 8 ? zlib.inflateRawSync(data) : data;
      return output.toString("utf8");
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return "";
}

function findEndOfCentralDirectory(buffer) {
  const minimumOffset = Math.max(0, buffer.length - 66000);

  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  return -1;
}

function rtfToPlainText(value) {
  return String(value || "")
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\tab/g, "\t")
    .replace(/\\'[0-9a-fA-F]{2}/g, "")
    .replace(/\\[a-zA-Z]+\d* ?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
