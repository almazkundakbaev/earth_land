const express = require("express");
const fs = require("fs");
const path = require("path");
const { config } = require("../config");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");

const router = express.Router();
const uploadRoot = path.resolve(process.cwd(), config.uploadDir);

router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query("select * from land_projects where deleted_at is null order by updated_at desc");
    res.json({ projects: rows });
  } catch (error) {
    next(error);
  }
});

router.get("/trash/list", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `select
         projects.*,
         users.full_name as deleted_by_name,
         users.email as deleted_by_email
       from land_projects projects
       left join app_users users on users.id = projects.deleted_by
       where projects.deleted_at is not null
       order by projects.deleted_at desc`,
    );
    res.json({ projects: rows });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query("select * from land_projects where id = $1 and deleted_at is null", [req.params.id]);

    if (!rows[0]) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({ project: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const project = req.body || {};
    const { rows } = await query(
      `insert into land_projects (
        id, title, summary, address, status, responsible, region, area, comments,
        lat, lng, area_square_meters, area_points, sections, created_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      returning *`,
      [
        project.id,
        project.title || "Новый участок",
        project.summary || "",
        project.address || "",
        project.status || "",
        project.responsible || "",
        project.region || "",
        project.area || "",
        project.comments || "",
        project.lat || null,
        project.lng || null,
        project.areaSquareMeters || 0,
        JSON.stringify(project.areaPoints || []),
        JSON.stringify(project.sections || []),
        req.user.id,
      ],
    );

    return res.status(201).json({ project: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const project = req.body || {};
    const { rows } = await query(
      `update land_projects
       set title = $1,
           summary = $2,
           address = $3,
           status = $4,
           responsible = $5,
           region = $6,
           area = $7,
           comments = $8,
           lat = $9,
           lng = $10,
           area_square_meters = $11,
           area_points = $12,
           sections = $13,
           updated_at = now()
       where id = $14 and deleted_at is null
       returning *`,
      [
        project.title || "Новый участок",
        project.summary || "",
        project.address || "",
        project.status || "",
        project.responsible || "",
        project.region || "",
        project.area || "",
        project.comments || "",
        project.lat || null,
        project.lng || null,
        project.areaSquareMeters || 0,
        JSON.stringify(project.areaPoints || []),
        JSON.stringify(project.sections || []),
        req.params.id,
      ],
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({ project: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query(
      "update land_projects set deleted_at = now(), deleted_by = $2, updated_at = now() where id = $1 and deleted_at is null",
      [req.params.id, req.user.id],
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.delete("/trash/clear/all", requireAdmin, async (_req, res, next) => {
  try {
    const { rows: files } = await query(
      `select files.storage_path
       from land_project_files files
       join land_projects projects on projects.id = files.project_id
       where projects.deleted_at is not null`,
    );
    const { rowCount } = await query("delete from land_projects where deleted_at is not null");

    files.forEach((file) => {
      fs.rm(path.join(uploadRoot, file.storage_path), { force: true }, () => {});
    });

    return res.json({ deleted: rowCount });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/restore", requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await query(
      "update land_projects set deleted_at = null, deleted_by = null, updated_at = now() where id = $1 returning *",
      [req.params.id],
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({ project: rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
