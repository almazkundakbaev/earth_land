const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");
const { hashPassword } = require("../utils/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(
      "select id, email, full_name, role, is_active, created_at, updated_at from app_users order by created_at desc",
    );
    res.json({ users: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { email, password, fullName = "", role = "user" } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await query(
      `insert into app_users (email, password_hash, full_name, role)
       values ($1, $2, $3, $4)
       returning id, email, full_name, role, is_active, created_at, updated_at`,
      [email, passwordHash, fullName, role],
    );

    return res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }

    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { fullName, role, isActive, password } = req.body || {};
    const updates = [];
    const values = [];

    function addUpdate(column, value) {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    }

    if (typeof fullName === "string") addUpdate("full_name", fullName);
    if (role) {
      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      addUpdate("role", role);
    }
    if (typeof isActive === "boolean") addUpdate("is_active", isActive);
    if (password) addUpdate("password_hash", await hashPassword(password));

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.params.id);
    const { rows } = await query(
      `update app_users
       set ${updates.join(", ")}, updated_at = now()
       where id = $${values.length}
       returning id, email, full_name, role, is_active, created_at, updated_at`,
      values,
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Cannot delete current user" });
    }

    const { rowCount } = await query("delete from app_users where id = $1", [req.params.id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
