const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query("select id, name, description, created_at, updated_at from app_roles order by created_at desc");
    res.json({ roles: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, description = "" } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Role name is required" });
    }

    const { rows } = await query(
      `insert into app_roles (name, description)
       values ($1, $2)
       returning id, name, description, created_at, updated_at`,
      [name.trim(), description.trim()],
    );

    return res.status(201).json({ role: rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Role already exists" });
    }

    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { name, description } = req.body || {};
    const updates = [];
    const values = [];

    function addUpdate(column, value) {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    }

    if (typeof name === "string") addUpdate("name", name.trim());
    if (typeof description === "string") addUpdate("description", description.trim());

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.params.id);
    const { rows } = await query(
      `update app_roles
       set ${updates.join(", ")}, updated_at = now()
       where id = $${values.length}
       returning id, name, description, created_at, updated_at`,
      values,
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Role not found" });
    }

    return res.json({ role: rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Role already exists" });
    }

    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await query("delete from app_roles where id = $1", [req.params.id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
