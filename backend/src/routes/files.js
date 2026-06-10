const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { query } = require("../db");
const { config } = require("../config");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const uploadRoot = path.resolve(process.cwd(), config.uploadDir);

fs.mkdirSync(uploadRoot, { recursive: true });

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
