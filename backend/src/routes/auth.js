const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { verifyPassword, createToken, hashPassword } = require("../utils/auth");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { rows } = await query(
      "select id, email, full_name, profile_description, role, user_role_id, is_active, password_hash from app_users where lower(email) = lower($1)",
      [email],
    );
    const user = rows[0];

    if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = createToken(user);
    delete user.password_hash;

    return res.json({ token, user });
  } catch (error) {
    return next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, fullName = "" } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await query(
      `insert into app_users (email, password_hash, full_name, role)
       values ($1, $2, $3, 'user')
       returning id, email, full_name, profile_description, role, user_role_id, is_active, created_at, updated_at`,
      [email, passwordHash, fullName],
    );
    const user = rows[0];
    const token = createToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }

    return next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const { profileDescription } = req.body || {};
    const updates = [];
    const values = [];

    function addUpdate(column, value) {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    }

    if (typeof profileDescription === "string") addUpdate("profile_description", profileDescription);

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.user.id);
    const { rows } = await query(
      `update app_users
       set ${updates.join(", ")}, updated_at = now()
       where id = $${values.length}
       returning id, email, full_name, profile_description, role, user_role_id, is_active, created_at, updated_at`,
      values,
    );

    return res.json({ user: rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
