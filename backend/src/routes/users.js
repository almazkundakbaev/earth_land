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
      `select
         users.id,
         users.email,
         users.full_name,
         users.profile_description,
         users.role,
         users.user_role_id,
         users.is_active,
         users.created_at,
         users.updated_at,
         roles.name as custom_role_name,
         roles.description as custom_role_description
       from app_users users
       left join app_roles roles on roles.id = users.user_role_id
       order by users.created_at desc`,
    );
    res.json({ users: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { email, password, fullName = "", role = "user", userRoleId = null } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await query(
      `insert into app_users (email, password_hash, full_name, role, user_role_id)
       values ($1, $2, $3, $4, $5)
       returning id, email, full_name, profile_description, role, user_role_id, is_active, created_at, updated_at`,
      [email, passwordHash, fullName, role, userRoleId || null],
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
    const { email, fullName, profileDescription, role, userRoleId, isActive, password } = req.body || {};
    const updates = [];
    const values = [];

    function addUpdate(column, value) {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    }

    if (typeof email === "string") addUpdate("email", email);
    if (typeof fullName === "string") addUpdate("full_name", fullName);
    if (typeof profileDescription === "string") addUpdate("profile_description", profileDescription);
    if (role) {
      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      addUpdate("role", role);
    }
    if (typeof isActive === "boolean") addUpdate("is_active", isActive);
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "userRoleId")) addUpdate("user_role_id", userRoleId || null);
    if (password) addUpdate("password_hash", await hashPassword(password));

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.params.id);
    const { rows } = await query(
      `update app_users
       set ${updates.join(", ")}, updated_at = now()
       where id = $${values.length}
       returning id, email, full_name, profile_description, role, user_role_id, is_active, created_at, updated_at`,
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
